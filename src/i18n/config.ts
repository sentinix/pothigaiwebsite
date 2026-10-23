export const LOCALES = ["en", "ta"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";
export const LOCALE_COOKIE = "NEXT_LOCALE";

export const HREFLANG: Record<Locale, string> = { en: "en-IN", ta: "ta-IN" };
export const OG_LOCALE: Record<Locale, string> = { en: "en_IN", ta: "ta_IN" };

export function isLocale(value: string | undefined | null): value is Locale {
  return value === "en" || value === "ta";
}
