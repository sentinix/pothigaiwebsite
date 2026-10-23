"use client";

export interface ApiResult<T> {
  ok: boolean;
  status: number;
  data: T;
  error: string | null;
  fieldErrors: Record<string, string>;
}

/** Calls the admin proxy and normalises validation errors into a field → code map. */
export async function adminFetch<T = unknown>(path: string, init: { method?: string; body?: unknown } = {}): Promise<ApiResult<T>> {
  const isForm = init.body instanceof FormData;
  const res = await fetch(`/api/admin/${path.replace(/^\/+/, "")}`, {
    method: init.method ?? "GET",
    headers: init.body && !isForm ? { "content-type": "application/json" } : undefined,
    body: init.body === undefined ? undefined : isForm ? (init.body as FormData) : JSON.stringify(init.body),
  });
  if (res.status === 401) window.location.href = "/admin/login/";
  const data = res.status === 204 ? null : await res.json().catch(() => null);
  const fieldErrors: Record<string, string> = {};
  const fields = (data?.fields ?? data?.details?.fields) as { path: string; code: string }[] | undefined;
  for (const f of fields ?? []) fieldErrors[f.path] = f.code;
  return {
    ok: res.ok,
    status: res.status,
    data: data as T,
    error: res.ok ? null : (data?.message ?? `Request failed (${res.status})`),
    fieldErrors,
  };
}

/** Returns only the keys whose values differ, so saves never touch untouched fields. */
export function diff<T extends Record<string, unknown>>(initial: T, current: T): Partial<T> {
  const out: Partial<T> = {};
  for (const k of Object.keys(current) as (keyof T)[]) {
    if (JSON.stringify(initial[k]) !== JSON.stringify(current[k])) out[k] = current[k];
  }
  return out;
}

export const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100);
