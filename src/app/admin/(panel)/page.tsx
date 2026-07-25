import type { Metadata } from "next";
import Link from "next/link";
import { and, desc, eq, gte, inArray, ne, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { orders, subscriptions, variants, products, waitlist } from "@/lib/db/schema";
import { getSettings } from "@/lib/store";
import { getRunSheet } from "@/lib/subscriptions";
import { formatPaise } from "@/lib/money";
import { formatIstDate, getCutoffInfo, istParts, isoDate, todayIST } from "@/lib/delivery";

export const metadata: Metadata = {
  title: "Overview",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

function Stat({
  label,
  value,
  hint,
  href,
}: {
  label: string;
  value: string;
  hint?: string;
  href?: string;
}) {
  const body = (
    <div className="bg-paper border border-rule p-5 h-full">
      <p className="eyebrow mb-2">{label}</p>
      <p className="font-display text-3xl leading-none mb-1.5">{value}</p>
      {hint ? <p className="text-xs text-ink-muted">{hint}</p> : null}
    </div>
  );
  return href ? (
    <Link href={href} className="block hover:opacity-80 transition-opacity">
      {body}
    </Link>
  ) : (
    body
  );
}

export default async function AdminOverview() {
  const settings = await getSettings();
  const today = todayIST();
  const cutoff = getCutoffInfo(settings);

  const p = istParts();
  const monthStart = isoDate(p.year, p.month, 1);

  const [
    openOrders,
    todaysOrders,
    monthRevenue,
    activeSubs,
    outOfStock,
    waitingList,
    recent,
    tomorrowRun,
  ] = await Promise.all([
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(orders)
      .where(inArray(orders.status, ["placed", "confirmed", "packed", "out_for_delivery"])),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(orders)
      .where(eq(orders.deliveryDate, today)),
    db
      .select({ total: sql<number>`coalesce(sum(${orders.totalPaise}), 0)::int` })
      .from(orders)
      .where(
        and(
          gte(orders.createdAt, new Date(`${monthStart}T00:00:00Z`)),
          ne(orders.status, "cancelled"),
        ),
      ),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(subscriptions)
      .where(eq(subscriptions.status, "active")),
    db
      .select({ id: variants.id, label: variants.label, productId: variants.productId })
      .from(variants)
      .where(eq(variants.inStock, false)),
    db.select({ count: sql<number>`count(*)::int` }).from(waitlist),
    db.select().from(orders).orderBy(desc(orders.createdAt)).limit(8),
    getRunSheet(cutoff.deliveryDate),
  ]);

  const outOfStockProducts =
    outOfStock.length > 0
      ? await db
          .select({ id: products.id, name: products.name })
          .from(products)
          .where(inArray(products.id, [...new Set(outOfStock.map((v) => v.productId))]))
      : [];

  const runTotal = tomorrowRun.reduce((sum, r) => sum + r.totalPaise, 0);

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display text-3xl">Overview</h1>
          <p className="text-sm text-ink-muted mt-1">
            {formatIstDate(today)} · orders close at{" "}
            {settings.cutoffHour > 12 ? settings.cutoffHour - 12 : settings.cutoffHour}
            {settings.cutoffHour >= 12 ? "pm" : "am"}
          </p>
        </div>
        {settings.ordersPaused ? (
          <span className="tag bg-alert-soft text-alert">Orders paused</span>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-10">
        <Stat
          label="Open orders"
          value={String(openOrders[0]?.count ?? 0)}
          hint="Not yet delivered"
          href="/admin/orders"
        />
        <Stat
          label="Due today"
          value={String(todaysOrders[0]?.count ?? 0)}
          hint={formatIstDate(today)}
          href="/admin/orders"
        />
        <Stat
          label="This month"
          value={formatPaise(monthRevenue[0]?.total ?? 0)}
          hint="Excluding cancellations"
        />
        <Stat
          label="Active subscriptions"
          value={String(activeSubs[0]?.count ?? 0)}
          hint="Recurring deliveries"
          href="/admin/subscriptions"
        />
      </div>

      <div className="grid gap-8 lg:grid-cols-2 items-start">
        {/* ------------------------------------------- tomorrow's round */}
        <section className="bg-paper border border-rule">
          <div className="px-5 py-4 border-b border-rule flex items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-xl">Next delivery round</h2>
              <p className="text-xs text-ink-muted mt-0.5">
                {cutoff.deliveryDateLabel} · {cutoff.slot}
              </p>
            </div>
            <Link href="/admin/runsheet" className="btn btn-outline btn-sm">
              Run-sheet
            </Link>
          </div>

          {tomorrowRun.length === 0 ? (
            <p className="px-5 py-8 text-sm text-ink-muted text-center">
              No subscription deliveries scheduled.
            </p>
          ) : (
            <>
              <ul className="divide-y divide-rule">
                {tomorrowRun.slice(0, 6).map((row) => (
                  <li key={row.subscriptionId} className="px-5 py-3 flex justify-between gap-4 text-sm">
                    <div className="min-w-0">
                      <p className="truncate">
                        {row.customerName ?? "Customer"}{" "}
                        <span className="text-ink-muted">+91 {row.customerPhone}</span>
                      </p>
                      <p className="text-xs text-ink-muted truncate">
                        {row.quantity} × {row.productName} — {row.variantLabel}
                      </p>
                    </div>
                    <span className="shrink-0">{formatPaise(row.totalPaise)}</span>
                  </li>
                ))}
              </ul>
              <p className="px-5 py-3 border-t border-rule text-sm flex justify-between">
                <span className="text-ink-soft">
                  {tomorrowRun.length} deliveries
                </span>
                <span className="font-medium">{formatPaise(runTotal)} to collect</span>
              </p>
            </>
          )}
        </section>

        {/* -------------------------------------------------- attention */}
        <section className="bg-paper border border-rule">
          <div className="px-5 py-4 border-b border-rule">
            <h2 className="font-display text-xl">Needs your attention</h2>
          </div>
          <ul className="divide-y divide-rule text-sm">
            {outOfStockProducts.length > 0 ? (
              <li className="px-5 py-4">
                <p className="mb-1">
                  <strong className="font-medium">
                    {outOfStock.length} sizes out of stock
                  </strong>
                </p>
                <p className="text-ink-muted text-xs mb-2">
                  {outOfStockProducts.map((p) => p.name).join(", ")}
                </p>
                <Link
                  href="/admin/products"
                  className="text-xs underline underline-offset-2"
                >
                  Manage stock
                </Link>
              </li>
            ) : null}

            {(waitingList[0]?.count ?? 0) > 0 ? (
              <li className="px-5 py-4">
                <p className="mb-1">
                  <strong className="font-medium">
                    {waitingList[0].count} people on the waiting list
                  </strong>
                </p>
                <p className="text-ink-muted text-xs mb-2">
                  Waiting for goat cheese and masala tikki.
                </p>
                <Link
                  href="/admin/waitlist"
                  className="text-xs underline underline-offset-2"
                >
                  See the list
                </Link>
              </li>
            ) : null}

            {outOfStockProducts.length === 0 && (waitingList[0]?.count ?? 0) === 0 ? (
              <li className="px-5 py-8 text-center text-ink-muted">
                Everything is in order.
              </li>
            ) : null}
          </ul>
        </section>
      </div>

      {/* ------------------------------------------------- recent orders */}
      <section className="bg-paper border border-rule mt-8">
        <div className="px-5 py-4 border-b border-rule flex items-center justify-between">
          <h2 className="font-display text-xl">Latest orders</h2>
          <Link href="/admin/orders" className="text-xs underline underline-offset-2">
            See all
          </Link>
        </div>

        {recent.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-ink-muted">
            No orders yet.
          </p>
        ) : (
          <div className="scroll-x">
            <table className="w-full text-sm min-w-[44rem]">
              <thead>
                <tr className="text-left border-b border-rule">
                  <th className="px-5 py-3 eyebrow font-medium">Order</th>
                  <th className="px-5 py-3 eyebrow font-medium">Customer</th>
                  <th className="px-5 py-3 eyebrow font-medium">For</th>
                  <th className="px-5 py-3 eyebrow font-medium">Status</th>
                  <th className="px-5 py-3 eyebrow font-medium text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rule">
                {recent.map((order) => (
                  <tr key={order.id}>
                    <td className="px-5 py-3">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="underline underline-offset-2"
                      >
                        {order.orderNumber}
                      </Link>
                    </td>
                    <td className="px-5 py-3">
                      {order.contactName}
                      <span className="block text-xs text-ink-muted">
                        +91 {order.contactPhone}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-ink-soft">
                      {order.deliveryDate ? formatIstDate(order.deliveryDate) : "—"}
                      <span className="block text-xs text-ink-muted capitalize">
                        {order.fulfilment}
                      </span>
                    </td>
                    <td className="px-5 py-3 capitalize">
                      {order.status.replace(/_/g, " ")}
                    </td>
                    <td className="px-5 py-3 text-right">
                      {formatPaise(order.totalPaise)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
