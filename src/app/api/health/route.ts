import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";

/**
 * Deployment sanity check: GET /api/health
 *
 * Answers the two questions a fresh deploy actually fails on — is the database
 * configured, and have the tables been created — without ever echoing a
 * connection string, a secret, or any customer data. Booleans and counts only,
 * so it is safe to open on a public URL and safe to paste into a chat.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  const url = process.env.DATABASE_URL ?? "";

  const checks = {
    databaseUrlSet: Boolean(url),
    databaseKind: !url
      ? "not set"
      : url.includes("neon.tech")
        ? "neon"
        : url.startsWith("pglite://")
          ? "pglite (local only — will not work on Netlify)"
          : "postgres",
    authSecretSet: (process.env.AUTH_SECRET ?? "").length >= 32,
    siteUrlSet: Boolean(process.env.NEXT_PUBLIC_SITE_URL),
    smsProvider: process.env.SMS_PROVIDER || "console (no real SMS)",
    canConnect: false,
    tablesCreated: false,
    productCount: 0,
    problem: null as string | null,
    nextStep: null as string | null,
  };

  if (!checks.databaseUrlSet) {
    checks.problem = "DATABASE_URL is not set.";
    checks.nextStep =
      "Netlify → Site configuration → Environment variables → add DATABASE_URL " +
      "(your Neon pooled connection string), then redeploy.";
    return NextResponse.json(checks, { status: 503 });
  }

  try {
    await db.execute(sql`select 1`);
    checks.canConnect = true;
  } catch (err) {
    checks.problem = `Cannot reach the database: ${err instanceof Error ? err.message : "unknown error"}`;
    checks.nextStep =
      "Check the connection string is the POOLED one from Neon and that it ends with ?sslmode=require.";
    return NextResponse.json(checks, { status: 503 });
  }

  try {
    const rows = await db.execute<{ count: number }>(
      sql`select count(*)::int as count from products`,
    );
    // The driver returns either an array or a { rows } envelope depending on the
    // adapter, so normalise before reading.
    const list = Array.isArray(rows) ? rows : ((rows as { rows?: unknown[] }).rows ?? []);
    checks.tablesCreated = true;
    checks.productCount = Number((list[0] as { count?: number })?.count ?? 0);
  } catch {
    checks.problem = "Connected, but the tables do not exist yet.";
    checks.nextStep =
      "Point your local .env.local at the Neon URL and run: npm run db:migrate && npm run db:seed";
    return NextResponse.json(checks, { status: 503 });
  }

  if (checks.productCount === 0) {
    checks.problem = "Tables exist but the catalogue is empty.";
    checks.nextStep = "Run: npm run db:seed (pointed at the Neon URL)";
    return NextResponse.json(checks, { status: 503 });
  }

  if (!checks.authSecretSet) {
    checks.problem = "AUTH_SECRET is missing or too short — logins will fail.";
    checks.nextStep =
      'Generate one with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))" ' +
      "and add it in Netlify.";
    return NextResponse.json(checks, { status: 503 });
  }

  return NextResponse.json({ ...checks, status: "ok" });
}
