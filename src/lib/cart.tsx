import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { shippingFor } from "./shop-config";

export type CartItem = {
  variantId: string;
  productId: string;
  productSlug: string;
  categorySlug: string;
  name: string;
  colorName: string;
  size: string;
  sku: string;
  unitPriceCents: number;
  imageUrl: string | null;
  quantity: number;
};

type CartContextValue = {
  items: CartItem[];
  hydrated: boolean;
  count: number;
  subtotalCents: number;
  shippingCents: number;
  totalCents: number;
  add: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  setQuantity: (variantId: string, quantity: number) => void;
  remove: (variantId: string) => void;
  clear: () => void;
};

const STORAGE_KEY = "anabelarto:cart:v1";
export const CART_TTL_MS = 24 * 60 * 60 * 1000;
const CartContext = createContext<CartContextValue | null>(null);

type Stored = { createdAt: number; items: CartItem[] };

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [createdAt, setCreatedAt] = useState<number | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Stored | CartItem[];
        const stored: Stored = Array.isArray(parsed) ? { createdAt: Date.now(), items: parsed } : parsed;
        if (Date.now() - stored.createdAt < CART_TTL_MS && stored.items.length) {
          setItems(stored.items);
          setCreatedAt(stored.createdAt);
        } else {
          window.localStorage.removeItem(STORAGE_KEY);
        }
      }
    } catch {
      /* ignore corrupt storage */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (items.length === 0) {
      setCreatedAt(null);
      window.localStorage.removeItem(STORAGE_KEY);
      return;
    }
    const ts = createdAt ?? Date.now();
    if (createdAt === null) setCreatedAt(ts);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ createdAt: ts, items } satisfies Stored));
  }, [items, hydrated, createdAt]);

  const add = useCallback((item: Omit<CartItem, "quantity">, quantity = 1) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.variantId === item.variantId);
      if (existing) {
        return prev.map((i) =>
          i.variantId === item.variantId ? { ...i, quantity: Math.min(10, i.quantity + quantity) } : i,
        );
      }
      return [...prev, { ...item, quantity }];
    });
  }, []);

  const setQuantity = useCallback((variantId: string, quantity: number) => {
    setItems((prev) =>
      quantity <= 0
        ? prev.filter((i) => i.variantId !== variantId)
        : prev.map((i) => (i.variantId === variantId ? { ...i, quantity: Math.min(10, quantity) } : i)),
    );
  }, []);

  const remove = useCallback((variantId: string) => {
    setItems((prev) => prev.filter((i) => i.variantId !== variantId));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const value = useMemo<CartContextValue>(() => {
    const subtotalCents = items.reduce((s, i) => s + i.unitPriceCents * i.quantity, 0);
    const shippingCents = shippingFor(subtotalCents);
    return {
      items,
      hydrated,
      count: items.reduce((s, i) => s + i.quantity, 0),
      subtotalCents,
      shippingCents,
      totalCents: subtotalCents + shippingCents,
      add,
      setQuantity,
      remove,
      clear,
    };
  }, [items, hydrated, add, setQuantity, remove, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
