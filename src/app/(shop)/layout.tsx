import { CartProvider } from "@/components/cart-provider";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { WhatsAppButton } from "@/components/whatsapp-button";
import { getSettings } from "@/lib/store";
import { getCurrentCustomer } from "@/lib/auth";

/**
 * Applies to every page in the storefront, because every one of them renders
 * live database content — at minimum the store details, announcement bar and
 * cart badge in the header and footer.
 *
 * Set here rather than page by page on purpose: a page that forgets it gets
 * prerendered at build time, which means it queries the database during the
 * build and ships a snapshot of your prices that never updates. That is exactly
 * how the first Netlify deploy broke on /policies/privacy.
 */
export const dynamic = "force-dynamic";

export default async function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [settings, customer] = await Promise.all([
    getSettings(),
    getCurrentCustomer(),
  ]);

  return (
    <CartProvider>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:top-2 focus:left-2 focus:bg-ink focus:text-paper focus:px-4 focus:py-2"
      >
        Skip to content
      </a>

      <SiteHeader
        announcement={
          settings.ordersPaused
            ? "We are not accepting new orders right now — please check back soon."
            : settings.announcement
        }
        loggedIn={Boolean(customer)}
      />

      <main id="main">{children}</main>

      <SiteFooter settings={settings} />
      <WhatsAppButton number={settings.whatsappNumber} />
    </CartProvider>
  );
}
