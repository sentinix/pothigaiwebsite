"use client";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { adminFetch, diff } from "./client";
import { Checkbox, ImageUpload, SaveBar, SelectField, SerpPreview, SlugField, TextField } from "./fields";

const TEXT_FIELDS = [
  "nameEn", "nameTa", "slug", "sku", "categoryId",
  "shortDescriptionEn", "shortDescriptionTa", "descriptionEn", "descriptionTa",
  "seoTitleEn", "seoTitleTa", "metaDescriptionEn", "metaDescriptionTa",
  "price", "salePrice", "stockQuantity", "packSize", "packUnit",
  "ingredientsEn", "ingredientsTa", "originEn", "originTa", "extractionMethodEn", "extractionMethodTa",
  "gradeEn", "gradeTa", "storageEn", "storageTa", "cookingEn", "cookingTa",
  "allergensEn", "allergensTa", "shippingInfoEn", "shippingInfoTa", "canonicalOverride",
] as const;
type TextKey = (typeof TEXT_FIELDS)[number];

export interface AdminImage {
  url: string;
  altEn: string | null;
  altTa: string | null;
  width: number | null;
  height: number | null;
}

export type AdminProduct = { id: string; isPublished: boolean; isFeatured: boolean; robotsIndex: boolean; originVerified: boolean; images: AdminImage[]; category: { slug: string } } & Record<TextKey, string | number | null>;

type Form = Record<TextKey, string> & { isPublished: boolean; isFeatured: boolean; robotsIndex: boolean; originVerified: boolean; images: AdminImage[] };

function toForm(p: AdminProduct | null, defaultCategory: string): Form {
  const f = {} as Form;
  for (const k of TEXT_FIELDS) f[k] = p?.[k] == null ? "" : String(p[k]);
  if (!p) f.categoryId = defaultCategory;
  f.isPublished = p?.isPublished ?? false;
  f.isFeatured = p?.isFeatured ?? false;
  f.robotsIndex = p?.robotsIndex ?? true;
  f.originVerified = p?.originVerified ?? false;
  f.images = p?.images.map(({ url, altEn, altTa, width, height }) => ({ url, altEn, altTa, width, height })) ?? [];
  return f;
}

/** Converts form strings to API types: "" → null, numeric fields → numbers. */
function toPayload(f: Partial<Form>) {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(f)) {
    if (["price", "stockQuantity"].includes(k)) out[k] = v === "" ? undefined : Number(v);
    else if (["salePrice", "packSize"].includes(k)) out[k] = v === "" ? null : Number(v);
    else if (typeof v === "string" && !["slug", "sku", "nameEn", "categoryId"].includes(k)) out[k] = v.trim() === "" ? null : v;
    else out[k] = v;
  }
  return out;
}

export function ProductEditor({
  product,
  categories,
  mediaBase,
  siteUrl,
}: {
  product: AdminProduct | null;
  categories: { id: string; slug: string; nameEn: string }[];
  mediaBase: string;
  siteUrl: string;
}) {
  const router = useRouter();
  const initial = useMemo(() => toForm(product, categories[0]?.id ?? ""), [product, categories]);
  const [form, setForm] = useState<Form>(initial);
  const [saved, setSaved] = useState<Form>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof Form>(k: K) => (v: Form[K]) => setForm((f) => ({ ...f, [k]: v }));
  const text = (k: TextKey) => ({ value: form[k], onChange: set(k), error: errors[k] });
  const categorySlug = categories.find((c) => c.id === form.categoryId)?.slug ?? "category";
  const path = `/${categorySlug}/${form.slug || "product-slug"}/`;
  const src = (url: string) => (url.startsWith("/uploads/") ? `${mediaBase}${url}` : url);

  const suggest = async () => {
    const res = await adminFetch<Record<string, string | null>>("products/suggest-seo", {
      method: "POST",
      body: { nameEn: form.nameEn, nameTa: form.nameTa, categoryId: form.categoryId },
    });
    if (!res.ok) return setError(res.error);
    setForm((f) => {
      const next = { ...f };
      for (const [k, v] of Object.entries(res.data)) {
        // Suggestions only fill empty fields; existing copy is never replaced.
        if (v && (next[k as TextKey] ?? "") === "") next[k as TextKey] = v;
      }
      return next;
    });
    setStatus("Suggestions added to empty fields — review them before saving.");
  };

  const save = async () => {
    setBusy(true);
    setError(null);
    setStatus(null);
    const changes = product ? diff(saved, form) : form;
    if (product && Object.keys(changes).length === 0) {
      setBusy(false);
      return setStatus("No changes");
    }
    const res = await adminFetch<AdminProduct>(product ? `products/${product.id}` : "products", {
      method: product ? "PATCH" : "POST",
      body: toPayload(changes),
    });
    setBusy(false);
    setErrors(res.fieldErrors);
    if (!res.ok) return setError(res.error);
    if (!product) return router.replace(`/admin/products/${res.data.id}/`);
    const next = toForm(res.data, "");
    setForm(next);
    setSaved(next);
    setStatus("Saved");
    router.refresh();
  };

  return (
    <div className="admin-form">
      <section className="admin-card">
        <h2>Basics</h2>
        <div className="two-col">
          <TextField label="Name (English) *" {...text("nameEn")} />
          <TextField label="Name (Tamil)" lang="ta" {...text("nameTa")} />
          <SlugField value={form.slug} onChange={set("slug")} source={form.nameEn} error={errors.slug} prefix={`${siteUrl}/en/${categorySlug}/`} />
          <TextField label="SKU *" {...text("sku")} />
          <SelectField label="Category *" value={form.categoryId} onChange={set("categoryId")} options={categories.map((c) => ({ value: c.id, label: c.nameEn }))} error={errors.categoryId} />
        </div>
        <div className="inline-actions" style={{ marginTop: 12 }}>
          <Checkbox label="Published (visible in the store and sitemap)" checked={form.isPublished} onChange={set("isPublished")} />
          <Checkbox label="Featured on homepage" checked={form.isFeatured} onChange={set("isFeatured")} />
        </div>
      </section>

      <section className="admin-card">
        <h2>Price, stock &amp; pack</h2>
        <div className="two-col">
          <TextField label="Price (₹) *" type="number" {...text("price")} />
          <TextField label="Sale price (₹)" type="number" {...text("salePrice")} hint="Leave empty when there is no discount." />
          <TextField label="Stock quantity *" type="number" {...text("stockQuantity")} hint="Availability (in stock / out of stock) is derived from this." />
          <div className="two-col">
            <TextField label="Pack size" type="number" {...text("packSize")} />
            <SelectField label="Unit" value={form.packUnit} onChange={set("packUnit")} options={[{ value: "", label: "—" }, ...["g", "kg", "ml", "l", "pcs", "pack"].map((u) => ({ value: u, label: u }))]} />
          </div>
        </div>
      </section>

      <section className="admin-card">
        <h2>Descriptions</h2>
        <p className="hint">Only state facts you can verify from the product label or supplier (no unverified health, organic or cold-pressed claims).</p>
        <div className="two-col">
          <TextField label="Short description (English)" multiline rows={2} {...text("shortDescriptionEn")} />
          <TextField label="Short description (Tamil)" lang="ta" multiline rows={2} {...text("shortDescriptionTa")} />
          <TextField label="Full description (English)" multiline rows={6} {...text("descriptionEn")} />
          <TextField label="Full description (Tamil)" lang="ta" multiline rows={6} {...text("descriptionTa")} hint="The Tamil page is only indexed once the Tamil name and a Tamil description exist." />
        </div>
      </section>

      <section className="admin-card">
        <h2>Product details</h2>
        <div className="two-col">
          <TextField label="Grade / variety (English)" {...text("gradeEn")} />
          <TextField label="Grade / variety (Tamil)" lang="ta" {...text("gradeTa")} />
          <TextField label="Ingredients (English)" multiline {...text("ingredientsEn")} />
          <TextField label="Ingredients (Tamil)" lang="ta" multiline {...text("ingredientsTa")} />
          <TextField label="Extraction method (oils, English)" {...text("extractionMethodEn")} />
          <TextField label="Extraction method (oils, Tamil)" lang="ta" {...text("extractionMethodTa")} />
          <TextField label="Origin (English)" {...text("originEn")} />
          <TextField label="Origin (Tamil)" lang="ta" {...text("originTa")} />
        </div>
        <Checkbox label="Origin is verified (origin is hidden from customers until this is ticked)" checked={form.originVerified} onChange={set("originVerified")} />
        <div className="two-col" style={{ marginTop: 12 }}>
          <TextField label="Storage instructions (English)" multiline {...text("storageEn")} />
          <TextField label="Storage instructions (Tamil)" lang="ta" multiline {...text("storageTa")} />
          <TextField label="Cooking instructions (English)" multiline {...text("cookingEn")} />
          <TextField label="Cooking instructions (Tamil)" lang="ta" multiline {...text("cookingTa")} />
          <TextField label="Allergen information (English)" multiline {...text("allergensEn")} />
          <TextField label="Allergen information (Tamil)" lang="ta" multiline {...text("allergensTa")} />
          <TextField label="Shipping & returns (English)" multiline {...text("shippingInfoEn")} hint="Leave empty to use the store-wide delivery and returns text." />
          <TextField label="Shipping & returns (Tamil)" lang="ta" multiline {...text("shippingInfoTa")} />
        </div>
      </section>

      <section className="admin-card">
        <h2>Images</h2>
        <p className="hint">The first image is the main product image. Alt text should describe the image (e.g. “1 kg pack of Mapillai Samba rice”), not list keywords.</p>
        {form.images.map((img, i) => (
          <div key={img.url + i} className="image-row">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src(img.url)} alt="" />
            <div>
              <div className="two-col">
                <TextField label="Alt text (English)" value={img.altEn ?? ""} onChange={(v) => set("images")(form.images.map((x, j) => (j === i ? { ...x, altEn: v } : x)))} error={errors[`images.${i}.altEn`]} />
                <TextField label="Alt text (Tamil)" lang="ta" value={img.altTa ?? ""} onChange={(v) => set("images")(form.images.map((x, j) => (j === i ? { ...x, altTa: v } : x)))} />
              </div>
              <div className="inline-actions">
                <button type="button" className="btn btn-secondary btn-small" disabled={i === 0} onClick={() => set("images")([form.images[i], ...form.images.filter((_, j) => j !== i)])}>
                  Make main image
                </button>
                <button type="button" className="link-button" onClick={() => set("images")(form.images.filter((_, j) => j !== i))}>
                  Remove
                </button>
              </div>
            </div>
          </div>
        ))}
        <ImageUpload name={form.slug || form.nameEn} onUploaded={(img) => set("images")([...form.images, { url: img.url, width: img.width, height: img.height, altEn: form.nameEn || null, altTa: form.nameTa || null }])} />
      </section>

      <section className="admin-card">
        <h2>Search engine optimisation</h2>
        <p className="hint">
          Leave empty to use the brand template (e.g. “Buy {"{name}"} Online | Pothigai Naturals”). Each product should have its own
          description based on its real details.
        </p>
        <button type="button" className="btn btn-secondary btn-small" onClick={suggest} disabled={!form.nameEn || !form.categoryId}>
          Suggest SEO copy from templates
        </button>
        <div className="two-col" style={{ marginTop: 12 }}>
          <TextField label="SEO title (English)" recommended={[30, 60]} {...text("seoTitleEn")} />
          <TextField label="SEO title (Tamil)" lang="ta" recommended={[20, 80]} {...text("seoTitleTa")} />
          <TextField label="Meta description (English)" multiline recommended={[70, 160]} {...text("metaDescriptionEn")} />
          <TextField label="Meta description (Tamil)" lang="ta" multiline recommended={[60, 200]} {...text("metaDescriptionTa")} />
          <SerpPreview url={`${siteUrl}/en${path}`} title={form.seoTitleEn || `Buy ${form.nameEn} Online | Pothigai Naturals`} description={form.metaDescriptionEn} />
          <SerpPreview lang="ta" url={`${siteUrl}/ta${path}`} title={form.seoTitleTa || (form.nameTa ? `${form.nameTa} ஆன்லைனில் வாங்க | பொத்திகை நேச்சுரல்ஸ்` : "")} description={form.metaDescriptionTa} />
        </div>
        <details style={{ marginTop: 12 }}>
          <summary>Advanced: canonical URL &amp; indexing</summary>
          <TextField label="Canonical URL override" {...text("canonicalOverride")} hint="Leave empty (recommended). Only set this to point at another page on this site that duplicates this one." />
          <Checkbox
            label="Allow search engines to index this product"
            checked={form.robotsIndex}
            onChange={(v) => (v || confirm("Turning indexing off removes this product from Google results and the sitemap. Continue?")) && set("robotsIndex")(v)}
          />
        </details>
      </section>

      <SaveBar onSave={save} busy={busy} status={status} error={error}>
        {product && (
          <>
            <a className="btn btn-secondary btn-small" href={`/api/admin-preview?path=/en${encodeURI(path)}`} target="_blank" rel="noopener">
              Preview English
            </a>
            <a className="btn btn-secondary btn-small" href={`/api/admin-preview?path=/ta${encodeURI(path)}`} target="_blank" rel="noopener">
              Preview Tamil
            </a>
          </>
        )}
      </SaveBar>
    </div>
  );
}
