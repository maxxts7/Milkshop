"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { formatPaise } from "@/lib/money";
import { formatIstDate } from "@/lib/delivery";

export interface ManagedSubscription {
  id: number;
  productName: string;
  variantLabel: string;
  quantity: number;
  unitPricePaise: number;
  frequencyLabel: string;
  status: string;
  pausedUntil: string | null;
  address: string | null;
  nextDates: string[];
}

export function SubscriptionManager({
  subscriptions,
  slot,
}: {
  subscriptions: ManagedSubscription[];
  slot: string;
}) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<number | null>(null);
  const [confirmCancel, setConfirmCancel] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function act(id: number, body: Record<string, unknown>) {
    setBusyId(id);
    setError(null);
    try {
      const res = await fetch(`/api/subscriptions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setError(json.error ?? "Could not update your subscription.");
      } else {
        router.refresh();
      }
    } catch {
      setError("Could not reach the server.");
    }
    setBusyId(null);
    setConfirmCancel(null);
  }

  function pauseTwoWeeks(id: number) {
    const until = new Date(Date.now() + 14 * 86_400_000).toISOString().slice(0, 10);
    void act(id, { action: "pause", until });
  }

  if (subscriptions.length === 0) {
    return (
      <p className="text-ink-soft text-sm">
        You don&rsquo;t have a subscription yet.
      </p>
    );
  }

  return (
    <div className="space-y-5">
      {error ? (
        <p className="text-sm text-alert" role="alert">
          {error}
        </p>
      ) : null}

      {subscriptions.map((sub) => {
        const busy = busyId === sub.id;
        return (
          <article key={sub.id} className="border border-rule p-5">
            <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
              <div>
                <h3 className="font-display text-xl leading-snug">
                  {sub.quantity} × {sub.productName}
                </h3>
                <p className="text-sm text-ink-muted mt-0.5">
                  {sub.variantLabel} · {sub.frequencyLabel} ·{" "}
                  {formatPaise(sub.unitPricePaise * sub.quantity)} per delivery
                </p>
              </div>
              <span
                className={`tag ${
                  sub.status === "active"
                    ? "bg-fresh-soft text-fresh"
                    : sub.status === "paused"
                      ? "bg-cream text-ink-soft"
                      : "bg-alert-soft text-alert"
                }`}
              >
                {sub.status}
              </span>
            </div>

            {sub.address ? (
              <p className="text-sm text-ink-soft mb-3">
                Delivering to {sub.address}, {slot}
              </p>
            ) : null}

            {sub.status === "paused" && sub.pausedUntil ? (
              <p className="text-sm text-ink-soft mb-4">
                Paused until {formatIstDate(sub.pausedUntil)}.
              </p>
            ) : sub.status === "active" && sub.nextDates.length > 0 ? (
              <p className="text-sm text-ink-soft mb-4">
                Next:{" "}
                {sub.nextDates
                  .slice(0, 3)
                  .map((d) => formatIstDate(d))
                  .join(" · ")}
              </p>
            ) : null}

            {sub.status !== "cancelled" ? (
              <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-rule">
                <div className="flex items-center border border-rule-strong">
                  <button
                    type="button"
                    onClick={() => act(sub.id, { action: "quantity", quantity: sub.quantity - 1 })}
                    disabled={busy || sub.quantity <= 1}
                    className="px-3 py-1.5 leading-none disabled:opacity-30"
                    aria-label="Reduce quantity"
                  >
                    −
                  </button>
                  <span className="w-8 text-center text-sm tabular-nums">
                    {sub.quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => act(sub.id, { action: "quantity", quantity: sub.quantity + 1 })}
                    disabled={busy || sub.quantity >= 20}
                    className="px-3 py-1.5 leading-none disabled:opacity-30"
                    aria-label="Increase quantity"
                  >
                    +
                  </button>
                </div>

                {sub.status === "active" ? (
                  <button
                    type="button"
                    onClick={() => pauseTwoWeeks(sub.id)}
                    disabled={busy}
                    className="btn btn-outline btn-sm"
                  >
                    Pause 2 weeks
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => act(sub.id, { action: "resume" })}
                    disabled={busy}
                    className="btn btn-solid btn-sm"
                  >
                    Resume
                  </button>
                )}

                {confirmCancel === sub.id ? (
                  <span className="flex items-center gap-2 text-sm">
                    <span className="text-ink-soft">Cancel for good?</span>
                    <button
                      type="button"
                      onClick={() => act(sub.id, { action: "cancel" })}
                      disabled={busy}
                      className="text-alert underline underline-offset-2"
                    >
                      Yes, cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmCancel(null)}
                      className="text-ink-muted underline underline-offset-2"
                    >
                      Keep it
                    </button>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmCancel(sub.id)}
                    disabled={busy}
                    className="text-xs tracking-[0.08em] uppercase text-ink-muted hover:text-alert underline underline-offset-4"
                  >
                    Cancel
                  </button>
                )}
              </div>
            ) : null}
          </article>
        );
      })}
    </div>
  );
}
