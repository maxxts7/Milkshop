import Image from "next/image";
import Link from "next/link";
import type { Settings } from "@/lib/db/schema";

export function SiteFooter({ settings }: { settings: Settings }) {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-24 bg-ink text-paper">
      <div className="wrap py-16 grid gap-12 md:grid-cols-4">
        <div className="md:col-span-1">
          <Image
            src="/images/brand/logo-mark-white.png"
            alt="Milk House by Khanams Grassfed"
            width={768}
            height={712}
            className="h-20 w-auto mb-6"
          />
          <p className="text-sm text-white/60 leading-relaxed">
            Fresh, authentic and naturally produced dairy and traditional Kashmiri
            products — with a focus on purity, freshness and honesty.
          </p>
        </div>

        <div>
          <h3 className="eyebrow !text-white/50 mb-4">Shop</h3>
          <ul className="space-y-2.5 text-sm text-white/80">
            <li><Link href="/shop" className="hover:text-white">All products</Link></li>
            <li><Link href="/shop?house=Milk+House" className="hover:text-white">Milk House</Link></li>
            <li><Link href="/shop?house=Honey+House" className="hover:text-white">Honey House</Link></li>
            <li><Link href="/subscribe" className="hover:text-white">Milk subscription</Link></li>
            <li><Link href="/account" className="hover:text-white">My orders</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="eyebrow !text-white/50 mb-4">Information</h3>
          <ul className="space-y-2.5 text-sm text-white/80">
            <li><Link href="/about" className="hover:text-white">Our story</Link></li>
            <li><Link href="/certificates" className="hover:text-white">Certificates &amp; reports</Link></li>
            <li><Link href="/contact" className="hover:text-white">Visit the store</Link></li>
            <li><Link href="/policies/shipping" className="hover:text-white">Delivery &amp; pickup</Link></li>
            <li><Link href="/policies/refunds" className="hover:text-white">Cancellations &amp; refunds</Link></li>
            <li><Link href="/policies/terms" className="hover:text-white">Terms of service</Link></li>
            <li><Link href="/policies/privacy" className="hover:text-white">Privacy policy</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="eyebrow !text-white/50 mb-4">Pickup store</h3>
          <address className="not-italic text-sm text-white/80 leading-relaxed mb-4">
            {settings.storeAddress}
          </address>
          <p className="text-sm text-white/80">
            <a href={`tel:+91${settings.storePhone}`} className="hover:text-white">
              +91 {settings.storePhone}
            </a>
          </p>
          <div className="flex gap-4 mt-4 text-sm text-white/60">
            {settings.instagram ? (
              <a
                href={`https://instagram.com/${settings.instagram}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white"
              >
                Instagram
              </a>
            ) : null}
            {settings.facebook ? (
              <a
                href={`https://facebook.com/${settings.facebook}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white"
              >
                Facebook
              </a>
            ) : null}
            {settings.youtube ? (
              <a
                href={`https://youtube.com/@${settings.youtube}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white"
              >
                YouTube
              </a>
            ) : null}
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="wrap py-6 flex flex-col sm:flex-row justify-between gap-3 text-xs text-white/50">
          <p>© {year} {settings.storeName}. All rights reserved.</p>
          <p>FSSAI Lic. No. {settings.fssai}</p>
        </div>
      </div>
    </footer>
  );
}
