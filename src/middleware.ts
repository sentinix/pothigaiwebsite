import { NextResponse, type NextRequest } from "next/server";

const LOCALES = ["en", "ta"];
const ADMIN_COOKIE = "pn_admin";
const LOCALE_COOKIE = "NEXT_LOCALE";

function preferredLocale(req: NextRequest): "en" | "ta" {
  const cookie = req.cookies.get(LOCALE_COOKIE)?.value;
  if (cookie === "en" || cookie === "ta") return cookie;
  const header = req.headers.get("accept-language") ?? "";
  const langs = header
    .split(",")
    .map((part) => {
      const [tag, q] = part.trim().split(";q=");
      return { tag: tag.toLowerCase(), q: q ? Number(q) : 1 };
    })
    .sort((a, b) => b.q - a.q);
  const top = langs.find((l) => l.tag.startsWith("ta") || l.tag.startsWith("en"));
  return top?.tag.startsWith("ta") ? "ta" : "en";
}

export function middleware(req: NextRequest) {
  // req.nextUrl normalises trailing slashes away, so read the raw request URL.
  const { pathname, search } = new URL(req.url);
  const to = (path: string, status: 307 | 308) => NextResponse.redirect(new URL(`${path}${search}`, req.url), status);

  // One URL per page: "/en/oils" permanently moves to "/en/oils/".
  if (pathname !== "/" && !pathname.endsWith("/")) {
    const first = pathname.split("/")[1];
    const isKnownRoot = LOCALES.includes(first) || first === "admin";
    return to(isKnownRoot ? `${pathname}/` : `/en${pathname}/`, 308);
  }

  // Admin UI: bounce to login when there is no session cookie. The API still
  // verifies the token on every request; this only improves the UX.
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    if (!pathname.startsWith("/admin/login") && !req.cookies.get(ADMIN_COOKIE)) {
      return NextResponse.redirect(new URL(`/admin/login/?next=${encodeURIComponent(pathname)}`, req.url), 307);
    }
    return NextResponse.next();
  }

  const first = pathname.split("/")[1];
  if (LOCALES.includes(first)) {
    // Lets not-found.tsx (which receives no params) render in the right language.
    const headers = new Headers(req.headers);
    headers.set("x-pathname", pathname);
    return NextResponse.next({ request: { headers } });
  }

  // "/" is a language-selection entry point: send visitors to their language.
  if (pathname === "/") {
    const res = to(`/${preferredLocale(req)}/`, 307);
    res.headers.set("Vary", "Accept-Language, Cookie");
    return res;
  }

  // Locale-less legacy URLs (e.g. /oils/) permanently move to the English URL.
  return to(`/en${pathname}`, 308);
}

export const config = {
  // Skip Next internals, API routes and files with an extension (robots.txt, sitemap.xml, images).
  matcher: ["/((?!_next/|api/|.*\\.[a-zA-Z0-9]+$).*)"],
};
