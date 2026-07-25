import { NextResponse } from "next/server";
import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { subscriptions } from "@/lib/db/schema";
import { getCurrentCustomer } from "@/lib/auth";
import { todayIST } from "@/lib/delivery";

export const dynamic = "force-dynamic";

const bodySchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("pause"),
    until: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  }),
  z.object({ action: z.literal("resume") }),
  z.object({ action: z.literal("cancel") }),
  z.object({
    action: z.literal("quantity"),
    quantity: z.number().int().min(1).max(20),
  }),
]);

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const customer = await getCurrentCustomer();
  if (!customer) {
    return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  }

  const { id } = await params;
  const subscriptionId = Number(id);
  if (!Number.isInteger(subscriptionId)) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

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

  // Scoped by customer id — a guessed subscription id belonging to someone
  // else simply does not match.
  const [subscription] = await db
    .select()
    .from(subscriptions)
    .where(
      and(
        eq(subscriptions.id, subscriptionId),
        eq(subscriptions.customerId, customer.id),
      ),
    )
    .limit(1);

  if (!subscription) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const body = parsed.data;
  const now = new Date();

  switch (body.action) {
    case "pause":
      await db
        .update(subscriptions)
        .set({
          status: "paused",
          pausedFrom: todayIST(),
          pausedUntil: body.until,
          updatedAt: now,
        })
        .where(eq(subscriptions.id, subscriptionId));
      break;

    case "resume":
      await db
        .update(subscriptions)
        .set({
          status: "active",
          pausedFrom: null,
          pausedUntil: null,
          updatedAt: now,
        })
        .where(eq(subscriptions.id, subscriptionId));
      break;

    case "cancel":
      await db
        .update(subscriptions)
        .set({ status: "cancelled", updatedAt: now })
        .where(eq(subscriptions.id, subscriptionId));
      break;

    case "quantity":
      await db
        .update(subscriptions)
        .set({ quantity: body.quantity, updatedAt: now })
        .where(eq(subscriptions.id, subscriptionId));
      break;
  }

  return NextResponse.json({ ok: true });
}
