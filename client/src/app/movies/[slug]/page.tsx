// Ruta: client/src/app/movies/[slug]/page.tsx - Versión Dinámica Final

"use client";

import React from "react";
import Header from "@/components/Header";
import { useParams } from 'next/navigation';

interface ShowTime {
  time: string;
  sala: string;
  price: string;
  availableSeats: number;
}

interface MovieData {
    title: string;
    image: string;
    rating: string;
    score: number;
    genre: string; 
    duration: string; 
    description: string; 
    slug: string; // Identificador para la búsqueda
    showtimes: ShowTime[];
}

// FUNCIÓN DE SLUG (Para generar los slugs y buscar)
const createSlug = (title: string): string => {
    return title
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
};

// 🚨 DATOS SIMULADOS PARA TODAS LAS PELÍCULAS 
// (Mantén esta lista completa para que la búsqueda por slug funcione)
const MOVIES_DATA: MovieData[] = [
    { 
        title: "Otro Viernes de Locos", image: "/images/otro-viernes-de-locos.jpg", rating: "PG-13", score: 7.8, genre: "Comedia", 
        duration: "110 min", slug: "otro-viernes-de-locos",
        description: "Años después de que Tess y Anna sufrieran una crisis de identidad, Anna ahora tiene una hija y una hijastra. Enfrentan los desafíos que se presentan cuando dos familias se fusionan. Tess y Anna descubren que un rayo puede caer dos veces.",
        showtimes: [
            { time: "1:00 PM", sala: "Sala 1", price: "Q40", availableSeats: 50 },
            { time: "4:00 PM", sala: "Sala 1", price: "Q50", availableSeats: 35 },
            { time: "7:30 PM", sala: "Sala 2", price: "Q50", availableSeats: 20 },
        ],
    },
    { 
        title: "Quantum Nexus", image: "/images/movie1.jpg", rating: "PG-13", score: 8.5, genre: "Ciencia Ficción", 
        duration: "135 min", slug: "quantum-nexus",
        description: "Un físico viaja a través de dimensiones cuánticas para salvar el futuro de la humanidad.",
        showtimes: [
            { time: "1:30 PM", sala: "Sala 3", price: "Q45", availableSeats: 60 },
            { time: "5:00 PM", sala: "Sala 3", price: "Q55", availableSeats: 40 },
            { time: "8:30 PM", sala: "Sala 4", price: "Q60", availableSeats: 15 },
        ],
    },
    { 
        title: "Echoes of Tomorrow", image: "/images/movie2.jpg", rating: "R", score: 8.5, genre: "Drama", 
        duration: "110 min", slug: "echoes-of-tomorrow",
        description: "Una emotiva historia sobre la pérdida y la búsqueda de segundas oportunidades en un mundo post-apocalíptico.",
        showtimes: [
            { time: "3:00 PM", sala: "Sala 5", price: "Q40", availableSeats: 55 },
            { time: "6:30 PM", sala: "Sala 6", price: "Q50", availableSeats: 30 },
        ],
    },
    { 
        title: "Midnight Heist", image: "/images/movie3.jpg", rating: "PG-13", score: 8.5, genre: "Acción", 
        duration: "98 min", slug: "midnight-heist",
        description: "Un equipo de élite intenta el robo más grande de la historia durante un apagón total en la ciudad.",
        showtimes: [
            { time: "1:00 PM", sala: "Sala 7", price: "Q40", availableSeats: 45 },
            { time: "4:00 PM", sala: "Sala 7", price: "Q50", availableSeats: 25 },
        ],
    },
    { 
        title: "Death Unicorn", image: "/images/movie4.jpg", rating: "R", score: 9.2, genre: "Ciencia Ficción", 
        duration: "145 min", slug: "death-unicorn",
        description: "Una criatura mítica desata el caos en un laboratorio futurista, forzando a los científicos a luchar por su vida.",
        showtimes: [
            { time: "2:00 PM", sala: "Sala 8", price: "Q50", availableSeats: 70 },
            { time: "7:00 PM", sala: "Sala 8", price: "Q60", availableSeats: 50 },
        ],
    },
    { 
        title: "Warfare", image: "/images/movie5.jpg", rating: "PG-13", score: 9.1, genre: "Acción", 
        duration: "120 min", slug: "warfare",
        description: "El enfrentamiento final entre dos ejércitos de élite en una batalla épica por el control de un recurso vital.",
        showtimes: [
            { time: "1:00 PM", sala: "Sala 9", price: "Q40", availableSeats: 30 },
            { time: "4:00 PM", sala: "Sala 9", price: "Q50", availableSeats: 20 },
        ],
    },
    { 
        title: "Fast Lane Fury", image: "/images/movie6.jpg", rating: "PG-13", score: 7.8, genre: "Acción", 
        duration: "105 min", slug: "fast-lane-fury",
        description: "Una carrera de coches ilegal se convierte en una peligrosa persecución internacional por la supervivencia.",
        showtimes: [
            { time: "1:00 PM", sala: "Sala 10", price: "Q40", availableSeats: 60 },
            { time: "4:00 PM", sala: "Sala 10", price: "Q50", availableSeats: 40 },
        ],
    },
];


export default function MovieDetailPage() {
    // 1. OBTENER EL SLUG DE LA URL
    const params = useParams();
    const slug = params.slug as string;

    // 2. BUSCAR LA PELÍCULA
    const movie = MOVIES_DATA.find(m => m.slug === slug);

    // 3. MANEJAR CASO NO ENCONTRADO
    if (!movie) {
        return (
            <div className="min-h-screen bg-black text-white p-8 text-center">
                <Header /> 
                <h1 className="text-4xl mt-20 text-red-600">Película no encontrada 😢</h1>
                <p className="text-lg text-gray-400 mt-4">El identificador de la película no es válido: **{slug}**</p>
            </div>
        );
    }

    // 4. USAR LA VARIABLE 'movie' ENCONTRADA DINÁMICAMENTE EN EL JSX
    return (
        <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black text-white">
            <Header />

            {/* Contenido de la película */}
            <div className="p-4 sm:p-8 md:p-12 lg:p-16">
                
                {/* Sección de película */}
                <div className="flex flex-col md:flex-row gap-8 mb-12">
                    <img
                        // 🚨 Asegúrate de que todas las referencias usan la variable 'movie'
                        src={movie.image} 
                        alt={movie.title}
                        className="w-full md:w-1/3 rounded-xl shadow-2xl border-4 border-gray-700 object-cover max-h-[600px]"
                    />
                    <div className="flex-1 flex flex-col justify-center">
                        <h1 className="text-4xl sm:text-5xl font-extrabold mb-4 text-orange-400">{movie.title}</h1>
                        <div className="flex flex-wrap gap-3 text-yellow-400 mb-6 items-center">
                            <span className="font-semibold text-lg">{movie.duration}</span>
                            <span className="px-3 py-1 bg-gray-800 rounded-full text-sm">{movie.genre}</span>
                            <span className="px-3 py-1 bg-red-600 rounded-full text-sm font-bold">{movie.rating}</span>
                            <span className="px-3 py-1 bg-yellow-600 rounded-full text-sm font-bold">⭐ {movie.score}</span>
                        </div>
                        <p className="text-gray-300 text-lg leading-relaxed">{movie.description}</p>
                    </div>
                </div>

                {/* Horarios disponibles */}
                <div className="mt-12">
                    <h2 className="text-3xl font-bold mb-6 text-yellow-400 border-b-2 border-red-600 pb-2">Horarios Disponibles</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {/* 🚨 Aquí se usa movie.showtimes (la lista de horarios de la película encontrada) */}
                        {movie.showtimes.map((show, idx) => (
                            <div
                                key={idx}
                                className="bg-gray-800 p-6 rounded-2xl shadow-xl transform hover:scale-[1.02] transition-all cursor-pointer border-l-4 border-red-600 hover:bg-gray-700"
                            >
                                <p className="font-extrabold text-3xl mb-1 text-red-400">{show.time}</p>
                                <p className="text-lg mb-2 text-gray-300">Sala: <span className="font-semibold text-white">{show.sala}</span></p>
                                <p className="mt-3 font-semibold text-2xl text-orange-400">{show.price}</p>
                                <p className="text-sm mt-1 text-gray-400">{show.availableSeats} asientos disponibles</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}