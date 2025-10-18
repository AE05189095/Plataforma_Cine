"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { API_URL } from "@/services/api";

interface ShowTime {
  _id: string;
  time: string;
  date: string;
  sala: string;
  price: number;
  availableSeats: number;
}

interface Movie {
  _id: string;
  title: string;
  image: string;
  rating: string;
  genre: string;
  duration: string;
  score: number;
  description: string;
  showtimes: ShowTime[];
}

export default function MoviesPage() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [filteredMovies, setFilteredMovies] = useState<Movie[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [genreFilter, setGenreFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchMovies = async () => {
      try {
        const res = await fetch(`${API_URL}/movies`);
        if (!res.ok) throw new Error("No se pudieron obtener las películas.");
        const data = await res.json();
        setMovies(data);
        setFilteredMovies(data);
      } catch (err) {
        console.error("❌ Error al obtener películas:", err);
      }
    };
    fetchMovies();

    const token = localStorage.getItem("authToken");
    setIsLoggedIn(!!token);
  }, []);

  // 🔎 Filtros dinámicos
  useEffect(() => {
    let filtered = [...movies];
    if (searchTerm) {
      filtered = filtered.filter((m) =>
        m.title.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (genreFilter !== "all") {
      filtered = filtered.filter((m) => m.genre === genreFilter);
    }
    if (dateFilter) {
      filtered = filtered.filter((m) =>
        m.showtimes.some(
          (s) => new Date(s.date).toLocaleDateString("en-CA") === dateFilter
        )
      );
    }
    setFilteredMovies(filtered);
  }, [searchTerm, genreFilter, dateFilter, movies]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black text-white">
      {/* 🔝 Header con Logo y Buscador */}
      <header className="flex flex-col sm:flex-row justify-between items-center bg-[#0c1222] px-6 py-4 border-b border-red-600 shadow-lg">
        {/* 🎬 Logo Cine GT */}
        <div
          className="flex items-center gap-3 cursor-pointer select-none mb-3 sm:mb-0"
          onClick={() => router.push("/")}
        >
          <Image
            src="/images/logo.png"
            alt="Logo Cine GT"
            width={55}
            height={55}
            className="rounded-md"
            priority
          />
          <span className="text-2xl font-bold text-red-500 hover:text-red-400 transition-colors">
            Cine GT
          </span>
        </div>

        {/* 🔍 Buscador */}
        <div className="flex flex-wrap gap-3 items-center justify-center">
          <input
            type="text"
            placeholder="Buscar película"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-3 py-2 rounded-md bg-gray-800 border border-red-600 text-white placeholder-gray-400 w-48 sm:w-56 focus:outline-none focus:ring-2 focus:ring-red-600"
          />
          <select
            value={genreFilter}
            onChange={(e) => setGenreFilter(e.target.value)}
            className="px-3 py-2 rounded-md bg-gray-800 border border-red-600 text-white"
          >
            <option value="all">Todos los géneros</option>
            <option value="Acción">Acción</option>
            <option value="Drama">Drama</option>
            <option value="Comedia">Comedia</option>
            <option value="Terror">Terror</option>
            <option value="Aventura">Aventura</option>
          </select>
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-3 py-2 rounded-md bg-gray-800 border border-red-600 text-white"
          />

          {isLoggedIn ? (
            <button
              onClick={() => router.push("/profile")}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md font-semibold transition-all"
            >
              👤 Perfil
            </button>
          ) : (
            <button
              onClick={() => router.push("/login")}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md font-semibold transition-all"
            >
              Iniciar sesión
            </button>
          )}
        </div>
      </header>

      {/* 🎞️ Cartelera */}
      <div className="max-w-7xl mx-auto px-6 py-10">
        <h1 className="text-4xl font-extrabold text-yellow-400 border-b-2 border-red-600 pb-2 mb-8 text-center">
          Cartelera de Cine GT
        </h1>

        {filteredMovies.length === 0 ? (
          <p className="text-center text-gray-400 text-lg">
            No se encontraron películas que coincidan.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {filteredMovies.map((movie) => {
              // 🧩 Validar y ajustar ruta de imagen
              let imageSrc = movie.image || "";

              // Si el backend ya devuelve URL completa, se usa tal cual
              // Si devuelve nombre o ruta relativa, la corregimos
              if (!imageSrc) {
                imageSrc = "/images/default-poster.jpg"; // fallback
              } else if (!imageSrc.startsWith("http")) {
                imageSrc = `/images/${imageSrc.replace(/^\/?images\//, "")}`;
              }

              return (
                <div
                  key={movie._id}
                  className="bg-gray-800 rounded-xl overflow-hidden shadow-2xl border border-gray-700 hover:scale-[1.02] transition-all"
                >
                  <img
                    src={imageSrc}
                    alt={movie.title}
                    className="w-full h-80 object-cover border-b border-gray-700"
                    onError={(e) =>
                      (e.currentTarget.src = "/images/default-poster.jpg")
                    }
                  />
                  <div className="p-5 flex flex-col justify-between h-[300px]">
                    <div>
                      <h2 className="text-2xl font-bold text-orange-400 mb-2">
                        {movie.title}
                      </h2>
                      <div className="flex flex-wrap gap-2 text-sm text-gray-300 mb-2">
                        <span className="bg-gray-700 px-2 py-1 rounded">
                          {movie.genre}
                        </span>
                        <span className="bg-red-700 px-2 py-1 rounded">
                          {movie.rating}
                        </span>
                        <span className="bg-yellow-600 px-2 py-1 rounded">
                          ⭐ {movie.score}
                        </span>
                      </div>
                      <p className="text-gray-400 text-sm line-clamp-3">
                        {movie.description}
                      </p>
                    </div>

                    <div className="mt-4">
                      <button
                        onClick={() => {
                          if (movie.showtimes && movie.showtimes.length > 0) {
                            const firstShow = movie.showtimes[0];
                            router.push(
                              `/showtimes/${firstShow._id}?title=${encodeURIComponent(
                                movie.title
                              )}&time=${encodeURIComponent(
                                firstShow.time
                              )}&date=${encodeURIComponent(
                                firstShow.date
                              )}&sala=${encodeURIComponent(
                                firstShow.sala
                              )}&price=${firstShow.price}`
                            );
                          } else {
                            alert(
                              "No hay horarios disponibles para esta película."
                            );
                          }
                        }}
                        className="w-full bg-red-600 hover:bg-red-700 text-white py-2 rounded-md font-semibold transition-colors"
                      >
                        🎟️ Ver horarios / Comprar boletos
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
