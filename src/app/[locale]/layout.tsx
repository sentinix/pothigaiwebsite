import "@fontsource/noto-sans/latin-400.css";
import "@fontsource/noto-sans/latin-600.css";
import "@fontsource/noto-sans/latin-700.css";
import "@fontsource/noto-sans-tamil/tamil-400.css";
import "@fontsource/noto-sans-tamil/tamil-600.css";
import "@fontsource/noto-serif/latin-600.css";
import "@fontsource/noto-serif/latin-700.css";
import "@fontsource/noto-serif-tamil/tamil-600.css";
import "@fontsource/noto-serif-tamil/tamil-700.css";
import "../globals.css";
import type { Metadata, Viewport } from "next";
import { draftMode } from "next/headers";
import { notFound } from "next/navigation";
import { CartProvider } from "@/components/cart/CartProvider";
import { GoogleAnalytics } from "@/components/GoogleAnalytics";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { HREFLANG, isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { api } from "@/lib/api";
import { SITE_URL } from "@/lib/site";

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#3f5a36" };

export async function generateMetadata(): Promise<Metadata> {
  return {
    metadataBase: new URL(SITE_URL),
    applicationName: "Pothigai Naturals",
    ...(process.env.GOOGLE_SITE_VERIFICATION ? { verification: { google: process.env.GOOGLE_SITE_VERIFICATION } } : {}),
    formatDetection: { telephone: false },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getDictionary(locale);
  const [categories, settings] = await Promise.all([
    api.categories(locale).catch(() => []),
    api.settings().catch(() => null),
  ]);
  const preview = (await draftMode()).isEnabled;

  return (
    <html lang={HREFLANG[locale]}>
      <body>
        <CartProvider>
          {preview && <div className="preview-banner">{t.preview}</div>}
          <SiteHeader locale={locale} categories={categories} />
          <main id="main" tabIndex={-1}>
            {children}
          </main>
          <SiteFooter locale={locale} categories={categories} settings={settings} />
        </CartProvider>
        <GoogleAnalytics />
      </body>
    </html>
  );
}
