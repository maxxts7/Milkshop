import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { and, desc, eq, gt, isNull } from "drizzle-orm";
import { db } from "./db";
import { customers, otpCodes, adminUsers } from "./db/schema";

const CUSTOMER_COOKIE = "kg_session";
const ADMIN_COOKIE = "kg_admin";
const SESSION_DAYS = 60;

function secret(): Uint8Array {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 32) {
    throw new Error(
      "AUTH_SECRET is missing or too short. Generate one with:\n" +
        '  node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"',
    );
  }
  return new TextEncoder().encode(s);
}

async function sign(payload: Record<string, unknown>): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(secret());
}

async function verify<T>(token: string): Promise<T | null> {
  try {
    const { payload } = await jwtVerify(token, secret());
    return payload as T;
  } catch {
    return null;
  }
}

async function setCookie(name: string, token: string) {
  const jar = await cookies();
  jar.set(name, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
}

// ------------------------------------------------------------ customer sessions

export async function createCustomerSession(customerId: number) {
  await setCookie(CUSTOMER_COOKIE, await sign({ cid: customerId }));
}

export async function clearCustomerSession() {
  (await cookies()).delete(CUSTOMER_COOKIE);
}

export async function getCurrentCustomer() {
  const token = (await cookies()).get(CUSTOMER_COOKIE)?.value;
  if (!token) return null;

  const payload = await verify<{ cid: number }>(token);
  if (!payload?.cid) return null;

  const [row] = await db
    .select()
    .from(customers)
    .where(eq(customers.id, payload.cid))
    .limit(1);

  return row ?? null;
}

// ------------------------------------------------------------ admin sessions

export async function createAdminSession(adminId: number) {
  await setCookie(ADMIN_COOKIE, await sign({ aid: adminId }));
}

export async function clearAdminSession() {
  (await cookies()).delete(ADMIN_COOKIE);
}

export async function getCurrentAdmin() {
  const token = (await cookies()).get(ADMIN_COOKIE)?.value;
  if (!token) return null;

  const payload = await verify<{ aid: number }>(token);
  if (!payload?.aid) return null;

  const [row] = await db
    .select()
    .from(adminUsers)
    .where(eq(adminUsers.id, payload.aid))
    .limit(1);

  return row ?? null;
}

export async function verifyAdminPassword(email: string, password: string) {
  const [admin] = await db
    .select()
    .from(adminUsers)
    .where(eq(adminUsers.email, email.trim().toLowerCase()))
    .limit(1);

  if (!admin) {
    // Constant-ish work whether or not the account exists, so timing does not
    // reveal which emails are registered.
    await bcrypt.compare(password, "$2a$10$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidin");
    return null;
  }

  const ok = await bcrypt.compare(password, admin.passwordHash);
  return ok ? admin : null;
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

// ------------------------------------------------------------ OTP

const OTP_TTL_MS = 10 * 60 * 1000;
const OTP_RESEND_COOLDOWN_MS = 60 * 1000;
const OTP_MAX_ATTEMPTS = 5;

export type OtpIssue =
  | { ok: true }
  | { ok: false; error: string; retryAfterSeconds?: number };

export async function issueOtp(phone: string): Promise<OtpIssue> {
  const [recent] = await db
    .select()
    .from(otpCodes)
    .where(eq(otpCodes.phone, phone))
    .orderBy(desc(otpCodes.createdAt))
    .limit(1);

  if (recent) {
    const age = Date.now() - new Date(recent.createdAt).getTime();
    if (age < OTP_RESEND_COOLDOWN_MS && !recent.consumedAt) {
      return {
        ok: false,
        error: "A code was just sent. Please wait before requesting another.",
        retryAfterSeconds: Math.ceil((OTP_RESEND_COOLDOWN_MS - age) / 1000),
      };
    }
  }

  const code = String(Math.floor(100000 + Math.random() * 900000));

  await db.insert(otpCodes).values({
    phone,
    codeHash: await bcrypt.hash(code, 8),
    expiresAt: new Date(Date.now() + OTP_TTL_MS),
  });

  const { sendOtpSms } = await import("./sms");
  await sendOtpSms(phone, code);

  return { ok: true };
}

export type OtpCheck =
  | { ok: true; customerId: number; isNew: boolean }
  | { ok: false; error: string };

export async function checkOtp(phone: string, code: string): Promise<OtpCheck> {
  const [record] = await db
    .select()
    .from(otpCodes)
    .where(
      and(
        eq(otpCodes.phone, phone),
        isNull(otpCodes.consumedAt),
        gt(otpCodes.expiresAt, new Date()),
      ),
    )
    .orderBy(desc(otpCodes.createdAt))
    .limit(1);

  if (!record) {
    return { ok: false, error: "That code has expired. Please request a new one." };
  }

  if (record.attempts >= OTP_MAX_ATTEMPTS) {
    return { ok: false, error: "Too many attempts. Please request a new code." };
  }

  const matches = await bcrypt.compare(code.trim(), record.codeHash);

  if (!matches) {
    await db
      .update(otpCodes)
      .set({ attempts: record.attempts + 1 })
      .where(eq(otpCodes.id, record.id));
    return { ok: false, error: "That code is not right. Please check and try again." };
  }

  await db
    .update(otpCodes)
    .set({ consumedAt: new Date() })
    .where(eq(otpCodes.id, record.id));

  const [existing] = await db
    .select()
    .from(customers)
    .where(eq(customers.phone, phone))
    .limit(1);

  if (existing) {
    return { ok: true, customerId: existing.id, isNew: false };
  }

  const [created] = await db.insert(customers).values({ phone }).returning();
  return { ok: true, customerId: created.id, isNew: true };
}
