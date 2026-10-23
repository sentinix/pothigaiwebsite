import { draftMode } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { isSameOrigin } from "@/lib/admin-guard";
import { ADMIN_COOKIE } from "@/lib/admin-session";

export async function POST(req: NextRequest) {
  if (!isSameOrigin(req)) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  (await draftMode()).disable();
  const out = NextResponse.redirect(new URL("/admin/login/", req.url), 303);
  out.cookies.delete(ADMIN_COOKIE);
  return out;
}
