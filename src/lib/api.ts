import "server-only";
import { draftMode } from "next/headers";
import type { Locale } from "@/i18n/config";
import type {
  BlogCard,
  BlogPost,
  Category,
  HomeBody,
  PageContent,
  ProductCard,
  ProductDetail,
  SectionsBody,
  Settings,
  SitemapEntry,
} from "./types";
import { getAdminToken } from "./admin-session";

export const API_URL = (process.env.API_URL ?? "http://localhost:4000").replace(/\/+$/, "");

/** Every storefront fetch shares this tag so admin edits can revalidate it at once. */
export const CONTENT_TAG = "content";

class ApiError extends Error {
  constructor(public status: number, path: string) {
    super(`API ${status} for ${path}`);
  }
}

async function get<T>(path: string, opts: { revalidate?: number; preview?: boolean } = {}): Promise<T | null> {
  const headers: Record<string, string> = {};
  let init: RequestInit & { next?: { revalidate?: number; tags?: string[] } };
  if (opts.preview) {
    const token = await getAdminToken();
    if (token) headers.Authorization = `Bearer ${token}`;
    init = { headers, cache: "no-store" };
  } else {
    init = { headers, next: { revalidate: opts.revalidate ?? 300, tags: [CONTENT_TAG] } };
  }
  const res = await fetch(`${API_URL}/api/public${path}`, init);
  if (res.status === 404) return null;
  if (!res.ok) throw new ApiError(res.status, path);
  return (await res.json()) as T;
}

const q = (params: Record<string, string | number | undefined>) => {
  const s = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== "") s.set(k, String(v));
  return s.toString();
};

async function isPreview() {
  try {
    return (await draftMode()).isEnabled;
  } catch {
    return false;
  }
}

export const api = {
  settings: () => get<Settings>("/settings"),
  homePage: (locale: Locale) => get<PageContent<HomeBody>>(`/pages/home?${q({ locale })}`),
  page: (key: "about" | "contact", locale: Locale) =>
    get<PageContent<SectionsBody & { intro?: string }>>(`/pages/${key}?${q({ locale })}`),
  categories: async (locale: Locale) => (await get<Category[]>(`/categories?${q({ locale })}`)) ?? [],
  category: (slug: string, locale: Locale, sort?: string, page?: number) =>
    get<{
      category: Category;
      products: ProductCard[];
      pagination: { page: number; pageSize: number; total: number; totalPages: number };
      sort: string;
      blogPosts: BlogCard[];
    }>(`/categories/${encodeURIComponent(slug)}?${q({ locale, sort, page })}`),
  featured: async (locale: Locale, limit = 8) =>
    (await get<ProductCard[]>(`/products?${q({ locale, featured: 1, limit })}`)) ?? [],
  product: async (slug: string, locale: Locale) => {
    const preview = await isPreview();
    return get<{ product: ProductDetail; related: ProductCard[]; blogPosts: BlogCard[] }>(
      `/products/${encodeURIComponent(slug)}?${q({ locale, preview: preview ? 1 : undefined })}`,
      { preview },
    );
  },
  search: (query: string, locale: Locale) =>
    get<{ query: string; products: ProductCard[] }>(`/search?${q({ q: query, locale })}`, { revalidate: 60 }),
  blog: (locale: Locale, page = 1) =>
    get<{ posts: BlogCard[]; pagination: { page: number; totalPages: number; total: number } }>(
      `/blog?${q({ locale, page })}`,
    ),
  blogPost: async (slug: string, locale: Locale) => {
    const preview = await isPreview();
    return get<BlogPost>(`/blog/${encodeURIComponent(slug)}?${q({ locale, preview: preview ? 1 : undefined })}`, { preview });
  },
  redirect: (path: string) => get<{ toPath: string }>(`/redirects?${q({ path })}`),
  sitemap: async () => (await get<SitemapEntry[]>("/sitemap", { revalidate: 600 })) ?? [],
};

export { isPreview };
