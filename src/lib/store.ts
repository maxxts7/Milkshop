import "server-only";
import { cache } from "react";
import { and, asc, eq, inArray } from "drizzle-orm";
import { db } from "./db";
import {
  products,
  variants,
  settings as settingsTable,
  deliveryPincodes,
  type Product,
  type Variant,
  type Settings,
} from "./db/schema";

export type ProductWithVariants = Product & { variants: Variant[] };

/**
 * `cache` dedupes within a single render pass, so a page that reads settings in
 * the header, the banner and the checkout still makes one query.
 */
export const getSettings = cache(async (): Promise<Settings> => {
  const [row] = await db.select().from(settingsTable).limit(1);
  if (row) return row;

  // First boot before the seed has run.
  const [created] = await db.insert(settingsTable).values({ id: 1 }).returning();
  return created;
});

function attachVariants(
  rows: Product[],
  allVariants: Variant[],
): ProductWithVariants[] {
  const byProduct = new Map<number, Variant[]>();
  for (const v of allVariants) {
    const list = byProduct.get(v.productId) ?? [];
    list.push(v);
    byProduct.set(v.productId, list);
  }
  return rows.map((p) => ({
    ...p,
    variants: (byProduct.get(p.id) ?? []).sort((a, b) => a.sortOrder - b.sortOrder),
  }));
}

export const getCatalogue = cache(async (): Promise<ProductWithVariants[]> => {
  const rows = await db
    .select()
    .from(products)
    .where(inArray(products.status, ["active", "coming_soon"]))
    .orderBy(asc(products.sortOrder), asc(products.id));

  if (rows.length === 0) return [];

  const allVariants = await db
    .select()
    .from(variants)
    .where(
      inArray(
        variants.productId,
        rows.map((r) => r.id),
      ),
    )
    .orderBy(asc(variants.sortOrder));

  return attachVariants(rows, allVariants);
});

/** Every product including hidden ones — admin only. */
export async function getAllProducts(): Promise<ProductWithVariants[]> {
  const rows = await db
    .select()
    .from(products)
    .orderBy(asc(products.sortOrder), asc(products.id));

  if (rows.length === 0) return [];

  const allVariants = await db
    .select()
    .from(variants)
    .orderBy(asc(variants.sortOrder));

  return attachVariants(rows, allVariants);
}

export const getProductBySlug = cache(
  async (slug: string): Promise<ProductWithVariants | null> => {
    const [row] = await db
      .select()
      .from(products)
      .where(eq(products.slug, slug))
      .limit(1);

    if (!row || row.status === "hidden") return null;

    const rowVariants = await db
      .select()
      .from(variants)
      .where(eq(variants.productId, row.id))
      .orderBy(asc(variants.sortOrder));

    return { ...row, variants: rowVariants };
  },
);

export const getServiceablePincodes = cache(async (): Promise<string[]> => {
  const rows = await db
    .select({ pincode: deliveryPincodes.pincode })
    .from(deliveryPincodes)
    .where(eq(deliveryPincodes.active, true));
  return rows.map((r) => r.pincode);
});

export async function isPincodeServiceable(pincode: string): Promise<boolean> {
  const [row] = await db
    .select({ id: deliveryPincodes.id })
    .from(deliveryPincodes)
    .where(
      and(
        eq(deliveryPincodes.pincode, pincode.trim()),
        eq(deliveryPincodes.active, true),
      ),
    )
    .limit(1);
  return Boolean(row);
}

/** Cheapest in-stock variant — what the catalogue card shows as "from ₹x". */
export function entryPrice(p: ProductWithVariants): number | null {
  const available = p.variants.filter((v) => v.inStock);
  const pool = available.length > 0 ? available : p.variants;
  if (pool.length === 0) return null;
  return Math.min(...pool.map((v) => v.pricePaise));
}

export function isSoldOut(p: ProductWithVariants): boolean {
  if (p.status === "coming_soon") return true;
  if (p.variants.length === 0) return true;
  return p.variants.every((v) => !v.inStock);
}
