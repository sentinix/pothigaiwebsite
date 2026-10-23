"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { toItem, track } from "@/lib/analytics";

export interface CartLine {
  productId: string;
  sku: string;
  name: string;
  slug: string;
  categorySlug: string;
  categoryName: string;
  price: string;
  quantity: number;
  maxQuantity: number;
  image: { url: string; alt: string } | null;
}

interface CartContextValue {
  lines: CartLine[];
  ready: boolean;
  count: number;
  add: (line: Omit<CartLine, "quantity">, quantity: number) => void;
  setQuantity: (productId: string, quantity: number) => void;
  remove: (productId: string) => void;
  replace: (lines: CartLine[]) => void;
  clear: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "pn_cart_v1";

function load(): CartLine[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as CartLine[]) : [];
    return Array.isArray(parsed) ? parsed.filter((l) => l && typeof l.productId === "string" && l.quantity > 0) : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setLines(load());
    setReady(true);
    const onStorage = (e: StorageEvent) => e.key === STORAGE_KEY && setLines(load());
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
    } catch {
      /* storage unavailable (private mode) — cart still works for this page view */
    }
  }, [lines, ready]);

  const add = useCallback((line: Omit<CartLine, "quantity">, quantity: number) => {
    setLines((prev) => {
      const existing = prev.find((l) => l.productId === line.productId);
      const nextQty = Math.min((existing?.quantity ?? 0) + quantity, line.maxQuantity);
      const rest = prev.filter((l) => l.productId !== line.productId);
      return [...rest, { ...line, quantity: nextQty }];
    });
    track("add_to_cart", {
      currency: "INR",
      value: Number(line.price) * quantity,
      items: [toItem({ sku: line.sku, name: line.name, category: line.categoryName, price: line.price }, quantity)],
    });
  }, []);

  const setQuantity = useCallback((productId: string, quantity: number) => {
    setLines((prev) =>
      prev.map((l) => (l.productId === productId ? { ...l, quantity: Math.max(1, Math.min(quantity, l.maxQuantity)) } : l)),
    );
  }, []);

  const remove = useCallback(
    (productId: string) => {
      const line = lines.find((l) => l.productId === productId);
      if (line)
        track("remove_from_cart", {
          currency: "INR",
          value: Number(line.price) * line.quantity,
          items: [toItem({ sku: line.sku, name: line.name, category: line.categoryName, price: line.price }, line.quantity)],
        });
      setLines((prev) => prev.filter((l) => l.productId !== productId));
    },
    [lines],
  );

  const value = useMemo<CartContextValue>(
    () => ({
      lines,
      ready,
      count: lines.reduce((n, l) => n + l.quantity, 0),
      add,
      setQuantity,
      remove,
      replace: setLines,
      clear: () => setLines([]),
    }),
    [lines, ready, add, setQuantity, remove],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
