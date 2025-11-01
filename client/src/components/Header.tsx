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
        <header className="bg-black text-white p-3 md:p-4 sticky top-0 z-40">
            {/* Contenedor principal: Regresar/Logo (auto) | Filtros (1fr) | Perfil (auto) */}
            <div className="max-w-[1280px] mx-auto w-full grid grid-cols-[auto_1fr_auto] items-center gap-4 md:gap-8">
                
                {/* 1. Área Izquierda: Botón de Regreso y Logo */}
                <div className="flex items-center space-x-3"> 
                    
                    {/* 🚨 Botón de Regresar (visible si NO es la Home Page) */}
                    {!isHomePage && (
                        <button
                            onClick={handleGoBack}
                            className="inline-flex items-center justify-center size-9 rounded-full bg-red-600 text-white hover:bg-red-700 transition-colors flex-shrink-0"
                            aria-label="Regresar a la página anterior"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-arrow-left size-5">
                                <path d="m12 19-7-7 7-7"></path><path d="M19 12H5"></path>
                            </svg>
                        </button>
                    )}

                    {/* Logo (Alineado a la izquierda) */}
                    <div
                        className="flex items-center justify-start cursor-pointer flex-shrink-0 space-x-2"
                        role="button"
                        tabIndex={0}
                        onClick={() => {
                            if (props.onLogoClick) props.onLogoClick();
                            else router.push('/');
                        }}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                if (props.onLogoClick) props.onLogoClick();
                                else router.push('/');
                            }
                        }}
                    >
                        {/* Icono de Película con degradado */}
                        <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-yellow-400 rounded-lg flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-film w-5 h-5 text-black" aria-hidden="true">
                                <rect width="18" height="18" x="3" y="3" rx="2"></rect>
                                <path d="M7 3v18"></path><path d="M3 7.5h4"></path><path d="M3 12h18"></path><path d="M3 16.5h4"></path>
                                <path d="M17 3v18"></path><path d="M17 7.5h4"></path><path d="M17 16.5h4"></path>
                            </svg>
                        </div>
                        {/* Nombre CineGT con degradado */}
                        <span className="font-bold text-xl bg-gradient-to-r from-orange-500 to-yellow-400 bg-clip-text text-transparent">CineGT</span>
                    </div>
                </div>

                {/* 2. Controles de Filtrado (Centrados) - SIN CAMBIOS */}
                <div className="flex flex-col md:flex-row items-center gap-2 w-full justify-center px-0">
                    
                    {/* Contenedor de los inputs/selects */}
                    <div className="flex flex-col md:flex-row items-center gap-3 w-full md:max-w-2xl">
                        
                        {/* Input de Búsqueda */}
                        <div className="relative w-full md:flex-1">
                            <input
                                type="text"
                                placeholder="Buscar películas..."
                                className="w-full pl-10 pr-4 py-2 rounded-lg border border-red-600 bg-gray-800 text-white placeholder:text-gray-400 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm && setSearchTerm(e.target.value)}
                            />
                            {/* Ícono de Lupa */}
                            <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                        </div>
                        
                        {/* Select de Género */}
                        <select
                            className="px-3 py-2 rounded-lg border border-red-600 bg-gray-800 text-white focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 flex-shrink-0 w-full md:w-auto"
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
                        
                        {/* Input de Fecha */}
                        <input
                            type="date"
                            placeholder="mm/dd/yyyy"
                            className="px-3 py-2 rounded-lg border border-red-600 bg-gray-800 text-white focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 cursor-pointer flex-shrink-0 w-full md:w-auto"
                            style={{ colorScheme: 'dark' }}
                            readOnly={false}
                            value={selectedDate}
                            onChange={(e) => setSelectedDate && setSelectedDate(e.target.value)}
                        />
                    </div>
                    
                    {/* Botón de Limpiar Filtros */}
                    {areFiltersActive && (
                        <button
                            onClick={handleClearFilters}
                            className="px-3 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition flex items-center justify-center flex-shrink-0 w-full md:w-auto text-sm font-semibold whitespace-nowrap md:ml-4"
                        >
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                            Limpiar Filtros
                        </button>
                    )}
                </div>

                {/* 3. Botón perfil/inicio (Alineado a la derecha) - SIN CAMBIOS */}
                <div className="flex items-center justify-end flex-shrink-0">
                    {isLogged ? (
                        <button onClick={handleProfile} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center gap-2 font-semibold shadow-lg">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5" aria-hidden="true">
                                <path d="M12 12c2.761 0 5-2.239 5-5s-2.239-5-5-5-5 2.239-5 5 2.239 5 5 5zm0 2c-3.866 0-7 3.134-7 7h2a5 5 0 0 1 10 0h2c0-3.866-3.134-7-7-7z" />
                            </svg>
                            <span>Perfil</span>
                            <span className="inline-block w-2 h-2 rounded-full bg-amber-500" title="Conectado" aria-hidden="true" />
                        </button>
                    ) : (
                        <Link href="/login?next=/profile" className="w-full">
                            <button className="px-4 py-2 bg-red-600 rounded-lg hover:bg-red-700 transition font-semibold w-full shadow-lg">
                                Iniciar Sesión
                            </button>
                        </Link>
                    )}
                </div>
            </div>
        </header>
    );
}