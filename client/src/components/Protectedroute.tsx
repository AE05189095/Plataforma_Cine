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
    // Si no hay token -> redirigir al login genérico
    if (!token) {
      try {
        const next = window.location.pathname + window.location.search;
        // Determinar ruta de login según la ruta actual
        const path = window.location.pathname || '';
        if (path.startsWith('/admin')) router.replace(`/login-admin?next=${encodeURIComponent(next)}`);
        else if (path.startsWith('/colaborador') || path.startsWith('/employee')) router.replace(`/login-colaborador?next=${encodeURIComponent(next)}`);
        else router.replace(`/login?next=${encodeURIComponent(next)}`);
      } catch {
        router.replace("/login");
      }
      return;
    }

    // Intentar decodificar el JWT para comprobar expiración
    try {
      const parseJwt = (t: string) => {
        const parts = t.split('.');
        if (parts.length < 2) return null;
        const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
        try {
          const json = decodeURIComponent(atob(payload).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
          }).join(''));
          return JSON.parse(json);
        } catch (e) {
          return null;
        }
      };

      const payload = parseJwt(token);
      const nowSec = Math.floor(Date.now() / 1000);
      if (!payload || (payload.exp && payload.exp <= nowSec)) {
        // token expirado o inválido -> eliminar y redirigir según ruta
        localStorage.removeItem(TOKEN_KEY);
        const path = window.location.pathname || '';
        if (path.startsWith('/admin')) router.replace('/login-admin');
        else if (path.startsWith('/colaborador') || path.startsWith('/employee')) router.replace('/login-colaborador');
        else router.replace('/login');
        return;
      }

      // Comprobación adicional: si el role del token no concuerda con la ruta, forzar logout
      try {
        const role = (payload && payload.role) ? String(payload.role) : null;
        const path = window.location.pathname || '';
        if (path.startsWith('/admin') && role !== 'admin') {
          localStorage.removeItem(TOKEN_KEY);
          router.replace('/login-admin');
          return;
        }
        if ((path.startsWith('/colaborador') || path.startsWith('/employee')) && role !== 'colaborador' && role !== 'admin') {
          // permitir admin acceder como colaborador en caso necesario; si no, redirigir
          localStorage.removeItem(TOKEN_KEY);
          router.replace('/login-colaborador');
          return;
        }
      } catch (err) {
        // Si algo sale mal al comprobar el role, continuar silenciosamente
      }

      // Instalar un interceptor global para fetch que maneje 401 -> logout + redirect
      try {
        const win: any = window as any;
        if (!win.__fetchInterceptInstalled) {
          const originalFetch = window.fetch.bind(window);
          window.fetch = async (...args: any[]) => {
            const res = await (originalFetch as any).apply(window, args as any);
            if (res && res.status === 401) {
              try { localStorage.removeItem(TOKEN_KEY); } catch {}
              const p = window.location.pathname || '';
              if (p.startsWith('/admin')) router.replace('/login-admin');
              else if (p.startsWith('/colaborador') || p.startsWith('/employee')) router.replace('/login-colaborador');
              else router.replace('/login');
            }
            return res;
          };
          win.__fetchInterceptInstalled = true;
        }
      } catch (err) {
        // No bloquear la ejecución por problemas con el interceptor
        console.warn('No se pudo instalar interceptor de fetch:', err);
      }
    } catch (err) {
      // Si cualquier error ocurre, forzar logout y redirigir
      try { localStorage.removeItem(TOKEN_KEY); } catch {}
      router.replace('/login');
    }
  }, [router]);

  return <>{children}</>;
}
