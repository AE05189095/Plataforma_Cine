"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { TOKEN_KEY } from "@/lib/config";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    try {
      const bypass = process.env.NEXT_PUBLIC_BYPASS_AUTH === "true";
      if (bypass) return;
    } catch {
      // ignorar
    }

    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      // redirigir al login incluyendo ruta destino
      try {
        const next = window.location.pathname + window.location.search;
        router.replace(`/login?next=${encodeURIComponent(next)}`);
      } catch {
        router.replace("/login");
      }
    }
  }, [router]);

  return <>{children}</>;
}
