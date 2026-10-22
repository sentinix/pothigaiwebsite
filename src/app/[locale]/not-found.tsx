import Link from "next/link";
import { headers } from "next/headers";
import { getDictionary } from "@/i18n/dictionaries";

export default async function NotFound() {
  // not-found.tsx receives no params; infer the language from the URL.
  const path = (await headers()).get("x-pathname") ?? "";
  const locale = path.startsWith("/ta") ? "ta" : "en";
  const t = getDictionary(locale);
  return (
    <div className="container page-header">
      <title>{`${t.notFound.title} | ${t.brand}`}</title>
      <meta name="robots" content="noindex" />
      <h1>{t.notFound.title}</h1>
      <p className="lead">{t.notFound.body}</p>
      <p>
        <Link href={`/${locale}/`} className="btn btn-primary">
          {t.notFound.home}
        </Link>
      </p>
    </div>
  );
}
