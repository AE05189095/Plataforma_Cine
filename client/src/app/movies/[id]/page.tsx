"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Header from "@/components/Header";
import { API_URL } from "@/services/api";

interface Hall {
  _id: string;
  name: string;
  capacity: number;
}

interface Showtime {
  _id: string;
  startAt: string;
  hall: Hall;
  price: number;
  isActive: boolean;
}

interface MovieData {
  _id: string;
  title: string;
  description: string;
  genres: string[];
  duration: string;
  rating: string;
  score: number;
  images: string[];
  showtimes: Showtime[];
}

export default function MovieDetailPage() {
  const params = useParams();
  const router = useRouter();
  const movieId = params.id as string;

  const [movie, setMovie] = useState<MovieData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (!movieId) return;

    const fetchMovie = async () => {
      try {
        const res = await fetch(`${API_URL}/movies/${movieId}`);
        if (!res.ok) throw new Error("Película no encontrada");
        const data = await res.json();
        setMovie(data);
      } catch (error) {
        const errorMessage = error instanceof Error 
          ? error.message 
          : "Error desconocido al obtener los datos de la película";
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchMovie();
  }, [movieId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white bg-black">
        <p className="text-xl text-gray-400 animate-pulse">Cargando película...</p>
      </div>
    );
  }

  if (error || !movie) {
    return (
      <div className="min-h-screen bg-black text-white p-8 text-center">
        <Header />
        <h1 className="text-4xl mt-20 text-red-600">Película no encontrada 😢</h1>
        <p className="text-lg text-gray-400 mt-4">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black text-white">
      <Header />
      <div className="p-6 sm:p-12 md:p-16">
        <div className="flex flex-col md:flex-row gap-10 mb-12">
          <img
            src={movie.images?.[0] || "/images/default-movie.jpg"}
            alt={movie.title}
            className="w-full md:w-1/3 rounded-xl shadow-2xl border-4 border-gray-700 object-cover max-h-[600px]"
          />
          <div className="flex-1 flex flex-col justify-center">
            <h1 className="text-4xl sm:text-5xl font-extrabold mb-4 text-orange-400">
              {movie.title}
            </h1>
            <div className="flex flex-wrap gap-3 text-yellow-400 mb-6 items-center">
              <span className="font-semibold text-lg">{movie.duration}</span>
              {movie.genres.map((g) => (
                <span key={g} className="px-3 py-1 bg-gray-800 rounded-full text-sm">{g}</span>
              ))}
              <span className="px-3 py-1 bg-red-600 rounded-full text-sm font-bold">{movie.rating}</span>
              <span className="px-3 py-1 bg-yellow-600 rounded-full text-sm font-bold">⭐ {movie.score}</span>
            </div>
            <p className="text-gray-300 text-lg leading-relaxed">{movie.description}</p>
          </div>
        </div>

        <div className="mt-12">
          <h2 className="text-3xl font-bold mb-6 text-yellow-400 border-b-2 border-red-600 pb-2">
            Funciones Disponibles
          </h2>

          {movie.showtimes?.length === 0 ? (
            <p className="text-gray-400 mt-4">No hay funciones disponibles para esta película.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {movie.showtimes.map((show) => (
                <div
                  key={show._id}
                  className="bg-gray-800 p-6 rounded-2xl shadow-xl border-l-4 border-red-600 hover:bg-gray-700 transition-all"
                >
                  <p className="text-gray-400 text-sm">
                    📅{" "}
                    {new Date(show.startAt).toLocaleDateString("es-GT", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                  <p className="font-extrabold text-3xl mb-1 text-red-400">
                    {new Date(show.startAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </p>
                  <p className="text-lg mb-2 text-gray-300">
                    🏛️ Sala: <span className="font-semibold text-white">{show.hall?.name || "Sala no especificada"}</span>
                  </p>
                  <p className="mt-3 font-semibold text-2xl text-orange-400">Q{show.price}</p>
                  <button
                    onClick={() => router.push(`/showtimes/${show._id}`)}
                    className="w-full mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold shadow-md transition-all"
                  >
                    Seleccionar Asientos 🎟️
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
