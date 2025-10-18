"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import React from "react";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    // Utilizamos "authToken" para ser consistente con Header.tsx e InactivityLogout.tsx
    const token = localStorage.getItem("authToken");

    if (!token) {
      router.push("/login"); // Si no hay token, redirige a la página de login
    }
  }, [router]);

  // Si hay token, renderiza los hijos. Si no lo hay, la redirección se encarga.
  return <>{children}</>;
}
