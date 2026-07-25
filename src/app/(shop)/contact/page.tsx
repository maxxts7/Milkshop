import type { Metadata } from "next";
import Image from "next/image";
import { getSettings } from "@/lib/store";
import { StoreIcon, TruckIcon } from "@/components/icons";
import { WhatsAppIcon } from "@/components/icons";

export const metadata: Metadata = {
  title: "Visit & contact",
  description:
    "Khanams Grassfed pickup store at Naid Kadal, Makhdoom Mandav, near Ranger Masjid, Srinagar. Call or message us on WhatsApp.",
};

export default async function ContactPage() {
  const settings = await getSettings();
  const mapsQuery = encodeURIComponent(settings.storeAddress);

  return (
    <div className="wrap py-14 md:py-20">
      <header className="max-w-2xl mb-14">
        <p className="eyebrow mb-3">Visit &amp; contact</p>
        <h1 className="font-display text-4xl md:text-6xl leading-tight mb-5">
          Come to the store, or just message us
        </h1>
        <p className="text-lg text-ink-soft leading-relaxed">
          The quickest way to reach us is WhatsApp — we answer through the day.
        </p>
      </header>

      <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-start">
        <div className="space-y-10">
          <section>
            <StoreIcon className="h-6 w-6 mb-4" />
            <h2 className="font-display text-2xl mb-3">Pickup store</h2>
            <address className="not-italic text-ink-soft leading-relaxed mb-4">
              {settings.storeAddress}
            </address>
            <p className="text-sm text-ink-soft mb-4">
              Collect any order here free of charge and pay when you arrive.
            </p>
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${mapsQuery}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-outline btn-sm"
            >
              Open in Google Maps
            </a>
          </section>

          <section>
            <WhatsAppIcon className="h-6 w-6 mb-4" />
            <h2 className="font-display text-2xl mb-3">Talk to us</h2>
            <ul className="space-y-2 text-ink-soft">
              <li>
                Phone:{" "}
                <a
                  href={`tel:+91${settings.storePhone}`}
                  className="text-ink underline underline-offset-2"
                >
                  +91 {settings.storePhone}
                </a>
              </li>
              <li>
                WhatsApp:{" "}
                <a
                  href={`https://wa.me/${settings.whatsappNumber}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-ink underline underline-offset-2"
                >
                  Message us
                </a>
              </li>
              {settings.storeEmail ? (
                <li>
                  Email:{" "}
                  <a
                    href={`mailto:${settings.storeEmail}`}
                    className="text-ink underline underline-offset-2"
                  >
                    {settings.storeEmail}
                  </a>
                </li>
              ) : null}
              {settings.instagram ? (
                <li>
                  Instagram:{" "}
                  <a
                    href={`https://instagram.com/${settings.instagram}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-ink underline underline-offset-2"
                  >
                    @{settings.instagram}
                  </a>
                </li>
              ) : null}
            </ul>
          </section>

          <section>
            <TruckIcon className="h-6 w-6 mb-4" />
            <h2 className="font-display text-2xl mb-3">Delivery</h2>
            <p className="text-ink-soft leading-relaxed">
              Fresh milk, dahi and eggs are delivered across{" "}
              {settings.freshDeliveryCity} between{" "}
              {settings.deliverySlot.toLowerCase()}, the morning after you order.
              Order before {settings.cutoffHour > 12 ? settings.cutoffHour - 12 : settings.cutoffHour}
              {settings.cutoffHour >= 12 ? "pm" : "am"}. Honey, ghee, wari and
              pickle ship anywhere in India.
            </p>
          </section>

          <p className="text-sm text-ink-muted border-t border-rule pt-6">
            FSSAI Licence No. {settings.fssai}
          </p>
        </div>

        <div className="relative aspect-[4/5] photo">
          <Image
            src="/images/brand/poster-store.jpg"
            alt="Khanams Grassfed pickup store"
            fill
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="object-cover"
          />
        </div>
      </div>
    </div>
  );
}
