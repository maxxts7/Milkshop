import { CartProvider } from "@/components/cart-provider";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { WhatsAppButton } from "@/components/whatsapp-button";
import { getSettings } from "@/lib/store";
import { getCurrentCustomer } from "@/lib/auth";

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
