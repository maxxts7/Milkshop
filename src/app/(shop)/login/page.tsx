import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/login-form";
import { getCurrentCustomer } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const customer = await getCurrentCustomer();
  if (customer) redirect(next ?? "/account");

  // Only ever redirect within this site.
  const redirectTo = next && next.startsWith("/") && !next.startsWith("//") ? next : "/account";

  return (
    <div className="wrap-narrow py-16 md:py-24">
      <p className="eyebrow mb-3">Your account</p>
      <h1 className="font-display text-4xl md:text-5xl mb-4">Sign in</h1>
      <p className="text-ink-soft mb-10 leading-relaxed max-w-md">
        Use the mobile number you order with. Signing in lets you see past
        orders, reorder in one tap, and manage your milk subscription.
      </p>
      <LoginForm redirectTo={redirectTo} />
    </div>
  );
}
