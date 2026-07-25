import "server-only";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "./db";
import {
  subscriptions,
  subscriptionSkips,
  variants,
  products,
  customers,
  addresses,
  type Subscription,
} from "./db/schema";

export type Frequency = "daily" | "alternate" | "weekly";

export const FREQUENCY_LABELS: Record<Frequency, string> = {
  daily: "Every day",
  alternate: "Every other day",
  weekly: "Once a week",
};

/**
 * Does a subscription deliver on a given date?
 *
 * daily      — every active delivery day
 * alternate  — every second day counted from the start date
 * weekly     — only on the chosen weekdays
 */
export function deliversOn(
  sub: Pick<Subscription, "frequency" | "startDate" | "weekdays" | "status" | "pausedFrom" | "pausedUntil">,
  isoDate: string,
): boolean {
  if (sub.status !== "active") return false;
  if (isoDate < sub.startDate) return false;

  if (sub.pausedFrom && sub.pausedUntil) {
    if (isoDate >= sub.pausedFrom && isoDate <= sub.pausedUntil) return false;
  }

  const target = Date.parse(`${isoDate}T00:00:00Z`);
  const start = Date.parse(`${sub.startDate}T00:00:00Z`);
  if (Number.isNaN(target) || Number.isNaN(start)) return false;

  switch (sub.frequency as Frequency) {
    case "daily":
      return true;
    case "alternate": {
      const days = Math.round((target - start) / 86_400_000);
      return days >= 0 && days % 2 === 0;
    }
    case "weekly": {
      const weekday = new Date(target).getUTCDay();
      const chosen = sub.weekdays ?? [];
      return chosen.length > 0
        ? chosen.includes(weekday)
        : new Date(start).getUTCDay() === weekday;
    }
    default:
      return false;
  }
}

export interface RunSheetRow {
  subscriptionId: number;
  customerName: string | null;
  customerPhone: string;
  productName: string;
  variantLabel: string;
  quantity: number;
  unitPricePaise: number;
  totalPaise: number;
  address: string | null;
}

/**
 * Everything that must physically go out on a given morning.
 * This is the sheet the delivery rider carries.
 */
export async function getRunSheet(isoDate: string): Promise<RunSheetRow[]> {
  const activeSubs = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.status, "active"));

  if (activeSubs.length === 0) return [];

  const due = activeSubs.filter((s) => deliversOn(s, isoDate));
  if (due.length === 0) return [];

  const skips = await db
    .select()
    .from(subscriptionSkips)
    .where(
      and(
        inArray(
          subscriptionSkips.subscriptionId,
          due.map((s) => s.id),
        ),
        eq(subscriptionSkips.skipDate, isoDate),
      ),
    );
  const skipped = new Set(skips.map((s) => s.subscriptionId));

  const delivering = due.filter((s) => !skipped.has(s.id));
  if (delivering.length === 0) return [];

  const [variantRows, customerRows, addressRows] = await Promise.all([
    db
      .select()
      .from(variants)
      .where(inArray(variants.id, delivering.map((s) => s.variantId))),
    db
      .select()
      .from(customers)
      .where(inArray(customers.id, delivering.map((s) => s.customerId))),
    (async () => {
      const ids = delivering.map((s) => s.addressId).filter((v): v is number => v != null);
      if (ids.length === 0) return [];
      return db.select().from(addresses).where(inArray(addresses.id, ids));
    })(),
  ]);

  const productRows = await db
    .select()
    .from(products)
    .where(inArray(products.id, [...new Set(variantRows.map((v) => v.productId))]));

  const variantById = new Map(variantRows.map((v) => [v.id, v]));
  const productById = new Map(productRows.map((p) => [p.id, p]));
  const customerById = new Map(customerRows.map((c) => [c.id, c]));
  const addressById = new Map(addressRows.map((a) => [a.id, a]));

  const rows: RunSheetRow[] = [];

  for (const sub of delivering) {
    const variant = variantById.get(sub.variantId);
    if (!variant) continue;
    const product = productById.get(variant.productId);
    const customer = customerById.get(sub.customerId);
    if (!product || !customer) continue;

    const address = sub.addressId ? addressById.get(sub.addressId) : null;
    const unitPricePaise = variant.subscriberPricePaise ?? variant.pricePaise;

    rows.push({
      subscriptionId: sub.id,
      customerName: customer.name,
      customerPhone: customer.phone,
      productName: product.name,
      variantLabel: variant.label,
      quantity: sub.quantity,
      unitPricePaise,
      totalPaise: unitPricePaise * sub.quantity,
      address: address
        ? [address.line1, address.line2, address.landmark, address.pincode]
            .filter(Boolean)
            .join(", ")
        : null,
    });
  }

  return rows.sort(
    (a, b) => (a.address ?? "").localeCompare(b.address ?? "") || a.subscriptionId - b.subscriptionId,
  );
}

/** The next N dates this subscription will actually deliver on. */
export function nextDeliveries(
  sub: Pick<Subscription, "frequency" | "startDate" | "weekdays" | "status" | "pausedFrom" | "pausedUntil">,
  fromIso: string,
  count = 5,
): string[] {
  const out: string[] = [];
  const start = Date.parse(`${fromIso}T00:00:00Z`);
  if (Number.isNaN(start)) return out;

  for (let i = 0; i < 90 && out.length < count; i++) {
    const iso = new Date(start + i * 86_400_000).toISOString().slice(0, 10);
    if (deliversOn(sub, iso)) out.push(iso);
  }
  return out;
}
