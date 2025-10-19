"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

// FUNCION PARA CREAR SLUG (Ruta amigable)
const createSlug = (title: string): string => {
    return title
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '') // Remueve puntuacion
        .replace(/[\s_-]+/g, '-') // Reemplaza espacios y guiones bajos con guiones
        .replace(/^-+|-+$/g, ''); // Remueve guiones al inicio/final
};

interface MovieCardProps {
    title: string;
    image: string;
    rating: string;
    score: string;
    genre: string;
    duration: string;
    description: string;
}

export default function MovieCard({ title, image, rating, score, genre, duration, description }: MovieCardProps) {
    const router = useRouter();
    const [isHovered, setIsHovered] = useState(false);
    
    // GENERAMOS EL SLUG
    const movieSlug = createSlug(title);

    // La ruta dinamica ahora incluye el slug
    const navigateToDetails = (e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        router.push(`/movies/${movieSlug}`); // <--- RUTA DINAMICA CLAVE
    };
    
    // Al hacer clic en la tarjeta (cualquier parte)
    const handleMovieClick = () => {
        navigateToDetails();
    };
    
    // Al hacer clic en el boton "Ver detalles" (para detener la propagacion)
    const handleDetailsClick = (e: React.MouseEvent) => {
        navigateToDetails(e);
    };

    // Al hacer clic en el boton de funciones
    const handleFuncionesClick = (e: React.MouseEvent) => {
        navigateToDetails(e);
    };

    return (
        <div 
            className="cursor-pointer flex flex-col h-full"
            onClick={handleMovieClick} 
            onMouseEnter={() => setIsHovered(true)} 
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* CONTENEDOR DE IMAGEN (HOVER Y BOTON) */}
            <div 
                className={`
                    aspect-[3/4] bg-gray-800 rounded-lg overflow-hidden shadow-xl 
                    transform transition-all duration-300 relative border-2 flex-shrink-0
                    ${isHovered ? 'border-orange-500 scale-[1.03]' : 'border-gray-700'} 
                `}
            >
                {/* Imagen CORREGIDA: Uso basico de 'fill' y 'sizes' */}
                <Image 
                    src={image} 
                    alt={`Poster de ${title}`} 
                    fill 
                    sizes="(max-width: 768px) 50vw, 25vw" 
                    style={{ objectFit: 'cover' }} 
                    className="transition-all duration-300"
                />
                
                {/* Boton Ver Detalles aparece en hover */}
                <div 
                    className={`
                        absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center 
                        transition-opacity duration-300
                        ${isHovered ? 'opacity-100' : 'opacity-0 pointer-events-none'}
                    `}
                >
                    <button
                        onClick={handleDetailsClick} 
                        className="px-4 py-2 bg-orange-500 text-white font-bold rounded-lg shadow-lg hover:bg-orange-600 transition-colors text-sm"
                    >
                        Ver detalles
                    </button>
                </div>

                {/* Etiquetas (se mantienen) */}
                <div className="absolute top-2 left-2 flex flex-col space-y-1">
                    <span className={`px-2 py-0.5 text-xs font-bold rounded ${
                        rating === 'R' ? 'bg-red-700' : 'bg-green-700'
                    }`}>
                        {rating}
                    </span>
                </div>
                <div className="absolute top-2 right-2 flex items-center space-x-1 bg-gray-900/70 backdrop-blur-sm px-2 py-1 rounded">
                    <svg className="w-3 h-3 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.95-.69l1.07-3.292z" />
                    </svg>
                    <span className="text-xs font-bold">{score}</span>
                </div>
                
            </div>
            
            {/* Titulo */}
            <h3 className="text-xl font-bold mt-3 mb-1 truncate">{title}</h3>
            
            {/* Metadata (Genero y Duracion) */}
            <div className="flex justify-between items-center text-sm text-gray-300"> 
                {/* Genero (Izquierda) */}
                <span className="font-semibold text-red-500">{genre}</span>
                
                {/* Duracion (Derecha) */}
                <div className="flex items-center space-x-1">
                    <svg className="w-4 h-4 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    <span>{duration}</span>
                </div>
            </div>

            {/* Descripcion */}
            <p className="text-sm text-gray-400 mt-2 line-clamp-2" title={description}>
                {description}
            </p>

            {/* Boton de Funciones - Degradado Rojo a Naranja */}
            <button 
                onClick={handleFuncionesClick}
                className={`
                    w-full mt-auto px-4 py-2 text-white font-bold text-base rounded-xl 
                    shadow-lg transition-all 
                    bg-gradient-to-r from-red-600 to-orange-500 
                    hover:from-red-700 hover:to-orange-600
                `}
            >
                <span className="text-base font-bold">5 funciones disponibles</span>
            </button>
            
        </div>
    );
}