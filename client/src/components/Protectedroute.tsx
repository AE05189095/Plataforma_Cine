"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { TOKEN_KEY } from "@/lib/config";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    // Allow bypass of auth for local testing by setting NEXT_PUBLIC_BYPASS_AUTH=true
    try {
      const bypass = process.env.NEXT_PUBLIC_BYPASS_AUTH === "true";
      if (bypass) return;
    } catch {
      // ignore
    }

    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      // incluir la ruta actual como destino para volver después de login
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