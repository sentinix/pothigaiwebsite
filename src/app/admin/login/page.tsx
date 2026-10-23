import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "@/components/admin/LoginForm";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <main className="container" style={{ maxWidth: 420, paddingTop: 64 }}>
      <h1>Admin sign in</h1>
      <Suspense>
        <LoginForm />
      </Suspense>
    </main>
  );
}
