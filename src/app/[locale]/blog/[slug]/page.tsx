import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Markdown } from "@/components/Markdown";
import { ProductGrid } from "@/components/ProductCard";
import { isLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { api, isPreview } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { JsonLd } from "@/components/JsonLd";
import { blogPostingLd } from "@/lib/jsonld";
import { DEFAULT_OG_IMAGE } from "@/lib/og";
import { redirectOrNotFound } from "@/lib/redirects";
import { buildMetadata } from "@/lib/seo";
import { absoluteUrl, localePath, paths } from "@/lib/site";

type Props = { params: Promise<{ locale: string; slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return {};
  const post = await api.blogPost(slug, locale);
  if (!post || !post.locales.includes(locale)) return {};
  return buildMetadata({
    locale,
    path: paths.blogPost(post.slug),
    title: post.seo.title,
    description: post.seo.description,
    locales: post.locales,
    robotsIndex: post.seo.robotsIndex && !(await isPreview()),
    canonicalOverride: post.seo.canonicalOverride,
    image: post.image ?? DEFAULT_OG_IMAGE,
    type: "article",
    publishedTime: post.publishedAt,
    modifiedTime: post.updatedAt,
  });
}

export default async function BlogPostPage({ params }: Props) {
  const { locale: raw, slug } = await params;
  if (!isLocale(raw)) notFound();
  const locale: Locale = raw;
  const t = getDictionary(locale);
  const post = await api.blogPost(slug, locale);
  if (!post) return redirectOrNotFound(locale, paths.blogPost(slug));
  // Not written in this language: send readers to the version that exists.
  if (!post.locales.includes(locale)) redirect(localePath(post.locales[0], paths.blogPost(post.slug)));

  const url = post.seo.canonicalOverride ?? absoluteUrl(locale, paths.blogPost(post.slug));
  return (
    <div className="container">
      <JsonLd data={blogPostingLd(post, url, locale)} />
      <Breadcrumbs
        locale={locale}
        items={[
          { name: t.blog.title, path: paths.blog() },
          { name: post.title, path: paths.blogPost(post.slug) },
        ]}
      />
      <article>
        <header className="page-header">
          <h1>{post.title}</h1>
          <p className="post-meta">
            <span>{t.blog.by(post.authorName)}</span>
            {post.publishedAt && (
              <span>
                {t.blog.published}: <time dateTime={post.publishedAt}>{formatDate(post.publishedAt, locale)}</time>
              </span>
            )}
            {post.publishedAt && post.updatedAt.slice(0, 10) !== post.publishedAt.slice(0, 10) && (
              <span>
                {t.blog.updated}: <time dateTime={post.updatedAt}>{formatDate(post.updatedAt, locale)}</time>
              </span>
            )}
            {post.readingMinutes && <span>{t.blog.minRead(post.readingMinutes)}</span>}
            {post.category && (
              <Link href={localePath(locale, paths.category(post.category.slug))}>{post.category.name}</Link>
            )}
          </p>
        </header>
        {post.image && (
          <div className="post-hero">
            <Image src={post.image.url} alt={post.image.alt} fill priority sizes="(max-width: 1200px) 100vw, 1168px" style={{ objectFit: "cover" }} />
          </div>
        )}
        {post.body && <Markdown>{post.body}</Markdown>}
      </article>

      {post.relatedProducts.length > 0 && (
        <section className="section" aria-labelledby="related-products">
          <h2 id="related-products">{t.blog.relatedProducts}</h2>
          <ProductGrid products={post.relatedProducts} locale={locale} />
        </section>
      )}
      {post.category && (
        <p className="section">
          <Link href={localePath(locale, paths.category(post.category.slug))} className="btn btn-secondary">
            {t.actions.explore(post.category.name)}
          </Link>
        </p>
      )}
    </div>
  );
}
