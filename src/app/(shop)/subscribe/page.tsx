import type { Metadata } from "next";
import { SubscriptionBuilder, type SubProduct } from "@/components/subscription-builder";
import { getCatalogue, getSettings } from "@/lib/store";
import { getCurrentCustomer } from "@/lib/auth";
import { SUBSCRIPTION_DELIVERY_SLOT, getCutoffInfo } from "@/lib/delivery";
import { getPreOrderTerms } from "@/lib/pre-order";

export const metadata: Metadata = {
  title: "Milk subscription",
  description:
    "Fresh grass-fed milk and dahi delivered to your door in Srinagar every morning. Daily, alternate-day or weekly. Pause any time, pay cash on delivery.",
};

export const dynamic = "force-dynamic";

export default async function SubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ product?: string }>;
}) {
  const [{ product: initialSlug }, catalogue, settings, customer] = await Promise.all([
    searchParams,
    getCatalogue(),
    getSettings(),
    getCurrentCustomer(),
  ]);

  const cutoff = getCutoffInfo(settings);

  const subscribable: SubProduct[] = catalogue
    // Pre-order items are made to order in batches, so they cannot be put on a
    // standing daily round.
    .filter(
      (p) =>
        p.subscribable &&
        p.status === "active" &&
        p.variants.length > 0 &&
        !getPreOrderTerms(p.slug),
    )
    .map((p) => ({
      id: p.id,
      slug: p.slug,
      name: p.name,
      house: p.house,
      image: p.image,
      variants: p.variants.map((v) => ({
        id: v.id,
        label: v.label,
        pricePaise: v.pricePaise,
        subscriberPricePaise: v.subscriberPricePaise,
        inStock: v.inStock,
      })),
    }));

  return (
    <div className="wrap py-14 md:py-20">
      <header className="max-w-2xl mb-14">
        <p className="eyebrow mb-3">Milk subscription</p>
        <h1 className="font-display text-4xl md:text-6xl leading-tight mb-5">
          Fresh milk, every morning, without asking
        </h1>
        <p className="text-lg text-ink-soft leading-relaxed">
          Choose what you want and how often. We arrive between{" "}
          {SUBSCRIPTION_DELIVERY_SLOT.toLowerCase()} across{" "}
          {settings.freshDeliveryCity}, delivery is free, and you pay in cash at
          the door. Pause it whenever you travel — there is no contract and no
          advance.
        </p>
      </header>

      <SubscriptionBuilder
        products={subscribable}
        initialSlug={initialSlug}
        customerName={customer?.name ?? ""}
        customerPhone={customer?.phone ?? ""}
        freshCity={settings.freshDeliveryCity}
        slot={SUBSCRIPTION_DELIVERY_SLOT}
        tomorrow={cutoff.deliveryDate}
      />
    </div>
  );
}
