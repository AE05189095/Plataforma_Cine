// Ruta: client/src/app/movies/[slug]/page.tsx
"use client";
import React, { useEffect, useState } from "react";
import Header from "@/components/Header";
import { useParams } from "next/navigation";
interface ShowTime {
  time: string;
  sala: string;
  price: string;
  availableSeats: number;
}
interface MovieData {
  title: string;
  rating: string;
  score: number;
  duration: string;
  description: string;
  slug: string;
  showtimes: ShowTime[];
  images?: string[];
  genres?: string[];
}
export default function MovieDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [movie, setMovie] = useState<MovieData | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const fetchMovie = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/movies`);
        const data: MovieData[] = await res.json();
        const found = data.find((m) => m.slug === slug);
        if (found) {
          setMovie({
            title: found.title,
            rating: found.rating,
            score: found.score,
            duration: found.duration,
            description: found.description,
            slug: found.slug,
            showtimes: found.showtimes || [],
            images: found.images?.length ? found.images : undefined,
            genres: found.genres?.length ? found.genres : undefined,
          });
        } else {
          setMovie(null);
        }
      } catch (err) {
        console.error(err);
        setMovie(null);
      } finally {
        setLoading(false);
      }
    };
    fetchMovie();
  }, [slug]);
  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <Header />
        <p>Cargando película...</p>
      </div>
    );
  }
  if (!movie) {
    return (
      <div className="min-h-screen bg-black text-white p-8 text-center">
        <Header />
        <h1 className="text-4xl mt-20 text-red-600">Película no encontrada 😢</h1>
        <p className="text-lg text-gray-400 mt-4">
          El identificador de la película no es válido: <strong>{slug}</strong>
        </p>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black text-white">
      <Header />
      <div className="p-4 sm:p-8 md:p-12 lg:p-16">
        <div className="flex flex-col md:flex-row gap-8 mb-12">
          {movie.images && movie.images[0] && (
            <img
              src={movie.images[0]}
              alt={movie.title}
              className="w-full md:w-1/3 rounded-xl shadow-2xl border-4 border-gray-700 object-cover max-h-[600px]"
            />
          )}
          <div className="flex-1 flex flex-col justify-center">
            <h1 className="text-4xl sm:text-5xl font-extrabold mb-4 text-orange-400">
              {movie.title}
            </h1>
            <div className="flex flex-wrap gap-3 text-yellow-400 mb-6 items-center">
              <span className="font-semibold text-lg">{movie.duration}</span>
              {movie.genres &&
                movie.genres.map((g, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-gray-800 rounded-full text-sm"
                  >
                    {g}
                  </span>
                ))}
              <span className="px-3 py-1 bg-red-600 rounded-full text-sm font-bold">
                {movie.rating}
              </span>
              <span className="px-3 py-1 bg-yellow-600 rounded-full text-sm font-bold">
                ⭐ {movie.score}
              </span>
            </div>
            <p className="text-gray-300 text-lg leading-relaxed">{movie.description}</p>
          </div>
        </div>
        {/* Horarios disponibles */}
        <div className="mt-12">
          <h2 className="text-3xl font-bold mb-6 text-yellow-400 border-b-2 border-red-600 pb-2">
            Horarios Disponibles
          </h2>
          {movie.showtimes.length === 0 ? (
            <p className="text-gray-400">No hay horarios disponibles por el momento.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {movie.showtimes.map((show, idx) => (
                <div
                  key={idx}
                  className="bg-gray-800 p-6 rounded-2xl shadow-xl transform hover:scale-[1.02] transition-all cursor-pointer border-l-4 border-red-600 hover:bg-gray-700"
                >
                  <p className="font-extrabold text-3xl mb-1 text-red-400">{show.time}</p>
                  <p className="text-lg mb-2 text-gray-300">
                    Sala: <span className="font-semibold text-white">{show.sala}</span>
                  </p>
                  <p className="mt-3 font-semibold text-2xl text-orange-400">{show.price}</p>
                  <p className="text-sm mt-1 text-gray-400">
                    {show.availableSeats} asientos disponibles
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}