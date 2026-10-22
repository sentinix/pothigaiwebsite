import "server-only";
import { cookies } from "next/headers";

export const ADMIN_COOKIE = "pn_admin";

export async function getAdminToken(): Promise<string | null> {
  return (await cookies()).get(ADMIN_COOKIE)?.value ?? null;
}
