"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { TOKEN_KEY } from "@/lib/config";

declare global {
  interface Window {
    __fetchInterceptInstalled?: boolean;
  }
}

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
      try {
        const next = window.location.pathname + window.location.search;
        const path = window.location.pathname || "";
        if (path.startsWith("/admin")) router.replace(`/login-admin?next=${encodeURIComponent(next)}`);
        else if (path.startsWith("/colaborador") || path.startsWith("/employee"))
          router.replace(`/login-colaborador?next=${encodeURIComponent(next)}`);
        else router.replace(`/login?next=${encodeURIComponent(next)}`);
      } catch {
        router.replace("/login");
      }
      return;
    }

    // Decodificar JWT
    const parseJwt = (t: string) => {
      try {
        const payload = t.split(".")[1];
        const decoded = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
        return JSON.parse(
          decodeURIComponent(
            decoded
              .split("")
              .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
              .join("")
          )
        );
      } catch {
        return null;
      }
    };

    const payload = parseJwt(token);
    const nowSec = Math.floor(Date.now() / 1000);

    if (!payload || (payload.exp && payload.exp <= nowSec)) {
      localStorage.removeItem(TOKEN_KEY);
      const path = window.location.pathname || "";
      if (path.startsWith("/admin")) router.replace("/login-admin");
      else if (path.startsWith("/colaborador") || path.startsWith("/employee"))
        router.replace("/login-colaborador");
      else router.replace("/login");
      return;
    }

    // Validar role vs ruta
    try {
      const role = payload.role as string | undefined;
      const path = window.location.pathname || "";
      if (path.startsWith("/admin") && role !== "admin") {
        localStorage.removeItem(TOKEN_KEY);
        router.replace("/login-admin");
        return;
      }
      if ((path.startsWith("/colaborador") || path.startsWith("/employee")) && role !== "colaborador" && role !== "admin") {
        localStorage.removeItem(TOKEN_KEY);
        router.replace("/login-colaborador");
        return;
      }
    } catch {}

    // Interceptor global de fetch
    try {
      if (!window.__fetchInterceptInstalled) {
        const originalFetch = window.fetch.bind(window);
        window.fetch = async (...args: Parameters<typeof fetch>): Promise<Response> => {
          const res = await originalFetch(...args);
          if (res.status === 401) {
            try {
              localStorage.removeItem(TOKEN_KEY);
            } catch {}
            const path = window.location.pathname || "";
            if (path.startsWith("/admin")) router.replace("/login-admin");
            else if (path.startsWith("/colaborador") || path.startsWith("/employee"))
              router.replace("/login-colaborador");
            else router.replace("/login");
          }
          return res;
        };
        window.__fetchInterceptInstalled = true;
      }
    } catch (err) {
      console.warn("No se pudo instalar interceptor de fetch:", err);
    }
  }, [router]);

  return <>{children}</>;
}
