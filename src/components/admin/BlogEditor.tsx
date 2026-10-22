"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { adminFetch, diff } from "./client";
import { Checkbox, ImageUpload, SaveBar, SelectField, SerpPreview, SlugField, TextField } from "./fields";

const TEXT = [
  "slug", "titleEn", "titleTa", "excerptEn", "excerptTa", "bodyEn", "bodyTa", "authorName",
  "featuredImageUrl", "featuredImageAltEn", "featuredImageAltTa",
  "seoTitleEn", "seoTitleTa", "metaDescriptionEn", "metaDescriptionTa", "categoryId", "canonicalOverride",
] as const;
type TextKey = (typeof TEXT)[number];

export type AdminPost = {
  id: string;
  status: "DRAFT" | "PUBLISHED";
  robotsIndex: boolean;
  relatedProducts: { id: string }[];
} & Record<TextKey, string | null>;

type Form = Record<TextKey, string> & { status: "DRAFT" | "PUBLISHED"; robotsIndex: boolean; relatedProductIds: string[] };

const toForm = (p: AdminPost | null): Form => {
  const f = {} as Form;
  for (const k of TEXT) f[k] = p?.[k] ?? "";
  if (!p) f.authorName = "Pothigai Naturals";
  f.status = p?.status ?? "DRAFT";
  f.robotsIndex = p?.robotsIndex ?? true;
  f.relatedProductIds = p?.relatedProducts.map((r) => r.id) ?? [];
  return f;
};

export function BlogEditor({
  post,
  categories,
  products,
  siteUrl,
  mediaBase,
}: {
  post: AdminPost | null;
  categories: { id: string; nameEn: string }[];
  products: { id: string; nameEn: string; sku: string }[];
  siteUrl: string;
  mediaBase: string;
}) {
  const router = useRouter();
  const [saved, setSaved] = useState(() => toForm(post));
  const [form, setForm] = useState(saved);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [previewLang, setPreviewLang] = useState<"en" | "ta" | null>(null);
  const set = <K extends keyof Form>(k: K) => (v: Form[K]) => setForm((f) => ({ ...f, [k]: v }));
  const text = (k: TextKey) => ({ value: form[k], onChange: set(k), error: errors[k] });

  const save = async () => {
    const changes = post ? diff(saved, form) : form;
    if (post && Object.keys(changes).length === 0) return setStatus("No changes");
    const body: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(changes)) {
      body[k] = typeof v === "string" && !["slug", "titleEn", "authorName"].includes(k) && v.trim() === "" ? null : v;
    }
    setBusy(true);
    setError(null);
    const res = await adminFetch<AdminPost>(post ? `blog/${post.id}` : "blog", { method: post ? "PATCH" : "POST", body });
    setBusy(false);
    setErrors(res.fieldErrors);
    if (!res.ok) return setError(res.error);
    if (!post) return router.replace(`/admin/blog/${res.data.id}/`);
    const reloaded = await adminFetch<AdminPost>(`blog/${post.id}`);
    const next = toForm(reloaded.data);
    setSaved(next);
    setForm(next);
    setStatus("Saved");
    router.refresh();
  };

  const remove = async () => {
    if (!post || !confirm("Delete this post permanently?")) return;
    const res = await adminFetch(`blog/${post.id}`, { method: "DELETE" });
    if (res.ok) router.replace("/admin/blog/");
    else setError(res.error);
  };

  return (
    <div className="admin-form">
      <section className="admin-card">
        <h2>Post</h2>
        <div className="two-col">
          <TextField label="Title (English) *" {...text("titleEn")} />
          <TextField label="Title (Tamil)" lang="ta" {...text("titleTa")} />
          <SlugField value={form.slug} onChange={set("slug")} source={form.titleEn} error={errors.slug} prefix={`${siteUrl}/en/blog/`} />
          <TextField label="Author" {...text("authorName")} />
          <SelectField label="Topic (category)" value={form.categoryId} onChange={set("categoryId")} options={[{ value: "", label: "— none —" }, ...categories.map((c) => ({ value: c.id, label: c.nameEn }))]} />
          <SelectField
            label="Status"
            value={form.status}
            onChange={(v) => set("status")(v as Form["status"])}
            options={[
              { value: "DRAFT", label: "Draft (not public)" },
              { value: "PUBLISHED", label: "Published" },
            ]}
          />
        </div>
      </section>

      <section className="admin-card">
        <h2>Content</h2>
        <p className="hint">
          Markdown: <code>## Heading</code>, <code>**bold**</code>, <code>- list</code>, <code>[link text](/en/oils/)</code>. Raw HTML is not rendered.
          A language version goes live only when it has both a title and a body. Avoid health or medical claims without a cited source.
        </p>
        <div className="two-col">
          <TextField label="Excerpt (English)" multiline {...text("excerptEn")} />
          <TextField label="Excerpt (Tamil)" lang="ta" multiline {...text("excerptTa")} />
          <TextField label="Article body (English, Markdown)" multiline rows={16} {...text("bodyEn")} />
          <TextField label="Article body (Tamil, Markdown)" lang="ta" multiline rows={16} {...text("bodyTa")} />
        </div>
        <div className="inline-actions">
          <button type="button" className="btn btn-secondary btn-small" onClick={() => setPreviewLang(previewLang === "en" ? null : "en")}>
            {previewLang === "en" ? "Hide" : "Show"} English preview
          </button>
          <button type="button" className="btn btn-secondary btn-small" onClick={() => setPreviewLang(previewLang === "ta" ? null : "ta")}>
            {previewLang === "ta" ? "Hide" : "Show"} Tamil preview
          </button>
        </div>
        {previewLang && (
          <div className="prose admin-card" lang={previewLang === "ta" ? "ta-IN" : "en-IN"} style={{ marginTop: 12 }}>
            <ReactMarkdown skipHtml>{previewLang === "ta" ? form.bodyTa : form.bodyEn}</ReactMarkdown>
          </div>
        )}
      </section>

      <section className="admin-card">
        <h2>Featured image</h2>
        {form.featuredImageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={form.featuredImageUrl.startsWith("/uploads/") ? `${mediaBase}${form.featuredImageUrl}` : form.featuredImageUrl} alt="" style={{ maxWidth: 320, borderRadius: 8 }} />
        )}
        <ImageUpload name={form.slug} onUploaded={(img) => set("featuredImageUrl")(img.url)} />
        <div className="two-col">
          <TextField label="Alt text (English)" {...text("featuredImageAltEn")} />
          <TextField label="Alt text (Tamil)" lang="ta" {...text("featuredImageAltTa")} />
        </div>
      </section>

      <section className="admin-card">
        <h2>Related products</h2>
        <p className="hint">Linked products are shown under the article (only while they are published).</p>
        {products.length === 0 ? (
          <p className="hint">No products yet.</p>
        ) : (
          <div className="two-col">
            {products.map((p) => (
              <Checkbox
                key={p.id}
                label={`${p.nameEn} (${p.sku})`}
                checked={form.relatedProductIds.includes(p.id)}
                onChange={(on) => set("relatedProductIds")(on ? [...form.relatedProductIds, p.id] : form.relatedProductIds.filter((x) => x !== p.id))}
              />
            ))}
          </div>
        )}
      </section>

      <section className="admin-card">
        <h2>SEO</h2>
        <div className="two-col">
          <TextField label="SEO title (English)" recommended={[30, 60]} {...text("seoTitleEn")} />
          <TextField label="SEO title (Tamil)" lang="ta" recommended={[20, 80]} {...text("seoTitleTa")} />
          <TextField label="Meta description (English)" multiline recommended={[70, 160]} {...text("metaDescriptionEn")} />
          <TextField label="Meta description (Tamil)" lang="ta" multiline recommended={[60, 200]} {...text("metaDescriptionTa")} />
          <SerpPreview url={`${siteUrl}/en/blog/${form.slug}/`} title={form.seoTitleEn || `${form.titleEn} | Pothigai Naturals`} description={form.metaDescriptionEn || form.excerptEn} />
          <SerpPreview lang="ta" url={`${siteUrl}/ta/blog/${form.slug}/`} title={form.seoTitleTa || (form.titleTa ? `${form.titleTa} | பொத்திகை நேச்சுரல்ஸ்` : "")} description={form.metaDescriptionTa || form.excerptTa} />
        </div>
        <details style={{ marginTop: 12 }}>
          <summary>Advanced: canonical URL &amp; indexing</summary>
          <TextField label="Canonical URL override" {...text("canonicalOverride")} hint="Leave empty (recommended)." />
          <Checkbox label="Allow search engines to index this post" checked={form.robotsIndex} onChange={set("robotsIndex")} />
        </details>
      </section>

      <SaveBar onSave={save} busy={busy} status={status} error={error}>
        {post && (
          <>
            <a className="btn btn-secondary btn-small" href={`/api/admin-preview?path=/en/blog/${post.slug}/`} target="_blank" rel="noopener">
              Preview English
            </a>
            <a className="btn btn-secondary btn-small" href={`/api/admin-preview?path=/ta/blog/${post.slug}/`} target="_blank" rel="noopener">
              Preview Tamil
            </a>
            <button type="button" className="link-button" onClick={remove}>
              Delete post
            </button>
          </>
        )}
      </SaveBar>
    </div>
  );
}
