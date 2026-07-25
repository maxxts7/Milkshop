"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useCart } from "./cart-provider";
import { CutoffCountdown } from "./cutoff-countdown";
import { StoreIcon, TruckIcon } from "./icons";
import { formatPaise } from "@/lib/money";
import type { CartPriceDto } from "@/lib/types";

interface Props {
  storeAddress: string;
  freshCity: string;
  prefill: { name: string; phone: string; email: string } | null;
}

type Fulfilment = "delivery" | "pickup";

export function CheckoutForm({ storeAddress, freshCity, prefill }: Props) {
  const router = useRouter();
  const { items, ready, clear } = useCart();

  const [fulfilment, setFulfilment] = useState<Fulfilment>("delivery");
  const [name, setName] = useState(prefill?.name ?? "");
  const [phone, setPhone] = useState(prefill?.phone ?? "");
  const [email, setEmail] = useState(prefill?.email ?? "");
  const [line1, setLine1] = useState("");
  const [line2, setLine2] = useState("");
  const [landmark, setLandmark] = useState("");
  const [city, setCity] = useState(freshCity);
  const [state, setState] = useState("Jammu & Kashmir");
  const [pincode, setPincode] = useState("");
  const [note, setNote] = useState("");

  const [data, setData] = useState<CartPriceDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const errorRef = useRef<HTMLDivElement>(null);

  // Re-price whenever anything that affects the total changes.
  useEffect(() => {
    if (!ready) return;
    if (items.length === 0) {
      setLoading(false);
      setData(null);
      return;
    }

    let cancelled = false;
    const handle = window.setTimeout(() => {
      fetch("/api/cart/price", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items,
          fulfilment,
          pincode: pincode.trim() || undefined,
        }),
      })
        .then((r) => r.json())
        .then((json: CartPriceDto) => {
          if (!cancelled) {
            setData(json);
            setLoading(false);
          }
        })
        .catch(() => !cancelled && setLoading(false));
    }, 250);

    return () => {
      cancelled = true;
      window.clearTimeout(handle);
    };
  }, [items, ready, fulfilment, pincode]);

  useEffect(() => {
    if (error) errorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [error]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items,
          fulfilment,
          contact: { name, phone, email: email || undefined },
          address:
            fulfilment === "delivery"
              ? { line1, line2, landmark, city, state, pincode }
              : undefined,
          note: note || undefined,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        setError(json.error ?? "Something went wrong. Please try again.");
        setSubmitting(false);
        return;
      }

      clear();
      router.push(`/order/${json.orderNumber}`);
    } catch {
      setError("Could not reach the server. Please check your connection.");
      setSubmitting(false);
    }
  }

  if (!ready || loading) {
    return <p className="py-24 text-center text-ink-muted text-sm">Loading…</p>;
  }

  if (!data || data.lines.length === 0) {
    return (
      <div className="py-20 text-center">
        <p className="font-display text-2xl mb-3">Your cart is empty</p>
        <Link href="/shop" className="btn btn-solid mt-4">
          Go to the shop
        </Link>
      </div>
    );
  }

  const { delivery } = data;
  const blocked = Boolean(delivery.blocked);
  const canSubmit = !submitting && !blocked && !data.ordersPaused;

  return (
    <form onSubmit={handleSubmit} className="grid lg:grid-cols-[1fr_22rem] gap-12 lg:gap-16 items-start">
      <div>
        {/* ------------------------------------------------ fulfilment */}
        <section className="mb-10">
          <h2 className="font-display text-xl mb-4">How would you like it?</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setFulfilment("delivery")}
              aria-pressed={fulfilment === "delivery"}
              className={`text-left p-5 border transition-colors ${
                fulfilment === "delivery"
                  ? "border-ink bg-paper-warm"
                  : "border-rule-strong hover:border-ink"
              }`}
            >
              <TruckIcon className="h-5 w-5 mb-3" />
              <p className="font-medium mb-1">Deliver to me</p>
              <p className="text-xs text-ink-soft leading-relaxed">
                Fresh items across {freshCity}. Honey, ghee and pantry ship
                across India.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setFulfilment("pickup")}
              aria-pressed={fulfilment === "pickup"}
              className={`text-left p-5 border transition-colors ${
                fulfilment === "pickup"
                  ? "border-ink bg-paper-warm"
                  : "border-rule-strong hover:border-ink"
              }`}
            >
              <StoreIcon className="h-5 w-5 mb-3" />
              <p className="font-medium mb-1">Collect from store</p>
              <p className="text-xs text-ink-soft leading-relaxed">
                No delivery charge. Pay when you collect.
              </p>
            </button>
          </div>

          {fulfilment === "pickup" ? (
            <p className="mt-4 text-sm text-ink-soft border border-rule bg-paper-warm px-4 py-3">
              Collect from <strong className="font-medium">{storeAddress}</strong>.
              We&rsquo;ll call you when your order is ready.
            </p>
          ) : null}
        </section>

        {/* --------------------------------------------------- contact */}
        <section className="mb-10">
          <h2 className="font-display text-xl mb-4">Your details</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label" htmlFor="co-name">Full name</label>
              <input
                id="co-name"
                className="field"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                required
                minLength={2}
              />
            </div>
            <div>
              <label className="label" htmlFor="co-phone">Mobile number</label>
              <input
                id="co-phone"
                className="field"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                inputMode="numeric"
                autoComplete="tel"
                placeholder="10-digit mobile"
                required
              />
            </div>
            <div className="sm:col-span-2">
              <label className="label" htmlFor="co-email">
                Email <span className="normal-case tracking-normal text-ink-muted">(optional)</span>
              </label>
              <input
                id="co-email"
                type="email"
                className="field"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>
          </div>
        </section>

        {/* --------------------------------------------------- address */}
        {fulfilment === "delivery" ? (
          <section className="mb-10">
            <h2 className="font-display text-xl mb-4">Delivery address</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="label" htmlFor="co-line1">House / street</label>
                <input
                  id="co-line1"
                  className="field"
                  value={line1}
                  onChange={(e) => setLine1(e.target.value)}
                  autoComplete="address-line1"
                  required
                  minLength={5}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="label" htmlFor="co-line2">
                  Area / locality <span className="normal-case tracking-normal text-ink-muted">(optional)</span>
                </label>
                <input
                  id="co-line2"
                  className="field"
                  value={line2}
                  onChange={(e) => setLine2(e.target.value)}
                  autoComplete="address-line2"
                />
              </div>
              <div>
                <label className="label" htmlFor="co-landmark">
                  Landmark <span className="normal-case tracking-normal text-ink-muted">(optional)</span>
                </label>
                <input
                  id="co-landmark"
                  className="field"
                  value={landmark}
                  onChange={(e) => setLandmark(e.target.value)}
                  placeholder="Near…"
                />
              </div>
              <div>
                <label className="label" htmlFor="co-pincode">Pincode</label>
                <input
                  id="co-pincode"
                  className="field"
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  inputMode="numeric"
                  autoComplete="postal-code"
                  required
                />
                {delivery.pincodeGiven ? (
                  <p
                    className={`text-xs mt-1.5 ${delivery.serviceable ? "text-fresh" : "text-ink-soft"}`}
                  >
                    {delivery.serviceable
                      ? `We deliver fresh to this pincode.`
                      : `Outside ${freshCity} — pantry items ship by courier.`}
                  </p>
                ) : null}
              </div>
              <div>
                <label className="label" htmlFor="co-city">Town / city</label>
                <input
                  id="co-city"
                  className="field"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  autoComplete="address-level2"
                  required
                />
              </div>
              <div>
                <label className="label" htmlFor="co-state">State</label>
                <input
                  id="co-state"
                  className="field"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  autoComplete="address-level1"
                  required
                />
              </div>
            </div>
          </section>
        ) : null}

        {/* ------------------------------------------------------ note */}
        <section className="mb-10">
          <label className="label" htmlFor="co-note">
            Anything we should know? <span className="normal-case tracking-normal text-ink-muted">(optional)</span>
          </label>
          <textarea
            id="co-note"
            className="field min-h-24"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Ring the bell twice, leave with the guard, etc."
            maxLength={500}
          />
        </section>

        {/* --------------------------------------------------- payment */}
        <section className="border border-rule bg-paper-warm p-5">
          <h2 className="font-display text-xl mb-2">Payment</h2>
          <p className="text-sm text-ink-soft leading-relaxed">
            {fulfilment === "pickup"
              ? "Pay in cash when you collect your order from the store."
              : "Pay in cash to the delivery rider when your order arrives."}{" "}
            Online payment is coming soon.
          </p>
        </section>
      </div>

      {/* ------------------------------------------------------- summary */}
      <aside className="lg:sticky lg:top-32 border border-rule p-6">
        <h2 className="font-display text-xl mb-5">Your order</h2>

        <ul className="space-y-4 mb-5">
          {data.lines.map((l) => (
            <li key={l.variantId} className="flex gap-3 text-sm">
              <div className="photo h-16 w-14 shrink-0">
                {l.image ? (
                  <Image src={l.image} alt="" fill sizes="56px" className="object-cover" />
                ) : null}
              </div>
              <div className="flex-1 min-w-0">
                <p className="leading-snug">{l.productName}</p>
                <p className="text-ink-muted text-xs mt-0.5">
                  {l.variantLabel} × {l.quantity}
                </p>
              </div>
              <p className="shrink-0">{formatPaise(l.lineTotalPaise)}</p>
            </li>
          ))}
        </ul>

        <dl className="space-y-2.5 text-sm border-t border-rule pt-4">
          <div className="flex justify-between">
            <dt className="text-ink-soft">Subtotal</dt>
            <dd>{formatPaise(data.subtotalPaise)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-ink-soft">
              {fulfilment === "pickup"
                ? "Pickup"
                : delivery.zone === "india"
                  ? "Courier"
                  : "Delivery"}
            </dt>
            <dd>
              {delivery.feePaise === 0 ? (
                <span className="text-fresh">Free</span>
              ) : (
                formatPaise(delivery.feePaise)
              )}
            </dd>
          </div>
        </dl>

        {delivery.remainingForFreePaise !== null && delivery.remainingForFreePaise > 0 ? (
          <p className="text-xs text-ink-soft mt-3">
            {formatPaise(delivery.remainingForFreePaise)} more for free delivery.
          </p>
        ) : null}

        <div className="flex justify-between items-baseline border-t border-rule mt-4 pt-4 mb-5">
          <span className="font-display text-lg">Total</span>
          <span className="font-display text-2xl">{formatPaise(data.totalPaise)}</span>
        </div>

        {data.cutoff && fulfilment === "delivery" ? (
          <div className="border-t border-rule pt-4 mb-5">
            <CutoffCountdown
              cutoffAt={data.cutoff.cutoffAt}
              deliveryLabel={data.cutoff.deliveryDateLabel}
              slot={data.cutoff.slot}
            />
          </div>
        ) : null}

        {blocked ? (
          <div className="border border-alert/30 bg-alert-soft px-4 py-3 mb-4">
            <p className="text-sm text-alert leading-relaxed">{delivery.blocked}</p>
          </div>
        ) : null}

        {error ? (
          <div
            ref={errorRef}
            role="alert"
            className="border border-alert/30 bg-alert-soft px-4 py-3 mb-4"
          >
            <p className="text-sm text-alert leading-relaxed">{error}</p>
          </div>
        ) : null}

        <button type="submit" className="btn btn-solid w-full" disabled={!canSubmit}>
          {submitting ? "Placing your order…" : "Place order"}
        </button>

        <p className="text-xs text-ink-muted mt-3 text-center leading-relaxed">
          By placing this order you agree to our{" "}
          <Link href="/policies/terms" className="underline underline-offset-2">
            terms
          </Link>{" "}
          and{" "}
          <Link href="/policies/refunds" className="underline underline-offset-2">
            refund policy
          </Link>
          .
        </p>
      </aside>
    </form>
  );
}
