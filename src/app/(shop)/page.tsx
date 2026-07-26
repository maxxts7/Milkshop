import Image from "next/image";
import Link from "next/link";
import { ProductCard } from "@/components/product-card";
import { CutoffCountdown } from "@/components/cutoff-countdown";
import { BottleBoards, BottleStats } from "@/components/bottle-counter";
import { CustomerReviews } from "@/components/customer-reviews";
import {
  ArrowRightIcon,
  LeafIcon,
  ShieldIcon,
  StoreIcon,
  TruckIcon,
} from "@/components/icons";
import { getCatalogue, getSettings } from "@/lib/store";
import { getBottleCount } from "@/lib/bottle-count";
import { getCutoffInfo } from "@/lib/delivery";
import { formatPaise } from "@/lib/money";

export default async function HomePage() {
  const [catalogue, settings] = await Promise.all([getCatalogue(), getSettings()]);
  const cutoff = getCutoffInfo(settings);
  const bottles = getBottleCount();

  const milkHouse = catalogue.filter(
    (p) => p.house === "Milk House" && p.status === "active",
  );
  const honeyHouse = catalogue.filter((p) => p.house === "Honey House");
  const pantry = catalogue.filter(
    (p) => p.house === "Khanams Grassfed" && p.status === "active",
  );

  return (
    <>
      {/* ---------------------------------------------------------- hero */}
      <section className="relative isolate overflow-hidden">
        <Image
          src="/images/lifestyle/grass-bottle.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover -z-10"
        />
        {/*
          Scrim: the photography changes with the season, the legibility of the
          boards must not. Flat wash first, then a soft top-down fade so the
          heading sits on the lightest part of the frame.
        */}
        <div className="absolute inset-0 -z-10 bg-paper/80" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-paper via-paper/40 to-paper/70" />

        <div className="wrap py-12 md:py-16 text-center">
          <h1 className="font-display text-fresh text-[2.25rem] leading-[1.1] sm:text-5xl md:text-6xl">
            Real Milk. Real Freshness.
          </h1>

          <div className="flex items-center justify-center gap-4 my-5">
            <span className="h-px w-14 sm:w-24 bg-fresh/30" />
            <LeafIcon className="h-4 w-4 text-fresh shrink-0" />
            <span className="h-px w-14 sm:w-24 bg-fresh/30" />
          </div>

          <p className="font-display text-lg sm:text-xl md:text-2xl text-ink-soft mb-9 md:mb-11">
            From our farm to your home
          </p>

          <BottleBoards initial={bottles} />

          <div className="flex flex-wrap justify-center gap-3 mt-10">
            <Link href="/shop" className="btn btn-solid">
              Shop the range
            </Link>
            <Link href="/subscribe" className="btn btn-outline">
              Start a milk subscription
            </Link>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------- month & year tally */}
      <section className="wrap py-12 md:py-16">
        <BottleStats initial={bottles} />
      </section>

      {/* ------------------------------------------------- promise strip */}
      <section className="bg-fresh text-paper">
        <div className="wrap py-8 md:py-10 grid gap-7 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              icon: <LeafIcon className="h-5 w-5" />,
              title: "100% pure & organic",
              body: "No additives, no preservatives",
            },
            {
              icon: <StoreIcon className="h-5 w-5" />,
              title: "Farm fresh",
              body: "Straight from our farm",
            },
            {
              icon: <ShieldIcon className="h-5 w-5" />,
              title: "Hygienic & safe",
              body: "Packed with care",
            },
            {
              icon: <TruckIcon className="h-5 w-5" />,
              title: `Delivery within ${settings.freshDeliveryCity}`,
              body: "Fast & reliable",
            },
          ].map((f) => (
            <div key={f.title} className="flex items-center gap-4">
              <span className="inline-flex shrink-0 items-center justify-center h-11 w-11 rounded-full border border-white/35">
                {f.icon}
              </span>
              <div>
                <h3 className="font-display text-base leading-snug mb-0.5">
                  {f.title}
                </h3>
                <p className="text-sm text-white/65 leading-snug">{f.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* --------------------------------------------------- milk house */}
      <section className="wrap py-20 md:py-28">
        <div className="flex flex-wrap items-end justify-between gap-6 mb-12">
          <div>
            <p className="eyebrow mb-3">Milk House</p>
            <h2 className="font-display text-3xl md:text-5xl max-w-lg leading-tight">
              Fresh every morning, before you wake
            </h2>
          </div>
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 text-sm tracking-[0.08em] uppercase border-b border-ink pb-1 hover:gap-3 transition-all"
          >
            All products <ArrowRightIcon className="h-4 w-4" />
          </Link>
        </div>

        {!settings.ordersPaused ? (
          <div className="border border-rule bg-paper-warm px-5 py-4 mb-12 max-w-2xl">
            <CutoffCountdown
              cutoffAt={cutoff.cutoffAt}
              deliveryLabel={cutoff.deliveryDateLabel}
              slot={cutoff.slot}
            />
          </div>
        ) : null}

        <div className="grid gap-x-6 gap-y-12 grid-cols-2 lg:grid-cols-4">
          {milkHouse.map((p, i) => (
            <ProductCard key={p.id} product={p} priority={i < 2} />
          ))}
        </div>
      </section>

      {/* ------------------------------------------------- subscription */}
      <section className="bg-cream">
        <div className="wrap py-20 md:py-28 grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <div className="relative aspect-[4/3] photo">
            <Image
              src="/images/products/cow-milk-alt.jpg"
              alt="Milk House bottle with gingham caps"
              fill
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover"
            />
          </div>
          <div>
            <p className="eyebrow mb-4">Milk subscription</p>
            <h2 className="font-display text-3xl md:text-5xl leading-tight mb-6">
              Never think about milk again
            </h2>
            <p className="text-ink-soft leading-relaxed mb-8 max-w-md">
              Set your quantity and your rhythm — every day, alternate days, or
              once a week. We deliver between {settings.deliverySlot.toLowerCase()},
              and you pay on delivery. Pause it whenever you travel.
            </p>
            <ul className="space-y-3 mb-8 text-sm">
              <li className="flex gap-3">
                <span className="text-ink-muted tabular-nums">01</span>
                <span>
                  Subscriber price{" "}
                  <strong className="font-medium">{formatPaise(6000)}/litre</strong>{" "}
                  instead of {formatPaise(6300)}
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-ink-muted tabular-nums">02</span>
                <span>Pause, skip a day, or cancel any time — no lock-in</span>
              </li>
              <li className="flex gap-3">
                <span className="text-ink-muted tabular-nums">03</span>
                <span>Cash on delivery, no card and no advance</span>
              </li>
            </ul>
            <Link href="/subscribe" className="btn btn-solid">
              Build my subscription
            </Link>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------- honey house */}
      {honeyHouse.length > 0 ? (
        <section className="wrap py-20 md:py-28">
          <div className="mb-12">
            <p className="eyebrow mb-3">Honey House</p>
            <h2 className="font-display text-3xl md:text-5xl max-w-xl leading-tight">
              Raw, unheated and unfiltered
            </h2>
            <p className="text-ink-soft mt-4 max-w-lg leading-relaxed">
              Produce of Kashmir. Medium to dark amber, floral and slightly
              smoky. Ingredients: 100% bee love.
            </p>
          </div>
          <div className="grid gap-x-6 gap-y-12 grid-cols-2 lg:grid-cols-4">
            {honeyHouse.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      ) : null}

      {/* ------------------------------------------------------- pantry */}
      {pantry.length > 0 ? (
        <section className="bg-paper-warm">
          <div className="wrap py-20 md:py-28">
            <div className="mb-12">
              <p className="eyebrow mb-3">The Kashmiri pantry</p>
              <h2 className="font-display text-3xl md:text-5xl max-w-xl leading-tight">
                Ghee, eggs and things made the old way
              </h2>
            </div>
            <div className="grid gap-x-6 gap-y-12 grid-cols-2 lg:grid-cols-4">
              {pantry.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* ------------------------------------------------ how it reaches */}
      <section className="wrap py-20 md:py-28">
        <h2 className="font-display text-3xl md:text-5xl mb-14 max-w-lg leading-tight">
          How it reaches you
        </h2>
        <div className="grid gap-10 md:grid-cols-3">
          <div>
            <TruckIcon className="h-7 w-7 mb-5" />
            <h3 className="font-display text-xl mb-2">
              Fresh across {settings.freshDeliveryCity}
            </h3>
            <p className="text-sm text-ink-soft leading-relaxed">
              Milk, dahi and eggs are delivered {settings.deliverySlot.toLowerCase()},
              the morning after you order. {formatPaise(settings.localDeliveryFeePaise)}{" "}
              delivery, free over {formatPaise(settings.localFreeAbovePaise)}.
            </p>
          </div>
          <div>
            <LeafIcon className="h-7 w-7 mb-5" />
            <h3 className="font-display text-xl mb-2">Shipped across India</h3>
            <p className="text-sm text-ink-soft leading-relaxed">
              Honey, ghee, wari and pickle travel anywhere in the country.{" "}
              {formatPaise(settings.courierFeePaise)} flat, free over{" "}
              {formatPaise(settings.courierFreeAbovePaise)}. Perishables stay local
              — we will not post you milk.
            </p>
          </div>
          <div>
            <StoreIcon className="h-7 w-7 mb-5" />
            <h3 className="font-display text-xl mb-2">Collect from the store</h3>
            <p className="text-sm text-ink-soft leading-relaxed">
              {settings.storeAddress}. No delivery charge on pickup orders — pay
              when you collect.
            </p>
          </div>
        </div>
      </section>

      {/* ----------------------------------------------- customer reviews */}
      <CustomerReviews />

      {/* --------------------------------------------------------- verse */}
      <section className="bg-ink text-paper">
        <div className="wrap-narrow py-20 md:py-28 text-center">
          <p className="font-display text-2xl md:text-3xl leading-relaxed text-white/90">
            &ldquo;And there is certainly a lesson for you in cattle: We give you
            to drink of what is in their bellies, from between digested food and
            blood: pure milk, pleasant to drink.&rdquo;
          </p>
          <p className="eyebrow !text-white/40 mt-6">Quran 16:66</p>
        </div>
      </section>
    </>
  );
}
