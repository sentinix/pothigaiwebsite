import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CheckoutForm } from "@/components/cart/CheckoutForm";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { api } from "@/lib/api";
import { noindexMetadata } from "@/lib/seo";
import { paths } from "@/lib/site";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = getDictionary(locale);
  return noindexMetadata(locale, paths.checkout(), `${t.checkout.title} | ${t.brand}`);
}

export default async function CheckoutPage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getDictionary(locale);
  const settings = await api.settings().catch(() => null);
  return (
    <div className="container">
      <header className="page-header">
        <h1>{t.checkout.title}</h1>
      </header>
      <CheckoutForm locale={locale} shippingFee={Number(settings?.flatShippingFee ?? 0)} codEnabled={settings?.codEnabled ?? true} />
    </div>
  );
}
