import { SettingsEditor, type AdminSettings } from "@/components/admin/SettingsEditor";
import { adminGet } from "@/lib/admin-api";

export default async function SettingsPage() {
  const settings = await adminGet<AdminSettings>("/settings");
  return (
    <>
      <h1>Store settings</h1>
      <p className="notice">
        Only enter verified details. Anything left empty is simply not shown on the site or in structured data — no placeholder
        contact details or addresses are ever published.
      </p>
      <SettingsEditor settings={settings} />
    </>
  );
}
