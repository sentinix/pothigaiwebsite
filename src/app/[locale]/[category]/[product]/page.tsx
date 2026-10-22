import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { AddToCartButton } from "@/components/cart/AddToCartButton";
import { Paragraphs } from "@/components/Paragraphs";
import { Price } from "@/components/Price";
import { ProductGrid } from "@/components/ProductCard";
import { ProductImage } from "@/components/ProductImage";
import { TrackEvent } from "@/components/TrackEvent";
import { isLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { api, isPreview } from "@/lib/api";
import { JsonLd } from "@/components/JsonLd";
import { productLd } from "@/lib/jsonld";
import { DEFAULT_OG_IMAGE } from "@/lib/og";
import { redirectOrNotFound } from "@/lib/redirects";
import { buildMetadata } from "@/lib/seo";
import { absoluteUrl, localePath, paths } from "@/lib/site";

type Props = { params: Promise<{ locale: string; category: string; product: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, product: slug } = await params;
  if (!isLocale(locale)) return {};
  const data = await api.product(slug, locale);
  if (!data) return {};
  const p = data.product;
  return buildMetadata({
    locale,
    path: paths.product(p.category.slug, p.slug),
    title: p.seo.title,
    description: p.seo.description,
    locales: p.locales,
    robotsIndex: p.seo.robotsIndex && !(await isPreview()),
    canonicalOverride: p.seo.canonicalOverride,
    image: p.images[0] ?? DEFAULT_OG_IMAGE,
  });
}

export default async function ProductPage({ params }: Props) {
  const { locale: raw, category, product: slug } = await params;
  if (!isLocale(raw)) notFound();
  const locale: Locale = raw;
  const t = getDictionary(locale);

  const [data, settings] = await Promise.all([api.product(slug, locale), api.settings().catch(() => null)]);
  if (!data) return redirectOrNotFound(locale, paths.product(category, slug));
  const { product, related, blogPosts } = data;
  // One canonical URL per product: wrong category segments move permanently.
  if (product.category.slug !== category) {
    permanentRedirect(localePath(locale, paths.product(product.category.slug, product.slug)));
  }

  const ownPath = paths.product(product.category.slug, product.slug);
  // Structured data uses the canonical URL so it never competes with the English page.
  const canonicalUrl = product.seo.canonicalOverride ?? absoluteUrl(product.translationFallback ? "en" : locale, ownPath);
  const [main, ...thumbs] = product.images;
  const details: [string, string | null][] = [
    [t.product.packSize, product.pack],
    [t.product.grade, product.details.grade],
    [t.product.ingredients, product.details.ingredients],
    [t.product.origin, product.details.origin],
    [t.product.extractionMethod, product.details.extractionMethod],
    [t.product.storage, product.details.storage],
    [t.product.cooking, product.details.cooking],
    [t.product.allergens, product.details.allergens],
    [t.product.sku, product.sku],
  ];
  const shipping = product.details.shippingInfo ?? settings?.deliveryInfo[locale] ?? null;
  const returns = settings?.returnPolicy[locale] ?? null;

  return (
    <div className="container">
      {!product.translationFallback && <JsonLd data={productLd(product, canonicalUrl, locale)} />}
      <Breadcrumbs
        locale={locale}
        items={[
          { name: product.category.name, path: paths.category(product.category.slug) },
          { name: product.name, path: ownPath },
        ]}
      />
      {product.translationFallback && <p className="notice">{t.product.translationFallback}</p>}

      <div className="product-detail">
        <div className="gallery">
          <ProductImage image={main ?? null} sizes="(max-width: 800px) 100vw, 580px" priority />
          {thumbs.length > 0 && (
            <div className="gallery-thumbs">
              {thumbs.map((img) => (
                <ProductImage key={img.url} image={img} sizes="(max-width: 800px) 25vw, 140px" />
              ))}
            </div>
          )}
        </div>

        <div>
          <h1>{product.name}</h1>
          {product.pack && <p className="muted">{product.pack}</p>}
          <Price price={product.price} salePrice={product.salePrice} locale={locale} large />
          <p className={product.inStock ? "stock-in" : "stock-out"}>{product.inStock ? t.product.inStock : t.product.outOfStock}</p>
          {product.shortDescription && <p>{product.shortDescription}</p>}
          <AddToCartButton product={product} locale={locale} withQuantity />
          <p className="muted small">{t.product.priceNote}</p>
        </div>
      </div>

      {product.description && (
        <section className="section" aria-labelledby="desc-heading">
          <h2 id="desc-heading">{t.product.description}</h2>
          <div className="prose">
            <Paragraphs text={product.description} />
          </div>
        </section>
      )}

      <section className="section" aria-labelledby="details-heading">
        <h2 id="details-heading">{t.product.details}</h2>
        <dl className="details-list">
          {details
            .filter((d): d is [string, string] => Boolean(d[1]))
            .map(([label, value]) => (
              <div key={label} style={{ display: "contents" }}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
        </dl>
      </section>

      {(shipping || returns) && (
        <section className="section" aria-labelledby="shipping-heading">
          <h2 id="shipping-heading">{t.product.shippingInfo}</h2>
          <Paragraphs text={shipping} />
          {returns && <Paragraphs text={returns} />}
        </section>
      )}

      {related.length > 0 && (
        <section className="section" aria-labelledby="related-heading">
          <div className="section-head">
            <h2 id="related-heading">{t.product.related}</h2>
            <Link href={localePath(locale, paths.category(product.category.slug))}>
              {t.actions.explore(product.category.name)} →
            </Link>
          </div>
          <ProductGrid products={related} locale={locale} />
        </section>
      )}

      {blogPosts.length > 0 && (
        <section className="section" aria-labelledby="blog-heading">
          <h2 id="blog-heading">{t.category.fromBlog}</h2>
          <ul className="pill-links">
            {blogPosts.map((b) => (
              <li key={b.slug}>
                <Link href={localePath(locale, paths.blogPost(b.slug))}>{b.title}</Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <TrackEvent
        name="view_item"
        params={{
          currency: product.currency,
          value: Number(product.effectivePrice),
          items: [{ item_id: product.sku, item_name: product.nameEn, item_category: product.category.name, price: Number(product.effectivePrice) }],
        }}
      />
    </div>
  );
}
