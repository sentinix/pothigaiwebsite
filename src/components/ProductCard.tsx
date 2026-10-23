import Link from "next/link";
import type { Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { localePath, paths } from "@/lib/site";
import type { ProductCard as Product } from "@/lib/types";
import { AddToCartButton } from "./cart/AddToCartButton";
import { Price } from "./Price";
import { ProductImage } from "./ProductImage";

export function ProductCard({ product, locale, headingLevel = 3 }: { product: Product; locale: Locale; headingLevel?: 2 | 3 }) {
  const t = getDictionary(locale);
  const href = localePath(locale, paths.product(product.category.slug, product.slug));
  const Heading = `h${headingLevel}` as "h2" | "h3";
  return (
    <article className="product-card">
      <Link href={href} className="product-card-link" tabIndex={-1} aria-hidden="true">
        <ProductImage image={product.image} sizes="(max-width: 600px) 50vw, (max-width: 1100px) 33vw, 280px" />
      </Link>
      <div className="product-card-body">
        <Heading className="product-card-title">
          <Link href={href}>{product.name}</Link>
        </Heading>
        {product.pack && <p className="muted small">{product.pack}</p>}
        <Price price={product.price} salePrice={product.salePrice} locale={locale} />
        {!product.inStock && <p className="stock-out small">{t.product.outOfStock}</p>}
        <AddToCartButton product={product} locale={locale} />
      </div>
    </article>
  );
}

export function ProductGrid({ products, locale }: { products: Product[]; locale: Locale }) {
  return (
    <ul className="product-grid">
      {products.map((p) => (
        <li key={p.id}>
          <ProductCard product={p} locale={locale} />
        </li>
      ))}
    </ul>
  );
}
