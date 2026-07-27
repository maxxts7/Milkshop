import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { desc, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  orders,
  orderItems,
  subscriptions,
  variants,
  products,
  addresses,
} from "@/lib/db/schema";
import { getCurrentCustomer } from "@/lib/auth";
import { formatPaise } from "@/lib/money";
import {
  SUBSCRIPTION_DELIVERY_SLOT,
  formatIstDate,
  todayIST,
} from "@/lib/delivery";
import {
  FREQUENCY_LABELS,
  nextDeliveries,
  type Frequency,
} from "@/lib/subscriptions";
import {
  SubscriptionManager,
  type ManagedSubscription,
} from "@/components/subscription-manager";
import { LogoutButton } from "@/components/logout-button";
import { CheckIcon } from "@/components/icons";

export const metadata: Metadata = {
  title: "Your account",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const STATUS_LABELS: Record<string, string> = {
  placed: "Placed",
  confirmed: "Confirmed",
  packed: "Packed",
  out_for_delivery: "On its way",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ started?: string }>;
}) {
  const [{ started }, customer] = await Promise.all([
    searchParams,
    getCurrentCustomer(),
  ]);

  if (!customer) redirect("/login?next=/account");

  const myOrders = await db
    .select()
    .from(orders)
    .where(eq(orders.customerId, customer.id))
    .orderBy(desc(orders.createdAt))
    .limit(25);

  const items =
    myOrders.length > 0
      ? await db
          .select()
          .from(orderItems)
          .where(
            inArray(
              orderItems.orderId,
              myOrders.map((o) => o.id),
            ),
          )
      : [];

  const itemsByOrder = new Map<number, typeof items>();
  for (const item of items) {
    const list = itemsByOrder.get(item.orderId) ?? [];
    list.push(item);
    itemsByOrder.set(item.orderId, list);
  }

  // ---- subscriptions
  const mySubs = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.customerId, customer.id))
    .orderBy(desc(subscriptions.createdAt));

  let managed: ManagedSubscription[] = [];

  if (mySubs.length > 0) {
    const subVariants = await db
      .select()
      .from(variants)
      .where(inArray(variants.id, mySubs.map((s) => s.variantId)));

    const subProducts = await db
      .select()
      .from(products)
      .where(
        inArray(products.id, [...new Set(subVariants.map((v) => v.productId))]),
      );

    const addressIds = mySubs
      .map((s) => s.addressId)
      .filter((v): v is number => v != null);
    const subAddresses =
      addressIds.length > 0
        ? await db.select().from(addresses).where(inArray(addresses.id, addressIds))
        : [];

    const variantById = new Map(subVariants.map((v) => [v.id, v]));
    const productById = new Map(subProducts.map((p) => [p.id, p]));
    const addressById = new Map(subAddresses.map((a) => [a.id, a]));
    const today = todayIST();

    managed = mySubs
      .filter((s) => s.status !== "cancelled")
      .map((s) => {
        const variant = variantById.get(s.variantId);
        const product = variant ? productById.get(variant.productId) : undefined;
        const address = s.addressId ? addressById.get(s.addressId) : null;

        return {
          id: s.id,
          productName: product?.name ?? "Product",
          variantLabel: variant?.label ?? "",
          quantity: s.quantity,
          unitPricePaise: variant
            ? (variant.subscriberPricePaise ?? variant.pricePaise)
            : 0,
          frequencyLabel: FREQUENCY_LABELS[s.frequency as Frequency] ?? s.frequency,
          status: s.status,
          pausedUntil: s.pausedUntil,
          address: address
            ? [address.line1, address.line2, address.pincode].filter(Boolean).join(", ")
            : null,
          nextDates: nextDeliveries(s, today, 3),
        };
      });
  }

  return (
    <div className="wrap py-14 md:py-20">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-12">
        <div>
          <p className="eyebrow mb-3">Your account</p>
          <h1 className="font-display text-4xl md:text-5xl">
            {customer.name ? `Hello, ${customer.name}` : "Hello"}
          </h1>
          <p className="text-ink-soft mt-2">+91 {customer.phone}</p>
        </div>
        <LogoutButton />
      </div>

      {started ? (
        <div className="border border-fresh/30 bg-fresh-soft px-5 py-4 mb-12 flex gap-3">
          <CheckIcon className="h-5 w-5 shrink-0 mt-0.5 text-fresh" />
          <p className="text-sm text-fresh leading-relaxed">
            Your subscription is live. First delivery arrives{" "}
            {SUBSCRIPTION_DELIVERY_SLOT.toLowerCase()} — pay the rider in cash.
          </p>
        </div>
      ) : null}

      <div className="grid lg:grid-cols-2 gap-14 lg:gap-16 items-start">
        {/* ------------------------------------------------ subscriptions */}
        <section>
          <div className="flex items-center justify-between gap-4 mb-6">
            <h2 className="font-display text-2xl">Subscriptions</h2>
            <Link
              href="/subscribe"
              className="text-xs tracking-[0.08em] uppercase border-b border-ink pb-0.5"
            >
              New subscription
            </Link>
          </div>
          <SubscriptionManager
            subscriptions={managed}
            slot={SUBSCRIPTION_DELIVERY_SLOT}
          />
        </section>

        {/* ------------------------------------------------------ orders */}
        <section>
          <h2 className="font-display text-2xl mb-6">Order history</h2>

          {myOrders.length === 0 ? (
            <p className="text-ink-soft text-sm">
              No orders yet.{" "}
              <Link href="/shop" className="underline underline-offset-2">
                Have a look at the shop
              </Link>
              .
            </p>
          ) : (
            <ul className="space-y-4">
              {myOrders.map((order) => {
                const orderLines = itemsByOrder.get(order.id) ?? [];
                return (
                  <li key={order.id} className="border border-rule p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                      <div>
                        <Link
                          href={`/order/${order.orderNumber}`}
                          className="font-medium hover:underline underline-offset-4"
                        >
                          {order.orderNumber}
                        </Link>
                        <p className="text-xs text-ink-muted mt-0.5">
                          {order.deliveryDate
                            ? formatIstDate(order.deliveryDate)
                            : new Date(order.createdAt).toLocaleDateString("en-IN")}
                          {" · "}
                          {order.fulfilment === "pickup" ? "Pickup" : "Delivery"}
                        </p>
                      </div>
                      <span className="tag bg-cream text-ink-soft">
                        {STATUS_LABELS[order.status] ?? order.status}
                      </span>
                    </div>

                    <p className="text-sm text-ink-soft leading-relaxed">
                      {orderLines
                        .map((l) => `${l.quantity} × ${l.productName}`)
                        .join(", ")}
                    </p>

                    <p className="text-sm mt-3 font-medium">
                      {formatPaise(order.totalPaise)}
                      <span className="font-normal text-ink-muted">
                        {" "}
                        · {order.paymentStatus === "paid" ? "Paid" : "Cash on delivery"}
                      </span>
                    </p>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
