import { NextResponse, type NextRequest } from "next/server";
import { isSameOrigin } from "@/lib/admin-guard";
import { ADMIN_COOKIE } from "@/lib/admin-session";
import { API_URL } from "@/lib/api";

export async function POST(req: NextRequest) {
  if (!isSameOrigin(req)) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const body = await req.text();
  const res = await fetch(`${API_URL}/api/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": req.headers.get("x-forwarded-for") ?? "" },
    body,
    cache: "no-store",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.user?.role !== "ADMIN") {
    return NextResponse.json(
      { error: data.error ?? "invalid_credentials", message: data.message ?? "Invalid email or password" },
      { status: res.status === 429 ? 429 : 401 },
    );
  }
  const out = NextResponse.json({ ok: true, user: { email: data.user.email } });
  out.cookies.set(ADMIN_COOKIE, data.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 8 * 60 * 60,
  });
  return out;
}
