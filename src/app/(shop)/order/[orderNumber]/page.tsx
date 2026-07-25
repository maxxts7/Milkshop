import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { orders, orderItems } from "@/lib/db/schema";
import { getSettings } from "@/lib/store";
import { formatPaise } from "@/lib/money";
import { formatIstDate } from "@/lib/delivery";
import { CheckIcon } from "@/components/icons";

export const metadata: Metadata = {
  title: "Order confirmed",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function OrderPage({
  params,
}: {
  params: Promise<{ orderNumber: string }>;
}) {
  const { orderNumber } = await params;

  const [order] = await db
    .select()
    .from(orders)
    .where(eq(orders.orderNumber, decodeURIComponent(orderNumber)))
    .limit(1);

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

  const waMessage = `Hello, I'd like to ask about my order ${order.orderNumber}.`;

  return (
    <div className="wrap-narrow py-14 md:py-20">
      <div className="text-center mb-12">
        <div className="mx-auto mb-6 h-14 w-14 rounded-full bg-fresh-soft grid place-items-center">
          <CheckIcon className="h-7 w-7 text-fresh" />
        </div>
        <h1 className="font-display text-4xl md:text-5xl mb-3">Thank you!</h1>
        <p className="text-ink-soft leading-relaxed">
          Your order is placed. We&rsquo;ll call you on{" "}
          <strong className="font-medium text-ink">+91 {order.contactPhone}</strong>{" "}
          to confirm.
        </p>
      </div>

      <div className="border border-rule">
        <div className="px-6 py-5 border-b border-rule bg-paper-warm flex flex-wrap justify-between gap-2">
          <div>
            <p className="eyebrow mb-1">Order number</p>
            <p className="font-display text-xl">{order.orderNumber}</p>
          </div>
          <div className="text-right">
            <p className="eyebrow mb-1">Status</p>
            <p className="text-sm capitalize">{order.status.replace(/_/g, " ")}</p>
          </div>
        </div>

        <ul className="px-6 divide-y divide-rule">
          {items.map((item) => (
            <li key={item.id} className="flex gap-4 py-5">
              <div className="photo h-20 w-16 shrink-0">
                {item.image ? (
                  <Image
                    src={item.image}
                    alt=""
                    fill
                    sizes="64px"
                    className="object-cover"
                  />
                ) : null}
              </div>
              <div className="flex-1 min-w-0">
                <p className="leading-snug">{item.productName}</p>
                <p className="text-sm text-ink-muted mt-0.5">
                  {item.variantLabel} × {item.quantity}
                </p>
              </div>
              <p className="shrink-0 text-sm">{formatPaise(item.lineTotalPaise)}</p>
            </li>
          ))}
        </ul>

        <dl className="px-6 py-5 border-t border-rule space-y-2.5 text-sm">
          <div className="flex justify-between">
            <dt className="text-ink-soft">Subtotal</dt>
            <dd>{formatPaise(order.subtotalPaise)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-ink-soft">
              {order.fulfilment === "pickup" ? "Pickup" : "Delivery"}
            </dt>
            <dd>
              {order.deliveryFeePaise === 0 ? (
                <span className="text-fresh">Free</span>
              ) : (
                formatPaise(order.deliveryFeePaise)
              )}
            </dd>
          </div>
          <div className="flex justify-between border-t border-rule pt-3 text-base">
            <dt className="font-display text-lg">Total to pay</dt>
            <dd className="font-display text-lg">{formatPaise(order.totalPaise)}</dd>
          </div>
        </dl>
      </div>

      <div className="grid sm:grid-cols-2 gap-6 mt-8">
        <div>
          <p className="eyebrow mb-2">
            {order.fulfilment === "pickup" ? "Collect from" : "Delivering to"}
          </p>
          <p className="text-sm text-ink-soft leading-relaxed">
            {order.fulfilment === "pickup" ? settings.storeAddress : address}
          </p>
        </div>
        <div>
          <p className="eyebrow mb-2">
            {order.fulfilment === "pickup" ? "Ready" : "Arriving"}
          </p>
          <p className="text-sm text-ink-soft leading-relaxed">
            {order.deliveryDate ? (
              <>
                {formatIstDate(order.deliveryDate)}
                {order.deliverySlot ? `, ${order.deliverySlot}` : ""}
              </>
            ) : (
              "We'll confirm the date when we call you."
            )}
          </p>
          <p className="text-sm text-ink-soft leading-relaxed mt-2">
            Pay {formatPaise(order.totalPaise)} in cash on{" "}
            {order.fulfilment === "pickup" ? "collection" : "delivery"}.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 mt-10">
        <Link href="/shop" className="btn btn-outline">
          Continue shopping
        </Link>
        <a
          href={`https://wa.me/${settings.whatsappNumber}?text=${encodeURIComponent(waMessage)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-outline"
        >
          Message us about this order
        </a>
      </div>

      <p className="text-xs text-ink-muted mt-8 leading-relaxed">
        Keep this order number safe — it&rsquo;s how we find your order. You can
        also see it any time under{" "}
        <Link href="/account" className="underline underline-offset-2">
          your account
        </Link>{" "}
        by signing in with {order.contactPhone}.
      </p>
    </div>
  );
}
