"use client";
import { useState } from "react";
import { adminFetch } from "./client";

interface LiveResult {
  baseUrl: string;
  generatedAt: string;
  summary: { pagesCrawled: number; pagesInSitemap: number; linksChecked: number; issues: number };
  issues: { severity: string; check: string; url: string; message: string }[];
}

export function LiveAudit() {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<LiveResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    setBusy(true);
    setError(null);
    const res = await adminFetch<LiveResult>("seo-audit/live", { method: "POST", body: { limit: 150 } });
    setBusy(false);
    if (res.ok) setResult(res.data);
    else setError(res.error);
  };

  return (
    <section className="admin-card" style={{ marginTop: 16 }}>
      <h2>Live page checks</h2>
      <p className="hint">
        Crawls the deployed storefront (SITE_URL configured on the API) and inspects the real HTML: H1 count, canonical and hreflang
        tags, robots meta, JSON-LD validity, image alt attributes, sitemap.xml contents and broken internal links. Takes up to a few minutes.
      </p>
      <button type="button" className="btn btn-secondary btn-small" onClick={run} disabled={busy}>
        {busy ? "Crawling…" : "Run live crawl"}
      </button>
      {error && <p className="status-err">{error}</p>}
      {result && (
        <>
          <p>
            Crawled {result.summary.pagesCrawled} of {result.summary.pagesInSitemap} sitemap pages on {result.baseUrl}, checked{" "}
            {result.summary.linksChecked} other internal links: <strong>{result.summary.issues} issues</strong>.
          </p>
          <div className="table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Severity</th>
                  <th>Check</th>
                  <th>URL</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {result.issues.map((i, n) => (
                  <tr key={n}>
                    <td>
                      <span className={`badge badge-${i.severity}`}>{i.severity}</span>
                    </td>
                    <td>{i.check}</td>
                    <td style={{ wordBreak: "break-all" }}>{i.url}</td>
                    <td>{i.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}
