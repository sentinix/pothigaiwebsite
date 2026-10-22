import { ProductEditor, type AdminProduct } from "@/components/admin/ProductEditor";
import { adminGet } from "@/lib/admin-api";
import { MEDIA_BASE } from "@/lib/admin-media";
import { SITE_URL } from "@/lib/site";

export default async function EditProduct({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [product, categories] = await Promise.all([
    adminGet<AdminProduct>(`/products/${encodeURIComponent(id)}`),
    adminGet<{ id: string; slug: string; nameEn: string }[]>("/categories"),
  ]);
  return (
    <>
      <h1>Edit: {product.nameEn}</h1>
      <ProductEditor product={product} categories={categories} mediaBase={MEDIA_BASE} siteUrl={SITE_URL} />
    </>
  );
}
