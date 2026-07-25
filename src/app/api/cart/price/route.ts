import { NextResponse } from "next/server";
import { z } from "zod";
import { priceCart } from "@/lib/cart";
import { getSettings, isPincodeServiceable } from "@/lib/store";
import {
  calculateDeliveryFee,
  getCutoffInfo,
  isPincode,
  resolveZone,
  type Zone,
} from "@/lib/delivery";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  items: z
    .array(
      z.object({
        variantId: z.number().int().positive(),
        quantity: z.number().int().positive().max(50),
      }),
    )
    .max(60),
  fulfilment: z.enum(["delivery", "pickup"]).default("delivery"),
  pincode: z.string().trim().optional(),
});

export async function POST(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid cart." }, { status: 400 });
  }

  const { items, fulfilment, pincode } = parsed.data;
  const [cart, settings] = await Promise.all([priceCart(items), getSettings()]);

  const pincodeGiven = Boolean(pincode && isPincode(pincode));
  const serviceable = pincodeGiven ? await isPincodeServiceable(pincode!) : false;

  const zone: Zone = resolveZone(cart.hasFresh, fulfilment, serviceable);

  const fee = calculateDeliveryFee({
    subtotalPaise: cart.subtotalPaise,
    zone,
    settings,
  });

  /**
   * A cart with fresh items can only go to a serviceable pincode or be
   * collected. This is the single rule the whole delivery model rests on.
   */
  let blocked: string | null = null;
  if (fulfilment === "delivery" && cart.hasFresh && pincodeGiven && !serviceable) {
    blocked = `We can only deliver fresh milk, dahi and eggs inside ${settings.freshDeliveryCity}. Remove the fresh items to ship the rest across India, or choose store pickup.`;
  }

  return NextResponse.json({
    lines: cart.lines.map((l) => ({
      variantId: l.variantId,
      quantity: l.quantity,
      productName: l.product.name,
      productSlug: l.product.slug,
      house: l.product.house,
      kind: l.product.kind,
      variantLabel: l.variant.label,
      image: l.product.image,
      unitPricePaise: l.unitPricePaise,
      lineTotalPaise: l.lineTotalPaise,
    })),
    removed: cart.removed,
    subtotalPaise: cart.subtotalPaise,
    itemCount: cart.itemCount,
    hasFresh: cart.hasFresh,
    hasDry: cart.hasDry,
    delivery: {
      zone,
      fulfilment,
      serviceable,
      pincodeGiven,
      blocked,
      feePaise: fee.feePaise,
      freeThresholdPaise: fee.freeThresholdPaise,
      remainingForFreePaise: fee.remainingForFreePaise,
    },
    totalPaise: cart.subtotalPaise + fee.feePaise,
    cutoff: cart.hasFresh ? getCutoffInfo(settings) : null,
    ordersPaused: settings.ordersPaused,
  });
}
