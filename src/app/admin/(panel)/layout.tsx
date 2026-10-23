import Link from "next/link";
import { adminGet } from "@/lib/admin-api";

export const dynamic = "force-dynamic";

const NAV = [
  ["/admin/", "SEO dashboard"],
  ["/admin/products/", "Products"],
  ["/admin/categories/", "Categories"],
  ["/admin/pages/home/", "Homepage"],
  ["/admin/pages/about/", "About page"],
  ["/admin/pages/contact/", "Contact page"],
  ["/admin/blog/", "Blog"],
  ["/admin/orders/", "Orders"],
  ["/admin/redirects/", "Redirects"],
  ["/admin/settings/", "Store settings"],
];

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  // Verifies the session with the API (redirects to login if invalid/expired).
  await adminGet("/settings");
  return (
    <div className="admin-shell">
      <nav className="admin-nav" aria-label="Admin">
        <div className="brand-small">Pothigai Naturals</div>
        <ul>
          {NAV.map(([href, label]) => (
            <li key={href}>
              <Link href={href}>{label}</Link>
            </li>
          ))}
          <li>
            <a href="/en/" target="_blank" rel="noopener">
              View store ↗
            </a>
          </li>
        </ul>
        <form action="/api/admin-auth/logout/" method="post">
          <button type="submit">Sign out</button>
        </form>
      </nav>
      <main className="admin-main" id="main">
        {children}
      </main>
    </div>
  );
}
