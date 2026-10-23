// JSON-LD builders. All values come from API data that is also rendered on the
// page, so structured data always matches visible content. No ratings or
// reviews are emitted because none are collected.
import { HREFLANG, type Locale } from "@/i18n/config";
import { absoluteUrl, SITE_URL } from "./site";
import type { BlogPost, ProductDetail, Settings } from "./types";

export type Json = Record<string, unknown>;

/** Serialises JSON for a <script> tag; escapes characters that could close the tag. */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

const ORG_ID = `${SITE_URL}/#organization`;
const SITE_ID = `${SITE_URL}/#website`;

export function organizationLd(settings: Settings | null): Json {
  const org: Json = {
    "@type": "Organization",
    "@id": ORG_ID,
    name: "Pothigai Naturals",
    alternateName: "பொத்திகை நேச்சுரல்ஸ்",
    url: absoluteUrl("en", "/"),
    logo: { "@type": "ImageObject", url: `${SITE_URL}/logo.png`, width: 512, height: 512 },
    slogan: "Nature's Goodness. Tradition in Every Bite.",
  };
  // Contact details are only published when the business has entered them.
  if (settings?.contactEmail) org.email = settings.contactEmail;
  if (settings?.contactPhone) org.telephone = settings.contactPhone;
  if (settings?.address) {
    org.address = {
      "@type": "PostalAddress",
      streetAddress: settings.address.streetAddress,
      addressLocality: settings.address.addressLocality ?? undefined,
      addressRegion: settings.address.addressRegion ?? undefined,
      postalCode: settings.address.postalCode ?? undefined,
      addressCountry: "IN",
    };
  }
  if (settings?.socialLinks?.length) org.sameAs = settings.socialLinks;
  return org;
}

export function homeLd(settings: Settings | null, locale: Locale): Json {
  return {
    "@context": "https://schema.org",
    "@graph": [
      organizationLd(settings),
      {
        "@type": "WebSite",
        "@id": SITE_ID,
        url: absoluteUrl("en", "/"),
        name: "Pothigai Naturals",
        alternateName: "பொத்திகை நேச்சுரல்ஸ்",
        inLanguage: [HREFLANG.en, HREFLANG.ta],
        publisher: { "@id": ORG_ID },
      },
      {
        "@type": "WebPage",
        "@id": `${absoluteUrl(locale, "/")}#webpage`,
        url: absoluteUrl(locale, "/"),
        inLanguage: HREFLANG[locale],
        isPartOf: { "@id": SITE_ID },
      },
    ],
  };
}

export interface Crumb {
  name: string;
  path: string;
}

export function breadcrumbLd(locale: Locale, crumbs: Crumb[]): Json {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      item: absoluteUrl(locale, c.path),
    })),
  };
}

const plain = (s: string) => s.replace(/[#*_`>[\]]/g, "").replace(/\s+/g, " ").trim();

export function productLd(product: ProductDetail, url: string, locale: Locale): Json {
  const data: Json = {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${url}#product`,
    name: product.name,
    sku: product.sku,
    url,
    inLanguage: HREFLANG[locale],
    category: product.category.name,
    description: plain(product.description ?? product.shortDescription ?? product.seo.description),
    offers: {
      "@type": "Offer",
      url,
      price: product.effectivePrice,
      priceCurrency: product.currency,
      availability: product.inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
      seller: { "@id": ORG_ID, "@type": "Organization", name: "Pothigai Naturals" },
    },
  };
  if (product.images.length) data.image = product.images.map((i) => i.url);
  return data;
}

export function blogPostingLd(post: BlogPost, url: string, locale: Locale): Json {
  const isBrand = post.authorName.trim().toLowerCase() === "pothigai naturals";
  const data: Json = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "@id": `${url}#article`,
    headline: post.title,
    description: post.seo.description,
    url,
    mainEntityOfPage: url,
    inLanguage: HREFLANG[locale],
    datePublished: post.publishedAt ?? post.updatedAt,
    dateModified: post.updatedAt,
    author: isBrand ? { "@id": ORG_ID, "@type": "Organization", name: "Pothigai Naturals" } : { "@type": "Person", name: post.authorName },
    publisher: { "@id": ORG_ID, "@type": "Organization", name: "Pothigai Naturals", logo: { "@type": "ImageObject", url: `${SITE_URL}/logo.png` } },
  };
  if (post.image) data.image = [post.image.url];
  return data;
}
