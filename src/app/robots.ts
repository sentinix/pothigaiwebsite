import type { MetadataRoute } from "next";
import { LOCALES } from "@/i18n/config";
import { SITE_URL } from "@/lib/site";

// robots.txt is a crawl hint, not access control: admin and API routes are
// separately protected by authentication.
export default function robots(): MetadataRoute.Robots {
  const privatePaths = ["cart", "checkout", "order", "search"].flatMap((p) => LOCALES.map((l) => `/${l}/${p}/`));
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin/", "/api/", ...privatePaths] }],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
