import "@fontsource/noto-sans/latin-400.css";
import "@fontsource/noto-sans/latin-600.css";
import "@fontsource/noto-sans-tamil/tamil-400.css";
import "@fontsource/noto-serif/latin-700.css";
import "../globals.css";
import "./admin.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { default: "Admin | Pothigai Naturals", template: "%s | Admin" },
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
