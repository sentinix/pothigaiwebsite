import { revalidateTag } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_COOKIE } from "@/lib/admin-session";
import { isSameOrigin } from "@/lib/admin-guard";
import { API_URL, CONTENT_TAG } from "@/lib/api";

// Authenticated proxy from the admin UI to the API. The JWT stays in an
// httpOnly cookie and is attached here, server-side; the API enforces the
// ADMIN role on every request.
async function forward(req: NextRequest, segments: string[]) {
  if (req.method !== "GET" && !isSameOrigin(req)) {
    return NextResponse.json({ error: "forbidden", message: "Cross-site request blocked" }, { status: 403 });
  }
  const token = req.cookies.get(ADMIN_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: "unauthenticated", message: "Please sign in" }, { status: 401 });
  if (segments.some((s) => s === ".." || s.includes("/"))) return NextResponse.json({ error: "bad_request" }, { status: 400 });

  const headers: Record<string, string> = { Authorization: `Bearer ${token}` };
  const contentType = req.headers.get("content-type");
  if (contentType) headers["content-type"] = contentType;
  const hasBody = !["GET", "HEAD"].includes(req.method);
  const res = await fetch(`${API_URL}/api/admin/${segments.map(encodeURIComponent).join("/")}${req.nextUrl.search}`, {
    method: req.method,
    headers,
    body: hasBody ? await req.arrayBuffer() : undefined,
    cache: "no-store",
  });

  // Any successful edit refreshes cached storefront pages and the sitemap.
  if (hasBody && res.ok) revalidateTag(CONTENT_TAG);

  const out = new NextResponse(res.status === 204 ? null : await res.arrayBuffer(), { status: res.status });
  for (const h of ["content-type", "content-disposition"]) {
    const v = res.headers.get(h);
    if (v) out.headers.set(h, v);
  }
  out.headers.set("cache-control", "no-store");
  if (res.status === 401) out.cookies.delete(ADMIN_COOKIE);
  return out;
}

type Ctx = { params: Promise<{ path: string[] }> };
const handler = async (req: NextRequest, ctx: Ctx) => forward(req, (await ctx.params).path);
export { handler as GET, handler as POST, handler as PUT, handler as PATCH, handler as DELETE };
