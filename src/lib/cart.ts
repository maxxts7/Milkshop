import "server-only";
import { inArray, eq } from "drizzle-orm";
import { db } from "./db";
import { products, variants, type Product, type Variant } from "./db/schema";

/**
 * The browser sends variant ids and quantities and nothing else.
 *
 * Every price on an order is looked up here, server-side, from the database.
 * A tampered cart in devtools can change what you buy — never what it costs.
 */

export interface CartLineInput {
  variantId: number;
  quantity: number;
}

export interface PricedLine {
  variantId: number;
  quantity: number;
  product: Product;
  variant: Variant;
  unitPricePaise: number;
  lineTotalPaise: number;
  /** True when this line was priced at the subscriber rate. */
  subscriberRate: boolean;
}

export interface PricedCart {
  lines: PricedLine[];
  subtotalPaise: number;
  itemCount: number;
  hasFresh: boolean;
  hasDry: boolean;
  /** Lines dropped because the variant vanished or went out of stock. */
  removed: { label: string; reason: string }[];
}

const MAX_QTY_PER_LINE = 50;

export async function priceCart(
  input: CartLineInput[],
  opts: { subscriber?: boolean } = {},
): Promise<PricedCart> {
  const empty: PricedCart = {
    lines: [],
    subtotalPaise: 0,
    itemCount: 0,
    hasFresh: false,
    hasDry: false,
    removed: [],
  };

  // Collapse duplicates and clamp quantities before touching the database.
  const wanted = new Map<number, number>();
  for (const line of input) {
    const id = Number(line.variantId);
    const qty = Math.floor(Number(line.quantity));
    if (!Number.isInteger(id) || id <= 0) continue;
    if (!Number.isFinite(qty) || qty <= 0) continue;
    wanted.set(id, Math.min((wanted.get(id) ?? 0) + qty, MAX_QTY_PER_LINE));
  }

  if (wanted.size === 0) return empty;

  const variantRows = await db
    .select()
    .from(variants)
    .where(inArray(variants.id, [...wanted.keys()]));

  if (variantRows.length === 0) return empty;

  const productRows = await db
    .select()
    .from(products)
    .where(inArray(products.id, [...new Set(variantRows.map((v) => v.productId))]));

  const productById = new Map(productRows.map((p) => [p.id, p]));

  const lines: PricedLine[] = [];
  const removed: PricedCart["removed"] = [];

  for (const [variantId, quantity] of wanted) {
    const variant = variantRows.find((v) => v.id === variantId);
    if (!variant) {
      removed.push({ label: `Item #${variantId}`, reason: "no longer sold" });
      continue;
    }

    const product = productById.get(variant.productId);
    if (!product || product.status !== "active") {
      removed.push({
        label: product?.name ?? `Item #${variantId}`,
        reason: "no longer available",
      });
      continue;
    }

    if (!variant.inStock) {
      removed.push({
        label: `${product.name} — ${variant.label}`,
        reason: "out of stock",
      });
      continue;
    }

    const useSubscriberRate =
      Boolean(opts.subscriber) && variant.subscriberPricePaise != null;

    const unitPricePaise = useSubscriberRate
      ? variant.subscriberPricePaise!
      : variant.pricePaise;

    lines.push({
      variantId,
      quantity,
      product,
      variant,
      unitPricePaise,
      lineTotalPaise: unitPricePaise * quantity,
      subscriberRate: useSubscriberRate,
    });
  }

  // Preserve catalogue order so the cart reads the same as the shop.
  lines.sort(
    (a, b) =>
      a.product.sortOrder - b.product.sortOrder ||
      a.variant.sortOrder - b.variant.sortOrder,
  );

  return {
    lines,
    subtotalPaise: lines.reduce((sum, l) => sum + l.lineTotalPaise, 0),
    itemCount: lines.reduce((sum, l) => sum + l.quantity, 0),
    hasFresh: lines.some((l) => l.product.kind === "fresh"),
    hasDry: lines.some((l) => l.product.kind === "dry"),
    removed,
  };
}

/** A single variant priced for the subscription builder. */
export async function priceSubscriptionLine(variantId: number, quantity: number) {
  const [variant] = await db
    .select()
    .from(variants)
    .where(eq(variants.id, variantId))
    .limit(1);
  if (!variant) return null;

  const [product] = await db
    .select()
    .from(products)
    .where(eq(products.id, variant.productId))
    .limit(1);
  if (!product || !product.subscribable) return null;

  const unitPricePaise = variant.subscriberPricePaise ?? variant.pricePaise;
  const qty = Math.max(1, Math.min(Math.floor(quantity) || 1, MAX_QTY_PER_LINE));

  return {
    product,
    variant,
    quantity: qty,
    unitPricePaise,
    perDeliveryPaise: unitPricePaise * qty,
    savingPaise:
      variant.subscriberPricePaise != null
        ? (variant.pricePaise - variant.subscriberPricePaise) * qty
        : 0,
  };
}
