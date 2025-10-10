"use client";

import React from "react";
import Header from "../../components/Header";

interface ShowTime {
  time: string;
  sala: string;
  price: string;
  availableSeats: number;
}

const movie = {
  title: "Otro Viernes de Locos",
  duration: "110 minutos",
  genre: "Comedia",
  rating: "PG-13",
  score: 7.8,
  description:
    "Años después de que Tess y Anna sufrieran una crisis de identidad, Anna ahora tiene una hija y una hijastra. Enfrentan los desafíos que se presentan cuando dos familias se fusionan. Tess y Anna descubren que un rayo puede caer dos veces.",
  image: "/images/otro-viernes-de-locos.jpg",
  showtimes: [
    { time: "1:00 PM", sala: "Sala 1", price: "Q40", availableSeats: 50 },
    { time: "4:00 PM", sala: "Sala 1", price: "Q50", availableSeats: 35 },
    { time: "7:30 PM", sala: "Sala 2", price: "Q50", availableSeats: 20 },
  ],
};

export default function MovieDetailPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black text-white">
      {/* Header común */}
      <Header />

      {/* Contenido de la película */}
      <div className="p-8">
        {/* Sección de película */}
        <div className="flex flex-col md:flex-row gap-8 mb-12">
          <img
            src={movie.image}
            alt={movie.title}
            className="w-full md:w-1/3 rounded-xl shadow-2xl border-4 border-gray-700"
          />
          <div className="flex-1 flex flex-col justify-center">
            <h1 className="text-5xl font-extrabold mb-4">{movie.title}</h1>
            <div className="flex flex-wrap gap-4 text-yellow-400 mb-6">
              <span className="font-semibold">{movie.duration}</span>
              <span className="px-3 py-1 bg-gray-800 rounded-full">{movie.genre}</span>
              <span className="px-3 py-1 bg-gray-800 rounded-full">{movie.rating}</span>
              <span className="px-3 py-1 bg-yellow-600 rounded-full">{movie.score}</span>
            </div>
            <p className="text-gray-300 text-lg leading-relaxed">{movie.description}</p>
          </div>
        </div>

        {/* Horarios disponibles */}
        <div>
          <h2 className="text-3xl font-bold mb-6 text-yellow-400">Horarios Disponibles</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {movie.showtimes.map((show, idx) => (
              <div
                key={idx}
                className="bg-red-600 p-6 rounded-2xl shadow-lg transform hover:scale-105 hover:shadow-2xl transition-all cursor-pointer"
              >
                <p className="font-bold text-2xl mb-2">{show.time}</p>
                <p className="text-lg mb-2">{show.sala}</p>
                <p className="mt-2 font-semibold text-xl">{show.price}</p>
                <p className="text-sm mt-1">{show.availableSeats} asientos disponibles</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
