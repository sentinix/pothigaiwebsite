"use client";
import { useId } from "react";
import { slugify } from "./client";

const ERROR_TEXT: Record<string, string> = {
  required: "Required",
  too_long: "Too long",
  invalid_slug: "Use lowercase letters, numbers and hyphens only",
  reserved_slug: "This slug is reserved for site pages",
  invalid_sku: "Letters, numbers, dot, dash and underscore only",
  must_be_positive: "Must be greater than zero",
  invalid_number: "Enter a number",
  sale_price_must_be_below_price: "Sale price must be lower than the price",
  canonical_must_be_same_site_absolute_url: "Must be a full URL on this website (https://…)",
  invalid_image_url: "Upload an image or use an https:// URL",
  invalid_email: "Invalid email",
  invalid_phone: "Invalid phone number",
  invalid_pincode: "6-digit PIN code",
  invalid_url: "Invalid URL",
  unknown_category: "Choose a category",
  homepage_must_be_indexable: "The homepage must stay indexable",
  required_to_publish: "Add the article body before publishing",
};

export const errorText = (code?: string) => (code ? (ERROR_TEXT[code] ?? code) : undefined);

export function TextField({
  label,
  value,
  onChange,
  error,
  hint,
  multiline,
  rows = 3,
  lang,
  recommended,
  type = "text",
  placeholder,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  hint?: string;
  multiline?: boolean;
  rows?: number;
  lang?: "ta" | "en";
  recommended?: [number, number];
  type?: string;
  placeholder?: string;
  required?: boolean;
}) {
  const id = useId();
  const len = value.length;
  const counterClass = recommended ? (len > recommended[1] ? "bad" : len > 0 && len < recommended[0] ? "warn" : "") : "";
  const props = {
    id,
    value,
    lang: lang === "ta" ? "ta-IN" : undefined,
    placeholder,
    required,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": error || hint ? `${id}-desc` : undefined,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChange(e.target.value),
  };
  return (
    <div className="field">
      <label htmlFor={id}>
        {label}
        {recommended && (
          <span className={`counter ${counterClass}`}>
            {len} chars · aim {recommended[0]}–{recommended[1]}
          </span>
        )}
      </label>
      {multiline ? <textarea rows={rows} {...props} /> : <input type={type} {...props} />}
      {(error || hint) && (
        <p id={`${id}-desc`} className={error ? "field-error" : "hint"}>
          {errorText(error) ?? hint}
        </p>
      )}
    </div>
  );
}

export function Checkbox({ label, checked, onChange, hint }: { label: string; checked: boolean; onChange: (v: boolean) => void; hint?: string }) {
  const id = useId();
  return (
    <div className="check">
      <input id={id} type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <label htmlFor={id}>
        {label}
        {hint && <span className="hint" style={{ display: "block" }}>{hint}</span>}
      </label>
    </div>
  );
}

export function SelectField({
  label,
  value,
  onChange,
  options,
  error,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  error?: string;
}) {
  const id = useId();
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)} aria-invalid={error ? true : undefined}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {error && <p className="field-error">{errorText(error)}</p>}
    </div>
  );
}

export function SlugField({ value, onChange, source, error, prefix }: { value: string; onChange: (v: string) => void; source: string; error?: string; prefix: string }) {
  return (
    <div>
      <TextField label="URL slug" value={value} onChange={(v) => onChange(v.toLowerCase())} error={error} hint={`URL: ${prefix}${value || "…"}/ — changing it later creates a permanent redirect automatically.`} />
      {source && slugify(source) !== value && (
        <button type="button" className="btn btn-secondary btn-small" onClick={() => onChange(slugify(source))}>
          Use “{slugify(source)}”
        </button>
      )}
    </div>
  );
}

/** Approximation of a Google result snippet (Google may rewrite titles and snippets). */
export function SerpPreview({ title, description, url, lang }: { title: string; description: string; url: string; lang?: "en" | "ta" }) {
  return (
    <div className="serp" lang={lang === "ta" ? "ta-IN" : "en-IN"} aria-label="Search result preview">
      <div className="serp-url">{url}</div>
      <div className="serp-title">{title || "(missing title)"}</div>
      <div className="serp-desc">{description || "(missing meta description — Google will pick text from the page)"}</div>
    </div>
  );
}

export function SaveBar({ onSave, busy, status, error, children }: { onSave: () => void; busy: boolean; status: string | null; error: string | null; children?: React.ReactNode }) {
  return (
    <div className="save-bar">
      <button type="button" className="btn btn-primary" onClick={onSave} disabled={busy}>
        {busy ? "Saving…" : "Save changes"}
      </button>
      {children}
      <span role="status" className={error ? "status-err" : "status-ok"}>
        {error ?? status ?? ""}
      </span>
    </div>
  );
}

export function ImageUpload({ onUploaded, name }: { onUploaded: (img: { url: string; width: number; height: number }) => void; name?: string }) {
  const id = useId();
  return (
    <div className="field">
      <label htmlFor={id}>Upload image (JPEG, PNG, WebP — converted to WebP)</label>
      <input
        id={id}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          const form = new FormData();
          form.append("file", file);
          if (name) form.append("name", name);
          const res = await fetch("/api/admin/uploads", { method: "POST", body: form });
          const data = await res.json().catch(() => ({}));
          if (res.ok) onUploaded(data);
          else alert(data.message ?? "Upload failed");
          e.target.value = "";
        }}
      />
    </div>
  );
}
