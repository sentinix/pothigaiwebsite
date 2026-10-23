# Pothigai Naturals — Storefront

Bilingual (English / Tamil) online store and admin dashboard for **Pothigai Naturals** — *Nature's Goodness. Tradition in Every Bite.* / *இயற்கையின் நன்மை. பாரம்பரியத்தின் சுவை.*

**Stack:** Next.js 15 (App Router, server-rendered), React 19, TypeScript, self-hosted Noto Sans/Serif + Noto Sans/Serif Tamil fonts. Data comes from the API in [`sentinix/pothigai_website_backend`](https://github.com/sentinix/pothigai_website_backend).

## Quick start

```bash
cp .env.example .env.local     # set NEXT_PUBLIC_SITE_URL and API_URL
npm install
npm run dev                    # http://localhost:3000 (API must be running)
```

## URL structure

| Page | English | Tamil |
|---|---|---|
| Home | `/en/` | `/ta/` |
| Category | `/en/traditional-rice/`, `/en/oils/`, `/en/nuts-dry-fruits/`, `/en/millets/`, `/en/pulses/`, `/en/spices/` | same under `/ta/` |
| Product | `/en/{category}/{product-slug}/` | `/ta/{category}/{product-slug}/` |
| Blog | `/en/blog/`, `/en/blog/{slug}/` | `/ta/blog/…` |
| About / Contact | `/en/about/`, `/en/contact/` | `/ta/about/`, `/ta/contact/` |
| Search, cart, checkout, order | `/en/search/` … | `/ta/…` (all `noindex`) |
| Admin | `/admin/` (login required, `noindex`) | — |

- `/` redirects (307) to `/en/` or `/ta/` based on a saved language choice or `Accept-Language`.
- Locale-less URLs (`/oils/`) and slash-less URLs (`/en/oils`) redirect permanently (308) to the canonical form, in one hop.
- Renamed slugs redirect permanently via redirects recorded by the API; a product requested under the wrong category redirects to its canonical URL.

## SEO implementation

- **Metadata** (`src/lib/seo.ts`): unique title + description per page from the database, self-referencing canonical, reciprocal `hreflang` (`en-IN`, `ta-IN`, `x-default` → English) only for pages that genuinely exist in both languages, robots directives, Open Graph and Twitter cards. `<html lang>` is `en-IN` / `ta-IN`.
- **Untranslated content**: Tamil URLs show English content with a notice, canonicalise to the English URL, and are excluded from hreflang and the sitemap. English-only blog posts redirect to the English version. The language switcher therefore never leads to a broken page.
- **Structured data** (`src/lib/jsonld.ts`): Organization + WebSite (homepage), BreadcrumbList, Product + Offer (price, INR, availability, SKU, images — generated from live product data that is also visible on the page), BlogPosting. No ratings or reviews are emitted. Contact details/address appear only when entered in Store settings. JSON-LD is escaped against `</script>` injection.
- **Sitemap** (`/sitemap.xml`): generated per request from the API (cached 10 min and refreshed instantly when an admin saves). Only published, indexable, self-canonical URLs, with `xhtml:link` alternates.
- **robots.txt**: allows the site, disallows `/admin/`, `/api/`, cart, checkout, order and search pages, and references the sitemap. CSS/JS/images are not blocked.
- **Parameters**: sort parameters never change the canonical; `?page=N` keeps a self-referencing canonical; sort links are `rel="nofollow"`.
- **Internal links**: header/footer category navigation, homepage sections → categories, categories → products and related blog posts, products → category/related products/posts, posts → related products and category, breadcrumbs everywhere.
- **Images**: `next/image` (AVIF/WebP, responsive `sizes`), lazy-loading except the main product/post image, fixed aspect-ratio boxes to prevent layout shift; editor-managed alt text in both languages.
- **Performance**: server-rendered HTML (content does not depend on JavaScript), self-hosted subsetted fonts, no-JS mobile menu and search form, small client bundles (~103 kB shared).

## Analytics (GA4)

Set `NEXT_PUBLIC_GA_MEASUREMENT_ID` to enable. Events: `view_item`, `view_item_list`, `search`, `add_to_cart`, `remove_from_cart`, `begin_checkout`, `purchase`. The purchase event uses the stored order (order number, DB prices) and is claimed once per order on the server, so reloads never double-count. No names, phone numbers, emails or addresses are sent.

## Admin dashboard (`/admin/`)

SEO dashboard (audit, pages needing attention, CSV export, live crawl), products (bilingual details, images + alt text, SEO fields with template suggestions, Google-style snippet previews, canonical/indexing controls, draft preview in both languages), categories (copy, SEO, FAQs, internal keyword notes), homepage/About/Contact copy in both languages, blog (Markdown editor with preview, related products, drafts), orders, redirects, store settings. The session token lives in an httpOnly, SameSite=Strict cookie; every request is authorised by the API, and state-changing requests are origin-checked.

## Environment variables

| Variable | Required | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | yes (at build time) | Production origin, e.g. `https://www.pothigainaturals.com`. Used in canonicals, hreflang, sitemap, robots, JSON-LD. On Vercel it falls back to the project's production domain if unset |
| `API_URL` | yes | Server-side URL of the API |
| `MEDIA_URL` | yes (prod) | Public origin serving uploaded images (usually the API's public URL); used by `next/image` |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | no | GA4 measurement ID (`G-…`) |
| `GOOGLE_SITE_VERIFICATION` | no | Search Console HTML-tag token |

## Tests

```bash
npm run lint && npm run typecheck && npm test && npm run build
# End-to-end (creates fixture products/orders — use a disposable database only):
E2E_SITE_URL=http://localhost:3000 E2E_ADMIN_EMAIL=… E2E_ADMIN_PASSWORD=… npm run test:e2e
```

## Deploying to Vercel

The API is deployed separately on Render (see the backend repository's `render.yaml`). Deploy it first so you have its URL.

1. In Vercel choose **Add New → Project** and import this GitHub repository. `vercel.json` sets the framework to Next.js and runs server functions in **Singapore (`sin1`)**, next to the Render API, to keep page rendering fast.
2. Add these **Production** environment variables, then deploy:
   - `NEXT_PUBLIC_SITE_URL`: your domain, e.g. `https://www.pothigainaturals.com`. It is read at build time, so redeploy after changing it.
   - `API_URL`: the Render API URL, e.g. `https://pothigai-api.onrender.com`
   - `MEDIA_URL`: the public origin that serves uploaded images, normally the same as `API_URL`. The build allows `next/image` to load from this host only.
   - Optional: `NEXT_PUBLIC_GA_MEASUREMENT_ID` and `GOOGLE_SITE_VERIFICATION`.
3. Under **Settings → Domains** add `www.pothigainaturals.com`, plus the apex domain redirecting to `www`, and follow Vercel's DNS instructions. Then set the API's `SITE_URL` and `CORS_ORIGINS` on Render to the same domain.
4. Pushes to `main` deploy to production; pull requests get preview deployments.

**Preview deployments are never indexed.** When `VERCEL_ENV` is not `production`, every response carries `X-Robots-Tag: noindex, nofollow` and `robots.txt` disallows everything. This keeps preview copies out of Google.

**CI.** `.github/workflows/ci.yml` runs lint, typecheck, unit tests and a production build on every pull request and on `main`. To stop Vercel deploying a red commit, turn on the CI check as required in GitHub branch protection for `main`.

## Owner checklist before / after launch

1. Deploy the API on Render and the storefront on Vercel (see above) on the final domain; set `NEXT_PUBLIC_SITE_URL` before building.
2. Replace the placeholder leaf mark (`public/logo.png`, `src/app/icon.svg`, `src/app/apple-icon.png`, `public/og-default.png`) with the real logo if one exists.
3. In the admin: enter verified contact details, delivery areas/timelines and returns policy (Store settings); add real products with photos, alt text and Tamil translations; complete and publish the blog drafts.
4. **Search Console**: add a Domain property (DNS) or URL-prefix property (set `GOOGLE_SITE_VERIFICATION`), submit `https://<domain>/sitemap.xml`, and check *Pages* and *Enhancements → Products / Breadcrumbs*.
5. **GA4**: create a web data stream, set `NEXT_PUBLIC_GA_MEASUREMENT_ID`, rebuild, confirm events in DebugView, and mark `purchase` as a key event. Add a cookie/consent notice if your legal advice requires one.
6. Validate a product URL with Google's [Rich Results Test](https://search.google.com/test/rich-results).
7. If you have a verified physical address, create a Google Business Profile and enable "Show this address" in Store settings; otherwise leave it hidden.
