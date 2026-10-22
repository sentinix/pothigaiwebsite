import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductGrid } from "@/components/ProductCard";
import { Paragraphs } from "@/components/Paragraphs";
import { TrackEvent } from "@/components/TrackEvent";
import { isLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { api } from "@/lib/api";
import { paragraphs } from "@/lib/format";
import { JsonLd } from "@/components/JsonLd";
import { homeLd } from "@/lib/jsonld";
import { DEFAULT_OG_IMAGE } from "@/lib/og";
import { buildMetadata } from "@/lib/seo";
import { localePath, paths } from "@/lib/site";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const page = await api.homePage(locale);
  if (!page) return {};
  return buildMetadata({
    locale,
    path: "/",
    title: page.seoTitle,
    description: page.metaDescription,
    locales: page.locales.filter(isLocale),
    image: DEFAULT_OG_IMAGE,
  });
}

export default async function HomePage({ params }: Props) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale: Locale = raw;
  const t = getDictionary(locale);
  const [page, categories, featured, settings] = await Promise.all([
    api.homePage(locale),
    api.categories(locale),
    api.featured(locale, 8),
    api.settings().catch(() => null),
  ]);
  if (!page) notFound();
  const body = page.body;
  const bySlug = new Map(categories.map((c) => [c.slug, c]));
  const [firstIntro, ...restIntro] = paragraphs(body.intro);
  const firstCategory = categories[0];

  return (
    <>
      <JsonLd data={homeLd(settings, locale)} />
      <section className="hero">
        <div className="hero-inner">
          <p className="eyebrow">{body.tagline}</p>
          <h1>{page.h1}</h1>
          <p className="lead">{firstIntro}</p>
          <div className="cta-row">
            {firstCategory && (
              <Link href="#categories" className="btn btn-primary">
                {t.actions.shopNow}
              </Link>
            )}
            <Link href={localePath(locale, paths.about())} className="btn btn-secondary">
              {t.nav.about}
            </Link>
          </div>
        </div>
      </section>

      <div className="container">
        {restIntro.length > 0 && (
          <section className="section" aria-labelledby="story-heading">
            <h2 id="story-heading">{t.home.storyHeading}</h2>
            <Paragraphs text={restIntro.join("\n\n")} />
          </section>
        )}

        <section className="section" id="categories" aria-labelledby="categories-heading">
          <h2 id="categories-heading">{t.home.shopByCategory}</h2>
          <ul className="category-grid">
            {categories.map((c) => (
              <li key={c.slug}>
                <Link href={localePath(locale, paths.category(c.slug))} className="category-card">
                  <h3>{c.name}</h3>
                  <p>{paragraphs(c.intro)[0]?.split(/(?<=\.)\s/)[0]}</p>
                  <span className="card-cta">{t.actions.explore(c.name)} →</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="section feature-sections" aria-label={t.footer.categories}>
          {body.sections.map((s) => (
            <article key={s.heading} className="feature">
              <h2 className="h3-size">{s.heading}</h2>
              <p>{s.body}</p>
              <p className="links">
                {s.categorySlugs
                  .map((slug) => bySlug.get(slug))
                  .filter((c) => c !== undefined)
                  .map((c) => (
                    <Link key={c.slug} href={localePath(locale, paths.category(c.slug))}>
                      {t.actions.explore(c.name)} →
                    </Link>
                  ))}
              </p>
            </article>
          ))}
        </section>

        <section className="section" aria-labelledby="featured-heading">
          <h2 id="featured-heading">{body.featuredHeading}</h2>
          {featured.length > 0 ? (
            <>
              <ProductGrid products={featured} locale={locale} />
              <TrackEvent
                name="view_item_list"
                params={{
                  item_list_id: "home_featured",
                  item_list_name: "Featured products",
                  items: featured.map((p, i) => ({ item_id: p.sku, item_name: p.name, item_category: p.category.name, price: Number(p.effectivePrice), index: i })),
                }}
              />
            </>
          ) : (
            <p className="empty-state">{t.home.featuredEmpty}</p>
          )}
        </section>

        <section className="section" aria-labelledby="why-heading">
          <h2 id="why-heading">{body.whyHeading}</h2>
          <ul className="why-list">
            {body.whyPoints.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
          {(settings?.deliveryInfo[locale] || settings?.contactPhone || settings?.contactEmail) && (
            <div className="feature">
              {settings?.deliveryInfo[locale] && (
                <>
                  <h3>{t.contact.delivery}</h3>
                  <Paragraphs text={settings.deliveryInfo[locale]} />
                </>
              )}
              <p>
                <Link href={localePath(locale, paths.contact())}>{t.nav.contact} →</Link>
              </p>
            </div>
          )}
        </section>

        <section className="cta-band" aria-labelledby="cta-heading">
          <h2 id="cta-heading">{body.ctaHeading}</h2>
          <p>{body.ctaBody}</p>
          {firstCategory && (
            <Link href="#categories" className="btn btn-primary">
              {t.actions.shopNow}
            </Link>
          )}
          <p className="tagline">{body.tagline}</p>
        </section>
      </div>
    </>
  );
}
