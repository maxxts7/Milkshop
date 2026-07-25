import type { Metadata } from "next";
import Link from "next/link";
import { desc, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { orders } from "@/lib/db/schema";
import { formatPaise } from "@/lib/money";
import { formatIstDate } from "@/lib/delivery";
import { setOrderStatus } from "../../actions";

export const metadata: Metadata = {
  title: "Orders",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const TABS = [
  { key: "open", label: "Open" },
  { key: "placed", label: "New" },
  { key: "out_for_delivery", label: "Out for delivery" },
  { key: "delivered", label: "Delivered" },
  { key: "cancelled", label: "Cancelled" },
  { key: "all", label: "All" },
];

const OPEN_STATUSES = ["placed", "confirmed", "packed", "out_for_delivery"];

const NEXT_STATUS: Record<string, { next: string; label: string }> = {
  placed: { next: "confirmed", label: "Confirm" },
  confirmed: { next: "packed", label: "Mark packed" },
  packed: { next: "out_for_delivery", label: "Send out" },
  out_for_delivery: { next: "delivered", label: "Mark delivered" },
};

export default async function AdminOrders({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab = "open" } = await searchParams;

  const rows = await (() => {
    const base = db.select().from(orders);
    if (tab === "all") return base.orderBy(desc(orders.createdAt)).limit(200);
    if (tab === "open")
      return base
        .where(inArray(orders.status, OPEN_STATUSES))
        .orderBy(desc(orders.createdAt))
        .limit(200);
    return base
      .where(eq(orders.status, tab))
      .orderBy(desc(orders.createdAt))
      .limit(200);
  })();

  return (
    <>
      <h1 className="font-display text-3xl mb-6">Orders</h1>

      <nav className="scroll-x mb-6" aria-label="Filter orders">
        <div className="flex gap-2 w-max">
          {TABS.map((t) => (
            <Link
              key={t.key}
              href={`/admin/orders?tab=${t.key}`}
              aria-current={tab === t.key ? "page" : undefined}
              className={`px-4 py-2 text-xs tracking-[0.08em] uppercase border whitespace-nowrap ${
                tab === t.key
                  ? "bg-ink text-paper border-ink"
                  : "bg-paper border-rule-strong text-ink-soft hover:border-ink"
              }`}
            >
              {t.label}
            </Link>
          ))}
        </div>
      </nav>

      {rows.length === 0 ? (
        <p className="bg-paper border border-rule px-5 py-12 text-center text-sm text-ink-muted">
          No orders in this view.
        </p>
      ) : (
        <div className="bg-paper border border-rule scroll-x">
          <table className="w-full text-sm min-w-[56rem]">
            <thead>
              <tr className="text-left border-b border-rule">
                <th className="px-4 py-3 eyebrow font-medium">Order</th>
                <th className="px-4 py-3 eyebrow font-medium">Customer</th>
                <th className="px-4 py-3 eyebrow font-medium">Method</th>
                <th className="px-4 py-3 eyebrow font-medium">Delivery</th>
                <th className="px-4 py-3 eyebrow font-medium">Payment</th>
                <th className="px-4 py-3 eyebrow font-medium">Status</th>
                <th className="px-4 py-3 eyebrow font-medium text-right">Total</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-rule">
              {rows.map((order) => {
                const step = NEXT_STATUS[order.status];
                return (
                  <tr key={order.id} className="align-top">
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="underline underline-offset-2 whitespace-nowrap"
                      >
                        {order.orderNumber}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      {order.contactName}
                      <a
                        href={`tel:+91${order.contactPhone}`}
                        className="block text-xs text-ink-muted hover:text-ink"
                      >
                        +91 {order.contactPhone}
                      </a>
                    </td>
                    <td className="px-4 py-3 capitalize text-ink-soft">
                      {order.fulfilment}
                      <span className="block text-xs text-ink-muted">{order.zone}</span>
                    </td>
                    <td className="px-4 py-3 text-ink-soft whitespace-nowrap">
                      {order.deliveryDate ? formatIstDate(order.deliveryDate) : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`tag ${
                          order.paymentStatus === "paid"
                            ? "bg-fresh-soft text-fresh"
                            : "bg-cream text-ink-soft"
                        }`}
                      >
                        {order.paymentStatus === "paid" ? "Paid" : "COD"}
                      </span>
                    </td>
                    <td className="px-4 py-3 capitalize whitespace-nowrap">
                      {order.status.replace(/_/g, " ")}
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      {formatPaise(order.totalPaise)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {step ? (
                        <form action={setOrderStatus}>
                          <input type="hidden" name="orderId" value={order.id} />
                          <input type="hidden" name="status" value={step.next} />
                          <button type="submit" className="btn btn-outline btn-sm whitespace-nowrap">
                            {step.label}
                          </button>
                        </form>
                      ) : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
