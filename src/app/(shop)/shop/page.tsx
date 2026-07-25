import type { Metadata } from "next";
import Link from "next/link";
import { ProductCard } from "@/components/product-card";
import { CutoffCountdown } from "@/components/cutoff-countdown";
import { getCatalogue, getSettings } from "@/lib/store";
import { getCutoffInfo } from "@/lib/delivery";

export const metadata: Metadata = {
  title: "Shop",
  description:
    "Fresh cow and goat milk, handmade dahi, raw Kashmiri honey, cow ghee, desi eggs, wari and pickle from Khanams Grassfed, Srinagar.",
};

const FILTERS = [
  { key: "all", label: "Everything" },
  { key: "Milk House", label: "Milk House" },
  { key: "Honey House", label: "Honey House" },
  { key: "Khanams Grassfed", label: "Pantry" },
  { key: "fresh", label: "Fresh daily" },
  { key: "dry", label: "Ships across India" },
];

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ house?: string; kind?: string }>;
}) {
  const params = await searchParams;
  const [catalogue, settings] = await Promise.all([getCatalogue(), getSettings()]);
  const cutoff = getCutoffInfo(settings);

  const active = params.kind ?? params.house ?? "all";

  const filtered = catalogue.filter((p) => {
    if (active === "all") return true;
    if (active === "fresh" || active === "dry") return p.kind === active;
    return p.house === active;
  });

  const hrefFor = (key: string) => {
    if (key === "all") return "/shop";
    if (key === "fresh" || key === "dry") return `/shop?kind=${key}`;
    return `/shop?house=${encodeURIComponent(key)}`;
  };

  return (
    <div className="wrap py-14 md:py-20">
      <header className="mb-10">
        <p className="eyebrow mb-3">The range</p>
        <h1 className="font-display text-4xl md:text-6xl leading-tight mb-4">
          Everything we make
        </h1>
        <p className="text-ink-soft max-w-xl leading-relaxed">
          Fresh items are delivered across {settings.freshDeliveryCity} the next
          morning. Honey, ghee, wari and pickle ship anywhere in India.
        </p>
      </header>

      <nav className="scroll-x -mx-5 px-5 md:mx-0 md:px-0 mb-10" aria-label="Filter products">
        <div className="flex gap-2 w-max pb-1">
          {FILTERS.map((f) => {
            const isActive = active === f.key;
            return (
              <Link
                key={f.key}
                href={hrefFor(f.key)}
                aria-current={isActive ? "page" : undefined}
                className={`whitespace-nowrap px-4 py-2 text-xs tracking-[0.08em] uppercase border transition-colors ${
                  isActive
                    ? "bg-ink text-paper border-ink"
                    : "border-rule-strong text-ink-soft hover:border-ink hover:text-ink"
                }`}
              >
                {f.label}
              </Link>
            );
          })}
        </div>
      </nav>

      {(active === "all" || active === "fresh" || active === "Milk House") &&
      !settings.ordersPaused ? (
        <div className="border border-rule bg-paper-warm px-5 py-4 mb-12 max-w-2xl">
          <CutoffCountdown
            cutoffAt={cutoff.cutoffAt}
            deliveryLabel={cutoff.deliveryDateLabel}
            slot={cutoff.slot}
          />
        </div>
      ) : null}

      {filtered.length === 0 ? (
        <p className="py-20 text-center text-ink-muted">
          Nothing in this section yet.
        </p>
      ) : (
        <div className="grid gap-x-6 gap-y-14 grid-cols-2 lg:grid-cols-4">
          {filtered.map((p, i) => (
            <ProductCard key={p.id} product={p} priority={i < 4} />
          ))}
        </div>
      )}
    </div>
  );
}
