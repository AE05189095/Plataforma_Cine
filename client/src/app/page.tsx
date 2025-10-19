"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import MovieCard from "@/components/MovieCard";
import Header from "@/components/Header";
import { useRouter } from "next/navigation";

interface RawMovie {
  title?: string;
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
  releaseDate: string;
  duration: string;
  description: string;
}

const ALL_GENRES = [
  "Todos los géneros",
  "Comedia",
  "Acción",
  "Drama",
  "Ciencia Ficción",
];

// Inicial vacío: cargaremos la lista desde la API
const MOVIES_CARTELERA: MovieData[] = [];

const NUM_CLICKS_TO_ACTIVATE = 8;
const TIMEOUT_DURATION = 1500;

export default function HomePage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGenre, setSelectedGenre] = useState(ALL_GENRES[0]);
  const [selectedDate, setSelectedDate] = useState("");
  const [movies, setMovies] = useState<MovieData[]>(MOVIES_CARTELERA);
  const [logoClickCount, setLogoClickCount] = useState(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Limpiar timeout al desmontar
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  // Cargar películas desde la API del servidor
  useEffect(() => {
    let mounted = true;
    async function load() {
      // Usar variable de entorno NEXT_PUBLIC_API_URL si está definida, si no, fallback a localhost:5000
      const API_BASE = (process.env.NEXT_PUBLIC_API_URL as string) || 'http://localhost:5000';

      // Helper para obtener una URL de imagen tipo string
      const getImage = (m: RawMovie): string => {
        if (typeof m.posterUrl === 'string') return m.posterUrl;
        if (Array.isArray(m.images) && m.images.length) {
            const first = m.images[0];
            if (typeof first === 'string') return first;
            if (first && typeof first === 'object' && 'url' in first && typeof (first as Record<string, unknown>).url === 'string') return (first as Record<string, unknown>).url as string;
        }
        return '/images/movie-default.svg';
      };

      try {
        const res = await fetch(`${API_BASE}/api/movies`);
        if (!res.ok) throw new Error('Error al obtener películas');
        const data = await res.json();

        // Mapear los campos del backend a MovieData para MovieCard
        const mapped: MovieData[] = (data as unknown as RawMovie[]).map((m) => ({
          title: m.title || 'Sin título',
          image: getImage(m),
          rating: m.rating && String(m.rating).length > 0 ? String(m.rating) : 'PG-13',
          score: m.rating ? String(m.rating) : (m.ratingCount ? String(m.ratingCount) : 'N/A'),
          genre: Array.isArray(m.genres) && m.genres.length ? m.genres[0] : 'General',
          releaseDate: m.releaseDate ? new Date(m.releaseDate).toISOString().slice(0,10) : '',
          duration: m.duration ? `${m.duration} min` : 'N/A',
          description: m.description || '',
        }));

        if (mounted) setMovies(mapped);
      } catch (err) {
        console.warn('Error al obtener películas desde', `${API_BASE}/api/movies`, err);
        // Intentar fallback relativo (si el backend está servido por el mismo host o hay proxy)
        try {
          const res2 = await fetch('/api/movies');
          if (res2.ok) {
            const data2 = await res2.json();
            const mapped2: MovieData[] = (data2 as unknown as RawMovie[]).map((m) => ({
              title: m.title || 'Sin título',
              image: getImage(m),
              rating: m.rating && String(m.rating).length > 0 ? String(m.rating) : 'PG-13',
              score: m.rating ? String(m.rating) : (m.ratingCount ? String(m.ratingCount) : 'N/A'),
              genre: Array.isArray(m.genres) && m.genres.length ? m.genres[0] : 'General',
              releaseDate: m.releaseDate ? new Date(m.releaseDate).toISOString().slice(0,10) : '',
              duration: m.duration ? `${m.duration} min` : 'N/A',
              description: m.description || '',
            }));
            if (mounted) setMovies(mapped2);
            return;
          }
        } catch (err2) {
          console.error('Fallback relativo falló', err2);
        }
        console.error('Error al obtener películas', err);
      }
    }

    load();
    return () => { mounted = false; };
  }, []);

  // Redirigir al modo admin cuando se alcance el número de clics
  useEffect(() => {
    if (logoClickCount >= NUM_CLICKS_TO_ACTIVATE) {
      router.push("/admin-dev-mode");
      setLogoClickCount(0);
    }
  }, [logoClickCount, router]);

  const filteredMovies = useMemo(() => {
    let current = movies;
    if (searchTerm)
      current = current.filter((m) =>
        m.title.toLowerCase().includes(searchTerm.toLowerCase())
      );
    if (selectedGenre !== ALL_GENRES[0])
      current = current.filter((m) => m.genre === selectedGenre);
    if (selectedDate)
      current = current.filter((m) => m.releaseDate >= selectedDate);
    return current;
  }, [movies, searchTerm, selectedGenre, selectedDate]);

  const handleLogoClick = () => {
    setLogoClickCount((prev) => {
      const next = prev + 1;

      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(
        () => setLogoClickCount(0),
        TIMEOUT_DURATION
      );

      return next;
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black text-white">
      <Header
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        selectedGenre={selectedGenre}
        setSelectedGenre={setSelectedGenre}
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
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
          <div className="flex justify-center gap-2 mt-4">
            <span className="w-3 h-3 bg-red-600 rounded-full"></span>
            <span className="w-3 h-3 bg-gray-600 rounded-full"></span>
            <span className="w-3 h-3 bg-gray-600 rounded-full"></span>
          </div>
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
