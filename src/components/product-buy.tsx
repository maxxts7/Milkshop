"use client";

import Link from "next/link";
import { useState } from "react";
import { useCart } from "./cart-provider";
import { CheckIcon } from "./icons";
import { formatPaise } from "@/lib/money";
import type { PreOrderTerms } from "@/lib/pre-order";

export interface BuyVariant {
  id: number;
  label: string;
  pricePaise: number;
  subscriberPricePaise: number | null;
  inStock: boolean;
}

export function ProductBuy({
  variants,
  subscribable,
  slug,
  ordersPaused,
  preOrder,
}: {
  variants: BuyVariant[];
  subscribable: boolean;
  slug: string;
  ordersPaused: boolean;
  preOrder: PreOrderTerms | null;
}) {
  const { add } = useCart();
  const firstAvailable = variants.find((v) => v.inStock) ?? variants[0];
  const [selectedId, setSelectedId] = useState<number>(firstAvailable?.id ?? 0);
  // Pre-order items start at their minimum batch — there is no point offering
  // a quantity the kitchen will not set.
  const minQuantity = preOrder?.minQuantity ?? 1;
  const maxQuantity = preOrder ? 500 : 50;
  const [quantity, setQuantity] = useState(minQuantity);
  const [added, setAdded] = useState(false);

  const selected = variants.find((v) => v.id === selectedId) ?? firstAvailable;
  const canBuy = Boolean(selected?.inStock) && !ordersPaused;

  function handleAdd() {
    if (!selected || !canBuy) return;
    add(selected.id, quantity);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 4000);
  }

  if (variants.length === 0) return null;

  return (
    <div>
      {variants.length > 1 ? (
        <fieldset className="mb-6">
          <legend className="label">Size</legend>
          <div className="flex flex-wrap gap-2">
            {variants.map((v) => {
              const isSelected = v.id === selectedId;
              return (
                <button
                  key={v.id}
                  type="button"
                  disabled={!v.inStock}
                  onClick={() => {
                    setSelectedId(v.id);
                    setAdded(false);
                  }}
                  aria-pressed={isSelected}
                  className={`px-4 py-2.5 text-sm border transition-colors ${
                    isSelected
                      ? "border-ink bg-ink text-paper"
                      : "border-rule-strong hover:border-ink"
                  } ${!v.inStock ? "opacity-40 cursor-not-allowed line-through" : ""}`}
                >
                  {v.label}
                </button>
              );
            })}
          </div>
        </fieldset>
      ) : null}

      {selected ? (
        <div className="mb-6">
          <p className="font-display text-3xl">{formatPaise(selected.pricePaise)}</p>
          {selected.subscriberPricePaise != null ? (
            <p className="text-sm text-ink-soft mt-1.5">
              {formatPaise(selected.subscriberPricePaise)} on subscription ·{" "}
              <Link href={`/subscribe?product=${slug}`} className="underline underline-offset-2">
                save {formatPaise(selected.pricePaise - selected.subscriberPricePaise)} per delivery
              </Link>
            </p>
          ) : null}
          {variants.length === 1 ? (
            <p className="text-sm text-ink-muted mt-1">{selected.label}</p>
          ) : null}
        </div>
      ) : null}

      {preOrder ? (
        <div className="mb-6 border border-rule bg-paper-warm p-5">
          <p className="eyebrow mb-2.5">Pre-order only</p>
          <ul className="space-y-2 text-sm text-ink-soft leading-relaxed">
            <li className="flex gap-3">
              <CheckIcon className="h-4 w-4 shrink-0 mt-0.5 text-ink" />
              {selected?.label ? `${selected.label} is` : "This is"} set to order
              — it is not kept in stock.
            </li>
            <li className="flex gap-3">
              <CheckIcon className="h-4 w-4 shrink-0 mt-0.5 text-ink" />
              Minimum order of {preOrder.minQuantity} units.
            </li>
            <li className="flex gap-3">
              <CheckIcon className="h-4 w-4 shrink-0 mt-0.5 text-ink" />
              Place your order at least {preOrder.leadDays} days ahead so it can
              be prepared fresh and delivered on time.
            </li>
          </ul>
        </div>
      ) : null}

      <div className="flex flex-wrap items-stretch gap-3 mb-4">
        <div className="flex items-center border border-rule-strong">
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.max(minQuantity, q - 1))}
            disabled={quantity <= minQuantity}
            className="px-4 py-3 text-lg leading-none disabled:opacity-30"
            aria-label="Decrease quantity"
          >
            −
          </button>
          <span className="w-12 text-center tabular-nums" aria-live="polite">
            {quantity}
          </span>
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.min(maxQuantity, q + 1))}
            disabled={quantity >= maxQuantity}
            className="px-4 py-3 text-lg leading-none disabled:opacity-30"
            aria-label="Increase quantity"
          >
            +
          </button>
        </div>

        <button
          type="button"
          onClick={handleAdd}
          disabled={!canBuy}
          className="btn btn-solid flex-1 min-w-[12rem]"
        >
          {ordersPaused
            ? "Orders paused"
            : !selected?.inStock
              ? "Out of stock"
              : preOrder
                ? "Pre-order"
                : "Add to cart"}
        </button>
      </div>

      {added ? (
        <p className="flex items-center gap-2 text-sm text-fresh mb-4" role="status">
          <CheckIcon className="h-4 w-4" />
          Added to your cart.{" "}
          <Link href="/cart" className="underline underline-offset-2">
            View cart
          </Link>
        </p>
      ) : null}

      {subscribable && !preOrder && !ordersPaused ? (
        <Link
          href={`/subscribe?product=${slug}`}
          className="btn btn-outline w-full"
        >
          Subscribe instead
        </Link>
      ) : null}
    </div>
  );
}
