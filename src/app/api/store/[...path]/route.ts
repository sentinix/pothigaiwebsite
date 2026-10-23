import { NextResponse, type NextRequest } from "next/server";
import { API_URL } from "@/lib/api";

// Same-origin proxy for the few public API calls made from the browser, so the
// API origin needs no CORS exposure. Only these routes are forwarded.
const ALLOWED: { method: string; pattern: RegExp }[] = [
  { method: "GET", pattern: /^products$/ },
  { method: "POST", pattern: /^orders$/ },
  { method: "POST", pattern: /^orders\/[A-Za-z0-9_-]{20,64}\/analytics$/ },
];

async function forward(req: NextRequest, segments: string[]) {
  const path = segments.join("/");
  if (!ALLOWED.some((a) => a.method === req.method && a.pattern.test(path))) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  const res = await fetch(`${API_URL}/api/public/${path}${req.nextUrl.search}`, {
    method: req.method,
    headers: { "content-type": "application/json" },
    body: req.method === "GET" ? undefined : await req.text(),
    cache: "no-store",
  });
  return new NextResponse(await res.text(), {
    status: res.status,
    headers: { "content-type": res.headers.get("content-type") ?? "application/json", "cache-control": "no-store" },
  });
}

type Ctx = { params: Promise<{ path: string[] }> };
export async function GET(req: NextRequest, ctx: Ctx) {
  return forward(req, (await ctx.params).path);
}
export async function POST(req: NextRequest, ctx: Ctx) {
  return forward(req, (await ctx.params).path);
}
