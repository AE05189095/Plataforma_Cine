<<<<<<< HEAD
"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import MovieCard from "@/components/MovieCard";
import { useRouter } from "next/navigation";
import Image from "next/image";

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

const MOVIES_CARTELERA: MovieData[] = [
  {
    title: "Otro Viernes de Locos",
    image: "/images/otro-viernes-de-locos.jpg",
    rating: "PG-13",
    score: "7.8",
    genre: "Comedia",
    releaseDate: "2024-12-10",
    duration: "110 min",
    description:
      "Años después de que Tess y Anna sufrieran una crisis de identidad, Anna ahora tiene una hija y una hijastra. Enfrentan los desafíos que se presentan cuando dos familias se fusionan. Tess y Anna descubren que un rayo puede caer dos veces.",
  },
  {
    title: "Quantum Nexus",
    image: "/images/movie1.jpg",
    rating: "PG-13",
    score: "8.5",
    genre: "Ciencia Ficción",
    releaseDate: "2024-11-15",
    duration: "135 min",
    description:
      "Un físico viaja a través de dimensiones cuánticas para salvar el futuro de la humanidad.",
  },
  {
    title: "Echoes of Tomorrow",
    image: "/images/movie2.jpg",
    rating: "R",
    score: "8.5",
    genre: "Drama",
    releaseDate: "2024-11-01",
    duration: "110 min",
    description:
      "Una emotiva historia sobre la pérdida y la búsqueda de segundas oportunidades en un mundo post-apocalíptico.",
  },
  {
    title: "Midnight Heist",
    image: "/images/movie3.jpg",
    rating: "PG-13",
    score: "8.5",
    genre: "Acción",
    releaseDate: "2024-11-22",
    duration: "98 min",
    description:
      "Un equipo de élite intenta el robo más grande de la historia durante un apagón total en la ciudad.",
  },
  {
    title: "Death Unicorn",
    image: "/images/movie4.jpg",
    rating: "R",
    score: "9.2",
    genre: "Ciencia Ficción",
    releaseDate: "2024-12-05",
    duration: "145 min",
    description:
      "Una criatura mítica desata el caos en un laboratorio futurista, forzando a los científicos a luchar por su vida.",
  },
  {
    title: "Warfare",
    image: "/images/movie5.jpg",
    rating: "PG-13",
    score: "9.1",
    genre: "Acción",
    releaseDate: "2024-10-10",
    duration: "120 min",
    description:
      "El enfrentamiento final entre dos ejércitos de élite en una batalla épica por el control de un recurso vital.",
  },
  {
    title: "Fast Lane Fury",
    image: "/images/movie6.jpg",
    rating: "PG-13",
    score: "7.8",
    genre: "Acción",
    releaseDate: "2024-11-29",
    duration: "105 min",
    description:
      "Una carrera de coches ilegal se convierte en una peligrosa persecución internacional por la supervivencia.",
  },
];

const NUM_CLICKS_TO_ACTIVATE = 8;
const TIMEOUT_DURATION = 1500;

export default function HomePage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGenre, setSelectedGenre] = useState(ALL_GENRES[0]);
  const [selectedDate, setSelectedDate] = useState("");
  const [logoClickCount, setLogoClickCount] = useState(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Limpiar timeout al desmontar
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  // Redirigir al modo admin cuando se alcance el número de clics
  useEffect(() => {
    if (logoClickCount >= NUM_CLICKS_TO_ACTIVATE) {
      router.push("/admin-dev-mode");
      setLogoClickCount(0);
    }
  }, [logoClickCount, router]);

  const filteredMovies = useMemo(() => {
    let current = MOVIES_CARTELERA;
    if (searchTerm)
      current = current.filter((m) =>
        m.title.toLowerCase().includes(searchTerm.toLowerCase())
      );
    if (selectedGenre !== ALL_GENRES[0])
      current = current.filter((m) => m.genre === selectedGenre);
    if (selectedDate)
      current = current.filter((m) => m.releaseDate >= selectedDate);
    return current;
  }, [searchTerm, selectedGenre, selectedDate]);

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
      <header className="bg-gray-900 text-white p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div
          className="flex-shrink-0 bg-transparent cursor-pointer"
          onClick={handleLogoClick}
        >
          <Image
            src="/images/Logo.png"
            alt="Logo CineGT"
            width={160}
            height={60}
            priority
          />
        </div>

        <div className="flex flex-col md:flex-row gap-3 md:gap-4 items-center w-full md:w-auto">
          <input
            type="text"
            placeholder="Buscar película"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-3 py-2 rounded border-2 border-red-600 bg-gray-900 text-white focus:outline-none focus:ring-2 focus:ring-red-600"
          />
          <select
            value={selectedGenre}
            onChange={(e) => setSelectedGenre(e.target.value)}
            className="px-3 py-2 rounded border-2 border-red-600 bg-gray-900 text-white focus:outline-none focus:ring-2 focus:ring-red-600 cursor-pointer"
          >
            {ALL_GENRES.map((genre) => (
              <option key={genre} value={genre}>
                {genre}
              </option>
            ))}
          </select>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-2 rounded border-2 border-red-600 bg-gray-900 text-white focus:outline-none focus:ring-2 focus:ring-red-600 cursor-pointer"
          />

          <button
            onClick={() => router.push("/login")}
            className="px-4 py-2 bg-red-600 rounded hover:bg-red-700 transition"
          >
            Iniciar sesión
          </button>
        </div>
      </header>

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
              <MovieCard key={index} {...movie} />
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
=======
import { redirect } from "next/navigation";

// 🚀 Redirige automáticamente al cargar la página raíz "/"
export default function HomeRedirect() {
  redirect("/movies");
>>>>>>> mapa-asientos
}
