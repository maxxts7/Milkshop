"use client";

import { useState } from "react";
import { CheckIcon } from "./icons";

export function WaitlistForm({
  productId,
  productName,
}: {
  productId: number;
  productName: string;
}) {
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setState("sending");

    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, phone, name }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        setState("idle");
        return;
      }
      setState("done");
    } catch {
      setError("Could not reach the server. Please check your connection.");
      setState("idle");
    }
  }

  if (state === "done") {
    return (
      <div className="border border-fresh/30 bg-fresh-soft px-5 py-4 flex gap-3">
        <CheckIcon className="h-5 w-5 shrink-0 mt-0.5 text-fresh" />
        <p className="text-sm text-fresh leading-relaxed">
          You&rsquo;re on the list. We&rsquo;ll message you on WhatsApp the day{" "}
          {productName} is ready.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="border border-rule bg-paper-warm p-5">
      <p className="font-display text-xl mb-1.5">Tell me when it&rsquo;s ready</p>
      <p className="text-sm text-ink-soft mb-5 leading-relaxed">
        Leave your number and we&rsquo;ll message you the moment {productName} is
        back. No marketing, just the one message.
      </p>

      <div className="grid gap-3 sm:grid-cols-2 mb-3">
        <div>
          <label className="label" htmlFor={`wl-name-${productId}`}>
            Name
          </label>
          <input
            id={`wl-name-${productId}`}
            className="field"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            autoComplete="name"
          />
        </div>
        <div>
          <label className="label" htmlFor={`wl-phone-${productId}`}>
            Phone
          </label>
          <input
            id={`wl-phone-${productId}`}
            className="field"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="10-digit mobile"
            inputMode="numeric"
            autoComplete="tel"
            required
          />
        </div>
      </div>

      {error ? (
        <p className="text-sm text-alert mb-3" role="alert">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        className="btn btn-solid btn-sm"
        disabled={state === "sending"}
      >
        {state === "sending" ? "Adding…" : "Notify me"}
      </button>
    </form>
  );
}
