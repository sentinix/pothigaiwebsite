"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export function LoginForm() {
  const router = useRouter();
  const next = useSearchParams().get("next");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/admin-auth/login/", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: form.get("email"), password: form.get("password") }),
    });
    setBusy(false);
    if (res.ok) {
      // Only allow same-site admin paths as the post-login destination.
      router.replace(next && /^\/admin(\/|$)/.test(next) ? next : "/admin/");
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.message ?? "Sign in failed");
    }
  };

  return (
    <form onSubmit={onSubmit} className="admin-form">
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <div className="field">
        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" autoComplete="username" required />
      </div>
      <div className="field">
        <label htmlFor="password">Password</label>
        <input id="password" name="password" type="password" autoComplete="current-password" required />
      </div>
      <button type="submit" className="btn btn-primary" disabled={busy}>
        {busy ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
