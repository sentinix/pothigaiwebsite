import { RedirectsManager } from "@/components/admin/RedirectsManager";
import { adminGet } from "@/lib/admin-api";

export default async function RedirectsPage() {
  const rows = await adminGet<{ id: string; fromPath: string; toPath: string; createdAt: string }[]>("/redirects");
  return (
    <>
      <h1>Redirects</h1>
      <p className="hint">
        Permanent (308) redirects for old URLs. They are created automatically when a published product, category or post changes its
        slug, and apply to both /en/ and /ta/. Paths are written without the language prefix, e.g. <code>/oils/old-name/</code>.
      </p>
      <RedirectsManager rows={rows} />
    </>
  );
}
