import type { MetadataRoute } from "next";
import { LOCALES } from "@/i18n/config";
import { IS_NON_PRODUCTION_DEPLOYMENT, SITE_URL } from "@/lib/site";

// robots.txt is a crawl hint, not access control: admin and API routes are
// separately protected by authentication.
export default function robots(): MetadataRoute.Robots {
  if (IS_NON_PRODUCTION_DEPLOYMENT) return { rules: [{ userAgent: "*", disallow: "/" }] };
  const privatePaths = ["cart", "checkout", "order", "search"].flatMap((p) => LOCALES.map((l) => `/${l}/${p}/`));
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin/", "/api/", ...privatePaths] }],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
