"use client";
import { useParams } from "next/navigation";
import { getDictionary } from "@/i18n/dictionaries";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  const params = useParams<{ locale?: string }>();
  const t = getDictionary(params?.locale === "ta" ? "ta" : "en");
  return (
    <div className="container page-header">
      <h1>{t.error.title}</h1>
      <p className="lead">{t.error.body}</p>
      <button type="button" className="btn btn-primary" onClick={reset}>
        {t.actions.tryAgain}
      </button>
    </div>
  );
}
