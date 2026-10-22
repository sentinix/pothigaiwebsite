import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Paragraphs } from "@/components/Paragraphs";
import { isLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { api } from "@/lib/api";
import { DEFAULT_OG_IMAGE } from "@/lib/og";
import { buildMetadata } from "@/lib/seo";
import { paths } from "@/lib/site";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const page = await api.page("contact", locale);
  if (!page) return {};
  return buildMetadata({
    locale,
    path: paths.contact(),
    title: page.seoTitle,
    description: page.metaDescription,
    locales: page.locales.filter(isLocale),
    robotsIndex: page.robotsIndex,
    image: DEFAULT_OG_IMAGE,
  });
}

export default async function ContactPage({ params }: Props) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale: Locale = raw;
  const t = getDictionary(locale);
  const [page, settings] = await Promise.all([api.page("contact", locale), api.settings().catch(() => null)]);
  if (!page) notFound();
  const s = settings;
  const hasDetails = Boolean(s?.contactEmail || s?.contactPhone || s?.whatsappNumber || s?.address);
  return (
    <div className="container">
      <Breadcrumbs locale={locale} items={[{ name: t.nav.contact, path: paths.contact() }]} />
      <header className="page-header">
        <h1>{page.h1}</h1>
        <p className="lead">{page.body.intro}</p>
      </header>
      {hasDetails ? (
        <dl className="details-list">
          {s?.contactPhone && (
            <>
              <dt>{t.contact.phone}</dt>
              <dd>
                <a href={`tel:${s.contactPhone.replace(/\s/g, "")}`}>{s.contactPhone}</a>
              </dd>
            </>
          )}
          {s?.whatsappNumber && (
            <>
              <dt>{t.contact.whatsapp}</dt>
              <dd>
                <a href={`https://wa.me/${s.whatsappNumber.replace(/[^0-9]/g, "")}`} rel="noopener noreferrer">
                  {s.whatsappNumber}
                </a>
              </dd>
            </>
          )}
          {s?.contactEmail && (
            <>
              <dt>{t.contact.email}</dt>
              <dd>
                <a href={`mailto:${s.contactEmail}`}>{s.contactEmail}</a>
              </dd>
            </>
          )}
          {s?.address && (
            <>
              <dt>{t.contact.address}</dt>
              <dd>
                <address>
                  {[s.address.streetAddress, s.address.addressLocality, s.address.addressRegion, s.address.postalCode]
                    .filter(Boolean)
                    .join(", ")}
                </address>
              </dd>
            </>
          )}
        </dl>
      ) : (
        <p className="empty-state">{t.contact.noDetails}</p>
      )}
      {s?.deliveryInfo[locale] && (
        <section className="section">
          <h2>{t.contact.delivery}</h2>
          <Paragraphs text={s.deliveryInfo[locale]} />
        </section>
      )}
      {s?.returnPolicy[locale] && (
        <section className="section">
          <h2>{t.contact.returns}</h2>
          <Paragraphs text={s.returnPolicy[locale]} />
        </section>
      )}
    </div>
  );
}
