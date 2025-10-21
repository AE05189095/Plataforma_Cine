"use client";

import React, { useEffect, useState } from "react";
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
import { API_BASE } from '@/lib/config';
import { getPriceForHall } from '@/lib/pricing';
import Header from "@/components/Header";
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';

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
    image?: string;
    rating?: string;
    score?: number;
    genre?: string;
    duration?: string;
    description?: string;
    slug: string;
}

export default function MovieDetailPage() {
    const params = useParams();
    const slug = params.slug as string;
        // router no se usa aquí (se usa dentro de MovieShowtimeCard)

    const [movie, setMovie] = useState<MovieData | null>(null);
    const [posterSrc, setPosterSrc] = useState<string>('/images/movie-default.svg');
    const [showtimes, setShowtimes] = useState<ShowTime[]>([]);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);

    useEffect(() => {
        if (!slug) return;

        const fetchData = async () => {
            setLoading(true);
            try {
                const resMovie = await fetch(`${API_BASE}/api/movies/${slug}`);
                if (resMovie.status === 404) {
                    setNotFound(true);
                    setLoading(false);
                    return;
                }
                const movieJson = await resMovie.json();
                setMovie({
                    title: movieJson.title || movieJson.name || 'Sin título',
                    image: movieJson.posterUrl || (movieJson.images && movieJson.images[0]) || '/images/movie-default.svg',
                    rating: movieJson.rating ? String(movieJson.rating) : undefined,
                    score: movieJson.rating || movieJson.score,
                    genre: movieJson.genres ? movieJson.genres.join(', ') : undefined,
                    duration: movieJson.duration ? `${movieJson.duration} min` : undefined,
                    description: movieJson.description || '',
                    slug: movieJson.slug || slug,
                });

                // establecer la fuente del póster (fallback si falla la carga)
                setPosterSrc(movieJson.posterUrl || (movieJson.images && movieJson.images[0]) || '/images/movie-default.svg');

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
                                            availableSeats?: number;
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
                                            // usar la capacidad real de la sala si está disponible, fallback a 80
                                            const capacity = (s.hall && typeof s.hall === 'object' && (s.hall as any).capacity) ? Number((s.hall as any).capacity) : 80;
                                            if (s.hall && typeof s.hall === 'object') {
                                                hallName = (s.hall as { name?: string }).name ?? 'Sala';
                                            } else if (typeof s.hall === 'string') {
                                                hallName = s.hall;
                                            }
                                            // preferir availableSeats provisto por el backend cuando exista
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
        if (typeof window === 'undefined') return;
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
                                        <div className="w-full md:w-1/3 rounded-xl shadow-2xl border-4 border-gray-700 overflow-hidden max-h-[600px]">
                                            <Image
                                                src={posterSrc ?? movie.image ?? '/images/movie-default.svg'}
                                                alt={movie.title}
                                                width={400}
                                                height={600}
                                                style={{ objectFit: 'cover', width: '100%', height: '100%' }}
                                                onError={() => setPosterSrc('/images/movie-default.svg')}
                                            />
                                        </div>
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

                <div className="mt-12">
                    <h2 className="text-3xl font-bold mb-6 text-yellow-400 border-b-2 border-red-600 pb-2">Horarios Disponibles</h2>
                    {showtimes.length === 0 ? (
                        <p className="text-gray-400">No hay funciones disponibles para esta película.</p>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {showtimes.map((show) => (
                                <MovieShowtimeCard key={show.id} show={show} movieSlug={movie.slug} />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function formatMovieName(name: string) {
    // Quitar guiones y poner mayúscula en cada palabra
    return name
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

function MovieShowtimeCard({ show, movieSlug }: { show: ShowTime; movieSlug: string }) {
    const router = useRouter();

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
            <p className="text-lg mb-2 text-white font-semibold">{salaLimpia}</p>
            {/* Precio removido por petición del diseño - ya no se muestra */}
            <p className="text-sm mt-1 text-gray-400">{show.availableSeats} asientos disponibles</p>
            <div className="mt-4 flex gap-2">
                <button onClick={handleBuy} className="px-4 py-2 bg-amber-500 text-black rounded font-semibold hover:bg-amber-400">Comprar</button>
            </div>
        </div>
    );
}