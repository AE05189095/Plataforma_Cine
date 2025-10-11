// client/src/app/page.tsx - Completo y Corregido

"use client";

import React, { useState, useMemo, ChangeEvent } from 'react';
import MovieCard from '@/components/MovieCard'; 
import { useRouter } from 'next/navigation';

// ----------------------------------------------------------------
// 1. DEFINICIÓN Y DATOS SIMULADOS (Añadimos duration y description)
// ----------------------------------------------------------------
interface MovieData {
    title: string;
    image: string;
    rating: string;
    score: string;
    genre: string; 
    releaseDate: string; 
    duration: string; // ✨ NUEVO: Duración de la película
    description: string; // ✨ NUEVO: Breve descripción/sinopsis
}

const ALL_GENRES = ["Todos los géneros", "Comedia", "Acción", "Drama", "Ciencia Ficción"];

const MOVIES_CARTELERA: MovieData[] = [
    { 
        title: "Quantum Nexus", image: "/images/movie1.jpg", rating: "PG-13", score: "8.5", genre: "Ciencia Ficción", releaseDate: "2024-11-15",
        duration: "135 min", description: "Un físico viaja a través de dimensiones cuánticas para salvar el futuro de la humanidad."
    },
    { 
        title: "Echoes of Tomorrow", image: "/images/movie2.jpg", rating: "R", score: "8.5", genre: "Drama", releaseDate: "2024-11-01",
        duration: "110 min", description: "Una emotiva historia sobre la pérdida y la búsqueda de segundas oportunidades en un mundo post-apocalíptico."
    },
    { 
        title: "Midnight Heist", image: "/images/movie3.jpg", rating: "PG-13", score: "8.5", genre: "Acción", releaseDate: "2024-11-22",
        duration: "98 min", description: "Un equipo de élite intenta el robo más grande de la historia durante un apagón total en la ciudad."
    },
    { 
        title: "Death Unicorn", image: "/images/movie4.jpg", rating: "R", score: "9.2", genre: "Ciencia Ficción", releaseDate: "2024-12-05",
        duration: "145 min", description: "Una criatura mítica desata el caos en un laboratorio futurista, forzando a los científicos a luchar por su vida."
    },
    { 
        title: "Warfare", image: "/images/movie5.jpg", rating: "PG-13", score: "9.1", genre: "Acción", releaseDate: "2024-10-10",
        duration: "120 min", description: "El enfrentamiento final entre dos ejércitos de élite en una batalla épica por el control de un recurso vital."
    },
    { 
        title: "Fast Lane Fury", image: "/images/movie6.jpg", rating: "PG-13", score: "7.8", genre: "Acción", releaseDate: "2024-11-29",
        duration: "105 min", description: "Una carrera de coches ilegal se convierte en una peligrosa persecución internacional por la supervivencia."
    },
];


export default function HomePage() {
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [selectedGenre, setSelectedGenre] = useState<string>(ALL_GENRES[0]);
    const [selectedDate, setSelectedDate] = useState<string>('');

    // ----------------------------------------------------------------
    // 3. FUNCIÓN DE FILTRADO (Se mantiene igual)
    // ----------------------------------------------------------------
    const filteredMovies = useMemo(() => {
        let currentMovies = MOVIES_CARTELERA;

        // FILTRO 1: Búsqueda por Título
        if (searchTerm) {
            currentMovies = currentMovies.filter(movie =>
                movie.title.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // FILTRO 2: Género
        if (selectedGenre !== ALL_GENRES[0]) {
            currentMovies = currentMovies.filter(movie =>
                movie.genre === selectedGenre
            );
        }

        // FILTRO 3: Fecha (Filtra solo las películas que tienen la fecha igual o posterior)
        if (selectedDate) {
             currentMovies = currentMovies.filter(movie =>
                movie.releaseDate >= selectedDate
            );
        }

        return currentMovies;
    }, [searchTerm, selectedGenre, selectedDate]);

    // ----------------------------------------------------------------
    // 4. HANDLERS PARA CAPTURAR CAMBIOS (Se mantiene igual)
    // ----------------------------------------------------------------
    const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(event.target.value);
    };

    const handleGenreChange = (event: ChangeEvent<HTMLSelectElement>) => {
        setSelectedGenre(event.target.value);
    };
    
    const handleDateChange = (event: ChangeEvent<HTMLInputElement>) => {
        setSelectedDate(event.target.value);
    };


    // ----------------------------------------------------------------
    // 5. RENDERIZADO 
    // ----------------------------------------------------------------
    return (
        <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black text-white">
            
            {/* HEADER (barra de navegación superior) */}
            <header className="bg-gray-900 text-white p-4 flex flex-col md:flex-row items-center justify-between gap-4">
                
                {/* Logo */}
                <h1 className="text-2xl font-bold">Mi Cine</h1>

                {/* Buscador, filtros y fecha */}
                <div className="flex flex-col md:flex-row gap-3 md:gap-4 items-center w-full md:w-auto">
                    
                    {/* Buscador */}
                    <input
                        type="text"
                        placeholder="Buscar película"
                        value={searchTerm}
                        onChange={handleSearchChange}
                        className="px-3 py-2 rounded border-2 border-red-600 bg-gray-900 text-white focus:outline-none focus:ring-2 focus:ring-red-600"
                    />
                    
                    {/* Géneros */}
                    <select 
                        value={selectedGenre}
                        onChange={handleGenreChange}
                        className="px-3 py-2 rounded border-2 border-red-600 bg-gray-900 text-white focus:outline-none focus:ring-2 focus:ring-red-600 cursor-pointer"
                    >
                        {ALL_GENRES.map(genre => (
                            <option key={genre} value={genre}>{genre}</option>
                        ))}
                    </select>
                    
                    {/* Fecha */}
                    <input
                        type="date"
                        value={selectedDate}
                        onChange={handleDateChange}
                        className="px-3 py-2 rounded border-2 border-red-600 bg-gray-900 text-white focus:outline-none focus:ring-2 focus:ring-red-600 cursor-pointer"
                    />

                    {/* Botón de inicio de sesión */}
                    <button onClick={() => router.push("/login")} className="px-4 py-2 bg-red-600 rounded hover:bg-red-700 transition">
                        Iniciar sesión
                    </button>
                </div>
            </header>

            <main className="container mx-auto p-4 sm:p-8">
                
                {/* SLOGAN Y LLAMADA A LA ACCIÓN */}
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

                {/* CARTELERA - Muestra las Tarjetas de Películas Filtradas */}
                <section className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 pb-10">
                    {filteredMovies.length > 0 ? (
                        filteredMovies.map((movie, index) => (
                            <MovieCard 
                                key={index}
                                title={movie.title}
                                image={movie.image}
                                rating={movie.rating}
                                score={movie.score}
                                // ✨ Pasando los nuevos datos
                                genre={movie.genre} 
                                duration={movie.duration} 
                                description={movie.description}
                            />
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