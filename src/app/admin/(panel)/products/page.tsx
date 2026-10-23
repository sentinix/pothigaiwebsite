import Link from "next/link";
import { adminGet } from "@/lib/admin-api";

interface Row {
  id: string;
  slug: string;
  sku: string;
  nameEn: string;
  nameTa: string | null;
  price: string;
  salePrice: string | null;
  stockQuantity: number;
  isPublished: boolean;
  robotsIndex: boolean;
  seoTitleEn: string | null;
  metaDescriptionEn: string | null;
  descriptionTa: string | null;
  category: { slug: string; nameEn: string };
  images: { altEn: string | null }[];
}

export default async function ProductsAdmin({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const rows = await adminGet<Row[]>(`/products${q ? `?q=${encodeURIComponent(q)}` : ""}`);
  return (
    <>
      <div className="section-head">
        <h1>Products</h1>
        <Link href="/admin/products/new/" className="btn btn-primary btn-small">
          Add product
        </Link>
      </div>
      <form method="get" className="search-form" style={{ maxWidth: 420, margin: "8px 0 16px" }}>
        <label htmlFor="pq" className="visually-hidden">
          Search products
        </label>
        <input id="pq" name="q" type="search" defaultValue={q} placeholder="Name or SKU" />
        <button type="submit">Search</button>
      </form>
      {rows.length === 0 ? (
        <p className="empty-state">No products yet. Add your real catalogue items with “Add product”.</p>
      ) : (
        <div className="table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Status</th>
                <th>SEO</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => {
                const gaps = [
                  !p.seoTitleEn && "title",
                  !p.metaDescriptionEn && "description",
                  !p.nameTa || !p.descriptionTa ? "Tamil" : null,
                  p.images.length === 0 ? "image" : p.images.some((i) => !i.altEn) ? "alt text" : null,
                ].filter(Boolean);
                return (
                  <tr key={p.id}>
                    <td>
                      <Link href={`/admin/products/${p.id}/`}>{p.nameEn}</Link>
                      <div className="hint">{p.sku}</div>
                    </td>
                    <td>{p.category.nameEn}</td>
                    <td>
                      ₹{p.salePrice ?? p.price}
                      {p.salePrice && <s className="hint"> ₹{p.price}</s>}
                    </td>
                    <td>{p.stockQuantity}</td>
                    <td>
                      <span className={`badge ${p.isPublished ? "badge-ok" : "badge-muted"}`}>{p.isPublished ? "Published" : "Draft"}</span>
                      {!p.robotsIndex && <span className="badge badge-warning">noindex</span>}
                    </td>
                    <td>{gaps.length ? <span className="hint">Missing: {gaps.join(", ")}</span> : <span className="badge badge-ok">OK</span>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
