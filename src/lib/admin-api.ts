import "server-only";
import { redirect } from "next/navigation";
import { API_URL } from "./api";
import { getAdminToken } from "./admin-session";

/** Server-side admin data loader; sends the user to the login page when the session is gone. */
export async function adminGet<T>(path: string): Promise<T> {
  const token = await getAdminToken();
  if (!token) redirect("/admin/login/");
  const res = await fetch(`${API_URL}/api/admin${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (res.status === 401 || res.status === 403) redirect("/admin/login/");
  if (!res.ok) throw new Error(`Admin API ${res.status} for ${path}`);
  return (await res.json()) as T;
}
