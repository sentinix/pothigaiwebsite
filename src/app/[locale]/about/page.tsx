import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Paragraphs } from "@/components/Paragraphs";
import { isLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { api } from "@/lib/api";
import { DEFAULT_OG_IMAGE } from "@/lib/og";
import { buildMetadata } from "@/lib/seo";
import { localePath, paths } from "@/lib/site";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const page = await api.page("about", locale);
  if (!page) return {};
  return buildMetadata({
    locale,
    path: paths.about(),
    title: page.seoTitle,
    description: page.metaDescription,
    locales: page.locales.filter(isLocale),
    robotsIndex: page.robotsIndex,
    image: DEFAULT_OG_IMAGE,
  });
}

export default async function AboutPage({ params }: Props) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale: Locale = raw;
  const t = getDictionary(locale);
  const [page, categories] = await Promise.all([api.page("about", locale), api.categories(locale)]);
  if (!page) notFound();
  return (
    <div className="container">
      <Breadcrumbs locale={locale} items={[{ name: t.nav.about, path: paths.about() }]} />
      <header className="page-header">
        <h1>{page.h1}</h1>
        <p className="lead">{t.tagline}</p>
      </header>
      <div className="prose">
        {page.body.sections.map((s) => (
          <section key={s.heading}>
            <h2>{s.heading}</h2>
            <Paragraphs text={s.body} />
          </section>
        ))}
      </div>
      <section className="section">
        <h2>{t.home.shopByCategory}</h2>
        <ul className="pill-links">
          {categories.map((c) => (
            <li key={c.slug}>
              <Link href={localePath(locale, paths.category(c.slug))}>{c.name}</Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
