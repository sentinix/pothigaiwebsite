import Link from "next/link";
import type { Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { localePath, paths } from "@/lib/site";
import type { Category, Settings } from "@/lib/types";
import { LogoMark } from "./Logo";

export function SiteFooter({ locale, categories, settings }: { locale: Locale; categories: Category[]; settings: Settings | null }) {
  const t = getDictionary(locale);
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div>
          <p className="footer-brand">
            <LogoMark size={32} /> <span>{t.brand}</span>
          </p>
          <p className="footer-tagline" lang={locale === "ta" ? "ta-IN" : "en-IN"}>
            {t.tagline}
          </p>
          {settings?.contactEmail || settings?.contactPhone ? (
            <ul className="footer-contact">
              {settings.contactPhone && (
                <li>
                  {t.contact.phone}: <a href={`tel:${settings.contactPhone.replace(/\s/g, "")}`}>{settings.contactPhone}</a>
                </li>
              )}
              {settings.contactEmail && (
                <li>
                  {t.contact.email}: <a href={`mailto:${settings.contactEmail}`}>{settings.contactEmail}</a>
                </li>
              )}
            </ul>
          ) : null}
        </div>
        <div>
          <h2 className="footer-heading">{t.footer.categories}</h2>
          <ul>
            {categories.map((c) => (
              <li key={c.slug}>
                <Link href={localePath(locale, paths.category(c.slug))}>{c.name}</Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="footer-heading">{t.footer.information}</h2>
          <ul>
            <li>
              <Link href={localePath(locale, paths.about())}>{t.nav.about}</Link>
            </li>
            <li>
              <Link href={localePath(locale, paths.contact())}>{t.nav.contact}</Link>
            </li>
            <li>
              <Link href={localePath(locale, paths.blog())}>{t.nav.blog}</Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="container footer-bottom">
        <p>{t.footer.rights(new Date().getFullYear())}</p>
      </div>
    </footer>
  );
}
