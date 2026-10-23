import { BlogEditor, type AdminPost } from "@/components/admin/BlogEditor";
import { adminGet } from "@/lib/admin-api";
import { MEDIA_BASE } from "@/lib/admin-media";
import { SITE_URL } from "@/lib/site";

export default async function EditPost({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [post, categories, products] = await Promise.all([
    adminGet<AdminPost>(`/blog/${encodeURIComponent(id)}`),
    adminGet<{ id: string; nameEn: string }[]>("/categories"),
    adminGet<{ id: string; nameEn: string; sku: string }[]>("/products"),
  ]);
  return (
    <>
      <h1>Edit post</h1>
      <BlogEditor post={post} categories={categories} products={products} siteUrl={SITE_URL} mediaBase={MEDIA_BASE} />
    </>
  );
}
