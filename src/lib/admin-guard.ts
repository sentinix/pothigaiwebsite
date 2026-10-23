import "server-only";
import type { NextRequest } from "next/server";

/**
 * Rejects cross-site state-changing requests. The admin cookie is also
 * SameSite=Strict; this is a second, explicit CSRF check.
 */
export function isSameOrigin(req: NextRequest): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return req.method === "GET" || req.method === "HEAD";
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}
