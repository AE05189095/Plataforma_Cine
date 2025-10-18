'use client';
import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

/**
 * Hook de protección de rutas.
 * Si no hay token guardado en localStorage, redirige al login.
 */
export function useAuth() {
  const router = useRouter();
  const pathname = usePathname(); // para guardar la ruta actual

  useEffect(() => {
    const token = localStorage.getItem('authToken');

    // Si no hay token, redirigir al login
    if (!token) {
      // Redirige al login con query ?redirect=/ruta-actual
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [router, pathname]);
}
