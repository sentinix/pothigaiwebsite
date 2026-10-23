import { describe, expect, it } from "vitest";
import { serializeJsonLd, productLd } from "@/lib/jsonld";
import { buildMetadata } from "@/lib/seo";
import type { ProductDetail } from "@/lib/types";

const SITE = "https://shop.example.test";

describe("buildMetadata", () => {
  it("emits self canonical and reciprocal hreflang with x-default for translated pages", () => {
    const m = buildMetadata({ locale: "ta", path: "/oils/", title: "t", description: "d", locales: ["en", "ta"] });
    expect(m.alternates?.canonical).toBe(`${SITE}/ta/oils/`);
    expect(m.alternates?.languages).toEqual({
      "en-IN": `${SITE}/en/oils/`,
      "ta-IN": `${SITE}/ta/oils/`,
      "x-default": `${SITE}/en/oils/`,
    });
    expect(m.robots).toEqual({ index: true, follow: true });
    expect(m.openGraph?.locale).toBe("ta_IN");
  });

  it("canonicalises untranslated fallbacks to English and drops hreflang", () => {
    const m = buildMetadata({ locale: "ta", path: "/oils/x/", title: "t", description: "d", locales: ["en"] });
    expect(m.alternates?.canonical).toBe(`${SITE}/en/oils/x/`);
    expect(m.alternates?.languages).toBeUndefined();
  });

  it("drops hreflang when an editor canonical points elsewhere, and honours noindex", () => {
    const m = buildMetadata({
      locale: "en",
      path: "/oils/a/",
      title: "t",
      description: "d",
      canonicalOverride: `${SITE}/en/oils/b/`,
      robotsIndex: false,
    });
    expect(m.alternates?.canonical).toBe(`${SITE}/en/oils/b/`);
    expect(m.alternates?.languages).toBeUndefined();
    expect(m.robots).toEqual({ index: false, follow: true });
  });
});

describe("JSON-LD", () => {
  it("escapes characters that could break out of the script tag", () => {
    const out = serializeJsonLd({ name: "</script><script>alert(1)</script>& " });
    expect(out).not.toContain("<");
    expect(out).not.toContain(">");
    expect(JSON.parse(out).name).toBe("</script><script>alert(1)</script>& ");
  });

  it("builds Product + Offer from real data without ratings", () => {
    const product = {
      name: "Groundnut Oil",
      sku: "OIL-1",
      effectivePrice: "230.00",
      currency: "INR",
      inStock: false,
      description: "A **cooking** oil.",
      shortDescription: null,
      images: [{ url: "https://cdn/x.webp", alt: "x" }],
      category: { slug: "oils", name: "Oils" },
      seo: { description: "fallback" },
    } as unknown as ProductDetail;
    const ld = productLd(product, `${SITE}/en/oils/groundnut-oil/`, "en") as { offers: Record<string, unknown>; description: string; aggregateRating?: unknown; review?: unknown };
    expect(ld.offers.price).toBe("230.00");
    expect(ld.offers.availability).toBe("https://schema.org/OutOfStock");
    expect(ld.description).toBe("A cooking oil.");
    expect(ld.aggregateRating).toBeUndefined();
    expect(ld.review).toBeUndefined();
  });
});
