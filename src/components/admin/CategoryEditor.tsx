"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { adminFetch, diff } from "./client";
import { Checkbox, ImageUpload, SaveBar, SerpPreview, TextField } from "./fields";

const TEXT = [
  "slug", "nameEn", "nameTa", "h1En", "h1Ta", "seoTitleEn", "seoTitleTa", "metaDescriptionEn", "metaDescriptionTa",
  "introEn", "introTa", "primaryKeyword", "imageUrl", "imageAltEn", "imageAltTa", "canonicalOverride",
] as const;
type TextKey = (typeof TEXT)[number];
type Faq = { qEn: string; aEn: string; qTa: string | null; aTa: string | null };

export type AdminCategory = { id: string; isPublished: boolean; robotsIndex: boolean; supportingKeywords: string[]; faqs: Faq[] } & Record<TextKey, string | null>;
type Form = Record<TextKey, string> & { isPublished: boolean; robotsIndex: boolean; keywords: string; faqs: Faq[] };

const toForm = (c: AdminCategory): Form => {
  const f = {} as Form;
  for (const k of TEXT) f[k] = c[k] ?? "";
  f.isPublished = c.isPublished;
  f.robotsIndex = c.robotsIndex;
  f.keywords = c.supportingKeywords.join("\n");
  f.faqs = c.faqs;
  return f;
};

export function CategoryEditor({ category, siteUrl, mediaBase }: { category: AdminCategory; siteUrl: string; mediaBase: string }) {
  const router = useRouter();
  const [saved, setSaved] = useState(() => toForm(category));
  const [form, setForm] = useState(saved);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const set = <K extends keyof Form>(k: K) => (v: Form[K]) => setForm((f) => ({ ...f, [k]: v }));
  const text = (k: TextKey) => ({ value: form[k], onChange: set(k), error: errors[k] });
  const setFaq = (i: number, key: keyof Faq, v: string) => set("faqs")(form.faqs.map((f, j) => (j === i ? { ...f, [key]: v } : f)));

  const save = async () => {
    const changes = diff(saved, form);
    if (Object.keys(changes).length === 0) return setStatus("No changes");
    const body: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(changes)) {
      if (k === "keywords") body.supportingKeywords = String(v).split("\n").map((s) => s.trim()).filter(Boolean);
      else if (k === "faqs") body.faqs = (v as Faq[]).map((f) => ({ ...f, qTa: f.qTa || null, aTa: f.aTa || null }));
      else if (typeof v === "string" && !["slug", "nameEn"].includes(k)) body[k] = v.trim() === "" ? null : v;
      else body[k] = v;
    }
    if (body.slug && !confirm("Changing the slug changes this category's URL and all its product URLs. Permanent redirects will be created. Continue?")) return;
    setBusy(true);
    setError(null);
    const res = await adminFetch<AdminCategory>(`categories/${category.id}`, { method: "PATCH", body });
    setBusy(false);
    setErrors(res.fieldErrors);
    if (!res.ok) return setError(res.error);
    const next = toForm(res.data);
    setSaved(next);
    setForm(next);
    setStatus("Saved");
    router.refresh();
  };

  return (
    <div className="admin-form">
      <section className="admin-card">
        <h2>Names &amp; headings</h2>
        <div className="two-col">
          <TextField label="Name (English)" {...text("nameEn")} />
          <TextField label="Name (Tamil)" lang="ta" {...text("nameTa")} />
          <TextField label="H1 heading (English)" {...text("h1En")} hint="Shown as the page's main heading. Defaults to the name." />
          <TextField label="H1 heading (Tamil)" lang="ta" {...text("h1Ta")} />
          <TextField label="URL slug" {...text("slug")} hint={`${siteUrl}/en/${form.slug}/`} />
        </div>
        <Checkbox label="Published" checked={form.isPublished} onChange={set("isPublished")} />
      </section>

      <section className="admin-card">
        <h2>Introduction</h2>
        <p className="hint">Separate paragraphs with a blank line. Write for shoppers first; use keywords naturally.</p>
        <div className="two-col">
          <TextField label="Introduction (English)" multiline rows={7} {...text("introEn")} />
          <TextField label="Introduction (Tamil)" lang="ta" multiline rows={7} {...text("introTa")} />
        </div>
      </section>

      <section className="admin-card">
        <h2>SEO</h2>
        <div className="two-col">
          <TextField label="SEO title (English)" recommended={[30, 60]} {...text("seoTitleEn")} />
          <TextField label="SEO title (Tamil)" lang="ta" recommended={[20, 80]} {...text("seoTitleTa")} />
          <TextField label="Meta description (English)" multiline recommended={[70, 160]} {...text("metaDescriptionEn")} />
          <TextField label="Meta description (Tamil)" lang="ta" multiline recommended={[60, 200]} {...text("metaDescriptionTa")} />
          <SerpPreview url={`${siteUrl}/en/${form.slug}/`} title={form.seoTitleEn} description={form.metaDescriptionEn} />
          <SerpPreview lang="ta" url={`${siteUrl}/ta/${form.slug}/`} title={form.seoTitleTa} description={form.metaDescriptionTa} />
          <TextField label="Primary keyword (internal note)" {...text("primaryKeyword")} />
          <TextField label="Supporting keywords (internal, one per line)" multiline rows={5} value={form.keywords} onChange={set("keywords")} hint="Guidance for writers only — never shown on the site." />
        </div>
        <details style={{ marginTop: 12 }}>
          <summary>Advanced: canonical URL &amp; indexing</summary>
          <TextField label="Canonical URL override" {...text("canonicalOverride")} hint="Leave empty (recommended)." />
          <Checkbox
            label="Allow search engines to index this category"
            checked={form.robotsIndex}
            onChange={(v) => (v || confirm("This removes the category page from Google results and the sitemap. Continue?")) && set("robotsIndex")(v)}
          />
        </details>
      </section>

      <section className="admin-card">
        <h2>Category image (optional)</h2>
        {form.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={form.imageUrl.startsWith("/uploads/") ? `${mediaBase}${form.imageUrl}` : form.imageUrl} alt="" style={{ maxWidth: 240, borderRadius: 8 }} />
        )}
        <ImageUpload name={form.slug} onUploaded={(img) => set("imageUrl")(img.url)} />
        <div className="two-col">
          <TextField label="Image alt text (English)" {...text("imageAltEn")} />
          <TextField label="Image alt text (Tamil)" lang="ta" {...text("imageAltTa")} />
        </div>
        {form.imageUrl && (
          <button type="button" className="link-button" onClick={() => set("imageUrl")("")}>
            Remove image
          </button>
        )}
      </section>

      <section className="admin-card">
        <h2>FAQs</h2>
        {form.faqs.map((f, i) => (
          <div key={i} className="two-col" style={{ borderBottom: "1px solid var(--border)", paddingBottom: 12, marginBottom: 12 }}>
            <TextField label={`Question ${i + 1} (English)`} value={f.qEn} onChange={(v) => setFaq(i, "qEn", v)} error={errors[`faqs.${i}.qEn`]} />
            <TextField label={`Question ${i + 1} (Tamil)`} lang="ta" value={f.qTa ?? ""} onChange={(v) => setFaq(i, "qTa", v)} />
            <TextField label="Answer (English)" multiline value={f.aEn} onChange={(v) => setFaq(i, "aEn", v)} error={errors[`faqs.${i}.aEn`]} />
            <TextField label="Answer (Tamil)" lang="ta" multiline value={f.aTa ?? ""} onChange={(v) => setFaq(i, "aTa", v)} />
            <button type="button" className="link-button" onClick={() => set("faqs")(form.faqs.filter((_, j) => j !== i))}>
              Remove FAQ
            </button>
          </div>
        ))}
        <button type="button" className="btn btn-secondary btn-small" onClick={() => set("faqs")([...form.faqs, { qEn: "", aEn: "", qTa: "", aTa: "" }])}>
          Add FAQ
        </button>
      </section>

      <SaveBar onSave={save} busy={busy} status={status} error={error}>
        <a className="btn btn-secondary btn-small" href={`/en/${category.slug}/`} target="_blank" rel="noopener">
          View English
        </a>
        <a className="btn btn-secondary btn-small" href={`/ta/${category.slug}/`} target="_blank" rel="noopener">
          View Tamil
        </a>
      </SaveBar>
    </div>
  );
}
