"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { formatPaise } from "@/lib/money";

export interface SubProduct {
  id: number;
  slug: string;
  name: string;
  house: string;
  image: string | null;
  variants: {
    id: number;
    label: string;
    pricePaise: number;
    subscriberPricePaise: number | null;
    inStock: boolean;
  }[];
}

const FREQUENCIES = [
  { key: "daily", label: "Every day", note: "7 deliveries a week" },
  { key: "alternate", label: "Every other day", note: "About 15 a month" },
  { key: "weekly", label: "Once a week", note: "Pick your days" },
] as const;

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

type Frequency = (typeof FREQUENCIES)[number]["key"];

/** What the server tells us once the subscription is on the books. */
interface Confirmation {
  reference: string;
  startDate: string;
  schedule: string;
  deliverySlot: string;
  perDeliveryPaise: number;
}

export function SubscriptionBuilder({
  products,
  initialSlug,
  customerName,
  customerPhone,
  freshCity,
  slot,
  tomorrow,
}: {
  products: SubProduct[];
  initialSlug?: string;
  customerName: string;
  customerPhone: string;
  freshCity: string;
  slot: string;
  tomorrow: string;
}) {
  const router = useRouter();

  const initialProduct =
    products.find((p) => p.slug === initialSlug) ?? products[0];

  const [productId, setProductId] = useState(initialProduct?.id ?? 0);
  const product = products.find((p) => p.id === productId) ?? initialProduct;

  const firstVariant = product?.variants.find((v) => v.inStock) ?? product?.variants[0];
  const [variantId, setVariantId] = useState(firstVariant?.id ?? 0);
  const variant =
    product?.variants.find((v) => v.id === variantId) ?? firstVariant;

  const [quantity, setQuantity] = useState(1);
  const [frequency, setFrequency] = useState<Frequency>("daily");
  const [weekdays, setWeekdays] = useState<number[]>([1]);
  const [startDate, setStartDate] = useState(tomorrow);

  const [name, setName] = useState(customerName);
  const [phone, setPhone] = useState(customerPhone);
  const [line1, setLine1] = useState("");
  const [line2, setLine2] = useState("");
  const [landmark, setLandmark] = useState("");
  const [pincode, setPincode] = useState("");

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState<Confirmation | null>(null);

  const unitPaise = variant
    ? (variant.subscriberPricePaise ?? variant.pricePaise)
    : 0;
  const perDelivery = unitPaise * quantity;

  const deliveriesPerMonth = useMemo(() => {
    if (frequency === "daily") return 30;
    if (frequency === "alternate") return 15;
    return weekdays.length * 4.3;
  }, [frequency, weekdays]);

  const monthlyEstimate = Math.round(perDelivery * deliveriesPerMonth);

  const savingPaise =
    variant && variant.subscriberPricePaise != null
      ? (variant.pricePaise - variant.subscriberPricePaise) * quantity
      : 0;

  function changeProduct(id: number) {
    setProductId(id);
    const next = products.find((p) => p.id === id);
    const v = next?.variants.find((x) => x.inStock) ?? next?.variants[0];
    setVariantId(v?.id ?? 0);
  }

  function toggleWeekday(day: number) {
    setWeekdays((current) =>
      current.includes(day)
        ? current.filter((d) => d !== day)
        : [...current, day].sort(),
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);

    try {
      const res = await fetch("/api/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          variantId,
          quantity,
          frequency,
          weekdays: frequency === "weekly" ? weekdays : undefined,
          startDate,
          name,
          phone,
          address: { line1, line2, landmark, pincode },
        }),
      });
      const json = await res.json();

      if (!res.ok) {
        setError(json.error ?? "Could not start your subscription.");
        setBusy(false);
        return;
      }

      setConfirmed(json as Confirmation);
      setBusy(false);
      router.refresh();
    } catch {
      setError("Could not reach the server. Please try again.");
      setBusy(false);
    }
  }

  if (products.length === 0) {
    return (
      <p className="text-ink-soft">
        No products are available for subscription right now.
      </p>
    );
  }

  if (confirmed) {
    return (
      <div className="max-w-2xl">
        <p className="eyebrow !text-fresh mb-3">Order confirmed</p>
        <h2 className="font-display text-3xl md:text-4xl leading-tight mb-4">
          Thank you, {name.split(" ")[0]} — your milk is on its way
        </h2>
        <p className="text-ink-soft leading-relaxed mb-8">
          We have your subscription and the farm has been notified. Your first
          delivery arrives {confirmed.deliverySlot.toLowerCase()}. There is
          nothing to pay now — you pay cash at the door on each delivery.
        </p>

        <dl className="border border-rule divide-y divide-rule bg-paper-warm">
          {[
            ["Reference", confirmed.reference],
            ["Name", name],
            ["Mobile", `+91 ${phone}`],
            [
              "Delivery address",
              [line1, line2, freshCity, pincode].filter(Boolean).join(", "),
            ],
            ["Landmark", landmark || "—"],
            ["Product", product ? `${product.name} — ${variant?.label}` : "—"],
            ["Quantity", `${quantity} per delivery`],
            ["Schedule", confirmed.schedule],
            ["Starts", confirmed.startDate],
            ["Delivery time", confirmed.deliverySlot],
            ["Per delivery", formatPaise(confirmed.perDeliveryPaise)],
          ].map(([label, value]) => (
            <div
              key={label}
              className="flex flex-wrap justify-between gap-x-6 gap-y-1 px-5 py-3.5"
            >
              <dt className="text-sm text-ink-soft">{label}</dt>
              <dd className="text-sm text-right">{value}</dd>
            </div>
          ))}
        </dl>

        <div className="flex flex-wrap gap-3 mt-8">
          <Link href="/shop" className="btn btn-solid">
            Continue shopping
          </Link>
          <Link href="/contact" className="btn btn-outline">
            Change something
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="grid lg:grid-cols-[1fr_20rem] gap-12 lg:gap-16 items-start">
      <div className="space-y-10">
        {/* ------------------------------------------------- 1. product */}
        <section>
          <h2 className="font-display text-xl mb-4">
            <span className="text-ink-muted tabular-nums mr-2">01</span>
            What would you like delivered?
          </h2>
          <div className="grid sm:grid-cols-3 gap-3">
            {products.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => changeProduct(p.id)}
                aria-pressed={p.id === productId}
                className={`text-left border transition-colors overflow-hidden ${
                  p.id === productId
                    ? "border-ink"
                    : "border-rule-strong hover:border-ink"
                }`}
              >
                <div className="photo aspect-[3/2]">
                  {p.image ? (
                    <Image
                      src={p.image}
                      alt=""
                      fill
                      sizes="(min-width:640px) 20vw, 100vw"
                      className="object-cover"
                    />
                  ) : null}
                </div>
                <div className="p-3">
                  <p className="text-sm leading-snug">{p.name}</p>
                  <p className="text-xs text-ink-muted mt-0.5">{p.house}</p>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* --------------------------------------------- 2. size + qty */}
        <section>
          <h2 className="font-display text-xl mb-4">
            <span className="text-ink-muted tabular-nums mr-2">02</span>
            How much, each time?
          </h2>

          {product && product.variants.length > 1 ? (
            <div className="flex flex-wrap gap-2 mb-5">
              {product.variants.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  disabled={!v.inStock}
                  onClick={() => setVariantId(v.id)}
                  aria-pressed={v.id === variantId}
                  className={`px-4 py-2.5 text-sm border transition-colors ${
                    v.id === variantId
                      ? "border-ink bg-ink text-paper"
                      : "border-rule-strong hover:border-ink"
                  } ${!v.inStock ? "opacity-40 cursor-not-allowed line-through" : ""}`}
                >
                  {v.label}
                </button>
              ))}
            </div>
          ) : null}

          <div className="flex items-center gap-4">
            <span className="label !mb-0">Quantity</span>
            <div className="flex items-center border border-rule-strong">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                disabled={quantity <= 1}
                className="px-4 py-2.5 leading-none disabled:opacity-30"
                aria-label="Decrease quantity"
              >
                −
              </button>
              <span className="w-10 text-center tabular-nums">{quantity}</span>
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.min(20, q + 1))}
                disabled={quantity >= 20}
                className="px-4 py-2.5 leading-none disabled:opacity-30"
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>
          </div>
        </section>

        {/* ----------------------------------------------- 3. frequency */}
        <section>
          <h2 className="font-display text-xl mb-4">
            <span className="text-ink-muted tabular-nums mr-2">03</span>
            How often?
          </h2>
          <div className="grid sm:grid-cols-3 gap-3">
            {FREQUENCIES.map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setFrequency(f.key)}
                aria-pressed={frequency === f.key}
                className={`text-left p-4 border transition-colors ${
                  frequency === f.key
                    ? "border-ink bg-paper-warm"
                    : "border-rule-strong hover:border-ink"
                }`}
              >
                <p className="font-medium text-sm mb-1">{f.label}</p>
                <p className="text-xs text-ink-muted">{f.note}</p>
              </button>
            ))}
          </div>

          {frequency === "weekly" ? (
            <fieldset className="mt-5">
              <legend className="label">Which days?</legend>
              <div className="flex flex-wrap gap-2">
                {WEEKDAYS.map((label, day) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => toggleWeekday(day)}
                    aria-pressed={weekdays.includes(day)}
                    className={`w-14 py-2 text-xs border transition-colors ${
                      weekdays.includes(day)
                        ? "border-ink bg-ink text-paper"
                        : "border-rule-strong hover:border-ink"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </fieldset>
          ) : null}

          <div className="mt-5 max-w-xs">
            <label className="label" htmlFor="sub-start">Start from</label>
            <input
              id="sub-start"
              type="date"
              className="field"
              value={startDate}
              min={tomorrow}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
          </div>
        </section>

        {/* ------------------------------------------------- 4. address */}
        <section>
          <h2 className="font-display text-xl mb-4">
            <span className="text-ink-muted tabular-nums mr-2">04</span>
            Where do we bring it?
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="label" htmlFor="sub-name">Your name</label>
              <input
                id="sub-name"
                className="field"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                required
                minLength={2}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="label" htmlFor="sub-phone">Mobile number</label>
              <input
                id="sub-phone"
                className="field"
                value={phone}
                onChange={(e) =>
                  setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))
                }
                inputMode="numeric"
                autoComplete="tel-national"
                placeholder="10-digit mobile"
                required
                minLength={10}
              />
              <p className="text-xs text-ink-muted mt-1.5">
                So the milkman can reach you on the round.
              </p>
            </div>
            <div className="sm:col-span-2">
              <label className="label" htmlFor="sub-line1">House / street</label>
              <input
                id="sub-line1"
                className="field"
                value={line1}
                onChange={(e) => setLine1(e.target.value)}
                autoComplete="address-line1"
                required
                minLength={5}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="label" htmlFor="sub-line2">
                Area / locality <span className="normal-case tracking-normal text-ink-muted">(optional)</span>
              </label>
              <input
                id="sub-line2"
                className="field"
                value={line2}
                onChange={(e) => setLine2(e.target.value)}
                autoComplete="address-line2"
              />
            </div>
            <div>
              <label className="label" htmlFor="sub-landmark">
                Landmark <span className="normal-case tracking-normal text-ink-muted">(optional)</span>
              </label>
              <input
                id="sub-landmark"
                className="field"
                value={landmark}
                onChange={(e) => setLandmark(e.target.value)}
                placeholder="Near…"
              />
            </div>
            <div>
              <label className="label" htmlFor="sub-pincode">Pincode</label>
              <input
                id="sub-pincode"
                className="field"
                value={pincode}
                onChange={(e) => setPincode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                inputMode="numeric"
                autoComplete="postal-code"
                required
              />
              <p className="text-xs text-ink-muted mt-1.5">
                Subscriptions run inside {freshCity} only.
              </p>
            </div>
          </div>
        </section>
      </div>

      {/* -------------------------------------------------------- summary */}
      <aside className="lg:sticky lg:top-32 border border-rule p-6 bg-paper-warm">
        <h2 className="font-display text-xl mb-5">Your plan</h2>

        {product && variant ? (
          <dl className="space-y-2.5 text-sm mb-5">
            <div className="flex justify-between gap-4">
              <dt className="text-ink-soft">Product</dt>
              <dd className="text-right">{product.name}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-ink-soft">Each delivery</dt>
              <dd className="text-right">
                {quantity} × {variant.label}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-ink-soft">Schedule</dt>
              <dd className="text-right">
                {FREQUENCIES.find((f) => f.key === frequency)?.label}
                {frequency === "weekly" && weekdays.length > 0 ? (
                  <span className="block text-xs text-ink-muted">
                    {weekdays.map((d) => WEEKDAYS[d]).join(", ")}
                  </span>
                ) : null}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-ink-soft">Arrives</dt>
              <dd className="text-right">{slot}</dd>
            </div>
          </dl>
        ) : null}

        <div className="border-t border-rule pt-4 space-y-2.5 text-sm">
          <div className="flex justify-between">
            <span className="text-ink-soft">Per delivery</span>
            <span className="font-medium">{formatPaise(perDelivery)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-ink-soft">Roughly per month</span>
            <span>{formatPaise(monthlyEstimate)}</span>
          </div>
          {savingPaise > 0 ? (
            <p className="text-xs text-fresh pt-1">
              You save {formatPaise(savingPaise)} on every delivery versus buying
              one-off.
            </p>
          ) : null}
        </div>

        {error ? (
          <p className="text-sm text-alert mt-5" role="alert">
            {error}
          </p>
        ) : null}

        <button type="submit" className="btn btn-solid w-full mt-6" disabled={busy}>
          {busy ? "Placing order…" : "Place order"}
        </button>

        <p className="text-xs text-ink-muted mt-3 leading-relaxed text-center">
          No account needed. Pay cash on each delivery, and pause or cancel any
          time — just{" "}
          <Link href="/contact" className="underline underline-offset-2">
            tell us
          </Link>
          .
        </p>
      </aside>
    </form>
  );
}
