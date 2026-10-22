"use client";
import { useEffect, useRef } from "react";
import { track } from "@/lib/analytics";
import type { OrderConfirmation } from "@/lib/types";

/**
 * Sends the GA4 purchase event from real order data. The server hands out the
 * right to track exactly once per order, so reloads and revisits never double count.
 */
export function PurchaseTracker({ token, order }: { token: string; order: OrderConfirmation }) {
  const done = useRef(false);
  useEffect(() => {
    if (done.current || typeof window.gtag !== "function") return;
    done.current = true;
    fetch(`/api/store/orders/${encodeURIComponent(token)}/analytics`, { method: "POST" })
      .then((r) => r.json())
      .then((res: { shouldTrack?: boolean }) => {
        if (!res.shouldTrack) return;
        track("purchase", {
          transaction_id: order.orderNumber,
          currency: order.currency,
          value: Number(order.total),
          shipping: Number(order.shippingFee),
          items: order.items.map((i) => ({
            item_id: i.sku,
            item_name: i.name,
            item_category: i.category,
            price: Number(i.unitPrice),
            quantity: i.quantity,
          })),
        });
      })
      .catch(() => undefined);
  }, [token, order]);
  return null;
}
