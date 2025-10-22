"use client";

import React, { useEffect, useState, useCallback } from "react";
import { API_BASE } from '@/lib/config';
import { getPriceForHall } from '@/lib/pricing';
import Header from "@/components/Header";
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';

// ==========================================================
// TIPOS (INTERFACES) DE DATOS
// ==========================================================

// Tipo para la estructura de la pelicula
interface Movie {
    title: string;
    image: string;
    rating?: string;
    score?: number;
    genre?: string;
    duration?: string;
    description: string;
    slug: string;
    isUpcoming?: boolean;
}

// Tipo para la estructura del horario (Showtime)
interface Showtime {
    time: string;
    sala: string;
    price: number;
    availableSeats: number;
    id: string; // Puede ser string (MongoDB ObjectId)
    startISO?: string;
    capacity?: number; 
}

// Tipo para el payload del evento 'showtimeUpdated' del socket
interface ShowtimeUpdatePayload {
    _id: string;
    availableSeats?: number;
    seatsBooked?: unknown[]; // Usamos unknown[] en lugar de any[]
}

// ==========================================================
// LOGICA PARA SOCKETS (CORREGIDA LA LINEA 59)
// ==========================================================
// Tipos inferidos genéricos para evitar errores de colision con el namespace
type SocketIoModule = typeof import("socket.io-client");
type IoFunction = SocketIoModule["io"];
type SocketObject = InstanceType<SocketIoModule["Socket"]>; // Obtenemos el tipo de instancia de Socket

let ioClient: IoFunction | null = null;
let SocketClient: SocketObject | null = null;

// LINEA 59 CORREGIDA: Se realiza la doble aserción (Window -> unknown -> { prop }) para evitar TS2352.
const disableSocketsClient = (
    (typeof process !== 'undefined' && process.env && (process.env.NEXT_PUBLIC_DISABLE_SOCKETS || '').toLowerCase() === '1') || 
    (typeof window !== 'undefined' && (window as unknown as { _DISABLE_SOCKETS_: boolean })._DISABLE_SOCKETS_)
);

if (!disableSocketsClient) {
    try {
        import('socket.io-client').then((module) => {
            // El cast de tipo a la estructura esperada
            const { io, Socket } = module as unknown as { 
                io: IoFunction, 
                // La clase Socket en el módulo importado
                Socket: { new(...args: unknown[]): SocketObject } 
            };
            
            ioClient = io;
            SocketClient = Socket as unknown as SocketObject; 
        }).catch((e) => {
            console.warn('socket.io-client no disponible en cliente (movies page)', e);
            ioClient = null;
            SocketClient = null;
        });
    } catch (e) {
        console.warn('socket.io-client no disponible en cliente (movies page)', e);
    }
}

// ==========================================================
// MAPEO DE IMAGENES EXACTAS
// ==========================================================

const IMAGE_MAP: Record<string, string> = {
    "the-shawshank-redemption": "/images/the-shawshank-redemption.jpg",
    "interstellar": "/images/interstellar.jpg",
    "parasite": "/images/parasite.jpg",
    "la-la-land": "/images/la-la-land.jpg",
    "incepcion": "/images/incepcion.jpg",
    "200-lobo": "/images/lobo_200.jpg",
};

// ==========================================================
// CONSTANTES DE PROXIMO ESTRENO (TIPADAS)
// ==========================================================

const LOBO_SLUG = '200-lobo';
const UPCOMING_SLUG = 'proximamente';
const UPCOMING_RELEASE_DATE = '2025-12-25';
const UPCOMING_DISPLAY_DATE = '25 de Diciembre de 2025';

const UPCOMING_MOVIE_DATA: Movie = {
    title: '200% Lobo',
    image: IMAGE_MAP[LOBO_SLUG] || '/images/lobo_200.jpg',
    rating: 'G',
    score: 5.0,
    genre: 'Animacion, Aventura',
    duration: '90 min',
    description: 'Freddy, heredero de una noble y heroica familia de hombres lobo, se convierte en un caniche en su 13º cumpleanos, ¡convirtiendose en la verguenza de la familia! Con un limite de tiempo, debe demostrar que tiene el corazon de un lobo, o sera desterrado para siempre.',
    slug: LOBO_SLUG,
    isUpcoming: true,
};

// ==========================================================
// FUNCIONES Y TIPOS
// ==========================================================

// FUNCION DE SLUG
const createSlug = (title: string): string => {
    return title
        .toLowerCase().trim()
        .replace(/[^ws-]/g, '')
        .replace(/[_]/g, '-')
        .replace(/^-+|-+$/g, '');
};

// FUNCION PARA OBTENER LA URL DE LA IMAGEN
const getImageURL = (movie: Movie): string => {
    const slug = movie.slug || createSlug(movie.title || '');

    if (IMAGE_MAP[slug]) {
        return IMAGE_MAP[slug];
    }
    
    if (typeof movie.image === 'string' && movie.image.trim() !== '' && !movie.image.includes('movie-default.svg')) {
        if (movie.image.startsWith('http')) return movie.image;
        const filename = movie.image.split('/').pop() || movie.image;
        return `/images/${filename.toLowerCase()}`;
    }
    
    if (slug) {
        return `/images/${slug.toLowerCase()}.jpg`;
    }

    return '/images/movie-default.svg';
};

// ==========================================================
// COMPONENTE PRINCIPAL
// ==========================================================

export default function MovieDetailPage() {
    const params = useParams();
    const slug = params.slug as string;

    const [movie, setMovie] = useState<Movie | null>(null);
    const [posterSrc, setPosterSrc] = useState<string>('/images/movie-default.svg');
    const [showtimes, setShowtimes] = useState<Showtime[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [notFound, setNotFound] = useState<boolean>(false);
    
    useEffect(() => {
        if (!slug) return;

        const fetchData = async () => {
            setLoading(true);

            if (slug === UPCOMING_SLUG || slug === LOBO_SLUG) {
                setMovie(UPCOMING_MOVIE_DATA);
                setPosterSrc(UPCOMING_MOVIE_DATA.image ?? '/images/movie-default.svg');
                
                const simulatedShowtimes: Showtime[] = [
                    { time: UPCOMING_DISPLAY_DATE, sala: 'Sala 1', price: 50, availableSeats: 80, id: 'res-1', startISO: `${UPCOMING_RELEASE_DATE}T10:00:00Z` },
                    { time: UPCOMING_DISPLAY_DATE, sala: 'Sala 2', price: 50, availableSeats: 80, id: 'res-2', startISO: `${UPCOMING_RELEASE_DATE}T14:00:00Z` },
                    { time: UPCOMING_DISPLAY_DATE, sala: 'Sala 3', price: 60, availableSeats: 80, id: 'res-3', startISO: `${UPCOMING_RELEASE_DATE}T18:00:00Z` },
                ];
                
                setShowtimes(simulatedShowtimes);
                setLoading(false);
                return;
            }

            // 2. Obtener datos de la pelicula (Logica normal de API)
            try {
                // FETCH MOVIE DETAIL
                const resMovie = await fetch(`${API_BASE}/api/movies/${slug}`);
                if (resMovie.status === 404) {
                    setNotFound(true);
                    setLoading(false);
                    return;
                }
                const movieJson: Record<string, unknown> = await resMovie.json();
                
                const movieData: Movie = {
                    title: (movieJson.title || movieJson.name || 'Sin titulo') as string,
                    image: (movieJson.posterUrl || (movieJson.images as string[] | undefined)?.[0] || '') as string,
                    rating: movieJson.rating ? String(movieJson.rating) : undefined,
                    score: (typeof movieJson.rating === 'number' && movieJson.rating)
                                    || (typeof movieJson.score === 'number' && movieJson.score)
                                    || undefined,
                    genre: Array.isArray(movieJson.genres) ? movieJson.genres.join(', ') : undefined,
                    duration: movieJson.duration ? `${movieJson.duration} min` : undefined,
                    description: (movieJson.description || '') as string,
                    slug: (movieJson.slug || slug) as string,
                };
                
                const finalPosterSrc = getImageURL(movieData);
                
                setMovie(movieData);
                setPosterSrc(finalPosterSrc);


                // FETCH SHOWTIMES
                const resShow = await fetch(`${API_BASE}/api/showtimes`);
                const showJson: unknown = await resShow.json();

                const filtered: unknown[] = Array.isArray(showJson)
                    ? (showJson).filter((s: Record<string, unknown>) => {
                        if (!s.movie) return false;
                        return typeof s.movie === 'object' && s.movie !== null && (s.movie as Record<string, string>).slug === slug;
                    })
                    : [];

                const mapped: Showtime[] = filtered.map((s: unknown): Showtime => {
                    const showtime = s as Record<string, unknown>;
                    const start = showtime.startAt ? new Date(showtime.startAt as string) : null;
                    const timeStr = start ? start.toLocaleTimeString('es-419', { hour: '2-digit', minute: '2-digit' }) : (showtime.time as string || '—');
                    
                    let hallName = 'Sala';
                    const hall = showtime.hall as Record<string, unknown> | string | undefined;

                    const capacity: number = (typeof hall === 'object' && hall !== null && typeof hall.capacity === 'number') ? hall.capacity : 80;
                    
                    if (typeof hall === 'object' && hall !== null) {
                        hallName = (hall.name as string) ?? 'Sala';
                    } else if (typeof hall === 'string') {
                        hallName = hall;
                    }

                    let available: number;
                    if (typeof showtime.availableSeats === 'number') {
                        available = showtime.availableSeats;
                    } else {
                        const seatsBooked = Array.isArray(showtime.seatsBooked) ? showtime.seatsBooked.length : 0;
                        available = Math.max(0, capacity - seatsBooked);
                    }

                    const numericPrice = getPriceForHall(hallName, showtime.price as number | undefined);

                    return {
                        time: timeStr,
                        sala: hallName,
                        price: numericPrice,
                        availableSeats: available,
                        id: showtime._id as string,
                        startISO: start ? start.toISOString() : undefined,
                        capacity: capacity,
                    };
                });

                const ensureFive: Showtime[] = [...mapped]; 
                if (ensureFive.length < 5) {
                    const baseDate = ensureFive[0] && ensureFive[0].startISO ? new Date(ensureFive[0].startISO) : new Date();
                    let addIndex = 0;
                    while (ensureFive.length < 5) {
                        addIndex += 1;
                        const d = new Date(baseDate.getTime() + addIndex * 2 * 60 * 60 * 1000);
                        const t = d.toLocaleTimeString('es-419', { hour: '2-digit', minute: '2-digit' });
                        ensureFive.push({
                            time: t,
                            sala: ensureFive[0]?.sala ?? 'Sala',
                            price: ensureFive[0]?.price ?? getPriceForHall(ensureFive[0]?.sala, undefined),
                            availableSeats: ensureFive[0]?.availableSeats ?? 80,
                            id: `${slug}-gen-${addIndex}`,
                            startISO: d.toISOString(),
                            capacity: ensureFive[0]?.capacity ?? 80,
                        });
                    }
                }

                setShowtimes(ensureFive);
            } catch (err) {
                console.error('Error fetch movie/showtimes', err);
                setNotFound(true);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [slug]);

    // Conectar socket para recibir actualizaciones en tiempo real sobre showtimes
    useEffect(() => {
        if (!slug || typeof window === 'undefined' || !ioClient) return;
        
        const socketUrl = window.location.origin;
        let socket: SocketObject | null = null; 
        
        try {
            socket = ioClient(socketUrl, { autoConnect: true });
            
            socket.on('connect', () => {
                console.debug('movie page socket connected', socket?.id);
            });
            
            socket.on('showtimeUpdated', (payload: ShowtimeUpdatePayload) => {
                try {
                    if (!payload || typeof payload !== 'object' || !payload._id) return;
                    
                    setShowtimes((prev) => {
                        let changed = false;
                        const next: Showtime[] = prev.map((sh) => {
                            if (String(sh.id) === String(payload._id)) {
                                
                                const currentCapacity = sh.capacity ?? sh.availableSeats ?? 80;

                                const newAvailable = typeof payload.availableSeats === 'number'
                                    ? payload.availableSeats
                                    : (Array.isArray(payload.seatsBooked) ? Math.max(0, currentCapacity - payload.seatsBooked.length) : sh.availableSeats);
                                
                                if (newAvailable !== sh.availableSeats) {
                                    changed = true;
                                    return { ...sh, availableSeats: newAvailable };
                                }
                            }
                            return sh;
                        });
                        return changed ? next : prev;
                    });
                } catch (e) {
                    console.error('Error procesando showtimeUpdated en movie page', e);
                }
            });
        } catch (e) {
            console.warn('No se pudo conectar socket en movie page', e);
        }

        return () => {
            try { if (socket) socket.disconnect(); } catch {}
        };
    }, [slug]);

    if (loading) {
        return (
            <div className="min-h-screen bg-black text-white p-8">
                <Header />
                <div className="mt-24 text-center">Cargando pelicula y horarios...</div>
            </div>
        );
    }

    const isUpcoming = movie?.isUpcoming || false;
    const upcomingReleaseText = isUpcoming && slug === LOBO_SLUG ? '¡Proximo estreno en cines!' : `Proximo gran estreno: ${UPCOMING_DISPLAY_DATE}`;

    if (notFound || !movie) {
        return (
            <div className="min-h-screen bg-black text-white p-8 text-center">
                <Header />
                <h1 className="text-4xl mt-20 text-red-600">Pelicula no encontrada 😢</h1>
                <p className="text-lg text-gray-400 mt-4">El identificador de la pelicula no es valido: <strong>{slug}</strong></p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black text-white">
            <Header />
            <div className="p-4 sm:p-8 md:p-12 lg:p-16">
                <div className="flex flex-col md:flex-row gap-8 mb-12">
                    {/* Contenedor de la Imagen */}
                    <div className="w-full md:w-1/3 rounded-xl shadow-2xl border-4 border-gray-700 overflow-hidden max-h-[600px]">
                        <Image
                            src={posterSrc}
                            alt={movie.title}
                            width={400}
                            height={600}
                            style={{ objectFit: 'cover', width: '100%', height: '100%' }}
                            onError={() => setPosterSrc('/images/movie-default.svg')}
                        />
                    </div>
                    {/* Detalles de la Pelicula */}
                    <div className="flex-1 flex flex-col justify-center">
                        {/* Titulo y estado de estreno */}
                        <h1 className="text-4xl sm:text-5xl font-extrabold mb-4 text-orange-400">
                            {movie.title}
                            {isUpcoming && (
                                <span className="block text-xl font-medium text-green-400 mt-2">{upcomingReleaseText}</span>
                            )}
                        </h1>
                        <div className="flex flex-wrap gap-3 text-yellow-400 mb-6 items-center">
                            <span className="font-semibold text-lg">{movie.duration}</span>
                            <span className="px-3 py-1 bg-gray-800 rounded-full text-sm">{movie.genre}</span>
                            <span className="px-3 py-1 bg-red-600 rounded-full text-sm font-bold">{movie.rating}</span>
                            <span className="px-3 py-1 bg-yellow-600 rounded-full text-sm font-bold">⭐ {movie.score}</span>
                        </div>
                        <p className="text-gray-300 text-lg leading-relaxed">{movie.description}</p>
                    </div>
                </div>

                <div className="mt-12">
                    <h2 className="text-3xl font-bold mb-6 text-yellow-400 border-b-2 border-red-600 pb-2">
                        {isUpcoming ? "Horarios de Reserva (Simulacion)" : "Horarios Disponibles"}
                    </h2>
                    {showtimes.length === 0 ? (
                        <p className="text-gray-400">{isUpcoming ? `Reserva disponible a partir del ${UPCOMING_DISPLAY_DATE}.` : "No hay funciones disponibles para esta pelicula."}</p>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {showtimes.map((show) => (
                                <MovieShowtimeCard
                                    key={show.id}
                                    show={show}
                                    movieSlug={movie.slug}
                                    isUpcoming={isUpcoming}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// ==========================================================
// FUNCIONES AUXILIARES
// ==========================================================

function formatMovieName(name: string): string {
    // Quitar guiones y poner mayuscula en cada palabra
    return name
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

// ==========================================================
// COMPONENTE SECUNDARIO
// ==========================================================

function MovieShowtimeCard({ show, movieSlug, isUpcoming }: { show: Showtime; movieSlug: string; isUpcoming: boolean }) {
    const router = useRouter();

    const buttonText = isUpcoming ? "Reservar" : "Comprar";

    const handleBuy = () => {
        const syntheticPrefix = `${movieSlug}-gen-`;
        if (!show.id || String(show.id).startsWith(syntheticPrefix)) {
            router.push(`/comprar`);
            return;
        }
        const params = new URLSearchParams({ showtimeId: String(show.id) });
        router.push(`/comprar?${params.toString()}`);
    };

    let salaLimpia = show.sala;
    if (salaLimpia && salaLimpia.includes('-')) {
        const partes = salaLimpia.split(' - ');
        if (partes.length === 2) {
            salaLimpia = `${partes[0]} - ${formatMovieName(partes[1])}`;
        } else {
            salaLimpia = formatMovieName(salaLimpia);
        }
    }

    return (
        <div className="bg-gray-800 p-6 rounded-2xl shadow-xl transform hover:scale-[1.02] transition-all border-l-4 border-red-600 hover:bg-gray-700">
            <p className="font-extrabold text-3xl mb-1 text-red-400">{show.time}</p>
            <p className="text-lg mb-2 text-gray-300">Sala: <span className="font-semibold text-white">{show.sala}</span></p>
            <p className="text-sm mt-1 text-gray-400">{show.availableSeats} asientos disponibles</p>
            <div className="mt-4 flex gap-2">
                <button onClick={handleBuy} className="px-4 py-2 bg-amber-500 text-black rounded font-semibold hover:bg-amber-400">
                    {buttonText}
                </button>
            </div>
        </div>
    );
}