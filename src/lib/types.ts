// Shapes returned by the Pothigai Naturals public API (see backend serializers).
import type { Locale } from "@/i18n/config";

export interface ImageData {
  url: string;
  alt: string;
  width?: number | null;
  height?: number | null;
}

export interface SeoData {
  title: string;
  description: string;
  robotsIndex: boolean;
  canonicalOverride: string | null;
}

export interface ProductCard {
  id: string;
  slug: string;
  sku: string;
  name: string;
  category: { slug: string; name: string };
  shortDescription: string | null;
  price: string;
  salePrice: string | null;
  effectivePrice: string;
  currency: string;
  inStock: boolean;
  maxQuantity: number;
  pack: string | null;
  image: ImageData | null;
}

export interface ProductDetail extends ProductCard {
  nameEn: string;
  description: string | null;
  images: ImageData[];
  details: {
    grade: string | null;
    ingredients: string | null;
    origin: string | null;
    extractionMethod: string | null;
    storage: string | null;
    cooking: string | null;
    allergens: string | null;
    shippingInfo: string | null;
  };
  locales: Locale[];
  translationFallback: boolean;
  seo: SeoData;
  updatedAt: string;
}

export interface Category {
  id: string;
  slug: string;
  name: string;
  h1: string;
  intro: string | null;
  faqs: { q: string; a: string }[];
  image: ImageData | null;
  locales: Locale[];
  translationFallback: boolean;
  seo: SeoData;
  updatedAt: string;
  productCount?: number;
}

export interface BlogCard {
  slug: string;
  title: string;
  excerpt: string | null;
  authorName: string;
  image: ImageData | null;
  category: { slug: string; name: string } | null;
  publishedAt: string | null;
  updatedAt: string;
  locales: Locale[];
}

export interface BlogPost extends BlogCard {
  body: string | null;
  readingMinutes: number | null;
  relatedProducts: ProductCard[];
  seo: SeoData;
}

export interface PageContent<T> {
  key: string;
  locale: Locale;
  seoTitle: string;
  metaDescription: string;
  h1: string;
  body: T;
  robotsIndex: boolean;
  locales: Locale[];
  translationFallback: boolean;
  updatedAt: string;
}

export interface HomeBody {
  tagline: string;
  intro: string;
  sections: { heading: string; body: string; categorySlugs: string[] }[];
  featuredHeading: string;
  whyHeading: string;
  whyPoints: string[];
  ctaHeading: string;
  ctaBody: string;
}

export interface SectionsBody {
  sections: { heading: string; body: string }[];
}

export interface Settings {
  contactEmail: string | null;
  contactPhone: string | null;
  whatsappNumber: string | null;
  address: { streetAddress: string; addressLocality: string | null; addressRegion: string | null; postalCode: string | null } | null;
  deliveryInfo: Record<Locale, string | null>;
  returnPolicy: Record<Locale, string | null>;
  flatShippingFee: string;
  codEnabled: boolean;
  socialLinks: string[];
}

export interface SitemapEntry {
  path: string;
  locales: Locale[];
  lastModified: string;
}

export interface OrderConfirmation {
  orderNumber: string;
  status: string;
  paymentMethod: string;
  subtotal: string;
  shippingFee: string;
  total: string;
  currency: string;
  createdAt: string;
  items: { productId: string; sku: string; name: string; category: string; unitPrice: string; quantity: number; lineTotal: string }[];
}
