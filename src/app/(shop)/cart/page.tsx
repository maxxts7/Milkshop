import type { Metadata } from "next";
import { CartView } from "@/components/cart-view";

export const metadata: Metadata = {
  title: "Your cart",
  robots: { index: false, follow: false },
};

export default function CartPage() {
  return (
    <div className="wrap py-14 md:py-20">
      <h1 className="font-display text-4xl md:text-5xl mb-10">Your cart</h1>
      <CartView />
    </div>
  );
}
