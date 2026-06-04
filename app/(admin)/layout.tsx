import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin",
};

// Esto le dice a Next.js que no cachee estas páginas
export const dynamic = "force-dynamic";
export const revalidate = 0;

import AuthGuard from "@/components/layout/AuthGuard";
import AdminShell from "@/components/layout/AdminShell";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <AdminShell>
        {children}
      </AdminShell>
    </AuthGuard>
  );
}