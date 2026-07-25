import { NextResponse } from "next/server";
import { z } from "zod";
import { issueOtp, checkOtp, createCustomerSession } from "@/lib/auth";
import { isPhone, normalisePhone } from "@/lib/delivery";

export const dynamic = "force-dynamic";

const requestSchema = z.object({
  action: z.literal("request"),
  phone: z.string().trim().min(1),
});

const verifySchema = z.object({
  action: z.literal("verify"),
  phone: z.string().trim().min(1),
  code: z.string().trim().min(4).max(8),
});

const bodySchema = z.discriminatedUnion("action", [requestSchema, verifySchema]);

export async function POST(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const phone = normalisePhone(parsed.data.phone);
  if (!isPhone(phone)) {
    return NextResponse.json(
      { error: "Please enter a valid 10-digit Indian mobile number." },
      { status: 400 },
    );
  }

  if (parsed.data.action === "request") {
    const result = await issueOtp(phone);
    if (!result.ok) {
      return NextResponse.json(
        { error: result.error, retryAfterSeconds: result.retryAfterSeconds },
        { status: 429 },
      );
    }
    return NextResponse.json({
      ok: true,
      // Tells the UI to show "check the server console" while in console mode.
      consoleMode: !process.env.SMS_PROVIDER,
    });
  }

  const result = await checkOtp(phone, parsed.data.code);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 401 });
  }

  await createCustomerSession(result.customerId);
  return NextResponse.json({ ok: true, isNew: result.isNew });
}
