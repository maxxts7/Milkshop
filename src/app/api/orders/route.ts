import { NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { customAlphabet } from "nanoid";
import { db } from "@/lib/db";
import { customers, orders, orderItems } from "@/lib/db/schema";
import { priceCart } from "@/lib/cart";
import { getSettings, isPincodeServiceable } from "@/lib/store";
import { getCurrentCustomer } from "@/lib/auth";
import { sendOrderAlert } from "@/lib/email";
import {
  calculateDeliveryFee,
  getCutoffInfo,
  isPhone,
  isPincode,
  istParts,
  normalisePhone,
  resolveZone,
} from "@/lib/delivery";

export const dynamic = "force-dynamic";

// No look-alike characters — these numbers get read aloud over the phone.
const suffix = customAlphabet("ACDEFGHJKLMNPQRTUVWXY34679", 6);

const bodySchema = z.object({
  items: z
    .array(
      z.object({
        variantId: z.number().int().positive(),
        quantity: z.number().int().positive().max(50),
      }),
    )
    .min(1)
    .max(60),
  fulfilment: z.enum(["delivery", "pickup"]),
  contact: z.object({
    name: z.string().trim().min(2).max(80),
    phone: z.string().trim().min(1),
    email: z.string().trim().email().optional().or(z.literal("")),
  }),
  address: z
    .object({
      line1: z.string().trim().max(200).optional(),
      line2: z.string().trim().max(200).optional(),
      landmark: z.string().trim().max(120).optional(),
      city: z.string().trim().max(80).optional(),
      state: z.string().trim().max(80).optional(),
      pincode: z.string().trim().max(10).optional(),
    })
    .optional(),
  note: z.string().trim().max(500).optional(),
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
      { error: "Please check the form and try again." },
      { status: 400 },
    );
  }

  const { items, fulfilment, contact, address, note } = parsed.data;
  const settings = await getSettings();

  if (settings.ordersPaused) {
    return NextResponse.json(
      { error: "We are not accepting orders right now. Please try again later." },
      { status: 409 },
    );
  }

  const phone = normalisePhone(contact.phone);
  if (!isPhone(phone)) {
    return NextResponse.json(
      { error: "Please enter a valid 10-digit Indian mobile number." },
      { status: 400 },
    );
  }

  // Every price is recomputed here. The client's numbers are never trusted.
  const cart = await priceCart(items);

  if (cart.lines.length === 0) {
    return NextResponse.json(
      {
        error:
          cart.removed.length > 0
            ? "The items in your cart are no longer available."
            : "Your cart is empty.",
        removed: cart.removed,
      },
      { status: 409 },
    );
  }

  if (cart.removed.length > 0) {
    return NextResponse.json(
      {
        error: "Some items changed while you were shopping. Please review your cart.",
        removed: cart.removed,
      },
      { status: 409 },
    );
  }

  // ---- address + zone
  let pincode = "";
  if (fulfilment === "delivery") {
    pincode = (address?.pincode ?? "").trim();
    if (!isPincode(pincode)) {
      return NextResponse.json(
        { error: "Please enter a valid 6-digit pincode." },
        { status: 400 },
      );
    }
    if (!address?.line1 || address.line1.trim().length < 5) {
      return NextResponse.json(
        { error: "Please enter your full address." },
        { status: 400 },
      );
    }
  }

  const serviceable =
    fulfilment === "delivery" ? await isPincodeServiceable(pincode) : false;
  const zone = resolveZone(cart.hasFresh, fulfilment, serviceable);

  if (fulfilment === "delivery" && cart.hasFresh && !serviceable) {
    return NextResponse.json(
      {
        error: `We can only deliver fresh items inside ${settings.freshDeliveryCity}. Please remove the fresh items or choose store pickup.`,
      },
      { status: 409 },
    );
  }

  const fee = calculateDeliveryFee({
    subtotalPaise: cart.subtotalPaise,
    zone,
    settings,
  });
  const totalPaise = cart.subtotalPaise + fee.feePaise;

  // ---- when it arrives
  const cutoff = getCutoffInfo(settings);
  let deliveryDate: string | null = null;
  let deliverySlot: string | null = null;

  if (cart.hasFresh) {
    deliveryDate = cutoff.deliveryDate;
    deliverySlot = cutoff.slot;
  } else if (fulfilment === "delivery" && zone === "srinagar") {
    deliveryDate = cutoff.deliveryDate;
    deliverySlot = cutoff.slot;
  }

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
        .values({ phone, name: contact.name, email: contact.email || null })
        .returning();
      customerId = created.id;
    }
  }

  if (session && !session.name) {
    await db
      .update(customers)
      .set({ name: contact.name })
      .where(eq(customers.id, session.id));
  }

  // ---- write the order
  const p = istParts();
  const stamp = `${String(p.year).slice(2)}${String(p.month + 1).padStart(2, "0")}${String(p.day).padStart(2, "0")}`;
  const orderNumber = `KG-${stamp}-${suffix()}`;

  const [order] = await db
    .insert(orders)
    .values({
      orderNumber,
      customerId,
      contactName: contact.name,
      contactPhone: phone,
      contactEmail: contact.email || null,
      fulfilment,
      zone,
      addressLine1: fulfilment === "delivery" ? (address?.line1 ?? null) : null,
      addressLine2: fulfilment === "delivery" ? (address?.line2 ?? null) : null,
      landmark: fulfilment === "delivery" ? (address?.landmark ?? null) : null,
      city: fulfilment === "delivery" ? (address?.city ?? settings.freshDeliveryCity) : null,
      state: fulfilment === "delivery" ? (address?.state ?? "Jammu & Kashmir") : null,
      pincode: fulfilment === "delivery" ? pincode : null,
      subtotalPaise: cart.subtotalPaise,
      deliveryFeePaise: fee.feePaise,
      totalPaise,
      paymentMethod: fulfilment === "pickup" ? "pickup" : "cod",
      paymentStatus: "pending",
      status: "placed",
      deliveryDate,
      deliverySlot,
      customerNote: note || null,
    })
    .returning();

  await db.insert(orderItems).values(
    cart.lines.map((l) => ({
      orderId: order.id,
      productId: l.product.id,
      variantId: l.variant.id,
      productName: l.product.name,
      variantLabel: l.variant.label,
      image: l.product.image,
      unitPricePaise: l.unitPricePaise,
      quantity: l.quantity,
      lineTotalPaise: l.lineTotalPaise,
    })),
  );

  // Alerting must never fail the order — sendOrderAlert swallows its own errors.
  await sendOrderAlert({
    orderNumber,
    contactName: contact.name,
    contactPhone: phone,
    fulfilment,
    zone,
    address:
      fulfilment === "delivery"
        ? [address?.line1, address?.line2, address?.landmark, address?.city, pincode]
            .filter(Boolean)
            .join(", ")
        : null,
    deliveryDate,
    deliverySlot,
    items: cart.lines.map((l) => ({
      productName: l.product.name,
      variantLabel: l.variant.label,
      quantity: l.quantity,
      lineTotalPaise: l.lineTotalPaise,
    })),
    subtotalPaise: cart.subtotalPaise,
    deliveryFeePaise: fee.feePaise,
    totalPaise,
    customerNote: note || null,
  });

  return NextResponse.json({ ok: true, orderNumber });
}
