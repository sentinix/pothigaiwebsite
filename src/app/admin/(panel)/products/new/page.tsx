import { ProductEditor } from "@/components/admin/ProductEditor";
import { adminGet } from "@/lib/admin-api";
import { MEDIA_BASE } from "@/lib/admin-media";
import { SITE_URL } from "@/lib/site";

export default async function NewProduct() {
  const categories = await adminGet<{ id: string; slug: string; nameEn: string }[]>("/categories");
  return (
    <>
      <h1>Add product</h1>
      <ProductEditor product={null} categories={categories} mediaBase={MEDIA_BASE} siteUrl={SITE_URL} />
    </>
  );
}
