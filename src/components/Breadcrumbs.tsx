import Link from "next/link";
import type { Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { JsonLd } from "@/components/JsonLd";
import { breadcrumbLd, type Crumb } from "@/lib/jsonld";
import { localePath } from "@/lib/site";

/** Visible breadcrumb trail plus matching BreadcrumbList JSON-LD. */
export function Breadcrumbs({ locale, items }: { locale: Locale; items: Crumb[] }) {
  const t = getDictionary(locale);
  const crumbs = [{ name: t.breadcrumb.home, path: "/" }, ...items];
  return (
    <>
      <nav aria-label={t.breadcrumb.label} className="breadcrumbs">
        <ol>
          {crumbs.map((c, i) => (
            <li key={c.path}>
              {i === crumbs.length - 1 ? (
                <span aria-current="page">{c.name}</span>
              ) : (
                <Link href={localePath(locale, c.path)}>{c.name}</Link>
              )}
            </li>
          ))}
        </ol>
      </nav>
      <JsonLd data={breadcrumbLd(locale, crumbs)} />
    </>
  );
}
