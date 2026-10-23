import { notFound } from "next/navigation";
import { PageEditor, type AdminPage } from "@/components/admin/PageEditor";
import { adminGet } from "@/lib/admin-api";
import { SITE_URL } from "@/lib/site";

const TITLES: Record<string, string> = { home: "Homepage", about: "About page", contact: "Contact page" };

export default async function EditPage({ params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  if (!(key in TITLES)) notFound();
  const [pages, categories] = await Promise.all([
    adminGet<AdminPage[]>("/pages"),
    adminGet<{ slug: string; nameEn: string }[]>("/categories"),
  ]);
  return (
    <>
      <h1>{TITLES[key]}</h1>
      <PageEditor pageKey={key as "home" | "about" | "contact"} pages={pages.filter((p) => p.key === key)} categories={categories} siteUrl={SITE_URL} />
    </>
  );
}
