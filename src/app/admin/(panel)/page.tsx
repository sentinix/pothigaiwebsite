import Link from "next/link";
import { LiveAudit } from "@/components/admin/LiveAudit";
import { adminGet } from "@/lib/admin-api";

interface Issue {
  severity: "error" | "warning" | "info";
  check: string;
  entityType: string;
  entityId: string;
  entityName: string;
  locale: string | null;
  url: string | null;
  message: string;
  adminPath: string;
}
interface Audit {
  generatedAt: string;
  summary: { error: number; warning: number; info: number; indexableUrls: number; sitemapUrls: number };
  issues: Issue[];
}

const CHECK_LABELS: Record<string, string> = {
  missing_title: "Missing SEO title",
  missing_meta_description: "Missing meta description",
  duplicate_title: "Duplicate title",
  duplicate_meta_description: "Duplicate meta description",
  missing_h1: "Missing H1",
  missing_description: "Missing description",
  missing_tamil_translation: "Missing Tamil translation",
  missing_english_translation: "Missing English translation",
  missing_image_alt: "Missing image alt text",
  structured_data_incomplete: "Incomplete structured data",
  missing_price: "Missing price",
  invalid_sale_price: "Invalid sale price",
  out_of_stock: "Out of stock",
  noindex: "Set to noindex",
  title_too_long: "Title may be truncated",
  description_too_long: "Description may be truncated",
  description_too_short: "Description is short",
  hidden_category_with_products: "Hidden category with products",
  sitemap_non_indexable_url: "Non-indexable URL in sitemap",
};

type Props = { searchParams: Promise<{ severity?: string; check?: string }> };

export default async function Dashboard({ searchParams }: Props) {
  const { severity, check } = await searchParams;
  const audit = await adminGet<Audit>("/seo-audit");
  const issues = audit.issues.filter((i) => (!severity || i.severity === severity) && (!check || i.check === check));
  const byCheck = new Map<string, number>();
  for (const i of audit.issues) byCheck.set(i.check, (byCheck.get(i.check) ?? 0) + 1);
  const attention = new Map<string, { name: string; adminPath: string; errors: number; warnings: number }>();
  for (const i of audit.issues) {
    if (i.severity === "info") continue;
    const key = `${i.entityType}:${i.entityId}`;
    const row = attention.get(key) ?? { name: `${i.entityType}: ${i.entityName}`, adminPath: i.adminPath, errors: 0, warnings: 0 };
    if (i.severity === "error") row.errors++;
    else row.warnings++;
    attention.set(key, row);
  }
  const attentionRows = [...attention.values()].sort((a, b) => b.errors - a.errors || b.warnings - a.warnings).slice(0, 15);

  return (
    <>
      <h1>SEO dashboard</h1>
      <p className="notice">
        <strong>Automated checks only.</strong> These results are computed from your store data. They do not show Google rankings,
        search volume, backlinks or indexing status — use Google Search Console and the Rich Results Test for those.
      </p>
      <div className="stat-row">
        <div className="stat">
          <span className="badge badge-error">Errors</span>
          <strong>{audit.summary.error}</strong>
        </div>
        <div className="stat">
          <span className="badge badge-warning">Warnings</span>
          <strong>{audit.summary.warning}</strong>
        </div>
        <div className="stat">
          <span className="badge badge-info">Info</span>
          <strong>{audit.summary.info}</strong>
        </div>
        <div className="stat">
          Indexable URLs<strong>{audit.summary.indexableUrls}</strong>
        </div>
        <div className="stat">
          Sitemap URLs<strong>{audit.summary.sitemapUrls}</strong>
        </div>
      </div>
      <p className="inline-actions">
        <a className="btn btn-secondary btn-small" href="/api/admin/seo-audit.csv">
          Export CSV
        </a>
        <a className="btn btn-secondary btn-small" href="/sitemap.xml" target="_blank" rel="noopener">
          View sitemap.xml
        </a>
        <a className="btn btn-secondary btn-small" href="/robots.txt" target="_blank" rel="noopener">
          View robots.txt
        </a>
      </p>

      {attentionRows.length > 0 && (
        <section className="admin-card">
          <h2>Pages that need attention</h2>
          <div className="table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Page</th>
                  <th>Errors</th>
                  <th>Warnings</th>
                </tr>
              </thead>
              <tbody>
                {attentionRows.map((r) => (
                  <tr key={r.name + r.adminPath}>
                    <td>
                      <Link href={r.adminPath}>{r.name}</Link>
                    </td>
                    <td>{r.errors}</td>
                    <td>{r.warnings}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <section className="admin-card" style={{ marginTop: 16 }}>
        <h2>All issues ({issues.length})</h2>
        <p className="inline-actions small">
          Filter:
          <Link href="/admin/">All</Link>
          {(["error", "warning", "info"] as const).map((s) => (
            <Link key={s} href={`/admin/?severity=${s}`}>
              {s}
            </Link>
          ))}
          {[...byCheck.entries()].map(([c, n]) => (
            <Link key={c} href={`/admin/?check=${c}`}>
              {CHECK_LABELS[c] ?? c} ({n})
            </Link>
          ))}
        </p>
        <div className="table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Severity</th>
                <th>Check</th>
                <th>Item</th>
                <th>Lang</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {issues.map((i, n) => (
                <tr key={n}>
                  <td>
                    <span className={`badge badge-${i.severity}`}>{i.severity}</span>
                  </td>
                  <td>{CHECK_LABELS[i.check] ?? i.check}</td>
                  <td>
                    <Link href={i.adminPath}>{i.entityName}</Link>
                    {i.url && (
                      <div className="hint">
                        <a href={i.url.replace(/^https?:\/\/[^/]+/, "")} target="_blank" rel="noopener">
                          {i.url}
                        </a>
                      </div>
                    )}
                  </td>
                  <td>{i.locale ?? "—"}</td>
                  <td>{i.message}</td>
                </tr>
              ))}
              {issues.length === 0 && (
                <tr>
                  <td colSpan={5}>No issues found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <LiveAudit />
      <p className="hint">Generated {new Date(audit.generatedAt).toLocaleString("en-IN")}</p>
    </>
  );
}
