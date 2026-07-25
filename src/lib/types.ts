/** Shape returned by POST /api/cart/price — shared by the cart and checkout views. */

export interface PricedLineDto {
  variantId: number;
  quantity: number;
  productName: string;
  productSlug: string;
  house: string;
  kind: "fresh" | "dry";
  variantLabel: string;
  image: string | null;
  unitPricePaise: number;
  lineTotalPaise: number;
}

export interface CartPriceDto {
  lines: PricedLineDto[];
  removed: { label: string; reason: string }[];
  subtotalPaise: number;
  itemCount: number;
  hasFresh: boolean;
  hasDry: boolean;
  delivery: {
    zone: "srinagar" | "india" | "pickup";
    fulfilment: "delivery" | "pickup";
    serviceable: boolean;
    pincodeGiven: boolean;
    blocked: string | null;
    feePaise: number;
    freeThresholdPaise: number | null;
    remainingForFreePaise: number | null;
  };
  totalPaise: number;
  cutoff: {
    cutoffAt: number;
    deliveryDate: string;
    deliveryDateLabel: string;
    slot: string;
    missedToday: boolean;
  } | null;
  ordersPaused: boolean;
}
