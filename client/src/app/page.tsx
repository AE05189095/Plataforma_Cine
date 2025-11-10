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
    id?: string;
    slug?: string;
    isUpcoming?: boolean;
}

interface ShowtimeItem {
    _id?: string;
    movie?: { _id?: string; slug?: string; title?: string } | string;
    date?: string; // 'YYYY-MM-DD'
    startAt?: string;
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
    const [allShowtimes, setAllShowtimes] = useState<ShowtimeItem[]>([]);
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
                        id: (m as any)._id,
                        slug: (m as any).slug,
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
        const interval = setInterval(() => { if (mounted) loadMovies(); }, 3000);
        return () => { mounted = false; clearInterval(interval); };
    }, []);

    // Cargar showtimes desde API (para poder filtrar por fecha real de funciones)
    useEffect(() => {
        let mounted = true;
        const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

        const loadShowtimes = async () => {
            try {
                const res = await fetch(`${API_BASE}/api/showtimes`);
                if (!res.ok) throw new Error('Error al obtener showtimes');
                const data = await res.json();
                if (mounted) setAllShowtimes(Array.isArray(data) ? data as ShowtimeItem[] : []);
            } catch (err) {
                console.warn('Error al cargar showtimes:', err);
                if (mounted) setAllShowtimes([]);
            }
        };

        loadShowtimes();
        const interval = setInterval(() => { if (mounted) loadShowtimes(); }, 15000);
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
            // Buscar showtimes cuya fecha coincida con selectedDate (YYYY-MM-DD)
            const dateNormalized = selectedDate;
            const movieSlugSet = new Set<string>();
            for (const st of allShowtimes) {
                if (!st) continue;
                const stDate = st.date || (st.startAt ? new Date(st.startAt).toISOString().slice(0,10) : undefined);
                if (!stDate) continue;
                if (stDate === dateNormalized) {
                    // intentar obtener slug directamente
                    if (typeof st.movie === 'string') {
                        movieSlugSet.add(st.movie as string);
                    } else if (st.movie && (st.movie as any).slug) {
                        movieSlugSet.add((st.movie as any).slug);
                    } else if (st.movie && (st.movie as any).title) {
                        movieSlugSet.add(createSlug((st.movie as any).title));
                    }
                }
            }

            // Filtrar películas que tengan showtime en esa fecha (chequear slug o generar slug del título)
            current = current.filter(m => {
                const movieSlug = (m.slug && String(m.slug).trim()) || createSlug(m.title || '');
                return movieSlugSet.size === 0 ? false : movieSlugSet.has(movieSlug);
            });
        }

        return current;
    }, [allMovies, searchTerm, selectedGenre, selectedDate, allShowtimes]);

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
               <section className="text-center pt-6 sm:pt-10 pb-10 sm:pb-16 px-4">
                    <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold text-orange-500 mb-3 leading-tight">
                        Cartelera CineGT
                    </h1>
                    <p className="text-base sm:text-lg md:text-xl text-gray-400 max-w-2xl mx-auto">
                        Disfruta del mejor cine en Guatemala con la experiencia cinematográfica más emocionante
                    </p>
                    </section>
                <section className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 pb-10">
                    {filteredMovies.length > 0 ? (
                        filteredMovies.map((movie, index) => {
                            // Calcular cantidad de funciones para esta película
                            const count = allShowtimes.filter(st => {
                                if (!st) return false;
                                const movieId = (movie as any).id;
                                // Preferir match por _id si está disponible
                                if (movieId) {
                                    if (typeof st.movie === 'string') return String(st.movie) === String(movieId);
                                    if (st.movie && (st.movie as any)._id) return String((st.movie as any)._id) === String(movieId);
                                }
                                // Fallback: match por slug
                                const movieSlug = (movie as any).slug || createSlug(movie.title || '');
                                if (typeof st.movie === 'string') return String(st.movie) === String(movieSlug);
                                if (st.movie && (st.movie as any).slug) return String((st.movie as any).slug) === String(movieSlug);
                                if (st.movie && (st.movie as any).title) return createSlug((st.movie as any).title) === movieSlug;
                                return false;
                            }).length;

                            return <MovieCard key={movie.title + index} {...movie} showtimesCount={count} />
                        })
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
