import type { Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { formatPrice } from "@/lib/format";

export function Price({ price, salePrice, locale, large = false }: { price: string; salePrice: string | null; locale: Locale; large?: boolean }) {
  const t = getDictionary(locale);
  return (
    <p className={`price ${large ? "price-large" : ""}`}>
      {salePrice ? (
        <>
          <span className="visually-hidden">{t.product.offerPrice}: </span>
          <strong>{formatPrice(salePrice, locale)}</strong>{" "}
          <s>
            <span className="visually-hidden">{t.product.regularPrice}: </span>
            {formatPrice(price, locale)}
          </s>
        </>
      ) : (
        <strong>{formatPrice(price, locale)}</strong>
      )}
    </p>
  );
}
