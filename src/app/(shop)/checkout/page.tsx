import type { Metadata } from "next";
import { CheckoutForm } from "@/components/checkout-form";
import { getSettings } from "@/lib/store";
import { getCurrentCustomer } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Checkout",
  robots: { index: false, follow: false },
};

export default async function CheckoutPage() {
  const [settings, customer] = await Promise.all([
    getSettings(),
    getCurrentCustomer(),
  ]);

  return (
    <div className="wrap py-14 md:py-20">
      <h1 className="font-display text-4xl md:text-5xl mb-10">Checkout</h1>
      <CheckoutForm
        storeAddress={settings.storeAddress}
        freshCity={settings.freshDeliveryCity}
        prefill={
          customer
            ? {
                name: customer.name ?? "",
                phone: customer.phone,
                email: customer.email ?? "",
              }
            : null
        }
      />
    </div>
  );
}
