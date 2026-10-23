// On Vercel, fall back to the project's production domain when NEXT_PUBLIC_SITE_URL is unset.
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000")
).replace(/\/+$/, "");

/**
 * True for Vercel preview/development deployments. Those must never be
 * indexed, or they would compete with the production site in search results.
 */
export const IS_NON_PRODUCTION_DEPLOYMENT = Boolean(process.env.VERCEL_ENV) && process.env.VERCEL_ENV !== "production";

/** Locale-less paths always start and end with "/" ("/" is the homepage). */
export const paths = {
  home: () => "/",
  category: (slug: string) => `/${slug}/`,
  product: (categorySlug: string, slug: string) => `/${categorySlug}/${slug}/`,
  blog: () => "/blog/",
  blogPost: (slug: string) => `/blog/${slug}/`,
  about: () => "/about/",
  contact: () => "/contact/",
  search: () => "/search/",
  cart: () => "/cart/",
  checkout: () => "/checkout/",
  order: (token: string) => `/order/${token}/`,
};

export function localePath(locale: string, path: string): string {
  return `/${locale}${path}`;
}

export function absoluteUrl(locale: string, path: string): string {
  return `${SITE_URL}${localePath(locale, path)}`;
}
