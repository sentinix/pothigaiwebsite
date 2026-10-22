"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { formatPrice } from "@/lib/format";
import { localePath, paths } from "@/lib/site";
import type { ProductCard } from "@/lib/types";
import { ProductImage } from "../ProductImage";
import { useCart, type CartLine } from "./CartProvider";

/** Re-reads live prices and stock so the cart never shows stale data. */
export function useLiveCart(locale: Locale) {
  const { lines, ready, replace } = useCart();
  const [synced, setSynced] = useState(false);
  const [notices, setNotices] = useState<string[]>([]);
  const ids = lines.map((l) => l.productId).sort().join(",");

  useEffect(() => {
    if (!ready) return;
    if (!ids) {
      setSynced(true);
      return;
    }
    let cancelled = false;
    fetch(`/api/store/products?ids=${encodeURIComponent(ids)}&locale=${locale}`)
      .then((r) => (r.ok ? (r.json() as Promise<ProductCard[]>) : Promise.reject()))
      .then((products) => {
        if (cancelled) return;
        const t = getDictionary(locale);
        const msgs: string[] = [];
        const next: CartLine[] = [];
        for (const line of lines) {
          const p = products.find((x) => x.id === line.productId);
          if (!p || !p.inStock || p.maxQuantity < 1) {
            msgs.push(`${line.name}: ${t.cart.unavailable}`);
            continue;
          }
          const quantity = Math.min(line.quantity, p.maxQuantity);
          if (quantity !== line.quantity) msgs.push(`${p.name}: ${t.cart.adjusted}`);
          next.push({
            ...line,
            name: p.name,
            sku: p.sku,
            slug: p.slug,
            categorySlug: p.category.slug,
            categoryName: p.category.name,
            price: p.effectivePrice,
            maxQuantity: p.maxQuantity,
            image: p.image ? { url: p.image.url, alt: p.image.alt } : null,
            quantity,
          });
        }
        const changed = JSON.stringify(next) !== JSON.stringify(lines);
        if (changed) replace(next);
        setNotices(msgs);
        setSynced(true);
      })
      .catch(() => !cancelled && setSynced(true));
    return () => {
      cancelled = true;
    };
    // Only re-sync when the set of products or the language changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, ids, locale]);

  return { lines, ready: ready && synced, notices };
}

export function CartTotals({ subtotal, shippingFee, locale }: { subtotal: number; shippingFee: number; locale: Locale }) {
  const t = getDictionary(locale);
  return (
    <dl>
      <dt>{t.cart.subtotal}</dt>
      <dd>{formatPrice(subtotal, locale)}</dd>
      <dt>{t.cart.shipping}</dt>
      <dd>{shippingFee > 0 ? formatPrice(shippingFee, locale) : t.cart.free}</dd>
      <dt className="summary-total">{t.cart.total}</dt>
      <dd className="summary-total">{formatPrice(subtotal + shippingFee, locale)}</dd>
    </dl>
  );
}

export function CartView({ locale, shippingFee }: { locale: Locale; shippingFee: number }) {
  const t = getDictionary(locale);
  const { setQuantity, remove } = useCart();
  const { lines, ready, notices } = useLiveCart(locale);

  if (!ready) return <p aria-live="polite">{t.cart.loading}</p>;
  if (lines.length === 0) {
    return (
      <div>
        {notices.map((n) => (
          <p key={n} className="notice">
            {n}
          </p>
        ))}
        <p className="empty-state">{t.cart.empty}</p>
        <Link href={localePath(locale, "/")} className="btn btn-primary">
          {t.actions.continueShopping}
        </Link>
      </div>
    );
  }
  const subtotal = lines.reduce((s, l) => s + Number(l.price) * l.quantity, 0);

  return (
    <div className="cart-layout">
      <div>
        <div aria-live="polite">
          {notices.map((n) => (
            <p key={n} className="notice">
              {n}
            </p>
          ))}
        </div>
        <ul className="cart-lines">
          {lines.map((l) => (
            <li key={l.productId} className="cart-line">
              <ProductImage image={l.image} sizes="80px" />
              <div>
                <Link href={localePath(locale, paths.product(l.categorySlug, l.slug))}>{l.name}</Link>
                <p className="muted small" style={{ margin: "2px 0" }}>
                  {formatPrice(l.price, locale)}
                </p>
                <div className="qty" role="group" aria-label={`${t.product.quantity}: ${l.name}`}>
                  <button type="button" aria-label={t.product.decrease} onClick={() => setQuantity(l.productId, l.quantity - 1)} disabled={l.quantity <= 1}>
                    −
                  </button>
                  <output>{l.quantity}</output>
                  <button
                    type="button"
                    aria-label={t.product.increase}
                    onClick={() => setQuantity(l.productId, l.quantity + 1)}
                    disabled={l.quantity >= l.maxQuantity}
                  >
                    +
                  </button>
                </div>
              </div>
              <div className="line-total">
                <strong>{formatPrice(Number(l.price) * l.quantity, locale)}</strong>
                <br />
                <button type="button" className="link-button" onClick={() => remove(l.productId)} aria-label={t.cart.removeItem(l.name)}>
                  {t.cart.remove}
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
      <aside className="summary-box" aria-label={t.checkout.summary}>
        <CartTotals subtotal={subtotal} shippingFee={shippingFee} locale={locale} />
        <Link href={localePath(locale, paths.checkout())} className="btn btn-primary" style={{ width: "100%" }}>
          {t.cart.checkout}
        </Link>
      </aside>
    </div>
  );
}
