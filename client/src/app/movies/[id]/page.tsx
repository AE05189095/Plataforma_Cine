"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { API_URL } from "@/services/api";

interface Showtime {
  _id: string;
  startAt: string;
  price: number;
  hall: { name: string };
  seatsBooked: string[];
}

interface Movie {
  _id: string;
  title: string;
  description: string;
  duration: string;
  rating: string;
  genre: string;
  score: number;
  image: string;
  showtimes: Showtime[];
}

export default function MovieDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [movie, setMovie] = useState<Movie | null>(null);

  useEffect(() => {
    const fetchMovie = async () => {
      try {
        const res = await fetch(`${API_URL}/movies/${id}`);
        const data = await res.json();
        setMovie(data);
      } catch (err) {
        console.error("Error al cargar la película:", err);
      }
    };
    if (id) fetchMovie();
  }, [id]);

  if (!movie) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        Cargando detalles de la película...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black text-white px-4 sm:px-6 py-10">
      {/* 🔙 Botón de regreso */}
      <button
        onClick={() => router.back()}
        className="mb-6 text-red-500 hover:text-red-400 transition-colors font-semibold flex items-center gap-2"
      >
        ← Volver
      </button>

      <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-10 items-start">
        {/* 🎬 Portada */}
        <div className="w-full md:w-1/3 flex justify-center md:justify-start">
          <img
            src={movie.image}
            alt={movie.title}
            className="rounded-lg shadow-2xl w-full sm:w-80 h-[26rem] object-cover border border-gray-700"
            onError={(e) => (e.currentTarget.src = "/images/default-poster.jpg")}
          />
        </div>

        {/* 📄 Detalles */}
        <div className="w-full md:w-2/3 flex flex-col justify-between">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-orange-400 mb-4">
              {movie.title}
            </h1>

            <div className="flex flex-wrap items-center gap-3 mb-4">
              <span className="bg-yellow-600 px-3 py-1 rounded text-sm font-semibold">
                {movie.duration}
              </span>
              <span className="bg-gray-700 px-3 py-1 rounded text-sm font-semibold">
                {movie.genre}
              </span>
              <span className="bg-red-700 px-3 py-1 rounded text-sm font-semibold">
                {movie.rating}
              </span>
              <span className="bg-green-700 px-3 py-1 rounded text-sm font-semibold">
                ⭐ {movie.score}
              </span>
            </div>

            <p className="text-gray-300 text-base sm:text-lg mb-8 leading-relaxed">
              {movie.description}
            </p>
          </div>

          {/* 🎟️ Horarios disponibles */}
          <div>
            <h2 className="text-2xl font-bold text-yellow-400 border-b-2 border-red-600 pb-2 mb-4">
              Horarios Disponibles
            </h2>

            {movie.showtimes && movie.showtimes.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {movie.showtimes.map((show) => (
                  <div
                    key={show._id}
                    onClick={() => router.push(`/showtimes/${show._id}`)}
                    className="cursor-pointer bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl p-4 transition-all transform hover:scale-[1.03]"
                  >
                    <h3 className="text-xl font-bold text-red-500">
                      {new Date(show.startAt).toLocaleTimeString("es-ES", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </h3>
                    <p className="text-gray-400 mt-1">
                      Sala:{" "}
                      <span className="text-white font-semibold">
                        {show.hall?.name || "Desconocida"}
                      </span>
                    </p>
                    <p className="text-gray-300 font-semibold mt-2">
                      Q{show.price}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      {50 - show.seatsBooked.length} asientos disponibles
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400">No hay horarios disponibles.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
