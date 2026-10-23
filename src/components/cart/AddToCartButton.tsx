"use client";
import { useState } from "react";
import type { Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import type { ProductCard } from "@/lib/types";
import { useCart } from "./CartProvider";

export function AddToCartButton({
  product,
  locale,
  withQuantity = false,
}: {
  product: ProductCard;
  locale: Locale;
  withQuantity?: boolean;
}) {
  const t = getDictionary(locale);
  const { add } = useCart();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  if (!product.inStock || product.maxQuantity < 1) {
    return (
      <button type="button" className="btn btn-disabled" disabled>
        {t.product.outOfStock}
      </button>
    );
  }

  const onAdd = () => {
    add(
      {
        productId: product.id,
        sku: product.sku,
        name: product.name,
        slug: product.slug,
        categorySlug: product.category.slug,
        categoryName: product.category.name,
        price: product.effectivePrice,
        maxQuantity: product.maxQuantity,
        image: product.image ? { url: product.image.url, alt: product.image.alt } : null,
      },
      qty,
    );
    setAdded(true);
    window.setTimeout(() => setAdded(false), 2500);
  };

  return (
    <div className="add-to-cart">
      {withQuantity && (
        <div className="qty" role="group" aria-label={t.product.quantity}>
          <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label={t.product.decrease} disabled={qty <= 1}>
            −
          </button>
          <output aria-live="polite">{qty}</output>
          <button
            type="button"
            onClick={() => setQty((q) => Math.min(product.maxQuantity, q + 1))}
            aria-label={t.product.increase}
            disabled={qty >= product.maxQuantity}
          >
            +
          </button>
        </div>
      )}
      <button type="button" className="btn btn-primary" onClick={onAdd} aria-label={`${t.actions.addToCart}: ${product.name}`}>
        {t.actions.addToCart}
      </button>
      <span role="status" className="added-msg">
        {added ? t.actions.added : ""}
      </span>
    </div>
  );
}
