import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductGallery } from "@/components/product-gallery";
import { ProductBuy } from "@/components/product-buy";
import { WaitlistForm } from "@/components/waitlist-form";
import { ProductCard } from "@/components/product-card";
import { CutoffCountdown } from "@/components/cutoff-countdown";
import { CheckIcon, StoreIcon, TruckIcon } from "@/components/icons";
import { getCatalogue, getProductBySlug, getSettings } from "@/lib/store";
import { getCutoffInfo } from "@/lib/delivery";
import { getPreOrderTerms } from "@/lib/pre-order";
import { formatPaise } from "@/lib/money";

/**
 * Rendered per request rather than pre-built: prices, stock and the fresh-order
 * countdown all change from the admin dashboard, and a cached product page
 * would keep selling yesterday's price until the next deploy.
 */
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Product not found" };

  return {
    title: product.name,
    description: product.description?.slice(0, 160) ?? undefined,
    openGraph: {
      title: `${product.name} — ${product.house}`,
      description: product.description?.slice(0, 200) ?? undefined,
      images: product.image ? [product.image] : undefined,
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [product, settings, catalogue] = await Promise.all([
    getProductBySlug(slug),
    getSettings(),
    getCatalogue(),
  ]);

  if (!product) notFound();

  const cutoff = getCutoffInfo(settings);
  const comingSoon = product.status === "coming_soon";
  const images =
    product.gallery && product.gallery.length > 0
      ? product.gallery
      : product.image
        ? [product.image]
        : [];

  const related = catalogue
    .filter((p) => p.id !== product.id && p.house === product.house)
    .slice(0, 4);

  return (
    <div className="wrap py-10 md:py-16">
      <nav className="mb-8 text-xs tracking-[0.08em] uppercase text-ink-muted" aria-label="Breadcrumb">
        <Link href="/shop" className="hover:text-ink">
          Shop
        </Link>
        <span className="mx-2">/</span>
        <span className="text-ink">{product.name}</span>
      </nav>

      <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-start">
        <ProductGallery images={images} name={product.name} house={product.house} />

        <div className="lg:sticky lg:top-32">
          <p className="eyebrow mb-3">{product.house}</p>
          <h1 className="font-display text-4xl md:text-5xl leading-tight mb-3">
            {product.name}
          </h1>
          {product.tagline ? (
            <p className="text-lg text-ink-soft mb-6 italic font-display">
              {product.tagline}
            </p>
          ) : null}

          {product.description ? (
            <p className="text-ink-soft leading-relaxed mb-8">
              {product.description}
            </p>
          ) : null}

          {comingSoon ? (
            <WaitlistForm productId={product.id} productName={product.name} />
          ) : (
            <ProductBuy
              slug={product.slug}
              subscribable={product.subscribable}
              ordersPaused={settings.ordersPaused}
              preOrder={getPreOrderTerms(product.slug)}
              variants={product.variants.map((v) => ({
                id: v.id,
                label: v.label,
                pricePaise: v.pricePaise,
                subscriberPricePaise: v.subscriberPricePaise,
                inStock: v.inStock,
              }))}
            />
          )}

          {product.highlights && product.highlights.length > 0 ? (
            <ul className="mt-10 space-y-2.5 border-t border-rule pt-8">
              {product.highlights.map((h) => (
                <li key={h} className="flex gap-3 text-sm text-ink-soft">
                  <CheckIcon className="h-4 w-4 shrink-0 mt-0.5 text-ink" />
                  {h}
                </li>
              ))}
            </ul>
          ) : null}

          <div className="mt-8 border-t border-rule pt-8 space-y-5">
            {product.kind === "fresh" ? (
              <>
                {!settings.ordersPaused && !comingSoon ? (
                  <CutoffCountdown
                    cutoffAt={cutoff.cutoffAt}
                    deliveryLabel={cutoff.deliveryDateLabel}
                    slot={cutoff.slot}
                  />
                ) : null}
                <div className="flex items-start gap-3">
                  <TruckIcon className="h-5 w-5 shrink-0 mt-0.5 text-ink-soft" />
                  <p className="text-sm text-ink-soft leading-relaxed">
                    Fresh item — delivered within {settings.freshDeliveryCity} only.{" "}
                    {formatPaise(settings.localDeliveryFeePaise)} delivery, free over{" "}
                    {formatPaise(settings.localFreeAbovePaise)}.
                  </p>
                </div>
              </>
            ) : (
              <div className="flex items-start gap-3">
                <TruckIcon className="h-5 w-5 shrink-0 mt-0.5 text-ink-soft" />
                <p className="text-sm text-ink-soft leading-relaxed">
                  Ships anywhere in India — {formatPaise(settings.courierFeePaise)} flat,
                  free over {formatPaise(settings.courierFreeAbovePaise)}. Delivered
                  in {settings.freshDeliveryCity} for{" "}
                  {formatPaise(settings.localDeliveryFeePaise)}.
                </p>
              </div>
            )}

            <div className="flex items-start gap-3">
              <StoreIcon className="h-5 w-5 shrink-0 mt-0.5 text-ink-soft" />
              <p className="text-sm text-ink-soft leading-relaxed">
                Or collect free from our store at {settings.storeAddress}.
              </p>
            </div>

            <p className="text-xs text-ink-muted pt-2">
              FSSAI Lic. No. {settings.fssai} · Questions?{" "}
              <a
                href={`https://wa.me/${settings.whatsappNumber}?text=${encodeURIComponent(
                  `Hello, I'd like to ask about ${product.name}.`,
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-2"
              >
                Message us on WhatsApp
              </a>
            </p>
          </div>
        </div>
      </div>

      {related.length > 0 ? (
        <section className="mt-24 border-t border-rule pt-16">
          <h2 className="font-display text-2xl md:text-3xl mb-10">
            More from {product.house}
          </h2>
          <div className="grid gap-x-6 gap-y-12 grid-cols-2 lg:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
