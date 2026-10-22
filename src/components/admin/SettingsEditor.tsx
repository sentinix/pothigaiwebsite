"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { adminFetch, diff } from "./client";
import { Checkbox, SaveBar, TextField } from "./fields";

const TEXT = [
  "contactEmail", "contactPhone", "whatsappNumber", "streetAddress", "addressLocality", "addressRegion", "postalCode",
  "deliveryInfoEn", "deliveryInfoTa", "returnPolicyEn", "returnPolicyTa", "flatShippingFee",
] as const;
type TextKey = (typeof TEXT)[number];
export type AdminSettings = { showAddress: boolean; codEnabled: boolean; socialLinks: string[] } & Record<TextKey, string | null>;
type Form = Record<TextKey, string> & { showAddress: boolean; codEnabled: boolean; socialLinks: string };

const toForm = (s: AdminSettings): Form => {
  const f = {} as Form;
  for (const k of TEXT) f[k] = s[k] == null ? "" : String(s[k]);
  f.showAddress = s.showAddress;
  f.codEnabled = s.codEnabled;
  f.socialLinks = s.socialLinks.join("\n");
  return f;
};

export function SettingsEditor({ settings }: { settings: AdminSettings }) {
  const router = useRouter();
  const [saved, setSaved] = useState(() => toForm(settings));
  const [form, setForm] = useState(saved);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const set = <K extends keyof Form>(k: K) => (v: Form[K]) => setForm((f) => ({ ...f, [k]: v }));
  const text = (k: TextKey) => ({ value: form[k], onChange: set(k), error: errors[k] });

  const save = async () => {
    const changes = diff(saved, form);
    if (!Object.keys(changes).length) return setStatus("No changes");
    const body: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(changes)) {
      if (k === "socialLinks") body[k] = String(v).split("\n").map((s) => s.trim()).filter(Boolean);
      else if (k === "flatShippingFee") body[k] = Number(v || 0);
      else body[k] = typeof v === "string" ? (v.trim() === "" ? null : v) : v;
    }
    setBusy(true);
    setError(null);
    const res = await adminFetch<AdminSettings>("settings", { method: "PATCH", body });
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
        <h2>Contact details</h2>
        <div className="two-col">
          <TextField label="Contact email" type="email" {...text("contactEmail")} />
          <TextField label="Contact phone" {...text("contactPhone")} hint="Include the country code, e.g. +91 …" />
          <TextField label="WhatsApp number" {...text("whatsappNumber")} />
        </div>
      </section>
      <section className="admin-card">
        <h2>Business address</h2>
        <p className="hint">Only for a verified address customers can visit or that appears on your Google Business Profile. Online-only stores should leave this hidden.</p>
        <div className="two-col">
          <TextField label="Street address" {...text("streetAddress")} />
          <TextField label="Town / city" {...text("addressLocality")} />
          <TextField label="State" {...text("addressRegion")} />
          <TextField label="PIN code" {...text("postalCode")} />
        </div>
        <Checkbox label="Show this address on the website and in Organization structured data" checked={form.showAddress} onChange={set("showAddress")} />
      </section>
      <section className="admin-card">
        <h2>Delivery &amp; returns</h2>
        <div className="two-col">
          <TextField label="Delivery information (English)" multiline rows={4} {...text("deliveryInfoEn")} hint="e.g. areas you deliver to and typical timelines — only what you can honour." />
          <TextField label="Delivery information (Tamil)" lang="ta" multiline rows={4} {...text("deliveryInfoTa")} />
          <TextField label="Returns policy (English)" multiline rows={4} {...text("returnPolicyEn")} />
          <TextField label="Returns policy (Tamil)" lang="ta" multiline rows={4} {...text("returnPolicyTa")} />
          <TextField label="Flat shipping fee per order (₹)" type="number" {...text("flatShippingFee")} hint="0 shows shipping as free." />
        </div>
        <Checkbox label="Accept cash-on-delivery orders online" checked={form.codEnabled} onChange={set("codEnabled")} hint="Turn off to pause online ordering." />
      </section>
      <section className="admin-card">
        <h2>Social profiles</h2>
        <TextField label="Profile URLs (one per line)" multiline {...text("socialLinks" as TextKey)} value={form.socialLinks} onChange={set("socialLinks")} hint="Used as sameAs in Organization structured data." />
      </section>
      <SaveBar onSave={save} busy={busy} status={status} error={error} />
    </div>
  );
}
