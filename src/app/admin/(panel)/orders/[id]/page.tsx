import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { orders, orderItems } from "@/lib/db/schema";
import { getSettings } from "@/lib/store";
import { formatPaise } from "@/lib/money";
import { formatIstDate } from "@/lib/delivery";
import { setOrderStatus, setOrderPayment, saveOrderNote } from "../../../actions";

export const metadata: Metadata = {
  title: "Order",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const STATUSES = [
  "placed",
  "confirmed",
  "packed",
  "out_for_delivery",
  "delivered",
  "cancelled",
];

export default async function AdminOrderDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const orderId = Number(id);
  if (!Number.isInteger(orderId)) notFound();

  const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
  if (!order) notFound();

  const [items, settings] = await Promise.all([
    db.select().from(orderItems).where(eq(orderItems.orderId, order.id)),
    getSettings(),
  ]);

  const address = [
    order.addressLine1,
    order.addressLine2,
    order.landmark,
    order.city,
    order.state,
    order.pincode,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <>
      <Link
        href="/admin/orders"
        className="text-xs tracking-[0.08em] uppercase text-ink-muted hover:text-ink no-print"
      >
        ← All orders
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4 mt-4 mb-8">
        <div>
          <h1 className="font-display text-3xl">{order.orderNumber}</h1>
          <p className="text-sm text-ink-muted mt-1">
            Placed {new Date(order.createdAt).toLocaleString("en-IN")}
          </p>
        </div>
        <div className="flex gap-2 no-print">
          <a
            href={`tel:+91${order.contactPhone}`}
            className="btn btn-outline btn-sm"
          >
            Call customer
          </a>
          <a
            href={`https://wa.me/91${order.contactPhone}?text=${encodeURIComponent(
              `Hello ${order.contactName}, about your Khanams Grassfed order ${order.orderNumber}:`,
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-outline btn-sm"
          >
            WhatsApp
          </a>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_20rem] gap-8 items-start">
        <div className="space-y-6">
          {/* --------------------------------------------------- items */}
          <section className="bg-paper border border-rule">
            <h2 className="font-display text-xl px-5 py-4 border-b border-rule">
              Items
            </h2>
            <ul className="divide-y divide-rule">
              {items.map((item) => (
                <li key={item.id} className="px-5 py-4 flex justify-between gap-4 text-sm">
                  <div>
                    <p>{item.productName}</p>
                    <p className="text-xs text-ink-muted mt-0.5">
                      {item.variantLabel} · {formatPaise(item.unitPricePaise)} each
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p>× {item.quantity}</p>
                    <p className="text-xs text-ink-muted mt-0.5">
                      {formatPaise(item.lineTotalPaise)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
            <dl className="px-5 py-4 border-t border-rule space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-ink-soft">Subtotal</dt>
                <dd>{formatPaise(order.subtotalPaise)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-soft">Delivery</dt>
                <dd>
                  {order.deliveryFeePaise === 0
                    ? "Free"
                    : formatPaise(order.deliveryFeePaise)}
                </dd>
              </div>
              <div className="flex justify-between border-t border-rule pt-2 font-medium">
                <dt>To collect</dt>
                <dd>{formatPaise(order.totalPaise)}</dd>
              </div>
            </dl>
          </section>

          {/* ------------------------------------------------- customer */}
          <section className="bg-paper border border-rule p-5">
            <h2 className="font-display text-xl mb-4">
              {order.fulfilment === "pickup" ? "Collection" : "Delivery"}
            </h2>
            <dl className="grid sm:grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="eyebrow mb-1">Customer</dt>
                <dd>
                  {order.contactName}
                  <span className="block text-ink-muted">+91 {order.contactPhone}</span>
                  {order.contactEmail ? (
                    <span className="block text-ink-muted">{order.contactEmail}</span>
                  ) : null}
                </dd>
              </div>
              <div>
                <dt className="eyebrow mb-1">
                  {order.fulfilment === "pickup" ? "Collect from" : "Address"}
                </dt>
                <dd className="text-ink-soft leading-relaxed">
                  {order.fulfilment === "pickup" ? settings.storeAddress : address}
                </dd>
              </div>
              <div>
                <dt className="eyebrow mb-1">When</dt>
                <dd className="text-ink-soft">
                  {order.deliveryDate ? formatIstDate(order.deliveryDate) : "Not set"}
                  {order.deliverySlot ? `, ${order.deliverySlot}` : ""}
                </dd>
              </div>
              <div>
                <dt className="eyebrow mb-1">Zone</dt>
                <dd className="text-ink-soft capitalize">{order.zone}</dd>
              </div>
            </dl>

            {order.customerNote ? (
              <div className="mt-5 pt-5 border-t border-rule">
                <p className="eyebrow mb-1">Note from customer</p>
                <p className="text-sm text-ink-soft leading-relaxed">
                  {order.customerNote}
                </p>
              </div>
            ) : null}
          </section>

          {/* ---------------------------------------------- admin note */}
          <section className="bg-paper border border-rule p-5 no-print">
            <h2 className="font-display text-xl mb-4">Internal note</h2>
            <form action={saveOrderNote}>
              <input type="hidden" name="orderId" value={order.id} />
              <textarea
                name="adminNote"
                className="field min-h-24 mb-3"
                defaultValue={order.adminNote ?? ""}
                placeholder="Anything the team should know about this order."
              />
              <button type="submit" className="btn btn-outline btn-sm">
                Save note
              </button>
            </form>
          </section>
        </div>

        {/* -------------------------------------------------- controls */}
        <aside className="space-y-4 no-print">
          <section className="bg-paper border border-rule p-5">
            <h2 className="font-display text-lg mb-4">Status</h2>
            <div className="flex flex-wrap gap-2">
              {STATUSES.map((status) => (
                <form key={status} action={setOrderStatus}>
                  <input type="hidden" name="orderId" value={order.id} />
                  <input type="hidden" name="status" value={status} />
                  <button
                    type="submit"
                    disabled={order.status === status}
                    className={`px-3 py-1.5 text-xs border capitalize transition-colors ${
                      order.status === status
                        ? "bg-ink text-paper border-ink cursor-default"
                        : "border-rule-strong hover:border-ink"
                    }`}
                  >
                    {status.replace(/_/g, " ")}
                  </button>
                </form>
              ))}
            </div>
            <p className="text-xs text-ink-muted mt-3 leading-relaxed">
              Marking an order delivered also marks the cash as collected.
            </p>
          </section>

          <section className="bg-paper border border-rule p-5">
            <h2 className="font-display text-lg mb-4">Payment</h2>
            <p className="text-sm mb-3">
              {formatPaise(order.totalPaise)} ·{" "}
              <span className="capitalize">{order.paymentMethod}</span>
            </p>
            <form action={setOrderPayment}>
              <input type="hidden" name="orderId" value={order.id} />
              <input
                type="hidden"
                name="paymentStatus"
                value={order.paymentStatus === "paid" ? "pending" : "paid"}
              />
              <button type="submit" className="btn btn-outline btn-sm w-full">
                {order.paymentStatus === "paid"
                  ? "Mark as unpaid"
                  : "Mark cash received"}
              </button>
            </form>
          </section>
        </aside>
      </div>
    </>
  );
}
