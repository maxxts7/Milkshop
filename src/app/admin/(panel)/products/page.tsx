import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getAllProducts } from "@/lib/store";
import { formatPaise } from "@/lib/money";

export const metadata: Metadata = {
  title: "Products & prices",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const STATUS_STYLES: Record<string, string> = {
  active: "bg-fresh-soft text-fresh",
  coming_soon: "bg-cream text-ink-soft",
  hidden: "bg-alert-soft text-alert",
};

export default async function AdminProducts() {
  const products = await getAllProducts();

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-3xl">Products &amp; prices</h1>
          <p className="text-sm text-ink-muted mt-1">
            Changes go live on the shop immediately.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {products.map((product) => {
          const outOfStock = product.variants.filter((v) => !v.inStock).length;

          return (
            <article key={product.id} className="bg-paper border border-rule">
              <div className="p-5 flex flex-wrap gap-5 items-start">
                <div className="photo h-24 w-20 shrink-0">
                  {product.image ? (
                    <Image
                      src={product.image}
                      alt=""
                      fill
                      sizes="80px"
                      className="object-cover"
                    />
                  ) : (
                    <span className="absolute inset-0 grid place-items-center text-[0.5625rem] text-ink-muted text-center px-1">
                      No photo
                    </span>
                  )}
                </div>

                <div className="flex-1 min-w-[14rem]">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h2 className="font-display text-xl">{product.name}</h2>
                    <span className={`tag ${STATUS_STYLES[product.status] ?? ""}`}>
                      {product.status.replace(/_/g, " ")}
                    </span>
                    {product.kind === "fresh" ? (
                      <span className="tag bg-cream text-ink-soft">Fresh</span>
                    ) : null}
                    {product.subscribable ? (
                      <span className="tag bg-cream text-ink-soft">Subscribable</span>
                    ) : null}
                  </div>
                  <p className="text-xs text-ink-muted mb-3">
                    {product.house} · /{product.slug}
                  </p>

                  {product.variants.length === 0 ? (
                    <p className="text-sm text-ink-muted">No sizes yet.</p>
                  ) : (
                    <ul className="flex flex-wrap gap-x-5 gap-y-1.5 text-sm">
                      {product.variants.map((v) => (
                        <li
                          key={v.id}
                          className={v.inStock ? "" : "text-ink-muted line-through"}
                        >
                          {v.label} —{" "}
                          <span className="font-medium">{formatPaise(v.pricePaise)}</span>
                          {v.subscriberPricePaise != null ? (
                            <span className="text-ink-muted">
                              {" "}
                              / {formatPaise(v.subscriberPricePaise)} sub
                            </span>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  )}

                  {outOfStock > 0 ? (
                    <p className="text-xs text-alert mt-2">
                      {outOfStock} of {product.variants.length} sizes out of stock
                    </p>
                  ) : null}
                </div>

                <Link
                  href={`/admin/products/${product.id}`}
                  className="btn btn-outline btn-sm shrink-0"
                >
                  Edit
                </Link>
              </div>
            </article>
          );
        })}
      </div>
    </>
  );
}
