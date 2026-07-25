import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/lib/auth";
import { adminLogout } from "../actions";

const NAV = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/runsheet", label: "Delivery run-sheet" },
  { href: "/admin/subscriptions", label: "Subscriptions" },
  { href: "/admin/products", label: "Products & prices" },
  { href: "/admin/waitlist", label: "Waiting list" },
  { href: "/admin/settings", label: "Settings" },
];

/** The dashboard is entirely live data behind a session — never prerender it. */
export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");

  return (
    <div className="min-h-screen bg-paper-warm">
      <header className="bg-ink text-paper no-print">
        <div className="wrap flex items-center justify-between h-16 gap-4">
          <div className="flex items-center gap-4">
            <Image
              src="/images/brand/logo-mark-white.png"
              alt=""
              width={768}
              height={712}
              className="h-9 w-auto"
            />
            <span className="text-xs tracking-[0.18em] uppercase text-white/50 hidden sm:block">
              Store admin
            </span>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <Link href="/" className="text-white/60 hover:text-white" target="_blank">
              View site ↗
            </Link>
            <span className="text-white/40 hidden md:inline">{admin.email}</span>
            <form action={adminLogout}>
              <button type="submit" className="text-white/60 hover:text-white">
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      <nav className="bg-ink border-t border-white/10 no-print" aria-label="Admin">
        <div className="wrap scroll-x">
          <ul className="flex gap-1 w-max">
            {NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="block px-4 py-3 text-xs tracking-[0.08em] uppercase text-white/60 hover:text-white hover:bg-white/5 whitespace-nowrap"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      <main className="wrap py-10">{children}</main>
    </div>
  );
}
