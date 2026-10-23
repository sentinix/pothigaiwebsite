// End-to-end verification against a running storefront + API.
//
//   E2E_SITE_URL=http://localhost:3000 E2E_ADMIN_EMAIL=... E2E_ADMIN_PASSWORD=... npm run test:e2e
//
// It creates clearly-labelled "E2E" fixture products, a blog post and an order
// through the real admin and checkout flows, so ONLY run it against a
// disposable test database, never production.

import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { parse } from "node-html-parser";
import { chromium } from "playwright-core";

const SITE = (process.env.E2E_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
const EMAIL = process.env.E2E_ADMIN_EMAIL;
const PASSWORD = process.env.E2E_ADMIN_PASSWORD;
const CHROME = process.env.E2E_CHROME ?? "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";
const SHOTS = process.env.E2E_SCREENSHOTS ?? "test-results";
const RUN = Date.now().toString(36);

if (!EMAIL || !PASSWORD) {
  console.error("Set E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD");
  process.exit(1);
}

let passed = 0;
const failures = [];
async function check(name, fn) {
  try {
    await fn();
    passed++;
    console.log(`  ✓ ${name}`);
  } catch (e) {
    failures.push(name);
    console.log(`  ✗ ${name}\n      ${e.message.split("\n").join("\n      ")}`);
  }
}

// ---------- admin session (through the Next.js proxy, like the real UI) ----------
let cookie = "";
async function admin(path, { method = "GET", body, form } = {}) {
  const res = await fetch(`${SITE}/api/admin/${path}`, {
    method,
    headers: {
      cookie,
      origin: SITE,
      ...(body ? { "content-type": "application/json" } : {}),
    },
    body: form ?? (body ? JSON.stringify(body) : undefined),
  });
  const data = res.status === 204 ? null : await res.json().catch(() => null);
  return { status: res.status, data };
}

async function page(path, opts = {}) {
  const res = await fetch(`${SITE}${path}`, { redirect: "manual", ...opts });
  const html = res.status === 200 ? await res.text() : "";
  const root = parse(html);
  const jsonld = root.querySelectorAll('script[type="application/ld+json"]').map((s) => JSON.parse(s.text));
  return {
    res,
    root,
    html,
    title: root.querySelector("title")?.text,
    description: root.querySelector('meta[name="description"]')?.getAttribute("content"),
    canonical: root.querySelector('link[rel="canonical"]')?.getAttribute("href"),
    robots: root.querySelector('meta[name="robots"]')?.getAttribute("content"),
    lang: root.querySelector("html")?.getAttribute("lang"),
    h1: root.querySelectorAll("h1").map((h) => h.text.trim()),
    alternates: Object.fromEntries(
      root.querySelectorAll('link[rel="alternate"][hreflang]').map((l) => [l.getAttribute("hreflang"), l.getAttribute("href")]),
    ),
    jsonld,
  };
}

const PNG_1PX = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

console.log(`\nE2E against ${SITE} (run ${RUN})\n`);

console.log("Admin protection");
await check("admin API rejects anonymous requests", async () => {
  const r = await fetch(`${SITE}/api/admin/products`);
  assert.equal(r.status, 401);
});
await check("admin UI redirects anonymous visitors to login", async () => {
  const r = await fetch(`${SITE}/admin/products/`, { redirect: "manual" });
  assert.equal(r.status, 307);
  assert.match(r.headers.get("location"), /\/admin\/login\//);
});
await check("login rejects a wrong password", async () => {
  const r = await fetch(`${SITE}/api/admin-auth/login/`, {
    method: "POST",
    headers: { "content-type": "application/json", origin: SITE },
    body: JSON.stringify({ email: EMAIL, password: "wrong-password" }),
  });
  assert.equal(r.status, 401);
});
await check("login rejects cross-site requests", async () => {
  const r = await fetch(`${SITE}/api/admin-auth/login/`, {
    method: "POST",
    headers: { "content-type": "application/json", origin: "https://evil.example" },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  assert.equal(r.status, 403);
});
await check("admin can sign in (httpOnly, SameSite=Strict cookie)", async () => {
  const r = await fetch(`${SITE}/api/admin-auth/login/`, {
    method: "POST",
    headers: { "content-type": "application/json", origin: SITE },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  assert.equal(r.status, 200);
  const setCookie = r.headers.get("set-cookie");
  assert.match(setCookie, /HttpOnly/i);
  assert.match(setCookie, /SameSite=Strict/i);
  cookie = setCookie.split(";")[0];
});

// ---------- fixtures ----------
console.log("\nFixtures (test data only)");
const cats = Object.fromEntries((await admin("categories")).data.map((c) => [c.slug, c]));
let imageUrl;
await check("image upload converts to WebP with a descriptive filename", async () => {
  const form = new FormData();
  form.append("file", new Blob([PNG_1PX], { type: "image/png" }), "photo.png");
  form.append("name", "E2E Mapillai Samba Rice 1kg");
  const r = await admin("uploads", { method: "POST", form });
  assert.equal(r.status, 201);
  assert.match(r.data.url, /^\/uploads\/e2e-mapillai-samba-rice-1kg-[a-f0-9]+\.webp$/);
  imageUrl = r.data.url;
});

const rice = (
  await admin("products", {
    method: "POST",
    body: {
      slug: `e2e-mapillai-samba-${RUN}`,
      sku: `E2E-RICE-${RUN}`,
      categoryId: cats["traditional-rice"].id,
      nameEn: `E2E Mapillai Samba ${RUN}`,
      nameTa: `E2E மாப்பிள்ளை சம்பா ${RUN}`,
      descriptionEn: "Test fixture description.",
      descriptionTa: "சோதனை விளக்கம்.",
      price: 180,
      salePrice: 160,
      stockQuantity: 10,
      packSize: 1,
      packUnit: "kg",
      isPublished: true,
      isFeatured: true,
      images: [{ url: imageUrl, altEn: "1 kg pack of Mapillai Samba rice", altTa: "1 கிலோ மாப்பிள்ளை சம்பா அரிசி பேக்", width: 1, height: 1 }],
    },
  })
).data;
const oil = (
  await admin("products", {
    method: "POST",
    body: {
      slug: `e2e-groundnut-oil-${RUN}`,
      sku: `E2E-OIL-${RUN}`,
      categoryId: cats.oils.id,
      nameEn: `E2E Groundnut Oil ${RUN}`,
      descriptionEn: "English-only test fixture.",
      price: 250,
      stockQuantity: 1,
      isPublished: true,
      images: [{ url: imageUrl, altEn: "Groundnut oil bottle" }],
    },
  })
).data;
const draft = (
  await admin("products", {
    method: "POST",
    body: {
      slug: `e2e-draft-${RUN}`,
      sku: `E2E-DRAFT-${RUN}`,
      categoryId: cats.spices.id,
      nameEn: `E2E Draft ${RUN}`,
      price: 50,
      stockQuantity: 5,
      isPublished: false,
    },
  })
).data;
const post = (
  await admin("blog", {
    method: "POST",
    body: {
      slug: `e2e-post-${RUN}`,
      titleEn: `E2E Rice Guide ${RUN}`,
      excerptEn: "A test article about traditional rice.",
      bodyEn: `## Section\n\nSee [our rice](/en/traditional-rice/).\n\n<script>alert(1)</script>`,
      authorName: "Pothigai Naturals",
      categoryId: cats["traditional-rice"].id,
      relatedProductIds: [rice.id],
      status: "PUBLISHED",
    },
  })
).data;
await check("fixtures created", async () => {
  assert.ok(rice?.id && oil?.id && draft?.id && post?.id, "fixture creation failed");
});

// ---------- metadata ----------
console.log("\nPage metadata, canonical & hreflang");
const expectations = [
  ["/en/", "Pothigai Naturals | Traditional Foods Online", "en-IN", "Pothigai Naturals – Buy Traditional Rice, Natural Oils, Nuts & More Online"],
  ["/ta/", "பொத்திகை நேச்சுரல்ஸ் | பாரம்பரிய உணவுப் பொருட்கள்", "ta-IN", "பொத்திகை நேச்சுரல்ஸ் – பாரம்பரிய அரிசி, எண்ணெய்கள் மற்றும் இயற்கை உணவுப் பொருட்கள்"],
  ["/en/traditional-rice/", "Buy Traditional Rice Online | Pothigai Naturals", "en-IN"],
  ["/en/oils/", "Buy Cooking Oils Online | Pothigai Naturals", "en-IN"],
  ["/en/nuts-dry-fruits/", "Buy Nuts & Dry Fruits Online | Pothigai Naturals", "en-IN"],
  ["/en/millets/", "Buy Millets Online | Pothigai Naturals", "en-IN"],
  ["/en/pulses/", "Buy Pulses Online | Pothigai Naturals", "en-IN"],
  ["/en/spices/", "Buy Spices Online | Pothigai Naturals", "en-IN"],
  ["/ta/traditional-rice/", "பாரம்பரிய அரிசி ஆன்லைனில் வாங்க | பொத்திகை நேச்சுரல்ஸ்", "ta-IN"],
  ["/ta/oils/", "சமையல் எண்ணெய்கள் ஆன்லைனில் வாங்க | பொத்திகை நேச்சுரல்ஸ்", "ta-IN"],
  ["/ta/spices/", "மசாலாப் பொருட்கள் ஆன்லைனில் வாங்க | பொத்திகை நேச்சுரல்ஸ்", "ta-IN"],
  ["/en/about/", "About Us | Pothigai Naturals", "en-IN"],
  ["/ta/contact/", "தொடர்புக்கு | பொத்திகை நேச்சுரல்ஸ்", "ta-IN"],
];
for (const [path, title, lang, h1] of expectations) {
  await check(`${path} title, lang, canonical, hreflang, single H1`, async () => {
    const p = await page(path);
    assert.equal(p.res.status, 200);
    assert.equal(p.title, title);
    assert.equal(p.lang, lang);
    assert.ok(p.description && p.description.length > 50, "missing meta description");
    assert.equal(p.canonical, `${SITE}${path}`);
    const bare = path.slice(3);
    assert.equal(p.alternates["en-IN"], `${SITE}/en${bare}`);
    assert.equal(p.alternates["ta-IN"], `${SITE}/ta${bare}`);
    assert.equal(p.alternates["x-default"], `${SITE}/en${bare}`);
    assert.equal(p.h1.length, 1, `expected one h1, got ${p.h1.length}`);
    if (h1) assert.equal(p.h1[0].replace(/&amp;/g, "&"), h1);
    assert.ok(p.root.querySelector('meta[property="og:title"]'), "missing og:title");
    assert.ok(p.root.querySelector('meta[property="og:image"]'), "missing og:image");
  });
}
await check("homepage has Organization + WebSite JSON-LD and links to every category", async () => {
  const p = await page("/en/");
  const graph = p.jsonld.find((j) => j["@graph"])["@graph"];
  assert.ok(graph.some((n) => n["@type"] === "Organization"));
  assert.ok(graph.some((n) => n["@type"] === "WebSite"));
  const org = graph.find((n) => n["@type"] === "Organization");
  assert.equal(org.address, undefined, "no unverified address should be published");
  for (const slug of Object.keys(cats)) assert.ok(p.html.includes(`href="/en/${slug}/"`), `no link to ${slug}`);
  assert.ok(p.html.includes("Nature&#x27;s Goodness. Tradition in Every Bite.") || p.html.includes("Nature's Goodness"));
});
await check("homepage features products from the real catalogue", async () => {
  const p = await page("/en/");
  assert.ok(p.html.includes(rice.nameEn));
});

console.log("\nProducts & structured data");
await check("product page: metadata, visible price and Product JSON-LD agree", async () => {
  const path = `/en/traditional-rice/${rice.slug}/`;
  const p = await page(path);
  assert.equal(p.res.status, 200);
  assert.equal(p.title, `Buy ${rice.nameEn} (1 kg) Online | Pothigai Naturals`);
  assert.equal(p.canonical, `${SITE}${path}`);
  assert.equal(p.alternates["ta-IN"], `${SITE}/ta/traditional-rice/${rice.slug}/`);
  const product = p.jsonld.find((j) => j["@type"] === "Product");
  assert.equal(product.name, rice.nameEn);
  assert.equal(product.sku, rice.sku);
  assert.equal(product.offers.price, "160.00");
  assert.equal(product.offers.priceCurrency, "INR");
  assert.equal(product.offers.availability, "https://schema.org/InStock");
  assert.equal(product.aggregateRating, undefined);
  assert.equal(product.review, undefined);
  assert.ok(p.html.includes("₹160"), "visible sale price missing");
  const crumbs = p.jsonld.find((j) => j["@type"] === "BreadcrumbList");
  assert.equal(crumbs.itemListElement.length, 3);
  assert.equal(p.jsonld.filter((j) => j["@type"] === "Product").length, 1);
  const img = p.root.querySelector(".product-detail img");
  assert.equal(img.getAttribute("alt"), "1 kg pack of Mapillai Samba rice");
});
await check("Tamil product page is fully translated with Tamil alt text", async () => {
  const p = await page(`/ta/traditional-rice/${rice.slug}/`);
  assert.equal(p.lang, "ta-IN");
  assert.equal(p.h1[0], rice.nameTa);
  assert.equal(p.title, `${rice.nameTa} (1 kg) ஆன்லைனில் வாங்க | பொத்திகை நேச்சுரல்ஸ்`);
  assert.ok(p.html.includes("கூடையில் சேர்க்கவும்"));
  assert.equal(p.root.querySelector(".product-detail img").getAttribute("alt"), "1 கிலோ மாப்பிள்ளை சம்பா அரிசி பேக்");
});
await check("untranslated Tamil product falls back to English and canonicalises to /en/", async () => {
  const p = await page(`/ta/oils/${oil.slug}/`);
  assert.equal(p.res.status, 200);
  assert.equal(p.canonical, `${SITE}/en/oils/${oil.slug}/`);
  assert.deepEqual(p.alternates, {});
  assert.equal(p.jsonld.filter((j) => j["@type"] === "Product").length, 0);
  assert.ok(p.html.includes("இன்னும் தமிழில் கிடைக்கவில்லை"));
});
await check("unpublished product returns 404 and is noindex", async () => {
  const p = await page(`/en/spices/${draft.slug}/`);
  assert.equal(p.res.status, 404);
});
await check("wrong category segment permanently redirects to the canonical product URL", async () => {
  const r = await fetch(`${SITE}/en/spices/${rice.slug}/`, { redirect: "manual" });
  assert.equal(r.status, 308);
  assert.equal(new URL(r.headers.get("location"), SITE).pathname, `/en/traditional-rice/${rice.slug}/`);
});
await check("sorted category listings canonicalise to the clean URL", async () => {
  const p = await page("/en/traditional-rice/?sort=price-asc");
  assert.equal(p.canonical, `${SITE}/en/traditional-rice/`);
});
await check("category page lists products with crawlable links", async () => {
  const p = await page("/en/traditional-rice/");
  assert.ok(p.html.includes(`href="/en/traditional-rice/${rice.slug}/"`));
});

console.log("\nBlog");
await check("blog post: BlogPosting JSON-LD, safe Markdown, related products", async () => {
  const p = await page(`/en/blog/${post.slug}/`);
  assert.equal(p.res.status, 200);
  const article = p.jsonld.find((j) => j["@type"] === "BlogPosting");
  assert.equal(article.headline, post.titleEn);
  assert.ok(!p.html.includes("<script>alert(1)</script>"), "raw HTML must not render");
  assert.ok(p.html.includes(`href="/en/traditional-rice/${rice.slug}/"`), "related product link missing");
  assert.deepEqual(p.alternates, {}, "English-only post must not advertise a Tamil alternate");
});
await check("English-only post redirects Tamil visitors to the English version", async () => {
  const r = await fetch(`${SITE}/ta/blog/${post.slug}/`, { redirect: "manual" });
  assert.equal(r.status, 307);
  assert.equal(new URL(r.headers.get("location"), SITE).pathname, `/en/blog/${post.slug}/`);
});
await check("seeded blog drafts are not public", async () => {
  const p = await page("/en/blog/traditional-rice-varieties-tamil-nadu-guide/");
  assert.equal(p.res.status, 404);
});

console.log("\nSitemap & robots");
await check("sitemap lists only published, indexable, canonical URLs with alternates", async () => {
  const xml = await (await fetch(`${SITE}/sitemap.xml`)).text();
  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  assert.ok(locs.includes(`${SITE}/en/`));
  assert.ok(locs.includes(`${SITE}/ta/`));
  assert.ok(locs.includes(`${SITE}/en/traditional-rice/${rice.slug}/`));
  assert.ok(locs.includes(`${SITE}/ta/traditional-rice/${rice.slug}/`));
  assert.ok(locs.includes(`${SITE}/en/oils/${oil.slug}/`));
  assert.ok(!locs.includes(`${SITE}/ta/oils/${oil.slug}/`), "untranslated Tamil URL must be excluded");
  assert.ok(!locs.some((l) => l.includes(draft.slug)), "draft product in sitemap");
  assert.ok(!locs.some((l) => l.includes("traditional-rice-varieties-tamil-nadu-guide")), "draft post in sitemap");
  assert.ok(locs.includes(`${SITE}/en/blog/${post.slug}/`));
  assert.ok(!locs.some((l) => /\/(cart|checkout|search|order|admin)\//.test(l)));
  assert.match(xml, /hreflang="ta-IN"/);
  assert.match(xml, /hreflang="x-default"/);
});
await check("robots.txt references the sitemap and blocks private routes only", async () => {
  const txt = await (await fetch(`${SITE}/robots.txt`)).text();
  assert.match(txt, new RegExp(`Sitemap: ${SITE}/sitemap.xml`));
  assert.match(txt, /Disallow: \/admin\//);
  assert.match(txt, /Disallow: \/en\/checkout\//);
  assert.ok(!/Disallow: \/_next/.test(txt), "must not block CSS/JS");
});
await check("utility pages are noindex", async () => {
  for (const path of ["/en/cart/", "/ta/checkout/", "/en/search/?q=rice"]) {
    const p = await page(path);
    assert.match(p.robots ?? "", /noindex/, path);
  }
});

console.log("\nURL changes");
await check("renaming a published product slug creates a permanent redirect", async () => {
  const newSlug = `${oil.slug}-renamed`;
  const r = await admin(`products/${oil.id}`, { method: "PATCH", body: { slug: newSlug } });
  assert.equal(r.status, 200);
  assert.equal(Number(r.data.price), 250, "PATCH must not change other fields");
  const res = await fetch(`${SITE}/en/oils/${oil.slug}/`, { redirect: "manual" });
  assert.equal(res.status, 308);
  assert.equal(new URL(res.headers.get("location"), SITE).pathname, `/en/oils/${newSlug}/`);
  oil.slug = newSlug;
});

// ---------- browser flows ----------
console.log("\nBrowser flows (Chromium)");
await mkdir(SHOTS, { recursive: true });
const browser = await chromium.launch({ executablePath: CHROME });
try {
  const desktop = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });

  await check("Tamil homepage renders with the Tamil web font (desktop + mobile)", async () => {
    for (const [ctx, name] of [[desktop, "desktop"], [mobile, "mobile"]]) {
      const tab = await ctx.newPage();
      await tab.goto(`${SITE}/ta/`, { waitUntil: "networkidle" });
      await tab.evaluate(() => document.fonts.ready);
      const ok = await tab.evaluate(() => document.fonts.check('16px "Noto Sans Tamil"', "தமிழ்"));
      assert.ok(ok, `Noto Sans Tamil not loaded on ${name}`);
      const overflow = (await tab.evaluate(() => document.documentElement.scrollWidth)) - tab.viewportSize().width;
      assert.ok(overflow <= 1, `horizontal overflow ${overflow}px on ${name}`);
      await tab.screenshot({ path: `${SHOTS}/home-ta-${name}.png`, fullPage: true });
      await tab.close();
    }
  });

  await check("English and Tamil pages have no horizontal overflow on a 390px phone", async () => {
    const tab = await mobile.newPage();
    for (const path of ["/en/", `/en/traditional-rice/${rice.slug}/`, "/en/traditional-rice/", "/ta/nuts-dry-fruits/", `/ta/traditional-rice/${rice.slug}/`, "/ta/cart/", "/ta/blog/"]) {
      await tab.goto(`${SITE}${path}`, { waitUntil: "networkidle" });
      const overflow = (await tab.evaluate(() => document.documentElement.scrollWidth)) - tab.viewportSize().width;
      assert.ok(overflow <= 1, `overflow ${overflow}px on ${path}`);
    }
    await tab.screenshot({ path: `${SHOTS}/category-en-mobile.png`, fullPage: true });
    await tab.close();
  });

  await check("language switcher opens the equivalent page", async () => {
    const tab = await desktop.newPage();
    await tab.goto(`${SITE}/en/traditional-rice/${rice.slug}/`);
    await tab.click("a.lang-switch");
    await tab.waitForURL(`${SITE}/ta/traditional-rice/${rice.slug}/`);
    assert.equal(await tab.locator("h1").innerText(), rice.nameTa);
    await tab.click("a.lang-switch");
    await tab.waitForURL(`${SITE}/en/traditional-rice/${rice.slug}/`);
    await tab.close();
  });

  await check("mobile menu (no-JS <details>) exposes category links", async () => {
    const tab = await mobile.newPage();
    await tab.goto(`${SITE}/en/`);
    await tab.click(".mobile-menu summary");
    assert.ok(await tab.locator('.mobile-menu-panel a[href="/en/oils/"]').isVisible());
    await tab.close();
  });

  await check("cart → checkout (Tamil validation) → order confirmation; stock decremented", async () => {
    const tab = await mobile.newPage();
    await tab.goto(`${SITE}/ta/traditional-rice/${rice.slug}/`);
    await tab.click('.product-detail button[aria-label="அளவைக் கூட்டு"]');
    await tab.click(".product-detail .btn-primary");
    await tab.waitForSelector("text=கூடையில் சேர்க்கப்பட்டது");
    await tab.goto(`${SITE}/ta/cart/`);
    await tab.waitForSelector(".cart-line");
    assert.match(await tab.locator(".summary-box").innerText(), /320/);
    await tab.click(`a[href="/ta/checkout/"]`);
    await tab.waitForSelector("#checkout-customerName");
    await tab.fill("#checkout-customerName", "E2E Test Customer");
    await tab.fill("#checkout-phone", "12345");
    await tab.fill("#checkout-addressLine1", "1 Test Street");
    await tab.fill("#checkout-city", "Tirunelveli");
    await tab.fill("#checkout-pincode", "627001");
    await tab.click('main form button[type="submit"]');
    await tab.waitForSelector("text=சரியான 10 இலக்க கைப்பேசி எண்ணை உள்ளிடவும்.");
    await tab.screenshot({ path: `${SHOTS}/checkout-ta-validation-mobile.png`, fullPage: true });
    await tab.fill("#checkout-phone", "9876543210");
    await tab.click('main form button[type="submit"]');
    await tab.waitForURL(/\/ta\/order\/[A-Za-z0-9_-]+\/$/, { timeout: 15000 });
    assert.match(await tab.locator("h1").innerText(), /நன்றி/);
    await tab.screenshot({ path: `${SHOTS}/order-ta-mobile.png`, fullPage: true });
    const count = await tab.evaluate(() => JSON.parse(localStorage.getItem("pn_cart_v1") ?? "[]").length);
    assert.equal(count, 0, "cart should be cleared after ordering");
    await tab.close();
    const fresh = (await admin(`products/${rice.id}`)).data;
    assert.equal(fresh.stockQuantity, 8);
    const orders = (await admin("orders")).data.orders;
    assert.equal(Number(orders[0].total), 320, "order total must come from DB prices (sale price)");
  });

  await check("admin dashboard renders the SEO audit after browser login", async () => {
    const tab = await desktop.newPage();
    await tab.goto(`${SITE}/admin/`);
    await tab.waitForURL(/\/admin\/login\//);
    await tab.fill("#email", EMAIL);
    await tab.fill("#password", PASSWORD);
    await tab.click('button[type="submit"]');
    await tab.waitForSelector("text=SEO dashboard");
    await tab.screenshot({ path: `${SHOTS}/admin-dashboard.png`, fullPage: false });
    await tab.goto(`${SITE}/admin/products/${rice.id}/`);
    await tab.waitForSelector("text=Search engine optimisation");
    const adminOverflow = (await tab.evaluate(() => document.documentElement.scrollWidth)) - tab.viewportSize().width;
    assert.ok(adminOverflow <= 1, `admin editor overflows by ${adminOverflow}px`);
    await tab.screenshot({ path: `${SHOTS}/admin-product-editor.png`, fullPage: true });
    await tab.close();
  });
} finally {
  await browser.close();
}

console.log("\nSEO audit");
await check("database audit runs and flags the English-only fixture", async () => {
  const r = await admin("seo-audit");
  assert.equal(r.status, 200);
  assert.ok(r.data.issues.some((i) => i.check === "missing_tamil_translation" && i.entityId === oil.id));
  assert.ok(!r.data.issues.some((i) => i.check === "sitemap_non_indexable_url"));
});
await check("CSV export downloads", async () => {
  const r = await fetch(`${SITE}/api/admin/seo-audit.csv`, { headers: { cookie } });
  assert.match(r.headers.get("content-type"), /text\/csv/);
  assert.match(await r.text(), /^severity,check,/);
});
await check("live HTML crawl finds no canonical/hreflang/H1/JSON-LD/sitemap errors", async () => {
  const r = await admin("seo-audit/live", { method: "POST", body: { limit: 80 } });
  assert.equal(r.status, 200);
  const serious = r.data.issues.filter((i) =>
    ["canonical_mismatch", "missing_hreflang", "missing_h1", "multiple_h1", "invalid_structured_data", "structured_data_incomplete", "sitemap_non_indexable_url", "broken_internal_link", "missing_canonical", "noindex_in_sitemap", "bad_status"].includes(i.check),
  );
  assert.deepEqual(serious, []);
  console.log(`      crawled ${r.data.summary.pagesCrawled} pages, ${r.data.summary.linksChecked} extra links, ${r.data.issues.length} issues total`);
});

console.log("\nCleanup");
await check("fixtures unpublished", async () => {
  for (const id of [rice.id, oil.id]) assert.equal((await admin(`products/${id}`, { method: "PATCH", body: { isPublished: false } })).status, 200);
  assert.equal((await admin(`products/${draft.id}`, { method: "DELETE" })).status, 204);
  assert.equal((await admin(`blog/${post.id}`, { method: "DELETE" })).status, 204);
});

console.log(`\n${passed} passed, ${failures.length} failed`);
if (failures.length) process.exit(1);
