import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { isLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { DEFAULT_OG_IMAGE } from "@/lib/og";
import { buildMetadata } from "@/lib/seo";
import { localePath, paths } from "@/lib/site";

type Props = { params: Promise<{ locale: string }>; searchParams: Promise<{ page?: string }> };

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const page = Math.max(1, Number((await searchParams).page) || 1);
  const t = getDictionary(locale);
  const data = await api.blog(locale, page);
  return buildMetadata({
    locale,
    path: page > 1 ? `${paths.blog()}?page=${page}` : paths.blog(),
    title: page > 1 ? `${t.blog.seoTitle} – ${t.category.pageOf(page, data?.pagination.totalPages ?? 1)}` : t.blog.seoTitle,
    description: t.blog.seoDescription,
    // An empty blog index is thin content; keep it out of the index until posts exist.
    robotsIndex: (data?.pagination.total ?? 0) > 0,
    image: DEFAULT_OG_IMAGE,
  });
}

export default async function BlogIndex({ params, searchParams }: Props) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale: Locale = raw;
  const t = getDictionary(locale);
  const page = Math.max(1, Number((await searchParams).page) || 1);
  const data = await api.blog(locale, page);
  const posts = data?.posts ?? [];
  if (data && page > data.pagination.totalPages) notFound();

  return (
    <div className="container">
      <Breadcrumbs locale={locale} items={[{ name: t.blog.title, path: paths.blog() }]} />
      <header className="page-header">
        <h1>{t.blog.h1}</h1>
        <p className="lead">{t.blog.intro}</p>
      </header>
      {posts.length === 0 ? (
        <p className="empty-state">{t.blog.empty}</p>
      ) : (
        <ul className="post-grid">
          {posts.map((post) => {
            // Untranslated posts link straight to the language they exist in.
            const postLocale = post.locales.includes(locale) ? locale : post.locales[0];
            const href = localePath(postLocale, paths.blogPost(post.slug));
            return (
              <li key={post.slug}>
                <article className="post-card">
                  {post.image && (
                    <div className="post-hero">
                      <Image src={post.image.url} alt={post.image.alt} fill sizes="(max-width: 700px) 100vw, 380px" style={{ objectFit: "cover" }} />
                    </div>
                  )}
                  <h2 className="h3-size">
                    <Link href={href} hrefLang={postLocale === "ta" ? "ta-IN" : "en-IN"}>
                      {post.title}
                    </Link>
                  </h2>
                  <p className="post-meta">
                    {post.publishedAt && <time dateTime={post.publishedAt}>{formatDate(post.publishedAt, locale)}</time>}
                    {post.category && <span>{post.category.name}</span>}
                  </p>
                  {post.excerpt && <p>{post.excerpt}</p>}
                  <Link href={href} aria-label={`${t.actions.readMore}: ${post.title}`}>
                    {t.actions.readMore} →
                  </Link>
                </article>
              </li>
            );
          })}
        </ul>
      )}
      {data && data.pagination.totalPages > 1 && (
        <nav className="pagination" aria-label={t.category.pageOf(page, data.pagination.totalPages)}>
          {page > 1 ? <Link href={`${localePath(locale, paths.blog())}${page > 2 ? `?page=${page - 1}` : ""}`}>← {t.category.previous}</Link> : <span />}
          <span>{t.category.pageOf(page, data.pagination.totalPages)}</span>
          {page < data.pagination.totalPages ? <Link href={`${localePath(locale, paths.blog())}?page=${page + 1}`}>{t.category.next} →</Link> : <span />}
        </nav>
      )}
    </div>
  );
}
