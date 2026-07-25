import type { Metadata } from "next";
import Link from "next/link";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { orders, orderItems } from "@/lib/db/schema";
import { getSettings } from "@/lib/store";
import { getRunSheet } from "@/lib/subscriptions";
import { formatPaise } from "@/lib/money";
import { formatIstDate, getCutoffInfo } from "@/lib/delivery";
import { PrintButton } from "@/components/print-button";

export const metadata: Metadata = {
  title: "Delivery run-sheet",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function RunSheetPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const [{ date }, settings] = await Promise.all([searchParams, getSettings()]);
  const cutoff = getCutoffInfo(settings);

  const target =
    date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : cutoff.deliveryDate;

  const [subRows, oneOffOrders] = await Promise.all([
    getRunSheet(target),
    db
      .select()
      .from(orders)
      .where(
        and(
          eq(orders.deliveryDate, target),
          eq(orders.fulfilment, "delivery"),
          inArray(orders.status, ["placed", "confirmed", "packed", "out_for_delivery"]),
        ),
      ),
  ]);

  const orderLines =
    oneOffOrders.length > 0
      ? await db
          .select()
          .from(orderItems)
          .where(
            inArray(
              orderItems.orderId,
              oneOffOrders.map((o) => o.id),
            ),
          )
      : [];

  const linesByOrder = new Map<number, typeof orderLines>();
  for (const line of orderLines) {
    const list = linesByOrder.get(line.orderId) ?? [];
    list.push(line);
    linesByOrder.set(line.orderId, list);
  }

  const subTotal = subRows.reduce((sum, r) => sum + r.totalPaise, 0);
  const orderTotal = oneOffOrders.reduce((sum, o) => sum + o.totalPaise, 0);
  const stops = subRows.length + oneOffOrders.length;

  // Previous / next day links
  const shift = (days: number) =>
    new Date(Date.parse(`${target}T00:00:00Z`) + days * 86_400_000)
      .toISOString()
      .slice(0, 10);

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-3xl">Delivery run-sheet</h1>
          <p className="text-sm text-ink-muted mt-1">
            {formatIstDate(target)} · {settings.deliverySlot}
          </p>
        </div>
        <div className="flex items-center gap-2 no-print">
          <Link href={`/admin/runsheet?date=${shift(-1)}`} className="btn btn-outline btn-sm">
            ← Previous
          </Link>
          <Link href={`/admin/runsheet?date=${shift(1)}`} className="btn btn-outline btn-sm">
            Next →
          </Link>
          <PrintButton />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <div className="bg-paper border border-rule p-4">
          <p className="eyebrow mb-1">Stops</p>
          <p className="font-display text-2xl">{stops}</p>
        </div>
        <div className="bg-paper border border-rule p-4">
          <p className="eyebrow mb-1">Subscriptions</p>
          <p className="font-display text-2xl">{subRows.length}</p>
        </div>
        <div className="bg-paper border border-rule p-4">
          <p className="eyebrow mb-1">Cash to collect</p>
          <p className="font-display text-2xl">
            {formatPaise(subTotal + orderTotal)}
          </p>
        </div>
      </div>

      {stops === 0 ? (
        <p className="bg-paper border border-rule px-5 py-12 text-center text-sm text-ink-muted">
          Nothing scheduled for {formatIstDate(target)}.
        </p>
      ) : null}

      {/* ------------------------------------------------- subscriptions */}
      {subRows.length > 0 ? (
        <section className="bg-paper border border-rule mb-8">
          <h2 className="font-display text-xl px-5 py-4 border-b border-rule">
            Subscription deliveries ({subRows.length})
          </h2>
          <div className="scroll-x">
            <table className="w-full text-sm min-w-[48rem]">
              <thead>
                <tr className="text-left border-b border-rule">
                  <th className="px-4 py-3 eyebrow font-medium w-8">✓</th>
                  <th className="px-4 py-3 eyebrow font-medium">Customer</th>
                  <th className="px-4 py-3 eyebrow font-medium">Address</th>
                  <th className="px-4 py-3 eyebrow font-medium">Item</th>
                  <th className="px-4 py-3 eyebrow font-medium text-right">Collect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rule">
                {subRows.map((row) => (
                  <tr key={row.subscriptionId} className="align-top">
                    <td className="px-4 py-3">
                      <span className="inline-block h-4 w-4 border border-rule-strong" />
                    </td>
                    <td className="px-4 py-3">
                      {row.customerName ?? "Customer"}
                      <a
                        href={`tel:+91${row.customerPhone}`}
                        className="block text-xs text-ink-muted"
                      >
                        +91 {row.customerPhone}
                      </a>
                    </td>
                    <td className="px-4 py-3 text-ink-soft max-w-xs">
                      {row.address ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      {row.quantity} × {row.productName}
                      <span className="block text-xs text-ink-muted">
                        {row.variantLabel}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      {formatPaise(row.totalPaise)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {/* -------------------------------------------------- one-off orders */}
      {oneOffOrders.length > 0 ? (
        <section className="bg-paper border border-rule">
          <h2 className="font-display text-xl px-5 py-4 border-b border-rule">
            One-off orders ({oneOffOrders.length})
          </h2>
          <div className="scroll-x">
            <table className="w-full text-sm min-w-[48rem]">
              <thead>
                <tr className="text-left border-b border-rule">
                  <th className="px-4 py-3 eyebrow font-medium w-8">✓</th>
                  <th className="px-4 py-3 eyebrow font-medium">Order</th>
                  <th className="px-4 py-3 eyebrow font-medium">Customer</th>
                  <th className="px-4 py-3 eyebrow font-medium">Address</th>
                  <th className="px-4 py-3 eyebrow font-medium">Items</th>
                  <th className="px-4 py-3 eyebrow font-medium text-right">Collect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rule">
                {oneOffOrders.map((order) => (
                  <tr key={order.id} className="align-top">
                    <td className="px-4 py-3">
                      <span className="inline-block h-4 w-4 border border-rule-strong" />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="underline underline-offset-2"
                      >
                        {order.orderNumber}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      {order.contactName}
                      <a
                        href={`tel:+91${order.contactPhone}`}
                        className="block text-xs text-ink-muted"
                      >
                        +91 {order.contactPhone}
                      </a>
                    </td>
                    <td className="px-4 py-3 text-ink-soft max-w-xs">
                      {[order.addressLine1, order.addressLine2, order.landmark, order.pincode]
                        .filter(Boolean)
                        .join(", ")}
                    </td>
                    <td className="px-4 py-3">
                      {(linesByOrder.get(order.id) ?? []).map((l) => (
                        <span key={l.id} className="block">
                          {l.quantity} × {l.productName}
                          <span className="text-ink-muted"> ({l.variantLabel})</span>
                        </span>
                      ))}
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      {order.paymentStatus === "paid"
                        ? "Paid"
                        : formatPaise(order.totalPaise)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </>
  );
}
