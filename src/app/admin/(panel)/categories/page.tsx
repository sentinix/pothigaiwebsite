import Link from "next/link";
import { adminGet } from "@/lib/admin-api";

interface Row {
  id: string;
  slug: string;
  nameEn: string;
  nameTa: string | null;
  isPublished: boolean;
  seoTitleEn: string | null;
  seoTitleTa: string | null;
  primaryKeyword: string | null;
  _count: { products: number };
}

export default async function CategoriesAdmin() {
  const rows = await adminGet<Row[]>("/categories");
  return (
    <>
      <h1>Categories</h1>
      <div className="table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Category</th>
              <th>URL</th>
              <th>Products</th>
              <th>Primary keyword</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c.id}>
                <td>
                  <Link href={`/admin/categories/${c.id}/`}>{c.nameEn}</Link>
                  <div className="hint" lang="ta-IN">
                    {c.nameTa}
                  </div>
                </td>
                <td>/en/{c.slug}/</td>
                <td>{c._count.products}</td>
                <td>{c.primaryKeyword ?? "—"}</td>
                <td>
                  <span className={`badge ${c.isPublished ? "badge-ok" : "badge-muted"}`}>{c.isPublished ? "Published" : "Hidden"}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
