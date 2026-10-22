import type { MetadataRoute } from "next";
import { HREFLANG } from "@/i18n/config";
import { api } from "@/lib/api";
import { absoluteUrl } from "@/lib/site";

// Built per request (data cached for 10 minutes and revalidated on admin edits)
// so publishing or unpublishing content updates the sitemap without a rebuild.
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries = await api.sitemap();
  return entries.flatMap((entry) => {
    const languages: Record<string, string> = {};
    if (entry.locales.length > 1) {
      for (const l of entry.locales) languages[HREFLANG[l]] = absoluteUrl(l, entry.path);
      languages["x-default"] = absoluteUrl(entry.locales.includes("en") ? "en" : entry.locales[0], entry.path);
    }
    return entry.locales.map((locale) => ({
      url: absoluteUrl(locale, entry.path),
      lastModified: entry.lastModified,
      ...(Object.keys(languages).length ? { alternates: { languages } } : {}),
    }));
  });
}
