import type { Metadata } from "next";
import { desc, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { waitlist, products } from "@/lib/db/schema";
import { getSettings } from "@/lib/store";

export const metadata: Metadata = {
  title: "Waiting list",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminWaitlist() {
  const [rows, settings] = await Promise.all([
    db.select().from(waitlist).orderBy(desc(waitlist.createdAt)).limit(500),
    getSettings(),
  ]);

  if (rows.length === 0) {
    return (
      <>
        <h1 className="font-display text-3xl mb-6">Waiting list</h1>
        <p className="bg-paper border border-rule px-5 py-12 text-center text-sm text-ink-muted">
          Nobody has signed up yet. Sign-ups appear here when someone uses the
          &ldquo;Notify me&rdquo; box on a coming-soon product.
        </p>
      </>
    );
  }

  const productRows = await db
    .select()
    .from(products)
    .where(inArray(products.id, [...new Set(rows.map((r) => r.productId))]));

  const productById = new Map(productRows.map((p) => [p.id, p]));

  const grouped = new Map<number, typeof rows>();
  for (const row of rows) {
    const list = grouped.get(row.productId) ?? [];
    list.push(row);
    grouped.set(row.productId, list);
  }

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-3xl">Waiting list</h1>
          <p className="text-sm text-ink-muted mt-1">
            {rows.length} {rows.length === 1 ? "person" : "people"} waiting
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {[...grouped.entries()].map(([productId, entries]) => {
          const product = productById.get(productId);
          const numbers = entries.map((e) => `91${e.phone}`).join(",");

          return (
            <section key={productId} className="bg-paper border border-rule">
              <div className="px-5 py-4 border-b border-rule flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="font-display text-xl">
                    {product?.name ?? "Product"}
                  </h2>
                  <p className="text-xs text-ink-muted mt-0.5">
                    {entries.length} waiting
                  </p>
                </div>
                <a
                  href={`https://wa.me/${settings.whatsappNumber}?text=${encodeURIComponent(
                    `${product?.name ?? "Our new product"} is now available at Khanams Grassfed! Order at ${process.env.NEXT_PUBLIC_SITE_URL ?? ""}`,
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-outline btn-sm"
                  title={`Numbers: ${numbers}`}
                >
                  Draft launch message
                </a>
              </div>

              <div className="scroll-x">
                <table className="w-full text-sm min-w-[32rem]">
                  <thead>
                    <tr className="text-left border-b border-rule">
                      <th className="px-4 py-3 eyebrow font-medium">Name</th>
                      <th className="px-4 py-3 eyebrow font-medium">Phone</th>
                      <th className="px-4 py-3 eyebrow font-medium">Signed up</th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-rule">
                    {entries.map((entry) => (
                      <tr key={entry.id}>
                        <td className="px-4 py-3">{entry.name ?? "—"}</td>
                        <td className="px-4 py-3">
                          <a
                            href={`tel:+91${entry.phone}`}
                            className="underline underline-offset-2"
                          >
                            +91 {entry.phone}
                          </a>
                        </td>
                        <td className="px-4 py-3 text-ink-muted">
                          {new Date(entry.createdAt).toLocaleDateString("en-IN")}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <a
                            href={`https://wa.me/91${entry.phone}?text=${encodeURIComponent(
                              `Hello${entry.name ? ` ${entry.name}` : ""}, ${product?.name ?? "the product"} you asked about is now available at Khanams Grassfed.`,
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs underline underline-offset-2"
                          >
                            WhatsApp
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          );
        })}
      </div>
    </>
  );
}
