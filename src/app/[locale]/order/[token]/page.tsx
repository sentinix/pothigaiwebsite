import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PurchaseTracker } from "@/components/cart/PurchaseTracker";
import { isLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { API_URL } from "@/lib/api";
import { formatPrice } from "@/lib/format";
import { localePath } from "@/lib/site";
import type { OrderConfirmation } from "@/lib/types";

type Props = { params: Promise<{ locale: string; token: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = getDictionary(locale === "ta" ? "ta" : "en");
  return { title: { absolute: `${t.order.thanks} | ${t.brand}` }, robots: { index: false, follow: false } };
}

export default async function OrderPage({ params }: Props) {
  const { locale: raw, token } = await params;
  if (!isLocale(raw) || !/^[A-Za-z0-9_-]{20,64}$/.test(token)) notFound();
  const locale: Locale = raw;
  const t = getDictionary(locale);
  const res = await fetch(`${API_URL}/api/public/orders/${token}`, { cache: "no-store" });
  if (res.status === 404) notFound();
  if (!res.ok) throw new Error("Order lookup failed");
  const order = (await res.json()) as OrderConfirmation;

  return (
    <div className="container">
      <header className="page-header">
        <h1>{t.order.thanks}</h1>
        <p className="lead">{t.order.received}</p>
      </header>
      <div className="summary-box" style={{ maxWidth: 560 }}>
        <p>
          {t.order.number}: <strong>{order.orderNumber}</strong>
        </p>
        <h2 className="h3-size">{t.order.items}</h2>
        <ul className="cart-lines">
          {order.items.map((i) => (
            <li key={i.sku} style={{ display: "flex", justifyContent: "space-between", gap: 8, padding: "6px 0" }}>
              <span>
                {i.name} × {i.quantity}
              </span>
              <span>{formatPrice(i.lineTotal, locale)}</span>
            </li>
          ))}
        </ul>
        <dl>
          <dt>{t.cart.subtotal}</dt>
          <dd>{formatPrice(order.subtotal, locale)}</dd>
          <dt>{t.cart.shipping}</dt>
          <dd>{Number(order.shippingFee) > 0 ? formatPrice(order.shippingFee, locale) : t.cart.free}</dd>
          <dt className="summary-total">{t.cart.total}</dt>
          <dd className="summary-total">{formatPrice(order.total, locale)}</dd>
        </dl>
        <p className="muted small">{t.checkout.cod}</p>
      </div>
      <p className="section">
        <Link href={localePath(locale, "/")} className="btn btn-primary">
          {t.actions.continueShopping}
        </Link>
      </p>
      <PurchaseTracker token={token} order={order} />
    </div>
  );
}
