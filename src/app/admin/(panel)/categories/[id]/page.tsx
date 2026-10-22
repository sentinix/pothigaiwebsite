import { CategoryEditor, type AdminCategory } from "@/components/admin/CategoryEditor";
import { adminGet } from "@/lib/admin-api";
import { MEDIA_BASE } from "@/lib/admin-media";
import { SITE_URL } from "@/lib/site";

export default async function EditCategory({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const category = await adminGet<AdminCategory>(`/categories/${encodeURIComponent(id)}`);
  return (
    <>
      <h1>Category: {category.nameEn}</h1>
      <CategoryEditor category={category} siteUrl={SITE_URL} mediaBase={MEDIA_BASE} />
    </>
  );
}
