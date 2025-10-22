"use client";

import React, { useState, useMemo, useRef, useEffect, Dispatch, SetStateAction } from "react";
import MovieCard from "@/components/MovieCard";
import Header from "@/components/Header";
// Se mantiene el import de useState como useState para evitar conflictos, aunque no se usa como useStateHook en el cuerpo principal
import { useRouter } from "next/navigation";

// Tipos
interface RawMovie {
    title?: string;
    slug?: string;
    posterUrl?: string;
    images?: unknown[];
    rating?: number | string;
    ratingCount?: number;
    genres?: string[];
    releaseDate?: string;
    duration?: number | string;
    description?: string;
}

interface MovieData {
    title: string;
    image: string;
    rating: string;
    score: string;
    genre: string;
    genres: string[];
    releaseDate: string;
    duration: string;
    description: string;
    isUpcoming?: boolean;
}

// Lista de géneros
const ALL_GENRES = [
    "Todos los géneros",
    "Comedia",
    "Accion",
    "Drama",
    "Musical",
    "Ciencia ficción",
    "Animación",
];

const NUM_CLICKS_TO_ACTIVATE = 8;
const TIMEOUT_DURATION = 1500;

// Crear slug
const createSlug = (title: string) =>
    title.toLowerCase().trim().replace(/[^\w\s-]/g, "").replace(/[\s_-]+/g, "-").replace(/^-+|-+$/g, "");

// Mapa de imágenes exactas según los archivos que tienes en public/images
const IMAGE_MAP: Record<string, string> = {
    "the shawshank redemption": "/images/the-shawshank-redemption.jpg",
    "interstellar": "/images/interstellar.jpg",
    "parasite": "/images/parasite.jpg",
    "la la land": "/images/la-la-land.jpg",
    "incepcion": "/images/incepcion.jpg",
    "200% lobo": "/images/lobo_200.jpg",
};

export default function HomePage() {
    const router = useRouter();

    // Estado para filtros
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedGenre, setSelectedGenre] = useState(ALL_GENRES[0]);
    const [selectedDate, setSelectedDate] = useState("");
    
    // Estado de las películas y carga
    const [allMovies, setAllMovies] = useState<MovieData[]>([]);
    const [syncing, setSyncing] = useState(false); // Mantener por si se usa en el UI
    
    // Estado para el modo administrador
    const [logoClickCount, setLogoClickCount] = useState(0);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Limpiar timeout al desmontar
    useEffect(() => () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); }, []);

    // Función para obtener la URL de la imagen (combina lógica de ambas versiones para priorizar mapeo local)
    const getImage = (m: RawMovie): string => {
        if (m.title) {
            const key = m.title.toLowerCase().trim();
            if (IMAGE_MAP[key]) return IMAGE_MAP[key];
        }
        
        // Fallback a URL externa (versión Izquierda)
        if (typeof m.posterUrl === 'string') return m.posterUrl;
        if (Array.isArray(m.images) && m.images.length) {
            const first = m.images[0];
            if (typeof first === 'string') return first;
            if (first && typeof first === 'object' && 'url' in first && typeof (first as Record<string, unknown>).url === 'string') return (first as Record<string, unknown>).url as string;
        }

        // Fallback al slug automático (versión Derecha)
        if (m.title) return `/images/${(m.slug || createSlug(m.title)).toLowerCase()}.jpg`;
        
        return "/images/movie-default.svg";
    };

    // Cargar películas desde API
    useEffect(() => {
        let mounted = true;
        setSyncing(true);
        const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

        const loadMovies = async () => {
            try {
                const res = await fetch(`${API_BASE}/api/movies`);
                if (!res.ok) throw new Error("Error al obtener películas");

                const data = await res.json();
                const rawArray = Array.isArray(data) ? (data as unknown as RawMovie[]) : [];

                const mapped: MovieData[] = rawArray.map((m) => {
                    const movieGenres = Array.isArray(m.genres) ? m.genres : [];
                    return {
                        title: m.title || "Sin título",
                        image: getImage(m),
                        rating: m.rating && String(m.rating).length > 0 ? String(m.rating) : 'PG-13',
                        score: m.rating ? String(m.rating) : m.ratingCount ? String(m.ratingCount) : "N/A",
                        genre: movieGenres[0] || "General",
                        genres: movieGenres,
                        releaseDate: m.releaseDate ? new Date(m.releaseDate).toISOString().slice(0, 10) : "",
                        duration: m.duration ? `${m.duration} min` : "N/A",
                        description: m.description || "",
                    };
                });

                // Inyectar la película '200% Lobo' (de la versión Derecha)
                const newMovie: MovieData = {
                    title: "200% Lobo",
                    image: IMAGE_MAP["200% lobo"] || "/images/lobo_200.jpg",
                    rating: "G",
                    score: "5",
                    genre: "Animación",
                    genres: ["Animación", "Comedia"],
                    releaseDate: "2025-11-30",
                    duration: "95 min",
                    description: "La esperada secuela del divertido lobo y sus aventuras.",
                    isUpcoming: true,
                };
                
                if (mounted) setAllMovies([...mapped, newMovie]);
            } catch (err) {
                console.error("Error al cargar películas:", err);

                // Fallback en caso de error de carga (versión Derecha)
                if (mounted && allMovies.length === 0) {
                    const fallbackMovie: MovieData = {
                        title: "200% Lobo (Fallback)",
                        image: "/images/lobo_200.jpg",
                        rating: "G",
                        score: "5",
                        genre: "Animación",
                        genres: ["Animación", "Comedia"],
                        releaseDate: "2025-11-30",
                        duration: "95 min",
                        description: "La esperada secuela del divertido lobo y sus aventuras. (Modo Fallback)",
                        isUpcoming: true,
                    };
                    setAllMovies([fallbackMovie]);
                }

            } finally {
                if (mounted) setSyncing(false);
            }
        };

        loadMovies();
        return () => { mounted = false; };
    }, []);

    // Redirigir al modo admin
    useEffect(() => {
        if (logoClickCount >= NUM_CLICKS_TO_ACTIVATE) {
            router.push("/admin-dev-mode");
            setLogoClickCount(0);
        }
    }, [logoClickCount, router]);

    // Lógica de Filtrado (tomada de la versión Derecha por ser más robusta para géneros)
    const filteredMovies = useMemo(() => {
        let current = [...allMovies];

        if (searchTerm) {
            current = current.filter(m => m.title.toLowerCase().includes(searchTerm.toLowerCase()));
        }

        const selectedGenreNormalized = selectedGenre.toLowerCase().trim();
        const allGenresOptionNormalized = ALL_GENRES[0].toLowerCase().trim();

        // Filtra si el género seleccionado no es "Todos los géneros"
        if (selectedGenreNormalized !== allGenresOptionNormalized) {
            current = current.filter(m =>
                // Verifica si ALGUN género de la película coincide con el seleccionado
                m.genres.some(g => g.toLowerCase().includes(selectedGenreNormalized))
            );
        }

        if (selectedDate) {
            current = current.filter(m => m.releaseDate >= selectedDate);
        }

        return current;
    }, [allMovies, searchTerm, selectedGenre, selectedDate]);

    const handleLogoClick = () => {
        setLogoClickCount(prev => {
            const next = prev + 1;
            
            // Reiniciar el contador si no hay más clics después de un tiempo
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            timeoutRef.current = setTimeout(() => setLogoClickCount(0), TIMEOUT_DURATION);
            
            return next;
        });
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black text-white">
            <Header
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm as Dispatch<SetStateAction<string>>}
                selectedGenre={selectedGenre}
                setSelectedGenre={setSelectedGenre as Dispatch<SetStateAction<string>>}
                selectedDate={selectedDate}
                setSelectedDate={setSelectedDate as Dispatch<SetStateAction<string>>}
                onLogoClick={handleLogoClick}
                allGenres={ALL_GENRES} // Se asume que Header necesita la lista completa de géneros
            />

            <main className="container mx-auto p-4 sm:p-8">
                <section className="text-center pt-10 pb-16">
                    <h1 className="text-4xl sm:text-6xl font-extrabold text-orange-500 mb-2">
                        Cartelera CineGT
                    </h1>
                    <p className="text-xl text-gray-400">
                        Disfruta del mejor cine en Guatemala con la experiencia cinematográfica más emocionante
                    </p>
                    {/* Elementos decorativos (de la versión izquierda) */}
                    <div className="flex justify-center gap-2 mt-4">
                        <span className="w-3 h-3 bg-red-600 rounded-full"></span>
                        <span className="w-3 h-3 bg-gray-600 rounded-full"></span>
                        <span className="w-3 h-3 bg-gray-600 rounded-full"></span>
                    </div>
                </section>

                <section className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 pb-10">
                    {syncing && allMovies.length === 0 ? (
                        <p className="col-span-full text-center text-xl text-orange-400 font-semibold">
                            Cargando películas...
                        </p>
                    ) : filteredMovies.length > 0 ? (
                        filteredMovies.map((movie, index) => (
                            <MovieCard key={movie.title + index} {...movie} />
                        ))
                    ) : (
                        <p className="col-span-full text-center text-xl text-gray-400">
                            No se encontraron películas que coincidan con los filtros aplicados.
                        </p>
                    )}
                </section>
            </main>
        </div>
    );
}
