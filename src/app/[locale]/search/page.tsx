import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductGrid } from "@/components/ProductCard";
import { TrackEvent } from "@/components/TrackEvent";
import { isLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { api } from "@/lib/api";
import { noindexMetadata } from "@/lib/seo";
import { paths } from "@/lib/site";

type Props = { params: Promise<{ locale: string }>; searchParams: Promise<{ q?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = getDictionary(locale);
  return noindexMetadata(locale, paths.search(), `${t.search.title} | ${t.brand}`);
}

export default async function SearchPage({ params, searchParams }: Props) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale: Locale = raw;
  const t = getDictionary(locale);
  const q = ((await searchParams).q ?? "").trim().slice(0, 100);
  const results = q.length >= 2 ? await api.search(q, locale) : null;

  return (
    <div className="container">
      <header className="page-header">
        <h1>{q ? t.search.resultsFor(q) : t.search.title}</h1>
      </header>
      <form method="get" role="search" className="search-form" style={{ maxWidth: 520 }}>
        <label htmlFor="search-page-q" className="visually-hidden">
          {t.search.label}
        </label>
        <input id="search-page-q" type="search" name="q" defaultValue={q} placeholder={t.search.placeholder} minLength={2} maxLength={100} required />
        <button type="submit">{t.search.button}</button>
      </form>
      {q.length > 0 && q.length < 2 && <p>{t.search.minChars}</p>}
      {results &&
        (results.products.length > 0 ? (
          <ProductGrid products={results.products} locale={locale} />
        ) : (
          <p className="empty-state">{t.search.noResults}</p>
        ))}
      {results && <TrackEvent name="search" params={{ search_term: q }} />}
    </div>
  );
}
