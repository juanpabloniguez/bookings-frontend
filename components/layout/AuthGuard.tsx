"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { isAdminUser, parseCurrentUser } from "@/lib/currentUser";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const [authorized, setAuthorized] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const parsedUser = parseCurrentUser(localStorage.getItem("currentUser"));
    if (!parsedUser) {
      // Redirige y reemplaza TODO el historial
      window.location.replace("/login");
      return;
    }

    // Only admins can access businesses and users pages
    if ((pathname === "/businesses" || pathname === "/users") && !isAdminUser(parsedUser)) {
      window.location.replace("/dashboard");
      return;
    }

    setAuthorized(true);
  }, [pathname, router]);

  if (!authorized) {
    return (
      <div style={{ display: "grid", placeItems: "center", minHeight: "100vh" }}>
        <p>Verificando sesión...</p>
      </div>
    );
  }

  return <>{children}</>;
}