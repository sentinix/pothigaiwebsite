export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/+$/, "");

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
