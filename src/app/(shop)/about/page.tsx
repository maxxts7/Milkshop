import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getSettings } from "@/lib/store";

export const metadata: Metadata = {
  title: "Our story",
  description:
    "Khanams Grassfed is a family dairy in Srinagar producing raw grass-fed milk, handmade dahi, raw Kashmiri honey and traditional cow ghee.",
};

/** public/videos/our-story-N.mp4, with a poster frame beside each. */
const VIDEOS = [1, 2, 3];

export default async function AboutPage() {
  const settings = await getSettings();

  return (
    <>
      <section className="wrap py-16 md:py-24">
        <div className="max-w-2xl">
          <p className="eyebrow mb-4">Our story</p>
          <h1 className="font-display text-4xl md:text-6xl leading-tight mb-8">
            Milk the way it used to reach you
          </h1>
          <div className="space-y-5 text-lg text-ink-soft leading-relaxed">
            <p>
              Khanams Grassfed began with a simple frustration: it had become
              almost impossible to buy milk in Srinagar that hadn&rsquo;t been
              watered down, powdered, or sat in a warehouse for a week.
            </p>
            <p>
              So we started doing it ourselves. Our cows graze on open pasture.
              The milking is touch-free and the bottling automated, which means
              no hand ever touches what you drink. It goes into certified glass —
              not plastic — and reaches your door the same morning it leaves the
              farm.
            </p>
            <p>
              From there it grew. Dahi set by hand in clay every day. Raw honey
              from our own hives in the Kashmiri hills, never heated and never
              filtered. Ghee cooked slowly the traditional way. Desi eggs from
              hens that actually walk around.
            </p>
            <p>
              We are not a large company and we do not want to be. Everything we
              sell is something we feed our own family.
            </p>
          </div>
        </div>
      </section>

      {/*
        Clips shot on a phone, so all three are portrait. They are held in a
        fixed 9:16 box with a capped width — left to fill the column they would
        stand taller than the viewport on desktop. preload="none" means nothing
        but the poster is fetched until someone actually presses play.
      */}
      <section className="bg-paper-warm">
        <div className="wrap py-16 md:py-24">
          <div className="max-w-2xl mb-10 md:mb-12">
            <p className="eyebrow mb-3">Watch</p>
            <h2 className="font-display text-3xl md:text-4xl leading-tight">
              Videos from the farm
            </h2>
            <p className="text-ink-soft mt-4 leading-relaxed">
              Tap a clip to play it — they have sound.
            </p>
          </div>

          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {VIDEOS.map((n) => (
              <li key={n} className="mx-auto w-full max-w-xs">
                <div className="photo aspect-[9/16]">
                  <video
                    src={`/videos/our-story-${n}.mp4`}
                    poster={`/videos/our-story-${n}-poster.jpg`}
                    controls
                    preload="none"
                    playsInline
                    className="h-full w-full object-cover"
                  />
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="bg-cream">
        <div className="wrap py-16 md:py-24 grid md:grid-cols-2 gap-12 items-center">
          <div className="relative aspect-[4/3] photo">
            <Image
              src="/images/lifestyle/night-table.jpg"
              alt="A bottle of Milk House milk on a table overlooking Srinagar at night"
              fill
              sizes="(min-width: 768px) 50vw, 100vw"
              className="object-cover"
            />
          </div>
          <div>
            <h2 className="font-display text-3xl md:text-4xl mb-6 leading-tight">
              What &ldquo;purity guaranteed&rdquo; actually means
            </h2>
            <ul className="space-y-4 text-ink-soft">
              {[
                ["Touch-free milking", "Machines, not hands. Nothing is exposed between the animal and the bottle."],
                ["Automated bottling", "Sealed immediately, so nothing gets in on the way."],
                ["No adulterants", "No water, no milk powder, no preservatives, no chemicals. Ever."],
                ["Grass-fed herds", "Open grazing on natural pasture, not feedlot concentrate."],
                ["Certified glass bottles", "Eco-friendly and returnable. Give them back on your next delivery."],
              ].map(([title, body]) => (
                <li key={title}>
                  <p className="text-ink font-medium mb-0.5">{title}</p>
                  <p className="text-sm leading-relaxed">{body}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="wrap py-16 md:py-24">
        <div className="max-w-2xl">
          <h2 className="font-display text-3xl md:text-4xl mb-6 leading-tight">
            Come and see for yourself
          </h2>
          <p className="text-ink-soft leading-relaxed mb-6">
            Our pickup store is at {settings.storeAddress}. You are welcome to
            collect your order there — there is no delivery charge on pickup, and
            you can pay when you arrive.
          </p>
          <p className="text-sm text-ink-muted mb-8">
            FSSAI Licence No. {settings.fssai}
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/shop" className="btn btn-solid">
              Shop the range
            </Link>
            <Link href="/contact" className="btn btn-outline">
              Find the store
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
