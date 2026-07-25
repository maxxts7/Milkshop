import { NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { subscriptions, addresses, customers, variants, products } from "@/lib/db/schema";
import { getCurrentCustomer } from "@/lib/auth";
import { getSettings, isPincodeServiceable } from "@/lib/store";
import { isPincode, todayIST } from "@/lib/delivery";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  variantId: z.number().int().positive(),
  quantity: z.number().int().min(1).max(20),
  frequency: z.enum(["daily", "alternate", "weekly"]),
  weekdays: z.array(z.number().int().min(0).max(6)).max(7).optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  name: z.string().trim().min(2).max(80),
  address: z.object({
    line1: z.string().trim().min(5).max(200),
    line2: z.string().trim().max(200).optional(),
    landmark: z.string().trim().max(120).optional(),
    pincode: z.string().trim(),
  }),
});

export async function POST(request: Request) {
  const customer = await getCurrentCustomer();
  if (!customer) {
    return NextResponse.json(
      { error: "Please sign in to start a subscription.", needsAuth: true },
      { status: 401 },
    );
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Please complete every field." },
      { status: 400 },
    );
  }

  const body = parsed.data;
  const settings = await getSettings();

  if (settings.ordersPaused) {
    return NextResponse.json(
      { error: "We are not accepting new subscriptions right now." },
      { status: 409 },
    );
  }

  // ---- the variant must belong to a product that is actually subscribable
  const [variant] = await db
    .select()
    .from(variants)
    .where(eq(variants.id, body.variantId))
    .limit(1);

  if (!variant || !variant.inStock) {
    return NextResponse.json(
      { error: "That size is not available right now." },
      { status: 409 },
    );
  }

  const [product] = await db
    .select()
    .from(products)
    .where(eq(products.id, variant.productId))
    .limit(1);

  if (!product || !product.subscribable || product.status !== "active") {
    return NextResponse.json(
      { error: "That product cannot be subscribed to." },
      { status: 409 },
    );
  }

  // ---- subscriptions are fresh deliveries, so the pincode must be serviceable
  if (!isPincode(body.address.pincode)) {
    return NextResponse.json(
      { error: "Please enter a valid 6-digit pincode." },
      { status: 400 },
    );
  }

  if (!(await isPincodeServiceable(body.address.pincode))) {
    return NextResponse.json(
      {
        error: `Subscriptions are delivered inside ${settings.freshDeliveryCity} only. ${body.address.pincode} is outside our morning route.`,
      },
      { status: 409 },
    );
  }

  if (body.frequency === "weekly" && (body.weekdays ?? []).length === 0) {
    return NextResponse.json(
      { error: "Please choose at least one day of the week." },
      { status: 400 },
    );
  }

  // A start date in the past would back-date the alternate-day rhythm.
  const today = todayIST();
  const startDate = body.startDate < today ? today : body.startDate;

  if (!customer.name) {
    await db
      .update(customers)
      .set({ name: body.name })
      .where(eq(customers.id, customer.id));
  }

  const [address] = await db
    .insert(addresses)
    .values({
      customerId: customer.id,
      line1: body.address.line1,
      line2: body.address.line2 || null,
      landmark: body.address.landmark || null,
      city: settings.freshDeliveryCity,
      pincode: body.address.pincode,
      isDefault: true,
    })
    .returning();

  const [subscription] = await db
    .insert(subscriptions)
    .values({
      customerId: customer.id,
      variantId: variant.id,
      quantity: body.quantity,
      frequency: body.frequency,
      weekdays: body.frequency === "weekly" ? (body.weekdays ?? []) : [],
      startDate,
      addressId: address.id,
      status: "active",
    })
    .returning();

  return NextResponse.json({ ok: true, subscriptionId: subscription.id });
}
