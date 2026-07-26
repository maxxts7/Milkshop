import { NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { randomInt } from "node:crypto";
import { db } from "@/lib/db";
import { subscriptions, addresses, customers, variants, products } from "@/lib/db/schema";
import { getCurrentCustomer } from "@/lib/auth";
import { getSettings, isPincodeServiceable } from "@/lib/store";
import { sendSubscriptionWhatsapp } from "@/lib/whatsapp";
import {
  isPhone,
  isPincode,
  istParts,
  normalisePhone,
  todayIST,
} from "@/lib/delivery";

export const dynamic = "force-dynamic";

// Same alphabet as order numbers: no look-alike characters, because these get
// read aloud over the phone too.
const REFERENCE_ALPHABET = "ACDEFGHJKLMNPQRTUVWXY34679";

function suffix(length = 6): string {
  let out = "";
  for (let i = 0; i < length; i++) {
    out += REFERENCE_ALPHABET[randomInt(REFERENCE_ALPHABET.length)];
  }
  return out;
}

const WEEKDAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const FREQUENCY_LABELS: Record<string, string> = {
  daily: "Every day",
  alternate: "Every other day",
  weekly: "Once a week",
};

const bodySchema = z.object({
  variantId: z.number().int().positive(),
  quantity: z.number().int().min(1).max(20),
  frequency: z.enum(["daily", "alternate", "weekly"]),
  weekdays: z.array(z.number().int().min(0).max(6)).max(7).optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  name: z.string().trim().min(2).max(80),
  phone: z.string().trim().min(1),
  address: z.object({
    line1: z.string().trim().min(5).max(200),
    line2: z.string().trim().max(200).optional(),
    landmark: z.string().trim().max(120).optional(),
    pincode: z.string().trim(),
  }),
});

export async function POST(request: Request) {
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

  // Signing in is optional — the mobile number is what identifies the customer,
  // exactly as it does for a one-off order at checkout.
  const phone = normalisePhone(body.phone);
  if (!isPhone(phone)) {
    return NextResponse.json(
      { error: "Please enter a valid 10-digit Indian mobile number." },
      { status: 400 },
    );
  }

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

  // ---- customer record (guests get one too, so history works if they log in)
  const session = await getCurrentCustomer();
  let customerId = session?.id ?? null;

  if (!customerId) {
    const [existing] = await db
      .select()
      .from(customers)
      .where(eq(customers.phone, phone))
      .limit(1);

    if (existing) {
      customerId = existing.id;
    } else {
      const [created] = await db
        .insert(customers)
        .values({ phone, name: body.name })
        .returning();
      customerId = created.id;
    }
  }

  if (session && !session.name) {
    await db
      .update(customers)
      .set({ name: body.name })
      .where(eq(customers.id, session.id));
  }

  const [address] = await db
    .insert(addresses)
    .values({
      customerId,
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
      customerId,
      variantId: variant.id,
      quantity: body.quantity,
      frequency: body.frequency,
      weekdays: body.frequency === "weekly" ? (body.weekdays ?? []) : [],
      startDate,
      addressId: address.id,
      status: "active",
    })
    .returning();

  const p = istParts();
  const stamp = `${String(p.year).slice(2)}${String(p.month + 1).padStart(2, "0")}${String(p.day).padStart(2, "0")}`;
  const reference = `KG-S-${stamp}-${suffix()}`;

  const days =
    body.frequency === "weekly"
      ? (body.weekdays ?? []).map((d) => WEEKDAY_NAMES[d]).join(", ")
      : "";
  const schedule =
    FREQUENCY_LABELS[body.frequency] + (days ? ` — ${days}` : "");

  const perDeliveryPaise =
    (variant.subscriberPricePaise ?? variant.pricePaise) * body.quantity;

  // Alerting must never fail the subscription — the sender swallows its own
  // errors — so this is awaited only to keep the function alive long enough.
  await sendSubscriptionWhatsapp(
    {
      reference,
      contactName: body.name,
      contactPhone: phone,
      address: [body.address.line1, body.address.line2, settings.freshDeliveryCity]
        .filter(Boolean)
        .join(", "),
      landmark: body.address.landmark || null,
      pincode: body.address.pincode,
      productName: product.name,
      variantLabel: variant.label,
      quantity: body.quantity,
      schedule,
      startDate,
      deliverySlot: settings.deliverySlot,
      perDeliveryPaise,
    },
    settings.whatsappNumber,
  );

  return NextResponse.json({
    ok: true,
    subscriptionId: subscription.id,
    reference,
    startDate,
    schedule,
    deliverySlot: settings.deliverySlot,
    perDeliveryPaise,
  });
}
