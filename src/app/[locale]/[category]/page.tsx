import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ProductGrid } from "@/components/ProductCard";
import { Paragraphs } from "@/components/Paragraphs";
import { TrackEvent } from "@/components/TrackEvent";
import { isLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { redirectOrNotFound } from "@/lib/redirects";
import { DEFAULT_OG_IMAGE } from "@/lib/og";
import { buildMetadata } from "@/lib/seo";
import { localePath, paths } from "@/lib/site";

type Props = {
  params: Promise<{ locale: string; category: string }>;
  searchParams: Promise<{ sort?: string; page?: string }>;
};

const SORTS = ["featured", "newest", "price-asc", "price-desc", "name"];

function parsePage(raw: string | undefined) {
  const n = Number(raw ?? 1);
  return Number.isInteger(n) && n >= 1 ? n : 1;
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { locale, category } = await params;
  const { page: rawPage } = await searchParams;
  if (!isLocale(locale)) return {};
  const page = parsePage(rawPage);
  const data = await api.category(category, locale, undefined, page);
  if (!data) return {};
  const c = data.category;
  const t = getDictionary(locale);
  // Sorting never changes the canonical; pagination keeps a self-referencing canonical per page.
  const path = page > 1 ? `${paths.category(c.slug)}?page=${page}` : paths.category(c.slug);
  return buildMetadata({
    locale,
    path,
    title: page > 1 ? `${c.seo.title} – ${t.category.pageOf(page, data.pagination.totalPages)}` : c.seo.title,
    description: c.seo.description,
    locales: c.locales,
    robotsIndex: c.seo.robotsIndex,
    canonicalOverride: page > 1 ? null : c.seo.canonicalOverride,
    image: c.image ?? DEFAULT_OG_IMAGE,
  });
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { locale: raw, category: slug } = await params;
  const sp = await searchParams;
  if (!isLocale(raw)) notFound();
  const locale: Locale = raw;
  const t = getDictionary(locale);
  const sort = sp.sort && SORTS.includes(sp.sort) ? sp.sort : "featured";
  const page = parsePage(sp.page);

  const [data, categories] = await Promise.all([api.category(slug, locale, sort, page), api.categories(locale)]);
  if (!data) return redirectOrNotFound(locale, paths.category(slug));
  const { category, products, pagination, blogPosts } = data;
  if (page > pagination.totalPages) notFound();

  const base = localePath(locale, paths.category(category.slug));
  const pageHref = (p: number) => {
    const q = new URLSearchParams();
    if (sort !== "featured") q.set("sort", sort);
    if (p > 1) q.set("page", String(p));
    const s = q.toString();
    return s ? `${base}?${s}` : base;
  };

  return (
    <div className="container">
      <Breadcrumbs locale={locale} items={[{ name: category.name, path: paths.category(category.slug) }]} />
      <header className="page-header">
        <h1>{category.h1}</h1>
        {category.translationFallback && <p className="notice">{t.product.translationFallback}</p>}
        <div className="lead">
          <Paragraphs text={category.intro} />
        </div>
      </header>

      <section aria-labelledby="products-heading">
        <h2 id="products-heading" className="visually-hidden">
          {category.name}
        </h2>
        {pagination.total > 0 ? (
          <>
            <div className="toolbar">
              <span className="muted">{t.category.productCount(pagination.total)}</span>
              <span id="sort-label">{t.category.sortBy}:</span>
              <ul className="sort-links" aria-labelledby="sort-label">
                {SORTS.map((s) => {
                  const href = s === "featured" ? base : `${base}?sort=${s}`;
                  return (
                    <li key={s}>
                      <Link href={href} rel="nofollow" aria-current={s === sort ? "true" : undefined} scroll={false}>
                        {t.category.sorts[s]}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
            <ProductGrid products={products} locale={locale} />
            <TrackEvent
              name="view_item_list"
              params={{
                item_list_id: category.slug,
                item_list_name: category.name,
                items: products.map((p, i) => ({
                  item_id: p.sku,
                  item_name: p.name,
                  item_category: category.name,
                  price: Number(p.effectivePrice),
                  index: (page - 1) * pagination.pageSize + i,
                })),
              }}
            />
            {pagination.totalPages > 1 && (
              <nav className="pagination" aria-label={t.category.pageOf(page, pagination.totalPages)}>
                {page > 1 ? <Link href={pageHref(page - 1)}>← {t.category.previous}</Link> : <span />}
                <span>{t.category.pageOf(page, pagination.totalPages)}</span>
                {page < pagination.totalPages ? <Link href={pageHref(page + 1)}>{t.category.next} →</Link> : <span />}
              </nav>
            )}
          </>
        ) : (
          <p className="empty-state">{t.category.empty}</p>
        )}
      </section>

      {category.faqs.length > 0 && (
        <section className="section faq" aria-labelledby="faq-heading">
          <h2 id="faq-heading">{t.category.faqTitle}</h2>
          {category.faqs.map((f) => (
            <details key={f.q}>
              <summary>
                <h3>{f.q}</h3>
              </summary>
              <p>{f.a}</p>
            </details>
          ))}
        </section>
      )}

      {blogPosts.length > 0 && (
        <section className="section" aria-labelledby="blog-heading">
          <h2 id="blog-heading">{t.category.fromBlog}</h2>
          <ul className="post-grid">
            {blogPosts.map((b) => (
              <li key={b.slug}>
                <article className="post-card">
                  <h3>
                    <Link href={localePath(locale, paths.blogPost(b.slug))}>{b.title}</Link>
                  </h3>
                  {b.publishedAt && <p className="post-meta">{formatDate(b.publishedAt, locale)}</p>}
                  {b.excerpt && <p>{b.excerpt}</p>}
                </article>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="section" aria-labelledby="other-heading">
        <h2 id="other-heading">{t.category.otherCategories}</h2>
        <ul className="pill-links">
          {categories
            .filter((c) => c.slug !== category.slug)
            .map((c) => (
              <li key={c.slug}>
                <Link href={localePath(locale, paths.category(c.slug))}>{c.name}</Link>
              </li>
            ))}
        </ul>
      </section>
    </div>
  );
}
