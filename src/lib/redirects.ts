import "server-only";
import { notFound, permanentRedirect } from "next/navigation";
import type { Locale } from "@/i18n/config";
import { api } from "./api";
import { localePath } from "./site";

/** For a missing page, follow a recorded slug redirect (308) or show the 404 page. */
export async function redirectOrNotFound(locale: Locale, path: string): Promise<never> {
  const redirect = await api.redirect(path).catch(() => null);
  if (redirect) permanentRedirect(localePath(locale, redirect.toPath));
  notFound();
}
