"use client";

import React, { useState, useMemo, useRef, useEffect, Dispatch, SetStateAction } from "react";
import MovieCard from "@/components/MovieCard";
import Header from "@/components/Header";
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
};

export default function HomePage() {
    const router = useRouter();

    const [searchTerm, setSearchTerm] = useState("");
    const [selectedGenre, setSelectedGenre] = useState(ALL_GENRES[0]);
    const [selectedDate, setSelectedDate] = useState("");
    const [allMovies, setAllMovies] = useState<MovieData[]>([]);
    const [apiError, setApiError] = useState(false);
    const [logoClickCount, setLogoClickCount] = useState(0);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Limpiar timeout
    useEffect(() => () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); }, []);

    // Cargar películas desde API
    useEffect(() => {
        let mounted = true;
        const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

        const getImage = (m: RawMovie): string => {
            if (m.posterUrl && typeof m.posterUrl === 'string' && m.posterUrl.trim() !== '') return m.posterUrl;
            if (m.title) {
                const key = m.title.toLowerCase().trim();
                if (IMAGE_MAP[key]) return IMAGE_MAP[key];
            }
            if (m.title) return `/images/${(m.slug || createSlug(m.title)).toLowerCase()}.jpg`;
            return "/images/movie-default.svg";
        };

        const loadMovies = async () => {
            try {
                const res = await fetch(`${API_BASE}/api/movies`);
                if (!res.ok) throw new Error("Error al obtener películas");

                const data = await res.json();
                const mapped: MovieData[] = (data as RawMovie[]).map((m) => {
                    const movieGenres = Array.isArray(m.genres) ? m.genres : [];
                    return {
                        title: m.title || "Sin título",
                        image: getImage(m),
                        rating: m.rating !== undefined && m.rating !== null ? String(m.rating) : "PG-13",
                        score:
                            m.rating !== undefined && m.rating !== null && typeof m.rating === 'number' && m.rating > 0
                                ? String(m.rating)
                                : m.ratingCount !== undefined && m.ratingCount !== null
                                    ? String(m.ratingCount)
                                    : 'N/A',
                        genre: movieGenres[0] || "General",
                        genres: movieGenres,
                        releaseDate: m.releaseDate ? new Date(m.releaseDate).toISOString().slice(0, 10) : "",
                        duration: m.duration ? `${m.duration} min` : "N/A",
                        description: m.description || "",
                    };
                });

                if (mounted) setAllMovies(mapped);
                if (mounted) setApiError(false);
            } catch (err) {
                console.warn("Error al cargar películas:", err);
                if (mounted) {
                    setAllMovies([]);
                    setApiError(true);
                }
            }
        };

        loadMovies();

        // Refrescar automáticamente cada 15s
        const interval = setInterval(() => { if (mounted) loadMovies(); }, 15000);
        return () => { mounted = false; clearInterval(interval); };
    }, []);

    // Admin dev mode
    useEffect(() => {
        if (logoClickCount >= NUM_CLICKS_TO_ACTIVATE) {
            router.push("/admin-dev-mode");
            setLogoClickCount(0);
        }
    }, [logoClickCount, router]);

    // Filtrado de Películas
    const filteredMovies = useMemo(() => {
        let current = [...allMovies];

        if (searchTerm) {
            current = current.filter(m => m.title.toLowerCase().includes(searchTerm.toLowerCase()));
        }

        const selectedGenreNormalized = selectedGenre.toLowerCase().trim();
        const allGenresOptionNormalized = ALL_GENRES[0].toLowerCase().trim();

        if (selectedGenreNormalized !== allGenresOptionNormalized) {
            current = current.filter(m =>
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
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            timeoutRef.current = setTimeout(() => setLogoClickCount(0), TIMEOUT_DURATION);
            return next;
        });
    };

    return (
        <div className="min-h-screen bg-black text-white">
            <Header
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm as Dispatch<SetStateAction<string>>}
                selectedGenre={selectedGenre}
                setSelectedGenre={setSelectedGenre as Dispatch<SetStateAction<string>>}
                selectedDate={selectedDate}
                setSelectedDate={setSelectedDate as Dispatch<SetStateAction<string>>}
                onLogoClick={handleLogoClick}
            />

            <main className="container mx-auto p-4 sm:p-8">
                <section className="text-center pt-10 pb-16">
                    <h1 className="text-4xl sm:text-6xl font-extrabold text-orange-500 mb-2">
                        Cartelera CineGT
                    </h1>
                    <p className="text-xl text-gray-400">
                        Disfruta del mejor cine en Guatemala con la experiencia cinematográfica más emocionante
                    </p>
                </section>

                <section className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 pb-10">
                    {filteredMovies.length > 0 ? (
                        filteredMovies.map((movie, index) => (
                            <MovieCard key={movie.title + index} {...movie} />
                        ))
                    ) : (
                        <div className="col-span-full text-center">
                            {apiError ? (
                                <p className="text-xl text-red-400">Películas temporalmente indisponibles — no se pudieron cargar desde el servidor.</p>
                            ) : (
                                <p className="text-xl text-gray-400">No se encontraron películas que coincidan con los filtros aplicados.</p>
                            )}
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
}
