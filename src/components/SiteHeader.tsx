import Link from "next/link";
import type { Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { localePath, paths } from "@/lib/site";
import type { Category } from "@/lib/types";
import { CartLink } from "./cart/CartLink";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { LogoMark } from "./Logo";

function SearchForm({ locale, id }: { locale: Locale; id: string }) {
  const t = getDictionary(locale);
  // Plain GET form: works without JavaScript.
  return (
    <form action={localePath(locale, paths.search())} method="get" role="search" className="search-form">
      <label htmlFor={id} className="visually-hidden">
        {t.search.label}
      </label>
      <input id={id} name="q" type="search" placeholder={t.search.placeholder} minLength={2} maxLength={100} required />
      <button type="submit">{t.search.button}</button>
    </form>
  );
}

export function SiteHeader({ locale, categories }: { locale: Locale; categories: Category[] }) {
  const t = getDictionary(locale);
  const links = [
    ...categories.map((c) => ({ href: localePath(locale, paths.category(c.slug)), label: c.name })),
  ];
  const infoLinks = [
    { href: localePath(locale, paths.blog()), label: t.nav.blog },
    { href: localePath(locale, paths.about()), label: t.nav.about },
    { href: localePath(locale, paths.contact()), label: t.nav.contact },
  ];
  return (
    <header className="site-header">
      <a href="#main" className="skip-link">
        {t.nav.skipToContent}
      </a>
      <div className="container header-top">
        <Link href={localePath(locale, "/")} className="brand" aria-label={t.brand}>
          <LogoMark />
          <span className="brand-name">{t.brand}</span>
        </Link>
        <div className="header-search">
          <SearchForm locale={locale} id="site-search" />
        </div>
        <div className="header-actions">
          <LanguageSwitcher locale={locale} />
          <CartLink locale={locale} />
        </div>
      </div>
      <nav className="main-nav" aria-label={t.nav.categoryNav}>
        <div className="container">
          {/* <details> gives an accessible mobile menu that works without JavaScript. */}
          <details className="mobile-menu">
            <summary>{t.nav.menu}</summary>
            <div className="mobile-menu-panel">
              <SearchForm locale={locale} id="mobile-search" />
              <ul>
                {[...links, ...infoLinks].map((l) => (
                  <li key={l.href}>
                    <Link href={l.href}>{l.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          </details>
          <ul className="desktop-nav">
            {links.map((l) => (
              <li key={l.href}>
                <Link href={l.href}>{l.label}</Link>
              </li>
            ))}
            <li className="nav-divider" aria-hidden="true" />
            {infoLinks.map((l) => (
              <li key={l.href}>
                <Link href={l.href}>{l.label}</Link>
              </li>
            ))}
          </ul>
        </div>
      </nav>
    </header>
  );
}
