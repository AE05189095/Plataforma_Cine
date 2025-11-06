// src/components/Header.tsx

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation"; // 🚨 Importar usePathname
import { API_BASE, TOKEN_KEY } from "@/lib/config";
import { Dispatch, SetStateAction } from "react";

type HeaderProps = {
    searchTerm?: string;
    setSearchTerm?: Dispatch<SetStateAction<string>>;
    selectedGenre?: string;
    setSelectedGenre?: Dispatch<SetStateAction<string>>;
    selectedDate?: string;
    setSelectedDate?: Dispatch<SetStateAction<string>>;
    onLogoClick?: () => void;
};

// Componente de encabezado
export default function Header(props: HeaderProps = {}) {
    const [isLogged, setIsLogged] = useState(false);
    const router = useRouter();
  const pathname = usePathname(); // 🚨 Hook para obtener la ruta actual

    // Determina si estamos en la página de inicio
  const isHomePage = pathname === '/';
  // Ocultar filtros sólo en la pantalla admin/dashboard
  const isAdminDashboard = pathname === '/admin/dashboard';

    // Lógica de autenticación (sin cambios)
    useEffect(() => {
        // ... (Lógica de validación de token)
        const validate = async () => {
            try {
                const token = localStorage.getItem(TOKEN_KEY);
                if (!token) {
                    setIsLogged(false);
                    return;
                }

                const res = await fetch(`${API_BASE}/api/auth/me`, {
                    headers: { Authorization: `Bearer ${token}` },
                });

                if (res.ok) {
                    setIsLogged(true);
                } else {
                    localStorage.removeItem(TOKEN_KEY);
                    setIsLogged(false);
                }
            } catch {
                localStorage.removeItem(TOKEN_KEY);
                setIsLogged(false);
            }
        };

        validate();

        const onAuth = () => validate();
        window.addEventListener('authChange', onAuth);
        return () => window.removeEventListener('authChange', onAuth);
    }, []);

    const handleProfile = () => {
        router.push("/profile");
    };

    // Control de estado de filtros (con fallback a local si no vienen por props)
    const [localSearch, setLocalSearch] = useState("");
    const [localGenre, setLocalGenre] = useState("Todos los géneros");
    const [localDate, setLocalDate] = useState("");

    const searchTerm = props.searchTerm ?? localSearch;
    const setSearchTerm = props.setSearchTerm ?? setLocalSearch;

    const selectedGenre = props.selectedGenre ?? localGenre;
    const setSelectedGenre = props.setSelectedGenre ?? setLocalGenre;

    const selectedDate = props.selectedDate ?? localDate;
    const setSelectedDate = props.setSelectedDate ?? setLocalDate;

    // Determina si alguno de los filtros está activo
    const areFiltersActive = searchTerm !== "" || selectedGenre !== "Todos los géneros" || selectedDate !== "";

    // FUNCIÓN PRINCIPAL: Limpia todos los filtros y navega al home
    const handleClearFilters = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        
        // 1. Limpia el estado de los filtros
        if (setSearchTerm) setSearchTerm("");
        if (setSelectedGenre) setSelectedGenre("Todos los géneros");
        if (setSelectedDate) setSelectedDate("");

        // 2. Regresa a la página principal (Home)
        router.push('/');
    };

    // 🚨 Nueva función para manejar el botón de regreso
    const handleGoBack = () => {
        router.back();
    };


    return (
  <header className="bg-black text-white p-4 sticky top-0 z-40 shadow-md">
    <div className="max-w-[1280px] mx-auto flex flex-wrap items-center justify-between gap-4">
      
      {/* 🔸 Logo y botón de regresar */}
      <div className="flex items-center gap-3">
        {!isHomePage && (
          <button
            onClick={handleGoBack}
            className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-red-600 text-white hover:bg-red-700 transition-colors"
            aria-label="Regresar"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m12 19-7-7 7-7" />
              <path d="M19 12H5" />
            </svg>
          </button>
        )}

        <div
          className="flex items-center cursor-pointer space-x-2"
          onClick={() => {
            if (props.onLogoClick) props.onLogoClick();
            else router.push("/");
          }}
        >
          <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-yellow-400 rounded-lg flex items-center justify-center shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-black">
              <rect width="18" height="18" x="3" y="3" rx="2" />
              <path d="M7 3v18M17 3v18M3 7.5h4M17 7.5h4M3 16.5h4M17 16.5h4" />
            </svg>
          </div>
          <span className="font-bold text-xl bg-gradient-to-r from-orange-500 to-yellow-400 bg-clip-text text-transparent">
            CineGT
          </span>
        </div>
      </div>

      {/* 🔸 Controles de búsqueda y filtros (ocultos en /admin/dashboard) */}
      {!isAdminDashboard && (
        <div className="flex flex-col sm:flex-row flex-wrap justify-center items-center gap-3 w-full sm:w-auto">
          <input
            type="text"
            placeholder="Buscar películas..."
            className="w-full sm:w-52 px-3 py-2 rounded-md border border-red-600 bg-gray-800 text-white placeholder:text-gray-400 focus:outline-none focus:border-red-500 text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm && setSearchTerm(e.target.value)}
          />

          <select
            className="w-full sm:w-40 px-3 py-2 rounded-md border border-red-600 bg-gray-800 text-white text-sm focus:outline-none"
            value={selectedGenre}
            onChange={(e) => setSelectedGenre && setSelectedGenre(e.target.value)}
          >
            <option value="Todos los géneros">Todas</option>
            <option value="Comedia">Comedia</option>
            <option value="Acción">Acción</option>
            <option value="Drama">Drama</option>
            <option value="Ciencia Ficción">Ciencia Ficción</option>
            <option value="Romance">Romance</option>
            <option value="Terror">Terror</option>
            <option value="Suspense">Suspense</option>
            <option value="Animación">Animación</option>
            <option value="Documental">Documental</option>
            <option value="Familiar">Familiar</option>
          </select>

          <input
            type="date"
            className="w-full sm:w-36 px-3 py-2 rounded-md border border-red-600 bg-gray-800 text-white text-sm focus:outline-none cursor-pointer"
            style={{ colorScheme: "dark" }}
            value={selectedDate}
            onChange={(e) => setSelectedDate && setSelectedDate(e.target.value)}
          />

          {areFiltersActive && (
            <button
              onClick={handleClearFilters}
              className="px-3 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600 transition text-sm font-semibold whitespace-nowrap"
            >
              Limpiar
            </button>
          )}
        </div>
      )}

      {/* 🔸 Botón de perfil o login */}
      <div className="flex items-center justify-end flex-shrink-0">
        {isLogged ? (
          <button
            onClick={handleProfile}
            className="px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition flex items-center gap-2 text-sm font-semibold"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" className="w-4 h-4" viewBox="0 0 24 24">
              <path d="M12 12c2.761 0 5-2.239 5-5S14.761 2 12 2 7 4.239 7 7s2.239 5 5 5zM4 20c0-4.418 3.582-8 8-8s8 3.582 8 8H4z" />
            </svg>
            Perfil
          </button>
        ) : (
          <Link href="/login?next=/profile">
            <button className="px-3 py-2 bg-red-600 rounded-md hover:bg-red-700 transition text-sm font-semibold">
              Iniciar sesión
            </button>
          </Link>
        )}
      </div>
    </div>
  </header>
);

}