"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { toItem, track } from "@/lib/analytics";
import { formatPrice } from "@/lib/format";
import { localePath, paths } from "@/lib/site";
import { useCart } from "./CartProvider";
import { CartTotals, useLiveCart } from "./CartView";

type FieldName = "customerName" | "phone" | "email" | "addressLine1" | "addressLine2" | "city" | "state" | "pincode" | "notes";

const RULES: Partial<Record<FieldName, (v: string) => string | null>> = {
  customerName: (v) => (v.trim() ? null : "required"),
  phone: (v) => (/^(?:\+91|0)?[6-9][0-9]{9}$/.test(v.replace(/[\s-]/g, "")) ? null : v.trim() ? "invalid_phone" : "required"),
  email: (v) => (!v.trim() || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) ? null : "invalid_email"),
  addressLine1: (v) => (v.trim() ? null : "required"),
  city: (v) => (v.trim() ? null : "required"),
  state: (v) => (v.trim() ? null : "required"),
  pincode: (v) => (/^[1-9][0-9]{5}$/.test(v.trim()) ? null : v.trim() ? "invalid_pincode" : "required"),
};

export function CheckoutForm({ locale, shippingFee, codEnabled }: { locale: Locale; shippingFee: number; codEnabled: boolean }) {
  const t = getDictionary(locale);
  const router = useRouter();
  const { clear } = useCart();
  const { lines, ready } = useLiveCart(locale);
  const [values, setValues] = useState<Record<FieldName, string>>({
    customerName: "",
    phone: "",
    email: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: locale === "ta" ? "தமிழ்நாடு" : "Tamil Nadu",
    pincode: "",
    notes: "",
  });
  const [errors, setErrors] = useState<Partial<Record<FieldName, string>>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const tracked = useRef(false);
  const subtotal = lines.reduce((s, l) => s + Number(l.price) * l.quantity, 0);

  useEffect(() => {
    if (!ready || tracked.current || lines.length === 0) return;
    tracked.current = true;
    track("begin_checkout", {
      currency: "INR",
      value: subtotal,
      items: lines.map((l) => toItem({ sku: l.sku, name: l.name, category: l.categoryName, price: l.price }, l.quantity)),
    });
  }, [ready, lines, subtotal]);

  if (!ready) return <p aria-live="polite">{t.cart.loading}</p>;
  if (lines.length === 0) {
    return (
      <div>
        <p className="empty-state">{t.cart.empty}</p>
        <Link href={localePath(locale, "/")} className="btn btn-primary">
          {t.actions.continueShopping}
        </Link>
      </div>
    );
  }
  if (!codEnabled) return <p className="notice">{t.checkout.unavailable}</p>;

  const set = (name: FieldName) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setValues((v) => ({ ...v, [name]: e.target.value }));
    if (errors[name]) setErrors((er) => ({ ...er, [name]: undefined }));
  };

  const field = (name: FieldName, label: string, opts: { type?: string; autoComplete?: string; full?: boolean; textarea?: boolean; inputMode?: "numeric" | "tel" | "email" } = {}) => {
    const id = `checkout-${name}`;
    const err = errors[name];
    const props = {
      id,
      name,
      value: values[name],
      onChange: set(name),
      "aria-invalid": err ? true : undefined,
      "aria-describedby": err ? `${id}-error` : undefined,
      autoComplete: opts.autoComplete,
      required: Boolean(RULES[name]) && name !== "email",
    };
    return (
      <div className={`field ${opts.full ? "full" : ""}`}>
        <label htmlFor={id}>{label}</label>
        {opts.textarea ? <textarea rows={3} {...props} /> : <input type={opts.type ?? "text"} inputMode={opts.inputMode} {...props} />}
        {err && (
          <p id={`${id}-error`} className="field-error">
            {t.errors[err] ?? t.errors.generic}
          </p>
        )}
      </div>
    );
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const found: Partial<Record<FieldName, string>> = {};
    for (const [name, rule] of Object.entries(RULES) as [FieldName, (v: string) => string | null][]) {
      const code = rule(values[name]);
      if (code) found[name] = code;
    }
    setErrors(found);
    if (Object.keys(found).length) {
      setFormError(t.errors.fixFields);
      document.getElementById(`checkout-${Object.keys(found)[0]}`)?.focus();
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/store/orders", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ...values,
          email: values.email.trim() || null,
          addressLine2: values.addressLine2.trim() || null,
          notes: values.notes.trim() || null,
          locale,
          items: lines.map((l) => ({ productId: l.productId, quantity: l.quantity })),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 201) {
        clear();
        router.push(localePath(locale, paths.order(data.token)));
        return;
      }
      if (res.status === 400 && Array.isArray(data.fields)) {
        const serverErrors: Partial<Record<FieldName, string>> = {};
        for (const f of data.fields as { path: string; code: string }[]) {
          const name = f.path.split(".")[0] as FieldName;
          if (name in values) serverErrors[name] = f.code;
        }
        setErrors(serverErrors);
        setFormError(t.errors.fixFields);
      } else {
        setFormError(t.errors[data.error] ?? t.errors.generic);
      }
    } catch {
      setFormError(t.errors.generic);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="cart-layout">
      <form onSubmit={onSubmit} noValidate>
        {formError && (
          <p className="form-error" role="alert">
            {formError}{" "}
            {(formError === t.errors.out_of_stock || formError === t.errors.product_unavailable) && (
              <Link href={localePath(locale, paths.cart())}>{t.cart.title}</Link>
            )}
          </p>
        )}
        <fieldset>
          <legend>{t.checkout.contact}</legend>
          <div className="form-grid">
            {field("customerName", t.checkout.name, { autoComplete: "name", full: true })}
            {field("phone", t.checkout.phone, { type: "tel", autoComplete: "tel", inputMode: "tel" })}
            {field("email", t.checkout.email, { type: "email", autoComplete: "email", inputMode: "email" })}
          </div>
        </fieldset>
        <fieldset>
          <legend>{t.checkout.address}</legend>
          <div className="form-grid">
            {field("addressLine1", t.checkout.address1, { autoComplete: "address-line1", full: true })}
            {field("addressLine2", t.checkout.address2, { autoComplete: "address-line2", full: true })}
            {field("city", t.checkout.city, { autoComplete: "address-level2" })}
            {field("state", t.checkout.state, { autoComplete: "address-level1" })}
            {field("pincode", t.checkout.pincode, { autoComplete: "postal-code", inputMode: "numeric" })}
            {field("notes", t.checkout.notes, { full: true, textarea: true })}
          </div>
        </fieldset>
        <fieldset>
          <legend>{t.checkout.payment}</legend>
          <p style={{ margin: 0 }}>
            <strong>{t.checkout.cod}</strong>
          </p>
          <p className="muted small">{t.checkout.confirmNote}</p>
        </fieldset>
        <button type="submit" className="btn btn-primary" disabled={submitting} aria-busy={submitting}>
          {submitting ? t.checkout.placing : t.checkout.placeOrder}
        </button>
      </form>
      <aside className="summary-box" aria-label={t.checkout.summary}>
        <h2 className="h3-size">{t.checkout.summary}</h2>
        <ul className="cart-lines">
          {lines.map((l) => (
            <li key={l.productId} style={{ display: "flex", justifyContent: "space-between", gap: 8, padding: "6px 0" }}>
              <span>
                {l.name} × {l.quantity}
              </span>
              <span>{formatPrice(Number(l.price) * l.quantity, locale)}</span>
            </li>
          ))}
        </ul>
        <CartTotals subtotal={subtotal} shippingFee={shippingFee} locale={locale} />
      </aside>
    </div>
  );
}
