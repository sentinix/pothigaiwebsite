"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { adminFetch } from "./client";
import { Checkbox, SaveBar, SerpPreview, TextField } from "./fields";

type Locale = "en" | "ta";
type Section = { heading: string; body: string; categorySlugs?: string[] };
type Body = {
  tagline?: string;
  intro?: string;
  sections?: Section[];
  featuredHeading?: string;
  whyHeading?: string;
  whyPoints?: string[];
  ctaHeading?: string;
  ctaBody?: string;
};
export interface AdminPage {
  key: string;
  locale: Locale;
  seoTitle: string;
  metaDescription: string;
  h1: string;
  body: Body;
  robotsIndex: boolean;
}

const empty = (key: string, locale: Locale): AdminPage => ({
  key,
  locale,
  seoTitle: "",
  metaDescription: "",
  h1: "",
  robotsIndex: true,
  body:
    key === "home"
      ? { tagline: "", intro: "", sections: [], featuredHeading: "", whyHeading: "", whyPoints: [], ctaHeading: "", ctaBody: "" }
      : key === "about"
        ? { sections: [] }
        : { intro: "" },
});

export function PageEditor({
  pageKey,
  pages,
  categories,
  siteUrl,
}: {
  pageKey: "home" | "about" | "contact";
  pages: AdminPage[];
  categories: { slug: string; nameEn: string }[];
  siteUrl: string;
}) {
  const router = useRouter();
  const [locale, setLocale] = useState<Locale>("en");
  const [data, setData] = useState<Record<Locale, AdminPage>>({
    en: pages.find((p) => p.locale === "en") ?? empty(pageKey, "en"),
    ta: pages.find((p) => p.locale === "ta") ?? empty(pageKey, "ta"),
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const page = data[locale];
  const update = (patch: Partial<AdminPage>) => setData((d) => ({ ...d, [locale]: { ...d[locale], ...patch } }));
  const updateBody = (patch: Partial<Body>) => update({ body: { ...page.body, ...patch } });
  const sections = page.body.sections ?? [];
  const setSection = (i: number, patch: Partial<Section>) => updateBody({ sections: sections.map((s, j) => (j === i ? { ...s, ...patch } : s)) });
  const lang = locale === "ta" ? "ta" : undefined;
  const path = pageKey === "home" ? "/" : `/${pageKey}/`;

  const save = async () => {
    setBusy(true);
    setError(null);
    setStatus(null);
    const body: Body = { ...page.body };
    if (pageKey === "home") body.whyPoints = (body.whyPoints ?? []).map((p) => p.trim()).filter(Boolean);
    const res = await adminFetch<AdminPage>(`pages/${pageKey}/${locale}`, {
      method: "PUT",
      body: { seoTitle: page.seoTitle, metaDescription: page.metaDescription, h1: page.h1, body, robotsIndex: page.robotsIndex },
    });
    setBusy(false);
    setErrors(res.fieldErrors);
    if (!res.ok) return setError(res.error);
    update(res.data);
    setStatus(`${locale === "en" ? "English" : "Tamil"} version saved`);
    router.refresh();
  };

  return (
    <div className="admin-form">
      <div className="tabs" role="tablist" aria-label="Language">
        {(["en", "ta"] as const).map((l) => (
          <button key={l} type="button" role="tab" aria-selected={l === locale} onClick={() => setLocale(l)}>
            {l === "en" ? "English" : "தமிழ் (Tamil)"}
          </button>
        ))}
      </div>

      <section className="admin-card">
        <h2>Search appearance</h2>
        <div className="two-col">
          <div>
            <TextField label="SEO title" lang={lang} recommended={locale === "ta" ? [20, 80] : [30, 60]} value={page.seoTitle} onChange={(v) => update({ seoTitle: v })} error={errors.seoTitle} />
            <TextField label="Meta description" lang={lang} multiline recommended={locale === "ta" ? [60, 200] : [70, 160]} value={page.metaDescription} onChange={(v) => update({ metaDescription: v })} error={errors.metaDescription} />
            <TextField label="H1 heading" lang={lang} value={page.h1} onChange={(v) => update({ h1: v })} error={errors.h1} />
            {pageKey !== "home" && (
              <Checkbox label="Allow search engines to index this page" checked={page.robotsIndex} onChange={(v) => update({ robotsIndex: v })} />
            )}
          </div>
          <SerpPreview lang={locale} url={`${siteUrl}/${locale}${path}`} title={page.seoTitle} description={page.metaDescription} />
        </div>
      </section>

      {pageKey === "home" && (
        <>
          <section className="admin-card">
            <h2>Hero &amp; introduction</h2>
            <TextField label="Tagline" lang={lang} value={page.body.tagline ?? ""} onChange={(v) => updateBody({ tagline: v })} error={errors["tagline"]} />
            <TextField label="Introduction (blank line between paragraphs; first paragraph is shown in the hero)" lang={lang} multiline rows={8} value={page.body.intro ?? ""} onChange={(v) => updateBody({ intro: v })} />
          </section>
          <section className="admin-card">
            <h2>Category sections</h2>
            {sections.map((s, i) => (
              <div key={i} style={{ borderBottom: "1px solid var(--border)", paddingBottom: 12, marginBottom: 12 }}>
                <TextField label={`Section ${i + 1} heading`} lang={lang} value={s.heading} onChange={(v) => setSection(i, { heading: v })} />
                <TextField label="Text" lang={lang} multiline value={s.body} onChange={(v) => setSection(i, { body: v })} />
                <fieldset>
                  <legend>Link to categories</legend>
                  <div className="inline-actions">
                    {categories.map((c) => (
                      <Checkbox
                        key={c.slug}
                        label={c.nameEn}
                        checked={(s.categorySlugs ?? []).includes(c.slug)}
                        onChange={(on) =>
                          setSection(i, { categorySlugs: on ? [...(s.categorySlugs ?? []), c.slug] : (s.categorySlugs ?? []).filter((x) => x !== c.slug) })
                        }
                      />
                    ))}
                  </div>
                </fieldset>
                <button type="button" className="link-button" onClick={() => updateBody({ sections: sections.filter((_, j) => j !== i) })}>
                  Remove section
                </button>
              </div>
            ))}
            <button type="button" className="btn btn-secondary btn-small" onClick={() => updateBody({ sections: [...sections, { heading: "", body: "", categorySlugs: [] }] })}>
              Add section
            </button>
          </section>
          <section className="admin-card">
            <h2>Featured products, why shop &amp; call to action</h2>
            <TextField label="Featured products heading" lang={lang} value={page.body.featuredHeading ?? ""} onChange={(v) => updateBody({ featuredHeading: v })} />
            <TextField label="“Why shop” heading" lang={lang} value={page.body.whyHeading ?? ""} onChange={(v) => updateBody({ whyHeading: v })} />
            <TextField label="“Why shop” points (one per line)" lang={lang} multiline rows={6} value={(page.body.whyPoints ?? []).join("\n")} onChange={(v) => updateBody({ whyPoints: v.split("\n") })} />
            <TextField label="Call-to-action heading" lang={lang} value={page.body.ctaHeading ?? ""} onChange={(v) => updateBody({ ctaHeading: v })} />
            <TextField label="Call-to-action text" lang={lang} multiline value={page.body.ctaBody ?? ""} onChange={(v) => updateBody({ ctaBody: v })} />
          </section>
        </>
      )}

      {pageKey === "about" && (
        <section className="admin-card">
          <h2>Sections</h2>
          {sections.map((s, i) => (
            <div key={i} style={{ borderBottom: "1px solid var(--border)", paddingBottom: 12, marginBottom: 12 }}>
              <TextField label={`Heading ${i + 1}`} lang={lang} value={s.heading} onChange={(v) => setSection(i, { heading: v })} />
              <TextField label="Text" lang={lang} multiline rows={5} value={s.body} onChange={(v) => setSection(i, { body: v })} />
              <button type="button" className="link-button" onClick={() => updateBody({ sections: sections.filter((_, j) => j !== i) })}>
                Remove section
              </button>
            </div>
          ))}
          <button type="button" className="btn btn-secondary btn-small" onClick={() => updateBody({ sections: [...sections, { heading: "", body: "" }] })}>
            Add section
          </button>
        </section>
      )}

      {pageKey === "contact" && (
        <section className="admin-card">
          <h2>Introduction</h2>
          <TextField label="Introduction" lang={lang} multiline value={page.body.intro ?? ""} onChange={(v) => updateBody({ intro: v })} hint="Phone, email and address are edited in Store settings." />
        </section>
      )}

      <SaveBar onSave={save} busy={busy} status={status} error={error}>
        <a className="btn btn-secondary btn-small" href={`/${locale}${path}`} target="_blank" rel="noopener">
          View {locale === "en" ? "English" : "Tamil"} page
        </a>
      </SaveBar>
    </div>
  );
}
