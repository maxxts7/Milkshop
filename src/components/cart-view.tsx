"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useCart } from "./cart-provider";
import { CutoffCountdown } from "./cutoff-countdown";
import { formatPaise } from "@/lib/money";
import type { CartPriceDto } from "@/lib/types";

export function CartView() {
  const { items, ready, setQuantity, remove } = useCart();
  const [data, setData] = useState<CartPriceDto | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ready) return;

    if (items.length === 0) {
      setData(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    fetch("/api/cart/price", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items, fulfilment: "delivery" }),
    })
      .then((r) => r.json())
      .then((json: CartPriceDto) => {
        if (cancelled) return;
        setData(json);
        setLoading(false);
      })
      .catch(() => !cancelled && setLoading(false));

    return () => {
      cancelled = true;
    };
  }, [items, ready]);

  if (!ready || loading) {
    return (
      <div className="py-24 text-center text-ink-muted text-sm">Loading your cart…</div>
    );
  }

  if (!data || data.lines.length === 0) {
    return (
      <div className="py-20 text-center">
        <p className="font-display text-2xl mb-3">Your cart is empty</p>
        <p className="text-ink-soft mb-8">
          Fresh milk, dahi, honey and ghee are waiting.
        </p>
        <Link href="/shop" className="btn btn-solid">
          Start shopping
        </Link>
      </div>
    );
  }

  const { delivery } = data;

  return (
    <div className="grid lg:grid-cols-[1fr_22rem] gap-12 lg:gap-16 items-start">
      <div>
        {data.removed.length > 0 ? (
          <div className="border border-alert/30 bg-alert-soft px-5 py-4 mb-8">
            <p className="text-sm text-alert font-medium mb-1">
              Some items were removed
            </p>
            <ul className="text-sm text-alert/90 space-y-0.5">
              {data.removed.map((r) => (
                <li key={r.label}>
                  {r.label} — {r.reason}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <ul className="border-t border-rule">
          {data.lines.map((line) => (
            <li
              key={line.variantId}
              className="flex gap-4 sm:gap-6 py-6 border-b border-rule"
            >
              <Link
                href={`/product/${line.productSlug}`}
                className="photo h-24 w-20 sm:h-32 sm:w-28 shrink-0"
              >
                {line.image ? (
                  <Image
                    src={line.image}
                    alt={line.productName}
                    fill
                    sizes="112px"
                    className="object-cover"
                  />
                ) : (
                  <span className="absolute inset-0 grid place-items-center text-[0.625rem] text-ink-muted text-center px-2">
                    {line.productName}
                  </span>
                )}
              </Link>

              <div className="flex-1 min-w-0">
                <p className="eyebrow mb-1">{line.house}</p>
                <Link
                  href={`/product/${line.productSlug}`}
                  className="font-display text-lg leading-snug hover:underline underline-offset-4"
                >
                  {line.productName}
                </Link>
                <p className="text-sm text-ink-muted mb-3">{line.variantLabel}</p>

                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center border border-rule-strong">
                    <button
                      type="button"
                      onClick={() => setQuantity(line.variantId, line.quantity - 1)}
                      className="px-3 py-1.5 leading-none"
                      aria-label={`Decrease ${line.productName}`}
                    >
                      −
                    </button>
                    <span className="w-8 text-center text-sm tabular-nums">
                      {line.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQuantity(line.variantId, line.quantity + 1)}
                      disabled={line.quantity >= 50}
                      className="px-3 py-1.5 leading-none disabled:opacity-30"
                      aria-label={`Increase ${line.productName}`}
                    >
                      +
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => remove(line.variantId)}
                    className="text-xs tracking-[0.08em] uppercase text-ink-muted hover:text-alert underline underline-offset-4"
                  >
                    Remove
                  </button>
                </div>
              </div>

              <div className="text-right shrink-0">
                <p className="font-medium">{formatPaise(line.lineTotalPaise)}</p>
                {line.quantity > 1 ? (
                  <p className="text-xs text-ink-muted mt-1">
                    {formatPaise(line.unitPricePaise)} each
                  </p>
                ) : null}
              </div>
            </li>
          ))}
        </ul>

        <Link
          href="/shop"
          className="inline-block mt-8 text-sm tracking-[0.08em] uppercase border-b border-ink pb-1"
        >
          Continue shopping
        </Link>
      </div>

      {/* ------------------------------------------------------- summary */}
      <aside className="lg:sticky lg:top-32 border border-rule p-6 bg-paper-warm">
        <h2 className="font-display text-xl mb-6">Order summary</h2>

        <dl className="space-y-3 text-sm">
          <div className="flex justify-between">
            <dt className="text-ink-soft">
              Subtotal ({data.itemCount} {data.itemCount === 1 ? "item" : "items"})
            </dt>
            <dd>{formatPaise(data.subtotalPaise)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-ink-soft">Delivery</dt>
            <dd>
              {delivery.feePaise === 0 ? (
                <span className="text-fresh">Free</span>
              ) : (
                formatPaise(delivery.feePaise)
              )}
            </dd>
          </div>
        </dl>

        {delivery.remainingForFreePaise !== null &&
        delivery.remainingForFreePaise > 0 ? (
          <p className="text-xs text-ink-soft mt-3 leading-relaxed">
            Add {formatPaise(delivery.remainingForFreePaise)} more for free
            delivery.
          </p>
        ) : null}

        <div className="flex justify-between items-baseline border-t border-rule mt-5 pt-5">
          <span className="font-display text-lg">Total</span>
          <span className="font-display text-2xl">
            {formatPaise(data.totalPaise)}
          </span>
        </div>

        <p className="text-xs text-ink-muted mt-2">
          Delivery is calculated properly at checkout once you enter your pincode.
        </p>

        {data.cutoff ? (
          <div className="mt-5 pt-5 border-t border-rule">
            <CutoffCountdown
              cutoffAt={data.cutoff.cutoffAt}
              deliveryLabel={data.cutoff.deliveryDateLabel}
              slot={data.cutoff.slot}
            />
          </div>
        ) : null}

        {data.ordersPaused ? (
          <p className="mt-6 text-sm text-alert">
            We&rsquo;re not taking orders at the moment.
          </p>
        ) : (
          <Link href="/checkout" className="btn btn-solid w-full mt-6">
            Checkout
          </Link>
        )}

        <p className="text-xs text-ink-muted mt-4 text-center">
          Pay cash on delivery or when you collect.
        </p>
      </aside>
    </div>
  );
}
