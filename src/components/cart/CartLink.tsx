"use client";
import Link from "next/link";
import type { Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { localePath, paths } from "@/lib/site";
import { useCart } from "./CartProvider";

export function CartLink({ locale }: { locale: Locale }) {
  const { count } = useCart();
  const t = getDictionary(locale);
  return (
    <Link href={localePath(locale, paths.cart())} className="cart-link" aria-label={t.cart.count(count)} prefetch={false}>
      <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M3 4h2l2.4 11.2a1 1 0 0 0 1 .8h9.2a1 1 0 0 0 1-.8L20 8H6.2" />
        <circle cx="9" cy="20" r="1.4" />
        <circle cx="17" cy="20" r="1.4" />
      </svg>
      <span className="cart-label">{t.nav.cart}</span>
      <span className="cart-count" aria-hidden="true">
        {count}
      </span>
    </Link>
  );
}
