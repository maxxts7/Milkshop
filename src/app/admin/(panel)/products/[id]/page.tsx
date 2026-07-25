import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { products, variants } from "@/lib/db/schema";
import { toRupees } from "@/lib/money";
import {
  saveProduct,
  saveVariants,
  addVariant,
  deleteVariant,
} from "../../../actions";

export const metadata: Metadata = {
  title: "Edit product",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function EditProduct({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const productId = Number(id);
  if (!Number.isInteger(productId)) notFound();

  const [product] = await db
    .select()
    .from(products)
    .where(eq(products.id, productId))
    .limit(1);
  if (!product) notFound();

  const rows = await db
    .select()
    .from(variants)
    .where(eq(variants.productId, product.id))
    .orderBy(asc(variants.sortOrder));

  return (
    <>
      <Link
        href="/admin/products"
        className="text-xs tracking-[0.08em] uppercase text-ink-muted hover:text-ink"
      >
        ← All products
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-4 mt-4 mb-8">
        <h1 className="font-display text-3xl">{product.name}</h1>
        <Link
          href={`/product/${product.slug}`}
          target="_blank"
          className="text-xs underline underline-offset-2 text-ink-muted"
        >
          View on shop ↗
        </Link>
      </div>

      <div className="grid lg:grid-cols-2 gap-8 items-start">
        {/* ---------------------------------------------------- details */}
        <section className="bg-paper border border-rule p-5">
          <h2 className="font-display text-xl mb-5">Details</h2>
          <form action={saveProduct} className="space-y-4">
            <input type="hidden" name="productId" value={product.id} />

            <div>
              <label className="label" htmlFor="p-name">Name</label>
              <input id="p-name" name="name" className="field" defaultValue={product.name} required />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="label" htmlFor="p-house">Brand / house</label>
                <select
                  id="p-house"
                  name="house"
                  className="field"
                  defaultValue={product.house}
                >
                  <option>Milk House</option>
                  <option>Honey House</option>
                  <option>Khanams Grassfed</option>
                </select>
              </div>
              <div>
                <label className="label" htmlFor="p-kind">Type</label>
                <select id="p-kind" name="kind" className="field" defaultValue={product.kind}>
                  <option value="fresh">Fresh — Srinagar only</option>
                  <option value="dry">Pantry — ships pan-India</option>
                </select>
              </div>
            </div>

            <div>
              <label className="label" htmlFor="p-tagline">Tagline</label>
              <input
                id="p-tagline"
                name="tagline"
                className="field"
                defaultValue={product.tagline ?? ""}
              />
            </div>

            <div>
              <label className="label" htmlFor="p-description">Description</label>
              <textarea
                id="p-description"
                name="description"
                className="field min-h-32"
                defaultValue={product.description ?? ""}
              />
            </div>

            <div>
              <label className="label" htmlFor="p-image">Main image path</label>
              <input
                id="p-image"
                name="image"
                className="field"
                defaultValue={product.image ?? ""}
                placeholder="/images/products/example.jpg"
              />
              <p className="text-xs text-ink-muted mt-1.5 leading-relaxed">
                Upload the file into <code>public/images/products/</code> in the
                repository, then put its path here.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-4 items-end">
              <div>
                <label className="label" htmlFor="p-status">Status</label>
                <select
                  id="p-status"
                  name="status"
                  className="field"
                  defaultValue={product.status}
                >
                  <option value="active">Active — on sale</option>
                  <option value="coming_soon">Coming soon — waiting list</option>
                  <option value="hidden">Hidden — off the site</option>
                </select>
              </div>
              <label className="flex items-center gap-2.5 text-sm pb-3">
                <input
                  type="checkbox"
                  name="subscribable"
                  defaultChecked={product.subscribable}
                  className="h-4 w-4"
                />
                Can be subscribed to
              </label>
            </div>

            <button type="submit" className="btn btn-solid btn-sm">
              Save details
            </button>
          </form>
        </section>

        {/* --------------------------------------------------- variants */}
        <section className="bg-paper border border-rule p-5">
          <h2 className="font-display text-xl mb-1">Sizes &amp; prices</h2>
          <p className="text-xs text-ink-muted mb-5">
            Prices in rupees. Leave the subscriber price empty to charge the
            normal price on subscriptions.
          </p>

          {rows.length > 0 ? (
            <form action={saveVariants} className="space-y-4 mb-6">
              <input type="hidden" name="productId" value={product.id} />

              {rows.map((v) => (
                <div key={v.id} className="border border-rule p-4">
                  <input type="hidden" name="variantId" value={v.id} />

                  <div className="grid sm:grid-cols-[1fr_6rem_6rem] gap-3 mb-3">
                    <div>
                      <label className="label" htmlFor={`label_${v.id}`}>Size</label>
                      <input
                        id={`label_${v.id}`}
                        name={`label_${v.id}`}
                        className="field"
                        defaultValue={v.label}
                        required
                      />
                    </div>
                    <div>
                      <label className="label" htmlFor={`price_${v.id}`}>Price ₹</label>
                      <input
                        id={`price_${v.id}`}
                        name={`price_${v.id}`}
                        type="number"
                        min="0"
                        step="0.01"
                        className="field"
                        defaultValue={toRupees(v.pricePaise)}
                        required
                      />
                    </div>
                    <div>
                      <label className="label" htmlFor={`subPrice_${v.id}`}>Sub ₹</label>
                      <input
                        id={`subPrice_${v.id}`}
                        name={`subPrice_${v.id}`}
                        type="number"
                        min="0"
                        step="0.01"
                        className="field"
                        defaultValue={
                          v.subscriberPricePaise != null
                            ? toRupees(v.subscriberPricePaise)
                            : ""
                        }
                      />
                    </div>
                  </div>

                  <label className="flex items-center gap-2.5 text-sm">
                    <input
                      type="checkbox"
                      name={`inStock_${v.id}`}
                      defaultChecked={v.inStock}
                      className="h-4 w-4"
                    />
                    In stock
                  </label>
                </div>
              ))}

              <button type="submit" className="btn btn-solid btn-sm">
                Save all sizes
              </button>
            </form>
          ) : (
            <p className="text-sm text-ink-muted mb-6">
              No sizes yet — add the first one below.
            </p>
          )}

          {/* Separate forms: nesting a form inside a form is invalid HTML. */}
          {rows.length > 0 ? (
            <div className="flex flex-wrap gap-2 mb-6 pb-6 border-b border-rule">
              {rows.map((v) => (
                <form key={v.id} action={deleteVariant}>
                  <input type="hidden" name="variantId" value={v.id} />
                  <input type="hidden" name="productId" value={product.id} />
                  <button
                    type="submit"
                    className="text-xs text-ink-muted hover:text-alert underline underline-offset-2"
                  >
                    Delete &ldquo;{v.label}&rdquo;
                  </button>
                </form>
              ))}
            </div>
          ) : null}

          <form action={addVariant}>
            <input type="hidden" name="productId" value={product.id} />
            <p className="label">Add a size</p>
            <div className="grid grid-cols-[1fr_7rem_auto] gap-2">
              <input
                name="newLabel"
                className="field"
                placeholder="e.g. 750 ml"
                required
                aria-label="New size label"
              />
              <input
                name="newPrice"
                type="number"
                min="0"
                step="0.01"
                className="field"
                placeholder="₹"
                required
                aria-label="New size price"
              />
              <button type="submit" className="btn btn-outline btn-sm">
                Add
              </button>
            </div>
          </form>
        </section>
      </div>
    </>
  );
}
