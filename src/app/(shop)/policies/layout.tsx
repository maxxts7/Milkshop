import Link from "next/link";

const POLICIES = [
  { href: "/policies/shipping", label: "Delivery & pickup" },
  { href: "/policies/refunds", label: "Cancellations & refunds" },
  { href: "/policies/terms", label: "Terms of service" },
  { href: "/policies/privacy", label: "Privacy policy" },
];

export default function PoliciesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="wrap py-14 md:py-20">
      <div className="grid lg:grid-cols-[16rem_1fr] gap-10 lg:gap-16 items-start">
        <nav className="lg:sticky lg:top-32" aria-label="Policies">
          <p className="eyebrow mb-4">Policies</p>
          <ul className="space-y-2">
            {POLICIES.map((p) => (
              <li key={p.href}>
                <Link
                  href={p.href}
                  className="text-sm text-ink-soft hover:text-ink hover:underline underline-offset-4"
                >
                  {p.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <article className="max-w-2xl prose-policy">{children}</article>
      </div>
    </div>
  );
}
