"use client";

import React, { useEffect, useState, useCallback } from "react";
import { API_BASE } from '@/lib/config';
import { getPriceForHall } from '@/lib/pricing';
import Header from "@/components/Header";
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';

// ==========================================================
// 🛑 Lógica para Sockets (Unificación de HU6)
// ==========================================================
let io: any = null;
let Socket: any = null;
const disableSocketsClient = (typeof process !== 'undefined' && process.env && (process.env.NEXT_PUBLIC_DISABLE_SOCKETS || '').toLowerCase() === '1') || (typeof window !== 'undefined' && (window as any).__DISABLE_SOCKETS__);
if (!disableSocketsClient) {
    try {
        // import dinámico para evitar bundling si está deshabilitado
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        ({ io, Socket } = require('socket.io-client'));
    } catch (e) {
        console.warn('socket.io-client no disponible en cliente (movies page)', e);
        io = null;
        Socket = null;
    }
}
// ==========================================================
// 🛑 MAPEO DE IMÁGENES EXACTAS
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
// CONSTANTES DE PRÓXIMO ESTRENO
// ==========================================================

const LOBO_SLUG = '200-lobo'; 
const UPCOMING_SLUG = 'proximamente';
const UPCOMING_RELEASE_DATE = '2025-12-25'; // Fecha de estreno para simulación (ISO)
const UPCOMING_DISPLAY_DATE = '25 de Diciembre de 2025'; // Fecha de estreno para mostrar

const UPCOMING_MOVIE_DATA: MovieData = {
    title: '200% Lobo',
    image: IMAGE_MAP[LOBO_SLUG] || '/images/lobo_200.jpg',
    rating: 'G',
    score: 5.0,
    genre: 'Animación, Aventura',
    duration: '90 min',
    description: 'Freddy, heredero de una noble y heroica familia de hombres lobo, se convierte en un caniche en su 13º cumpleaños, ¡convirtiéndose en la vergüenza de la familia! Con un límite de tiempo, debe demostrar que tiene el corazón de un lobo, o será desterrado para siempre.',
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
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
};

interface ShowTime {
    time: string;
    sala: string;
    price: number;
    availableSeats: number;
    id?: string;
    startISO?: string;
}

interface MovieData {
    title: string;
    image?: string; // posterUrl o image de la API
    rating?: string;
    score?: number;
    genre?: string;
    duration?: string;
    description?: string;
    slug: string;
    isUpcoming?: boolean; 
}

interface RawMovieResponse {
    title?: string | null;
    name?: string | null;
    posterUrl?: string | null;
    images?: (string | null)[];
    rating?: number | string | null;
    score?: number | null;
    genres?: string[] | null;
    duration?: number | string | null;
    description?: string | null;
    slug?: string | null;
}

// FUNCION PARA OBTENER LA URL DE LA IMAGEN
const getImageURL = (movie: MovieData): string => {
    const slug = movie.slug || createSlug(movie.title || '');

    // 1. 🛑 PRIORIDAD AL MAPEO MANUAL por slug (Garantiza el éxito local)
    if (IMAGE_MAP[slug]) {
        return IMAGE_MAP[slug];
    }
    
    // 2. Intentar obtener de la propiedad 'image' (que viene de posterUrl de la API)
    if (typeof movie.image === 'string' && movie.image.trim() !== '' && !movie.image.includes('movie-default.svg')) {
        // Si el path de la API es un URL completo, lo devolvemos
        if (movie.image.startsWith('http')) return movie.image;

        // Si es solo el nombre del archivo, construimos la ruta estática
        const filename = movie.image.split('/').pop() || movie.image;
        return `/images/${filename.toLowerCase()}`;
    }
    
    // 3. Fallback al slug automático
    if (slug) {
        return `/images/${slug.toLowerCase()}.jpg`; 
    }

    // 4. Fallback final
    return '/images/movie-default.svg';
};

// ==========================================================
// COMPONENTE PRINCIPAL
// ==========================================================

export default function MovieDetailPage() {
    const params = useParams();
    const slug = params.slug as string;

    const [movie, setMovie] = useState<MovieData | null>(null);
    const [posterSrc, setPosterSrc] = useState<string>('/images/movie-default.svg');
    const [showtimes, setShowtimes] = useState<ShowTime[]>([]);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);
    
    useEffect(() => {
        if (!slug) return;

        const fetchData = async () => {
            setLoading(true);

            // 🛑 LÓGICA CORREGIDA: Incluye el slug real de la película
            if (slug === UPCOMING_SLUG || slug === LOBO_SLUG) { 
                setMovie(UPCOMING_MOVIE_DATA);
                setPosterSrc(UPCOMING_MOVIE_DATA.image ?? '/images/movie-default.svg'); 
                
                const simulatedShowtimes: ShowTime[] = [
                    { time: UPCOMING_DISPLAY_DATE, sala: 'Sala 1', price: 50, availableSeats: 80, id: 'res-1', startISO: `${UPCOMING_RELEASE_DATE}T10:00:00Z` },
                    { time: UPCOMING_DISPLAY_DATE, sala: 'Sala 2', price: 50, availableSeats: 80, id: 'res-2', startISO: `${UPCOMING_RELEASE_DATE}T14:00:00Z` },
                    // 🛑 CORRECCIÓN DE TIPEO EN LA CONSTANTE ABAJO
                    { time: UPCOMING_DISPLAY_DATE, sala: 'Sala 3', price: 60, availableSeats: 80, id: 'res-3', startISO: `${UPCOMING_RELEASE_DATE}T18:00:00Z` },
                ];
                
                setShowtimes(simulatedShowtimes);
                setLoading(false);
                return;
            }

            // 2. Obtener datos de la película (Lógica normal de API)
            try {
                // FETCH MOVIE DETAIL
                const resMovie = await fetch(`${API_BASE}/api/movies/${slug}`);
                if (resMovie.status === 404) {
                    setNotFound(true);
                    setLoading(false);
                    return;
                }
                const movieJson: RawMovieResponse = await resMovie.json();
                
                const movieData: MovieData = {
                    title: movieJson.title || movieJson.name || 'Sin título',
                    image: movieJson.posterUrl || (movieJson.images && movieJson.images[0]) || '', // Puede estar vacío
                    rating: movieJson.rating ? String(movieJson.rating) : undefined,
                    score: (typeof movieJson.rating === 'number' && movieJson.rating) 
                                 || (typeof movieJson.score === 'number' && movieJson.score) 
                                 || undefined, 
                    genre: movieJson.genres ? movieJson.genres.join(', ') : undefined,
                    duration: movieJson.duration ? `${movieJson.duration} min` : undefined,
                    description: movieJson.description || '',
                    slug: movieJson.slug || slug,
                };
                
                // Usar getImageURL con los datos obtenidos
                const finalPosterSrc = getImageURL(movieData);
                
                setMovie(movieData);
                setPosterSrc(finalPosterSrc);


                // FETCH SHOWTIMES (lógica existente)
                const resShow = await fetch(`${API_BASE}/api/showtimes`);
                const showJson = await resShow.json();

                type RawShowtime = {
                    movie?: { slug?: string } | string | null;
                    startAt?: string | null;
                    time?: string;
                    hall?: { name?: string; capacity?: number } | string | null;
                    seatsBooked?: string[];
                    price?: number;
                    _id?: string;
                    availableSeats?: number; // Campo del backend (prioritario)
                };

                const filtered = Array.isArray(showJson)
                    ? (showJson as RawShowtime[]).filter((s) => {
                        if (!s.movie) return false;
                        if (typeof s.movie === 'string') return false;
                        return typeof s.movie === 'object' && (s.movie as { slug?: string }).slug === slug;
                    })
                    : [];

                const mapped: ShowTime[] = filtered.map((s: RawShowtime) => {
                    const start = s.startAt ? new Date(s.startAt) : null;
                    const timeStr = start ? start.toLocaleTimeString('es-419', { hour: '2-digit', minute: '2-digit' }) : (s.time || '—');
                    let hallName = 'Sala';
                    // 🛑 Unificación: usar capacidad real de la sala si está disponible (de HU6)
                    const capacity = (s.hall && typeof s.hall === 'object' && (s.hall as any).capacity) ? Number((s.hall as any).capacity) : 80;
                    
                    if (s.hall && typeof s.hall === 'object') {
                        hallName = (s.hall as { name?: string }).name ?? 'Sala';
                    } else if (typeof s.hall === 'string') {
                        hallName = s.hall;
                    }

                    // 🛑 Unificación: preferir availableSeats provisto por el backend cuando exista (de HU6)
                    let available: number;
                    if (typeof (s as any).availableSeats === 'number') {
                        available = (s as any).availableSeats as number;
                    } else {
                        const seatsBooked = Array.isArray(s.seatsBooked) ? s.seatsBooked.length : 0;
                        available = Math.max(0, capacity - seatsBooked);
                    }

                    const numericPrice = getPriceForHall(hallName, s.price as number | undefined);

                    return {
                        time: timeStr,
                        sala: hallName,
                        price: numericPrice,
                        availableSeats: available,
                        id: s._id,
                        startISO: start ? start.toISOString() : undefined,
                    };
                });

                // Si hay menos de 5 horarios, generar horarios adicionales (en intervalos de 2 horas)
                const ensureFive: ShowTime[] = [...mapped];
                if (ensureFive.length < 5) {
                    // Tomar base desde el primer horario si existe, si no usar ahora
                    const baseDate = ensureFive[0] && ensureFive[0].startISO ? new Date(ensureFive[0].startISO as string) : new Date();
                    let addIndex = 0;
                    while (ensureFive.length < 5) {
                        addIndex += 1;
                        const d = new Date(baseDate.getTime() + addIndex * 2 * 60 * 60 * 1000); // +2h cada vez
                        const t = d.toLocaleTimeString('es-419', { hour: '2-digit', minute: '2-digit' });
                        ensureFive.push({
                            time: t,
                            sala: ensureFive[0]?.sala ?? 'Sala',
                            price: ensureFive[0]?.price ?? getPriceForHall(ensureFive[0]?.sala, undefined),
                            // por defecto 80 asientos cuando no hay datos reales
                            availableSeats: ensureFive[0]?.availableSeats ?? 80,
                            id: `${slug}-gen-${addIndex}`,
                            startISO: d.toISOString(),
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
        if (!slug) return;
        // Ejecutar solo en cliente
        if (typeof window === 'undefined' || !io) return; // 🛑 Usar la importación dinámica io
        const socketUrl = window.location.origin;
        let socket: any = null;
        try {
            socket = io(socketUrl, { autoConnect: true });
            socket.on('connect', () => {
                console.debug('movie page socket connected', socket?.id);
            });
            socket.on('showtimeUpdated', (payload: unknown) => {
                try {
                    if (!payload || typeof payload !== 'object') return;
                    const p = payload as { _id?: string; seatsBooked?: unknown; availableSeats?: number };
                    if (!p._id) return;
                    // Actualizar la lista de showtimes si contiene ese id
                    setShowtimes((prev) => {
                        let changed = false;
                        const next = prev.map((sh) => {
                            if (!sh.id) return sh;
                            if (String(sh.id) === String(p._id)) {
                                // obtener capacidad de la sala si es posible (no está disponible en este payload)
                                const newAvailable = typeof p.availableSeats === 'number'
                                    ? p.availableSeats
                                    : (Array.isArray((p as any).seatsBooked) ? Math.max(0, (sh as any).capacity - (p as any).seatsBooked.length) : sh.availableSeats);
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
                <div className="mt-24 text-center">Cargando película y horarios...</div>
            </div>
        );
    }

    const isUpcoming = movie?.isUpcoming || false;
    const upcomingReleaseText = isUpcoming && slug === LOBO_SLUG ? `¡Próximo estreno en cines!` : `Próximo gran estreno: ${UPCOMING_DISPLAY_DATE}`;

    if (notFound || !movie) {
        return (
            <div className="min-h-screen bg-black text-white p-8 text-center">
                <Header /> 
                <h1 className="text-4xl mt-20 text-red-600">Película no encontrada 😢</h1>
                <p className="text-lg text-gray-400 mt-4">El identificador de la película no es válido: <strong>{slug}</strong></p>
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
                            // Si la imagen calculada (posterSrc) falla, forzamos el fallback
                            onError={() => setPosterSrc('/images/movie-default.svg')}
                        />
                    </div>
                    {/* Detalles de la Película */}
                    <div className="flex-1 flex flex-col justify-center">
                        {/* Título y estado de estreno */}
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
                        {isUpcoming ? "Horarios de Reserva (Simulación)" : "Horarios Disponibles"}
                    </h2>
                    {showtimes.length === 0 ? (
                        <p className="text-gray-400">{isUpcoming ? `Reserva disponible a partir del ${UPCOMING_DISPLAY_DATE}.` : "No hay funciones disponibles para esta película."}</p>
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

function formatMovieName(name: string) {
    // Quitar guiones y poner mayúscula en cada palabra
    return name
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

// ==========================================================
// COMPONENTE SECUNDARIO
// ==========================================================

function MovieShowtimeCard({ show, movieSlug, isUpcoming }: { show: ShowTime; movieSlug: string; isUpcoming?: boolean }) {
    const router = useRouter();

    const buttonText = isUpcoming ? "Reservar" : "Comprar";

    const handleBuy = () => {
        // Evitar usar ids sintéticos que no existen en el backend (p. ej. `${slug}-gen-...`)
        const syntheticPrefix = `${movieSlug}-gen-`;
        if (!show.id || String(show.id).startsWith(syntheticPrefix)) {
            // Redirigir a /comprar sin showtimeId para que la página seleccione uno real automáticamente
            router.push(`/comprar`);
            return;
        }
        const params = new URLSearchParams({ showtimeId: String(show.id) });
        router.push(`/comprar?${params.toString()}`);
    };

    // Evitar mostrar la sala repetida dos veces en la misma tarjeta
    let salaLimpia = show.sala;
    // Si el nombre de la sala contiene el slug de la película, lo limpiamos y formateamos
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
            {/* 🛑 Unificación de estilos de sala. Dejamos el formato de test/semana3 que es más claro. */}
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