import type { Metadata } from "next";
import { HREFLANG, LOCALES, OG_LOCALE, type Locale } from "@/i18n/config";
import { absoluteUrl, SITE_URL } from "./site";

export interface PageSeo {
  locale: Locale;
  /** Locale-less path, e.g. "/oils/" */
  path: string;
  title: string;
  description: string;
  /** Locales in which this page genuinely exists (translated). */
  locales?: readonly Locale[];
  robotsIndex?: boolean;
  canonicalOverride?: string | null;
  image?: { url: string; alt: string; width?: number | null; height?: number | null } | null;
  type?: "website" | "article";
  publishedTime?: string | null;
  modifiedTime?: string | null;
}

/**
 * Builds canonical, hreflang, robots and social metadata.
 *
 * - Canonical is the page's own localized URL, unless an editor override is
 *   set or the page is an untranslated fallback (then the English URL).
 * - hreflang alternates (en-IN, ta-IN, x-default → English) are only emitted
 *   for self-canonical pages, and only list locales that really exist.
 */
export function buildMetadata(seo: PageSeo): Metadata {
  const locales = seo.locales ?? LOCALES;
  const isFallback = !locales.includes(seo.locale);
  const ownUrl = absoluteUrl(seo.locale, seo.path);
  const defaultLocale: Locale = locales.includes("en") ? "en" : locales[0] ?? "en";
  const canonical = seo.canonicalOverride || (isFallback ? absoluteUrl(defaultLocale, seo.path) : ownUrl);
  const selfCanonical = canonical === ownUrl;

  const languages: Record<string, string> = {};
  if (selfCanonical && locales.length > 1) {
    for (const l of locales) languages[HREFLANG[l]] = absoluteUrl(l, seo.path);
    languages["x-default"] = absoluteUrl(defaultLocale, seo.path);
  }

  const index = seo.robotsIndex !== false;
  const images = seo.image
    ? [{ url: seo.image.url, alt: seo.image.alt, width: seo.image.width ?? undefined, height: seo.image.height ?? undefined }]
    : undefined;

  return {
    metadataBase: new URL(SITE_URL),
    title: { absolute: seo.title },
    description: seo.description,
    alternates: { canonical, languages: Object.keys(languages).length ? languages : undefined },
    robots: index ? { index: true, follow: true } : { index: false, follow: true },
    openGraph: {
      type: seo.type ?? "website",
      url: canonical,
      title: seo.title,
      description: seo.description,
      siteName: seo.locale === "ta" ? "பொத்திகை நேச்சுரல்ஸ்" : "Pothigai Naturals",
      locale: OG_LOCALE[seo.locale],
      alternateLocale: locales.filter((l) => l !== seo.locale).map((l) => OG_LOCALE[l]),
      ...(images ? { images } : {}),
      ...(seo.type === "article"
        ? { publishedTime: seo.publishedTime ?? undefined, modifiedTime: seo.modifiedTime ?? undefined }
        : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: seo.title,
      description: seo.description,
      ...(images ? { images: images.map((i) => i.url) } : {}),
    },
  };
}

/** Metadata for utility pages (cart, checkout, search, order) that must not be indexed. */
export function noindexMetadata(locale: Locale, path: string, title: string): Metadata {
  return {
    metadataBase: new URL(SITE_URL),
    title: { absolute: title },
    robots: { index: false, follow: true },
    alternates: { canonical: absoluteUrl(locale, path) },
  };
}
