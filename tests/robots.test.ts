import { afterEach, describe, expect, it, vi } from "vitest";

async function loadRobots() {
  vi.resetModules();
  return (await import("@/app/robots")).default();
}

describe("robots.txt", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("allows crawling and lists the sitemap in production", async () => {
    vi.stubEnv("VERCEL_ENV", "production");
    const robots = await loadRobots();
    expect(robots.sitemap).toBe("https://shop.example.test/sitemap.xml");
    expect(robots.rules).toEqual([expect.objectContaining({ allow: "/" })]);
  });

  it("blocks all crawling on Vercel preview deployments", async () => {
    vi.stubEnv("VERCEL_ENV", "preview");
    const robots = await loadRobots();
    expect(robots.rules).toEqual([{ userAgent: "*", disallow: "/" }]);
    expect(robots.sitemap).toBeUndefined();
  });
});
