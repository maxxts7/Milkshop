"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useCart } from "./cart-provider";

const LINKS = [
  { href: "/shop", label: "Shop" },
  { href: "/subscribe", label: "Milk Subscription" },
  { href: "/about", label: "Our Story" },
  { href: "/certificates", label: "Certificates" },
  { href: "/contact", label: "Visit & Contact" },
];

export function SiteHeader({
  announcement,
  loggedIn,
}: {
  announcement?: string | null;
  loggedIn: boolean;
}) {
  const { count, ready } = useCart();
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // A left-open menu after navigation is a classic mobile bug.
  useEffect(() => setOpen(false), [pathname]);

  return (
    <>
      {announcement ? (
        <div className="bg-ink text-paper text-center text-xs tracking-wide py-2 px-4">
          {announcement}
        </div>
      ) : null}

      <header className="sticky top-0 z-40 bg-paper/95 backdrop-blur-sm border-b border-rule">
        <div className="wrap flex items-center justify-between h-20 md:h-24 gap-4">
          <Link href="/" className="flex items-center shrink-0" aria-label="Khanams Grassfed — home">
            <Image
              src="/images/brand/logo-mark.png"
              alt="Milk House by Khanams Grassfed"
              width={768}
              height={712}
              priority
              className="h-12 md:h-16 w-auto"
            />
          </Link>

          <nav className="hidden lg:flex items-center gap-8" aria-label="Main">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={`text-[0.8125rem] tracking-[0.08em] uppercase transition-colors hover:text-ink ${
                  pathname.startsWith(l.href) ? "text-ink" : "text-ink-soft"
                }`}
              >
                {l.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-1 sm:gap-3">
            <Link
              href={loggedIn ? "/account" : "/login"}
              className="hidden sm:inline-flex text-[0.8125rem] tracking-[0.08em] uppercase text-ink-soft hover:text-ink px-2 py-2"
            >
              {loggedIn ? "Account" : "Sign in"}
            </Link>

            <Link
              href="/cart"
              className="relative inline-flex items-center gap-2 px-3 py-2 text-[0.8125rem] tracking-[0.08em] uppercase hover:text-ink text-ink-soft"
            >
              Cart
              <span
                className="min-w-[1.4rem] h-[1.4rem] inline-flex items-center justify-center rounded-full bg-ink text-paper text-[0.6875rem] font-medium px-1"
                aria-live="polite"
              >
                {ready ? count : 0}
              </span>
            </Link>

            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="lg:hidden p-2 -mr-2"
              aria-expanded={open}
              aria-controls="mobile-nav"
              aria-label={open ? "Close menu" : "Open menu"}
            >
              <span className="block w-6 space-y-[5px]">
                <span
                  className={`block h-px bg-ink transition-transform ${open ? "translate-y-[6px] rotate-45" : ""}`}
                />
                <span className={`block h-px bg-ink transition-opacity ${open ? "opacity-0" : ""}`} />
                <span
                  className={`block h-px bg-ink transition-transform ${open ? "-translate-y-[6px] -rotate-45" : ""}`}
                />
              </span>
            </button>
          </div>
        </div>

        {open ? (
          <nav id="mobile-nav" className="lg:hidden border-t border-rule bg-paper" aria-label="Mobile">
            <div className="wrap py-4 flex flex-col">
              {LINKS.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="py-3 text-sm tracking-[0.08em] uppercase border-b border-rule last:border-0"
                >
                  {l.label}
                </Link>
              ))}
              <Link
                href={loggedIn ? "/account" : "/login"}
                className="py-3 text-sm tracking-[0.08em] uppercase"
              >
                {loggedIn ? "My account" : "Sign in"}
              </Link>
            </div>
          </nav>
        ) : null}
      </header>
    </>
  );
}
