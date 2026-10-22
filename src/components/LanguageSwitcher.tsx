"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { HREFLANG, LOCALE_COOKIE, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";

/**
 * Links to the same page in the other language. Every storefront route exists
 * in both locales; pages without a translation show an English fallback (or
 * redirect, for blog posts), so the link is never broken.
 */
export function LanguageSwitcher({ locale }: { locale: Locale }) {
  const pathname = usePathname() ?? `/${locale}/`;
  const target: Locale = locale === "en" ? "ta" : "en";
  const href = pathname.replace(/^\/(en|ta)(?=\/|$)/, `/${target}`);
  const t = getDictionary(locale);
  return (
    <Link
      href={href}
      hrefLang={HREFLANG[target]}
      lang={HREFLANG[target]}
      aria-label={t.language.aria}
      className="lang-switch"
      prefetch={false}
      onClick={() => {
        document.cookie = `${LOCALE_COOKIE}=${target}; path=/; max-age=31536000; samesite=lax`;
      }}
    >
      {t.language.label}
    </Link>
  );
}
