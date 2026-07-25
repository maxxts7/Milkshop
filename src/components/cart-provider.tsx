"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

/**
 * The cart holds variant ids and quantities — nothing else.
 *
 * Prices, names and stock are always resolved server-side (see lib/cart.ts), so
 * a stale localStorage cart can never show a stale price or a withdrawn product.
 */

export interface CartItem {
  variantId: number;
  quantity: number;
}

interface CartContextValue {
  items: CartItem[];
  count: number;
  ready: boolean;
  add: (variantId: number, quantity?: number) => void;
  setQuantity: (variantId: number, quantity: number) => void;
  remove: (variantId: number) => void;
  clear: () => void;
  lastAdded: number | null;
}

const CartContext = createContext<CartContextValue | null>(null);

const STORAGE_KEY = "kg_cart_v1";
const MAX_QTY = 50;

function read(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((i) => ({
        variantId: Number(i?.variantId),
        quantity: Number(i?.quantity),
      }))
      .filter(
        (i) =>
          Number.isInteger(i.variantId) &&
          i.variantId > 0 &&
          Number.isInteger(i.quantity) &&
          i.quantity > 0,
      );
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);
  const [lastAdded, setLastAdded] = useState<number | null>(null);

  // Hydrate after mount — localStorage does not exist during SSR, and reading it
  // in useState would produce a server/client markup mismatch.
  useEffect(() => {
    setItems(read());
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      /* private mode / quota — the cart still works for this page view */
    }
  }, [items, ready]);

  // Keep two open tabs in step.
  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key === STORAGE_KEY) setItems(read());
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const add = useCallback((variantId: number, quantity = 1) => {
    setItems((current) => {
      const existing = current.find((i) => i.variantId === variantId);
      if (existing) {
        return current.map((i) =>
          i.variantId === variantId
            ? { ...i, quantity: Math.min(i.quantity + quantity, MAX_QTY) }
            : i,
        );
      }
      return [...current, { variantId, quantity: Math.min(quantity, MAX_QTY) }];
    });
    setLastAdded(variantId);
  }, []);

  const setQuantity = useCallback((variantId: number, quantity: number) => {
    setItems((current) =>
      quantity <= 0
        ? current.filter((i) => i.variantId !== variantId)
        : current.map((i) =>
            i.variantId === variantId
              ? { ...i, quantity: Math.min(quantity, MAX_QTY) }
              : i,
          ),
    );
  }, []);

  const remove = useCallback((variantId: number) => {
    setItems((current) => current.filter((i) => i.variantId !== variantId));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      count: items.reduce((sum, i) => sum + i.quantity, 0),
      ready,
      add,
      setQuantity,
      remove,
      clear,
      lastAdded,
    }),
    [items, ready, add, setQuantity, remove, clear, lastAdded],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}
