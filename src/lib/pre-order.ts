/**
 * Products we only sell on pre-order.
 *
 * Dahi is set by hand from a single morning's milk, so it is never held in
 * stock: the kitchen needs a batch worth making and a week's notice to set it
 * fresh for the delivery date. Keyed by slug because this is a property of how
 * the item is made rather than something the shop changes day to day.
 */

export interface PreOrderTerms {
  /** Smallest batch the kitchen will set. */
  minQuantity: number;
  /** Days of notice required before the delivery date. */
  leadDays: number;
}

const PRE_ORDER_PRODUCTS: Record<string, PreOrderTerms> = {
  "handmade-dahi": { minQuantity: 50, leadDays: 7 },
};

export function getPreOrderTerms(slug: string): PreOrderTerms | null {
  return PRE_ORDER_PRODUCTS[slug] ?? null;
}
