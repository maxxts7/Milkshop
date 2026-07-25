import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Image from "next/image";
import { getCurrentAdmin } from "@/lib/auth";
import { AdminLoginForm } from "./form";

export const metadata: Metadata = {
  title: "Admin sign in",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminLoginPage() {
  if (await getCurrentAdmin()) redirect("/admin");

  return (
    <div className="min-h-screen grid place-items-center px-6 bg-paper-warm">
      <div className="w-full max-w-sm">
        <Image
          src="/images/brand/logo-mark.png"
          alt=""
          width={768}
          height={712}
          className="h-16 w-auto mx-auto mb-8"
        />
        <h1 className="font-display text-3xl text-center mb-2">Store admin</h1>
        <p className="text-sm text-ink-soft text-center mb-8">
          Sign in to manage orders, prices and subscriptions.
        </p>
        <AdminLoginForm />
      </div>
    </div>
  );
}
