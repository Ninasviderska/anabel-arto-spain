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
const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw) as CartItem[]);
    } catch {
      /* ignore corrupt storage */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, hydrated]);

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
