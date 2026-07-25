"use client";

import Link from "next/link";

/**
 * Shown when a storefront page throws — in practice, when the database is
 * unreachable. A customer should never meet a stack trace, and the shop's phone
 * number is the one thing that still works when the site does not.
 */
export default function ShopError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="wrap-narrow py-24 md:py-32 text-center">
      <p className="eyebrow mb-4">Something went wrong</p>
      <h1 className="font-display text-4xl md:text-5xl mb-5 leading-tight">
        We can&rsquo;t load the shop right now
      </h1>
      <p className="text-ink-soft leading-relaxed mb-8 max-w-md mx-auto">
        This is our side, not yours. Please try again in a moment — or just call
        us and we&rsquo;ll take your order the old-fashioned way.
      </p>

      <div className="flex flex-wrap gap-3 justify-center mb-10">
        <button type="button" onClick={reset} className="btn btn-solid">
          Try again
        </button>
        <a href="tel:+917006543918" className="btn btn-outline">
          Call +91 7006543918
        </a>
        <a
          href="https://wa.me/917006543918"
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-outline"
        >
          WhatsApp us
        </a>
      </div>

      <Link
        href="/"
        className="text-sm tracking-[0.08em] uppercase border-b border-ink pb-1"
      >
        Back home
      </Link>

      {error.digest ? (
        <p className="text-xs text-ink-muted mt-12">
          Reference: {error.digest}
        </p>
      ) : null}
    </div>
  );
}
