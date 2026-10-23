import { draftMode } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_COOKIE } from "@/lib/admin-session";

// Enables Next.js draft mode for signed-in admins so unpublished products and
// posts can be previewed. Draft pages are rendered noindex and uncached.
export async function GET(req: NextRequest) {
  const path = req.nextUrl.searchParams.get("path") ?? "";
  const exit = req.nextUrl.searchParams.get("exit") === "1";
  if (!/^\/(en|ta)\/[a-z0-9\-/]*$/.test(path)) return NextResponse.json({ error: "invalid_path" }, { status: 400 });
  if (exit) {
    (await draftMode()).disable();
  } else {
    if (!req.cookies.get(ADMIN_COOKIE)) return NextResponse.redirect(new URL("/admin/login/", req.url));
    (await draftMode()).enable();
  }
  return NextResponse.redirect(new URL(path, req.url));
}
