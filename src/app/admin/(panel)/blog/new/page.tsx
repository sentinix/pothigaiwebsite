import { BlogEditor } from "@/components/admin/BlogEditor";
import { adminGet } from "@/lib/admin-api";
import { MEDIA_BASE } from "@/lib/admin-media";
import { SITE_URL } from "@/lib/site";

export default async function NewPost() {
  const [categories, products] = await Promise.all([
    adminGet<{ id: string; nameEn: string }[]>("/categories"),
    adminGet<{ id: string; nameEn: string; sku: string }[]>("/products"),
  ]);
  return (
    <>
      <h1>New blog post</h1>
      <BlogEditor post={null} categories={categories} products={products} siteUrl={SITE_URL} mediaBase={MEDIA_BASE} />
    </>
  );
}
