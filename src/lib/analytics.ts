"use client";
// GA4 e-commerce events. Calls are no-ops unless NEXT_PUBLIC_GA_MEASUREMENT_ID
// is configured (the gtag script is only loaded then). Only product and order
// data are sent — never names, phone numbers, emails or addresses.

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

export interface AnalyticsItem {
  item_id: string;
  item_name: string;
  item_category?: string;
  price: number;
  quantity?: number;
}

export function track(event: string, params: Record<string, unknown>) {
  if (typeof window === "undefined" || typeof window.gtag !== "function") return;
  window.gtag("event", event, params);
}

export function toItem(p: { sku: string; name: string; category?: { name: string } | string; effectivePrice?: string; price?: string | number }, quantity?: number): AnalyticsItem {
  return {
    item_id: p.sku,
    item_name: p.name,
    item_category: typeof p.category === "string" ? p.category : p.category?.name,
    price: Number(p.effectivePrice ?? p.price ?? 0),
    ...(quantity ? { quantity } : {}),
  };
}
