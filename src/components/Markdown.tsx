import Link from "next/link";
import ReactMarkdown from "react-markdown";

/**
 * Renders editor Markdown safely: raw HTML is skipped and unsafe URLs are
 * stripped by react-markdown. Markdown "# headings" are demoted so each page
 * keeps a single H1.
 */
export function Markdown({ children }: { children: string }) {
  return (
    <div className="prose">
      <ReactMarkdown
        skipHtml
        components={{
          h1: ({ children }) => <h2>{children}</h2>,
          a: ({ href, children }) =>
            href && href.startsWith("/") ? (
              <Link href={href}>{children}</Link>
            ) : (
              <a href={href} rel="noopener noreferrer" target="_blank">
                {children}
              </a>
            ),
          img: ({ src, alt }) =>
            // eslint-disable-next-line @next/next/no-img-element
            typeof src === "string" ? <img src={src} alt={alt ?? ""} loading="lazy" decoding="async" /> : null,
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
