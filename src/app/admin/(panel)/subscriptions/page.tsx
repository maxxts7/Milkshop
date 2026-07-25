import type { Metadata } from "next";
import { desc, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  subscriptions,
  customers,
  variants,
  products,
  addresses,
} from "@/lib/db/schema";
import { getSettings } from "@/lib/store";
import { FREQUENCY_LABELS, nextDeliveries, type Frequency } from "@/lib/subscriptions";
import { formatPaise } from "@/lib/money";
import { formatIstDate, todayIST } from "@/lib/delivery";

export const metadata: Metadata = {
  title: "Subscriptions",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const STATUS_STYLES: Record<string, string> = {
  active: "bg-fresh-soft text-fresh",
  paused: "bg-cream text-ink-soft",
  cancelled: "bg-alert-soft text-alert",
};

export default async function AdminSubscriptions() {
  const [rows, settings] = await Promise.all([
    db.select().from(subscriptions).orderBy(desc(subscriptions.createdAt)).limit(300),
    getSettings(),
  ]);

  if (rows.length === 0) {
    return (
      <>
        <h1 className="font-display text-3xl mb-6">Subscriptions</h1>
        <p className="bg-paper border border-rule px-5 py-12 text-center text-sm text-ink-muted">
          No subscriptions yet.
        </p>
      </>
    );
  }

  const [customerRows, variantRows, addressRows] = await Promise.all([
    db.select().from(customers).where(inArray(customers.id, rows.map((r) => r.customerId))),
    db.select().from(variants).where(inArray(variants.id, rows.map((r) => r.variantId))),
    (async () => {
      const ids = rows.map((r) => r.addressId).filter((v): v is number => v != null);
      return ids.length > 0
        ? db.select().from(addresses).where(inArray(addresses.id, ids))
        : [];
    })(),
  ]);

  const productRows = await db
    .select()
    .from(products)
    .where(inArray(products.id, [...new Set(variantRows.map((v) => v.productId))]));

  const customerById = new Map(customerRows.map((c) => [c.id, c]));
  const variantById = new Map(variantRows.map((v) => [v.id, v]));
  const productById = new Map(productRows.map((p) => [p.id, p]));
  const addressById = new Map(addressRows.map((a) => [a.id, a]));

  const today = todayIST();
  const activeCount = rows.filter((r) => r.status === "active").length;

  const dailyValue = rows
    .filter((r) => r.status === "active")
    .reduce((sum, r) => {
      const v = variantById.get(r.variantId);
      if (!v) return sum;
      return sum + (v.subscriberPricePaise ?? v.pricePaise) * r.quantity;
    }, 0);

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <h1 className="font-display text-3xl">Subscriptions</h1>
        <p className="text-sm text-ink-soft">
          {activeCount} active ·{" "}
          <span className="text-ink font-medium">{formatPaise(dailyValue)}</span> per
          full round
        </p>
      </div>

      <div className="bg-paper border border-rule scroll-x">
        <table className="w-full text-sm min-w-[56rem]">
          <thead>
            <tr className="text-left border-b border-rule">
              <th className="px-4 py-3 eyebrow font-medium">Customer</th>
              <th className="px-4 py-3 eyebrow font-medium">Item</th>
              <th className="px-4 py-3 eyebrow font-medium">Schedule</th>
              <th className="px-4 py-3 eyebrow font-medium">Next</th>
              <th className="px-4 py-3 eyebrow font-medium">Address</th>
              <th className="px-4 py-3 eyebrow font-medium">Status</th>
              <th className="px-4 py-3 eyebrow font-medium text-right">Per drop</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-rule">
            {rows.map((sub) => {
              const customer = customerById.get(sub.customerId);
              const variant = variantById.get(sub.variantId);
              const product = variant ? productById.get(variant.productId) : undefined;
              const address = sub.addressId ? addressById.get(sub.addressId) : null;
              const unit = variant
                ? (variant.subscriberPricePaise ?? variant.pricePaise)
                : 0;
              const upcoming = nextDeliveries(sub, today, 1);

              return (
                <tr key={sub.id} className="align-top">
                  <td className="px-4 py-3">
                    {customer?.name ?? "Customer"}
                    {customer ? (
                      <a
                        href={`tel:+91${customer.phone}`}
                        className="block text-xs text-ink-muted"
                      >
                        +91 {customer.phone}
                      </a>
                    ) : null}
                  </td>
                  <td className="px-4 py-3">
                    {sub.quantity} × {product?.name ?? "—"}
                    <span className="block text-xs text-ink-muted">
                      {variant?.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-ink-soft">
                    {FREQUENCY_LABELS[sub.frequency as Frequency] ?? sub.frequency}
                  </td>
                  <td className="px-4 py-3 text-ink-soft whitespace-nowrap">
                    {sub.status === "paused" && sub.pausedUntil
                      ? `Paused to ${formatIstDate(sub.pausedUntil)}`
                      : upcoming.length > 0
                        ? formatIstDate(upcoming[0])
                        : "—"}
                  </td>
                  <td className="px-4 py-3 text-ink-soft max-w-xs">
                    {address
                      ? [address.line1, address.line2, address.pincode]
                          .filter(Boolean)
                          .join(", ")
                      : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`tag ${STATUS_STYLES[sub.status] ?? ""}`}>
                      {sub.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    {formatPaise(unit * sub.quantity)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-ink-muted mt-4 leading-relaxed">
        Customers pause, resume and cancel their own subscriptions from their
        account. Deliveries appear on the{" "}
        <a href="/admin/runsheet" className="underline underline-offset-2">
          run-sheet
        </a>{" "}
        each morning ({settings.deliverySlot}).
      </p>
    </>
  );
}
