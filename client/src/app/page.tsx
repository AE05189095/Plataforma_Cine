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
    isUpcoming?: boolean; // 🚨 ¡NUEVO! Bandera para "PRÓXIMAMENTE"
}

// Lista de géneros - Agregamos "Animación"
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

export default function HomePage() {
    const router = useRouter();

    const [searchTerm, setSearchTerm] = useState("");
    const [selectedGenre, setSelectedGenre] = useState(ALL_GENRES[0]);
    const [selectedDate, setSelectedDate] = useState("");
    const [allMovies, setAllMovies] = useState<MovieData[]>([]); // lista completa
    const [logoClickCount, setLogoClickCount] = useState(0);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Limpiar timeout
    useEffect(() => () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); }, []);

    // Cargar películas desde API
    useEffect(() => {
        let mounted = true;
        const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

        const getImage = (m: RawMovie): string => {
            let imagePath = "";
            if (typeof m.posterUrl === "string" && m.posterUrl.trim()) imagePath = m.posterUrl;
            else if (Array.isArray(m.images) && m.images.length) {
                const first = m.images[0];
                if (typeof first === "string") imagePath = first;
                else if (first && typeof first === "object" && "url" in first && typeof (first as Record<string, unknown>).url === "string")
                    imagePath = (first as Record<string, unknown>).url as string;
            } else if (m.title) imagePath = `${m.slug || createSlug(m.title)}.jpg`;

            if (imagePath && !imagePath.startsWith("http")) {
                const filename = imagePath.split('/').pop() || imagePath;
                return `/images/${filename.toLowerCase()}`;
            }
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
                        rating: m.rating ? String(m.rating) : "PG-13",
                        score: m.rating ? String(m.rating) : m.ratingCount ? String(m.ratingCount) : "N/A",
                        genre: movieGenres[0] || "General",
                        genres: movieGenres,
                        releaseDate: m.releaseDate ? new Date(m.releaseDate).toISOString().slice(0, 10) : "",
                        duration: m.duration ? `${m.duration} min` : "N/A",
                        description: m.description || "",
                    };
                });

                // 🚨 INYECCIÓN DE LA NUEVA PELÍCULA (TÍTULO Y FECHA ACTUALIZADOS)
                const newMovie: MovieData = {
                    title: "200% Lobo", // ¡TÍTULO CORREGIDO!
                    image: "/images/lobo_200.jpg",
                    rating: "G",
                    score: "5",
                    genre: "Animación",
                    genres: ["Animación", "Comedia"],
                    releaseDate: "2025-11-30", // ¡FECHA CORREGIDA A 2025!
                    duration: "95 min",
                    description: "La esperada secuela del divertido lobo y sus aventuras.",
                    isUpcoming: true, // Se establece la bandera
                };
                
                const finalMovies = [...mapped, newMovie];

                if (mounted) setAllMovies(finalMovies);
            } catch (err) {
                console.warn("Error al cargar películas:", err);
                
                // Si la API falla, al menos mostramos 200% Lobo
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
                if (mounted && allMovies.length === 0) setAllMovies([fallbackMovie]);
            }
        };

        loadMovies();
        return () => { mounted = false; };
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

        // 1. Filtro por búsqueda
        if (searchTerm) {
            current = current.filter((m) =>
                m.title.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // 2. Filtro por género
        const selectedGenreNormalized = selectedGenre.toLowerCase().trim();
        const allGenresOptionNormalized = ALL_GENRES[0].toLowerCase().trim();

        if (selectedGenreNormalized !== allGenresOptionNormalized) {
            
            // Mapeo robusto de términos de búsqueda
            const genreMap: { [key: string]: string[] } = {
                "ciencia ficción": ["sci-fi", "ciencia ficción", "science fiction", "ciencia ficcion", "scifi"],
                "comedia": ["comedia", "comedy"],
                "accion": ["acción", "action", "accion"],
                "drama": ["drama"],
                "musical": ["musical"],
                "animación": ["animación", "animation", "cartoon"],
            };

            const searchTerms = genreMap[selectedGenreNormalized] || [selectedGenreNormalized];
            
            current = current.filter((m) =>
                m.genres.some((genre) => {
                    const genreLower = genre.toLowerCase();
                    return searchTerms.some(term => genreLower.includes(term));
                })
            );
        }

        // 3. Filtro por fecha (Lógica especial para 200% Lobo en noviembre 2025)
        if (selectedDate) {
            const selectedDateYearMonth = selectedDate.substring(0, 7); // YYYY-MM
            
            current = current.filter((m) => {
                const is200PercentLobo = m.title.includes("200% Lobo");
                const loboReleaseMonth = "2025-11";
                
                // Si la película es 200% Lobo y el cliente seleccionó una fecha en noviembre de 2025, la mostramos.
                if (is200PercentLobo && selectedDateYearMonth === loboReleaseMonth) {
                    return true;
                }
                
                // Para el resto de películas, usamos la lógica de "fecha seleccionada o posterior"
                return m.releaseDate >= selectedDate;
            });
        }

        return current;
    }, [allMovies, searchTerm, selectedGenre, selectedDate]);

    const handleLogoClick = () => {
        setLogoClickCount((prev) => {
            const next = prev + 1;
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
                        <p className="col-span-full text-center text-xl text-gray-400">
                            No se encontraron películas que coincidan con los filtros aplicados.
                        </p>
                    )}
                </section>
            </main>
        </div>
    );
}