import Link from "next/link";
import { adminGet } from "@/lib/admin-api";

interface Row {
  id: string;
  slug: string;
  titleEn: string;
  titleTa: string | null;
  status: "DRAFT" | "PUBLISHED";
  publishedAt: string | null;
  updatedAt: string;
  locales: string[];
  category: { nameEn: string } | null;
}

export default async function BlogAdmin() {
  const rows = await adminGet<Row[]>("/blog");
  return (
    <>
      <div className="section-head">
        <h1>Blog</h1>
        <Link href="/admin/blog/new/" className="btn btn-primary btn-small">
          New post
        </Link>
      </div>
      <div className="table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Topic</th>
              <th>Languages</th>
              <th>Status</th>
              <th>Updated</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.id}>
                <td>
                  <Link href={`/admin/blog/${p.id}/`}>{p.titleEn}</Link>
                  <div className="hint" lang="ta-IN">
                    {p.titleTa}
                  </div>
                </td>
                <td>{p.category?.nameEn ?? "—"}</td>
                <td>{p.locales.join(", ") || "—"}</td>
                <td>
                  <span className={`badge ${p.status === "PUBLISHED" ? "badge-ok" : "badge-muted"}`}>{p.status.toLowerCase()}</span>
                </td>
                <td>{new Date(p.updatedAt).toLocaleDateString("en-IN")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
