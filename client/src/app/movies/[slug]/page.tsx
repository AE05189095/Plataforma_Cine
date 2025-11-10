"use client";

import React, { useEffect, useState } from "react";
import { io, Socket } from 'socket.io-client';
import { API_BASE } from '@/lib/config';
import { getPriceForHall } from '@/lib/pricing';
import Header from "@/components/Header";
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';

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
    _id?: string;
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
    const [filterDate, setFilterDate] = useState<string>('');
    
    useEffect(() => {
        if (!slug) return;

        const fetchData = async () => {
            setLoading(true);

            // Si es un próximo estreno (simulación local), mostramos la info de la película
            // pero NO generamos horarios simulados automáticamente. Todas las funciones deben
            // provenir del backend (admin). De este modo evitamos mostrar horarios inventados.
            if (slug === UPCOMING_SLUG || slug === LOBO_SLUG) {
                setMovie(UPCOMING_MOVIE_DATA);
                setPosterSrc(UPCOMING_MOVIE_DATA.image ?? '/images/movie-default.svg');
                // No hacemos 'return' aquí: dejamos que la lógica de fetch de showtimes
                // se ejecute y muestre únicamente lo que el backend devuelva.
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
                    // RawMovieResponse may not declare _id in the type; usar cast seguro
                    _id: (movieJson as RawMovieResponse & { _id?: string })._id || undefined,
                };
                
                // Usar getImageURL con los datos obtenidos
                const finalPosterSrc = getImageURL(movieData);
                
                setMovie(movieData);
                setPosterSrc(finalPosterSrc);


                // FETCH SHOWTIMES (filtrar por película para no traer todo)
                const movieQuery = movieData._id ? movieData._id : (movieData.slug || slug);
                const resShow = await fetch(`${API_BASE}/api/showtimes?movie=${encodeURIComponent(movieQuery)}`);
                const showJson = await resShow.json();

                type RawShowtime = {
                    movie?: { slug?: string } | string | null;
                    startAt?: string | null;
                    time?: string;
                    hall?: { name?: string; capacity?: number } | string | null;
                    seatsBooked?: string[];
                    price?: number;
                    _id?: string;
                    availableSeats?: number;
                };

                const filtered = Array.isArray(showJson)
                    ? (showJson as RawShowtime[]).filter((s) => {
                        if (!s.movie) return false;
                        if (typeof s.movie === 'string') return false;
                        const m = s.movie as { slug?: string; _id?: string };
                        // aceptar match por _id (si la tenemos) o por slug
                        if (movieData._id && m._id) return String(m._id) === String(movieData._id);
                        return typeof m.slug === 'string' && m.slug === slug;
                    })
                    : [];

                const mapped: ShowTime[] = filtered.map((s: RawShowtime) => {
                    const start = s.startAt ? new Date(s.startAt) : null;
                    const timeStr = start ? start.toLocaleTimeString('es-419', { hour: '2-digit', minute: '2-digit' }) : (s.time || '—');
                    let hallName = 'Sala';
                    // Determinar capacidad a partir de la sala si está poblada, sino fallback a 80
                    const hallObj = s.hall && typeof s.hall === 'object' ? (s.hall as { name?: string; capacity?: number }) : null;
                    const capacity = hallObj?.capacity ?? 80;
                    if (hallObj) {
                        hallName = hallObj.name ?? 'Sala';
                    } else if (typeof s.hall === 'string') {
                        hallName = s.hall;
                    }
                    const seatsBooked = Array.isArray(s.seatsBooked) ? s.seatsBooked.length : 0;
                    // Preferir el valor que envía el backend si está disponible
                    const available = typeof s.availableSeats === 'number' ? s.availableSeats : Math.max(0, capacity - seatsBooked);
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

                // Usar sólo los horarios reales que vienen del backend.
                // Antes generábamos horarios "simulados" a partir del primero, lo que causaba
                // que varias tarjetas mostraran la misma sala y disponibilidad. Eso puede confundir al usuario.
                setShowtimes(mapped);
            } catch (err) {
                console.error('Error fetch movie/showtimes', err);
                setNotFound(true);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [slug]);

    // Inicializar filtro desde localStorage y escuchar cambios (limpiar desde otra vista)
    useEffect(() => {
        try {
            if (typeof window !== 'undefined' && window.localStorage) {
                const saved = window.localStorage.getItem('CineGT_filterDate') || '';
                setFilterDate(saved);
            }
        } catch {}

        // Evento personalizado para cambio de filtro de fecha.
        type FilterDateChangedEvent = CustomEvent<string | undefined>;
        const onChange = (ev: Event) => {
            const v = (ev as FilterDateChangedEvent).detail || '';
            setFilterDate(v);
        };
        document.addEventListener('CineGT_filterDateChanged', onChange);
        return () => {
            try { document.removeEventListener('CineGT_filterDateChanged', onChange); } catch {}
        };
    }, []);

    // Real-time updates: escuchar eventos de showtimes para refrescar la vista automáticamente
    useEffect(() => {
        if (!slug) return;
        // conectar socket una sola vez y mantener referencia
        const socket: Socket = io(API_BASE, { transports: ['websocket', 'polling'] });
        // guardamos socket en ref para poder usarlo en otros efectos si hace falta
    const w = window as typeof window & { __client_movie_socket?: Socket };
    w.__client_movie_socket = w.__client_movie_socket || socket;

        interface IncomingShowtime {
            _id?: string;
            movie?: { slug?: string; _id?: string; title?: string } | string;
            startAt?: string;
            time?: string;
            hall?: { name?: string; capacity?: number } | string;
            seatsBooked?: string[];
            availableSeats?: number;
            price?: number;
        }
        const handleCreated = (st: IncomingShowtime) => {
            try {
                if (!st || !st.movie) return;
                // Preferir comparación por _id si la película local lo tiene, sino por slug
                const localMovieId = movie?._id;
                const m = typeof st.movie === 'object' ? st.movie : null;
                if (localMovieId && m && m._id) {
                    if (String(m._id) !== String(localMovieId)) return;
                } else {
                    const movieSlug = m && m.slug ? m.slug : null;
                    if (movieSlug !== slug) return;
                }
                // mapear showtime entrante al formato local
                const start = st.startAt ? new Date(st.startAt) : null;
                const timeStr = start ? start.toLocaleTimeString('es-419', { hour: '2-digit', minute: '2-digit' }) : (st.time || '—');
                const hallObj = st.hall && typeof st.hall === 'object' ? st.hall : null;
                const capacity = hallObj?.capacity ?? 80;
                const seatsBooked = Array.isArray(st.seatsBooked) ? st.seatsBooked.length : 0;
                const available = typeof st.availableSeats === 'number' ? st.availableSeats : Math.max(0, capacity - seatsBooked);
                const numericPrice = getPriceForHall(hallObj?.name ?? 'Sala', st.price as number | undefined);
                const mapped = {
                    time: timeStr,
                    sala: hallObj?.name ?? (typeof st.hall === 'string' ? st.hall : 'Sala'),
                    price: numericPrice,
                    availableSeats: available,
                    id: st._id,
                    startISO: start ? start.toISOString() : undefined,
                };
                setShowtimes(prev => {
                    // evitar duplicados
                    if (prev.some(x => x.id === mapped.id)) return prev;
                    return [...prev, mapped].sort((a,b) => (a.startISO && b.startISO) ? new Date(a.startISO).getTime() - new Date(b.startISO).getTime() : 0);
                });
            } catch (e) { console.warn('Error manejando showtimeCreated socket', e); }
        };

    const handleUpdated = (st: IncomingShowtime) => {
            try {
                if (!st || !st.movie) return;
                const localMovieId = movie?._id;
                const m = typeof st.movie === 'object' ? st.movie : null;
                if (localMovieId && m && m._id) {
                    if (String(m._id) !== String(localMovieId)) return;
                } else {
                    const movieSlug = m && m.slug ? m.slug : null;
                    if (movieSlug !== slug) return;
                }
                const start = st.startAt ? new Date(st.startAt) : null;
                const timeStr = start ? start.toLocaleTimeString('es-419', { hour: '2-digit', minute: '2-digit' }) : (st.time || '—');
                const hallObj = st.hall && typeof st.hall === 'object' ? st.hall : null;
                const capacity = hallObj?.capacity ?? 80;
                const seatsBooked = Array.isArray(st.seatsBooked) ? st.seatsBooked.length : 0;
                const available = typeof st.availableSeats === 'number' ? st.availableSeats : Math.max(0, capacity - seatsBooked);
                const numericPrice = getPriceForHall(hallObj?.name ?? 'Sala', st.price as number | undefined);
                const mapped = {
                    time: timeStr,
                    sala: hallObj?.name ?? (typeof st.hall === 'string' ? st.hall : 'Sala'),
                    price: numericPrice,
                    availableSeats: available,
                    id: st._id,
                    startISO: start ? start.toISOString() : undefined,
                };
                setShowtimes(prev => prev.map(x => x.id === mapped.id ? mapped : x));
            } catch (e) { console.warn('Error manejando showtimeUpdated socket', e); }
        };

    const handleRemoved = (payload: { id?: string; _id?: string } | null) => {
            try {
                const id = payload && (payload.id || payload._id) ? (payload.id || payload._id) : null;
                if (!id) return;
                setShowtimes(prev => prev.filter(x => x.id !== id));
            } catch (e) { console.warn('Error manejando showtimeRemoved socket', e); }
        };

        socket.on('showtimeCreated', handleCreated);
        socket.on('showtimeUpdated', handleUpdated);
        socket.on('showtimeRemoved', handleRemoved);

        return () => {
            socket.off('showtimeCreated', handleCreated);
            socket.off('showtimeUpdated', handleUpdated);
            socket.off('showtimeRemoved', handleRemoved);
            // sólo desconectar si es la misma instancia creada aquí
            try { socket.disconnect(); } catch { /* ignore */ }
        };
    }, [slug, movie]);

    // Suscribirse a actualizaciones puntuales de availableSeats por showtime
    useEffect(() => {
    const w2 = window as typeof window & { __client_movie_socket?: Socket; __movie_listeners?: Record<string, (...args: unknown[]) => void> };
    const socket: Socket | undefined = w2.__client_movie_socket;
        if (!socket) return;

        const subscribed = new Set<string>();

    const attach = (id: string) => {
            if (!id || subscribed.has(id)) return;
            subscribed.add(id);
            const ev = `updateAvailableSeats-${id}`;
            const handler = (payload: { availableSeats?: number; seatsBooked?: string[] } | null) => {
                try {
                    setShowtimes(prev => prev.map(s => {
                        if (s.id !== id) return s;
                        const avail = (payload && typeof payload.availableSeats === 'number')
                            ? payload.availableSeats
                            : (payload && Array.isArray(payload.seatsBooked)
                                ? Math.max(0, s.availableSeats)
                                : s.availableSeats);
                        return { ...s, availableSeats: typeof avail === 'number' ? avail : s.availableSeats };
                    }));
                } catch (e) { console.warn('Error handling updateAvailableSeats payload', e); }
            };
            socket.on(ev, handler);
            // store for cleanup
            w2.__movie_listeners = w2.__movie_listeners || {};
            w2.__movie_listeners[ev] = handler as unknown as (...args: unknown[]) => void;
        };

        const detachAll = () => {
            const listeners = w2.__movie_listeners || {};
            Object.keys(listeners).forEach(ev => {
                try { socket.off(ev, listeners[ev]); } catch { /* ignore */ }
            });
            w2.__movie_listeners = {};
        };

        // Attach for current showtimes
        for (const s of showtimes) {
            if (s.id) attach(s.id);
        }

        return () => {
            detachAll();
        };
    }, [showtimes]);

    if (loading) {
        return (
            <div className="min-h-screen bg-black text-white p-8">
                <Header hideFilters />
                <div className="mt-24 text-center">Cargando película y horarios...</div>
            </div>
        );
    }

    const isUpcoming = movie?.isUpcoming || false;
    // Lógica combinada para el texto de próximo estreno
    const upcomingReleaseText = isUpcoming && (slug === LOBO_SLUG || slug === UPCOMING_SLUG) 
        ? `Próximo gran estreno: ${UPCOMING_DISPLAY_DATE}` 
        : `¡Próximo estreno en cines!`;


    if (notFound || !movie) {
        return (
            <div className="min-h-screen bg-black text-white p-8 text-center">
                <Header hideFilters /> 
                <h1 className="text-4xl mt-20 text-red-600">Película no encontrada 😢</h1>
                <p className="text-lg text-gray-400 mt-4">El identificador de la película no es válido: <strong>{slug}</strong></p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black text-white">
            <Header hideFilters />
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
                            {/* Mostrar SOLO un rating: preferir 'score' (numérico) con estrella; si no existe, mostrar 'rating' */}
                            {movie.score != null ? (
                                <span className="px-3 py-1 bg-yellow-600 rounded-full text-sm font-bold">⭐ {movie.score}</span>
                            ) : movie.rating ? (
                                <span className="px-3 py-1 bg-red-600 rounded-full text-sm font-bold">{movie.rating}</span>
                            ) : null}
                        </div>
                        <p className="text-gray-300 text-lg leading-relaxed">{movie.description}</p>
                    </div>
                </div>

                <div className="mt-12">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-3xl font-bold text-yellow-400 border-b-2 border-red-600 pb-2">
                            {isUpcoming ? "Horarios de Reserva (Simulación)" : "Horarios Disponibles"}
                        </h2>
                        <div className="flex items-center gap-4">
                            <label htmlFor="filter-date" className="text-sm text-gray-300 hidden sm:block">Filtrar por fecha</label>
                            <div className="flex items-center gap-3">
                                <input
                                    id="filter-date"
                                    type="date"
                                    className="bg-gray-900 text-white px-4 py-2 rounded-md border border-gray-700 focus:outline-none focus:ring-2 focus:ring-red-600 min-w-[200px]"
                                    value={filterDate || ''}
                                    onChange={(e) => {
                                        const v = e.target.value;
                                        setFilterDate(v || '');
                                        try { if (typeof window !== 'undefined' && window.localStorage) { if (v) window.localStorage.setItem('CineGT_filterDate', v); else window.localStorage.removeItem('CineGT_filterDate'); } } catch {}
                                    }}
                                />
                                <button
                                    type="button"
                                    title="Limpiar filtro"
                                    onClick={() => {
                                        setFilterDate('');
                                        try { if (typeof window !== 'undefined' && window.localStorage) window.localStorage.removeItem('CineGT_filterDate'); } catch {}
                                    }}
                                    className="px-3 py-2 bg-amber-500 text-black rounded-md font-semibold hover:bg-amber-400"
                                >
                                    Limpiar
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Filtrar y ordenar showtimes por fecha/hora (más cercano -> más lejano) */}
                    {(() => {
                        // Usar la fecha seleccionada desde el estado (formato YYYY-MM-DD)
                        const selectedDate: string | null = filterDate || null;

                        const filtered = showtimes.filter(s => {
                            if (!selectedDate) return true;
                            if (!s.startISO) return false;
                            return s.startISO.slice(0,10) === selectedDate;
                        });

                        const sorted = filtered.sort((a,b) => {
                            const ta = a.startISO ? new Date(a.startISO).getTime() : 0;
                            const tb = b.startISO ? new Date(b.startISO).getTime() : 0;
                            return ta - tb; // más cercano (menor timestamp) primero
                        });

                        if (sorted.length === 0) {
                            return (
                                <p className="text-gray-400">{isUpcoming ? `Reserva disponible a partir del ${UPCOMING_DISPLAY_DATE}.` : "No hay funciones disponibles para la fecha seleccionada."}</p>
                            );
                        }

                        return (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {sorted.map((show) => (
                                    <MovieShowtimeCard 
                                        key={show.id || `${movie.slug}-${show.time}`} 
                                        show={show} 
                                        movieSlug={movie.slug} 
                                        isUpcoming={isUpcoming} 
                                    />
                                ))}
                            </div>
                        );
                    })()}
                </div>
            </div>
        </div>
    );
}

// ==========================================================
// COMPONENTE SECUNDARIO
// ==========================================================

function MovieShowtimeCard({ show, movieSlug, isUpcoming }: { show: ShowTime; movieSlug: string; isUpcoming?: boolean }) {
    const router = useRouter();

    const buttonText = isUpcoming ? "Reservar" : "Comprar";

    const handleBuy = () => {
        //comprar solo si no es simulado
        /*if (!show.id) {
                alert("Este horario es simulado y no se puede comprar.");
                return;
          }

            const params = new URLSearchParams({ showtimeId: show.id });
            router.push(`/comprar?${params.toString()}`);
        */
      const params = new URLSearchParams({ showtimeId: show.id || `${movieSlug}-${show.time}` });
            router.push(`/comprar?${params.toString()}`);
    };



    // Mostrar hora usando startISO si está disponible para evitar inconsistencias de formato
    let displayTime = show.time;
    if (show.startISO) {
        try {
            displayTime = new Date(show.startISO).toLocaleTimeString('es-419', { hour: '2-digit', minute: '2-digit' });
        } catch {
            // fallback a show.time
        }
    }

    // Mostrar fecha del showtime (si está disponible)
    let displayDate = '';
    if (show.startISO) {
        try {
            displayDate = new Date(show.startISO).toLocaleDateString('es-419', { day: '2-digit', month: 'long', year: 'numeric' });
        } catch {
            displayDate = '';
        }
    }

    // Limpiar nombre de sala si contiene sufijos no deseados (ej: "Sala 1 - slug-de-pelicula")
    const salaRaw = show.sala || 'Sala';
    const salaDisplay = typeof salaRaw === 'string' ? salaRaw.replace(/\s*-\s*[^-]+$/,'').trim() : String(salaRaw);

    return (
        <div className="bg-gray-800 p-6 rounded-2xl shadow-xl transform hover:scale-[1.02] transition-all border-l-4 border-red-600 hover:bg-gray-700">
            <p className="font-extrabold text-3xl mb-1 text-red-400">{displayTime}</p>
            {displayDate ? (
                <p className="text-sm mb-2 text-gray-300">Fecha: <span className="font-semibold text-white">{displayDate}</span></p>
            ) : null}
            <p className="text-lg mb-2 text-gray-300">Sala: <span className="font-semibold text-white">{salaDisplay}</span></p>
            <p className="text-sm mt-1 text-gray-400">{show.availableSeats} asientos disponibles</p>
            <div className="mt-4 flex gap-2">
                <button onClick={handleBuy} className="px-4 py-2 bg-amber-500 text-black rounded font-semibold hover:bg-amber-400">
                    {buttonText}
                </button>
            </div>
        </div>
    );
}