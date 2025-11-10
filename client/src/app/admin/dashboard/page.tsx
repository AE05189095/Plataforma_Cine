"use client";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import { API_BASE } from "../../../lib/config";

type Movie = { _id: string; title: string; posterUrl?: string; images?: string[]; rating?: number; ratingCount?: number; isActive?: boolean };
type Hall = { _id: string; name: string; capacity?: number; isActive?: boolean };
type Showtime = { _id: string; movie: Movie | string; hall: Hall | string; startAt: string; price?: number; seatsBooked?: string[]; capacity?: number; isActive?: boolean };

export default function AdminDashboardPage() {
  const cardStyle: React.CSSProperties = {
    background: 'rgba(6,18,30,0.7)',
    border: '1px solid rgba(255,255,255,0.04)'
  };

  const [movies, setMovies] = useState<Movie[]>([]);
  const [halls, setHalls] = useState<Hall[]>([]);
  const [showtimes, setShowtimes] = useState<Showtime[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [mr, hr, sr] = await Promise.all([
          fetch(`${API_BASE}/api/movies`).then(r => r.ok ? r.json() : []),
          fetch(`${API_BASE}/api/halls`).then(r => r.ok ? r.json() : []),
          fetch(`${API_BASE}/api/showtimes`).then(r => r.ok ? r.json() : []),
        ]);
        setMovies(mr || []);
        setHalls(hr || []);
        setShowtimes(sr || []);
      } catch (err) {
        console.error('Error cargando datos para dashboard', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Derived stats
  const activeMoviesCount = movies.filter(m => m.isActive !== false).length;
  const scheduledCount = showtimes.filter(s => s.isActive !== false).length;

  // total booked seats and capacity
  let totalBooked = 0;
  let totalCapacity = 0;
  let estimatedIncome = 0;
  for (const s of showtimes) {
    if (!s.isActive) continue;
    const booked = Array.isArray(s.seatsBooked) ? s.seatsBooked.length : 0;
    const cap = typeof s.capacity === 'number' && s.capacity > 0 ? s.capacity : (typeof s.hall === 'object' && s.hall && s.hall.capacity ? s.hall.capacity : 64);
    totalBooked += booked;
    totalCapacity += cap;
    estimatedIncome += (s.price || 0) * booked;
  }

  const occupancyPercent = totalCapacity > 0 ? Math.round((totalBooked / totalCapacity) * 100) : 0;

  // popular movies by rating (desc)
  const popularByRating = [...movies].filter(m => m).sort((a,b) => (b.rating || 0) - (a.rating || 0)).slice(0,3);

  // upcoming showtimes (por horario) - los próximos 8
  const upcomingShowtimes = [...showtimes]
    .filter(s => s.isActive !== false)
    .sort((a,b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime())
    .slice(0, 8)
    .map(s => {
      const booked = Array.isArray(s.seatsBooked) ? s.seatsBooked.length : 0;
      const cap = typeof s.capacity === 'number' && s.capacity > 0 ? s.capacity : (typeof s.hall === 'object' && s.hall && s.hall.capacity ? s.hall.capacity : 64);
      const occ = cap > 0 ? Math.round((booked / cap) * 100) : 0;
      return { showtime: s, booked, capacity: cap, occupancy: occ };
    });

  return (
    <div className="py-8">
      <h1 className="text-3xl font-bold mb-6" style={{ color: 'var(--foreground)' }}>Panel de Control</h1>

      {/* Cards resumen */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="p-4 rounded-lg" style={cardStyle}>
          <h3 className="text-sm" style={{ color: 'var(--color-link)' }}>Películas Activas</h3>
          <p className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>{loading ? '...' : activeMoviesCount}</p>
        </div>
        <div className="p-4 rounded-lg" style={cardStyle}>
          <h3 className="text-sm" style={{ color: 'var(--color-link)' }}>Funciones Programadas</h3>
          <p className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>{loading ? '...' : scheduledCount}</p>
        </div>
        <div className="p-4 rounded-lg" style={cardStyle}>
          <h3 className="text-sm" style={{ color: 'var(--color-link)' }}>Ocupación</h3>
          <p className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>{loading ? '...' : `${occupancyPercent}%`}</p>
        </div>
        <div className="p-4 rounded-lg" style={cardStyle}>
          <h3 className="text-sm" style={{ color: 'var(--color-link)' }}>Ingresos Estimados</h3>
          <p className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>{loading ? '...' : `Q${Number(estimatedIncome).toLocaleString()}`}</p>
        </div>
      </div>

      {/* Secciones inferiores (resumen peliculas y salas) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="p-4 rounded-lg" style={cardStyle}>
          <h2 className="font-semibold mb-4" style={{ color: 'var(--foreground)' }}>Películas Más Populares (por rating)</h2>
          <ul className="space-y-3" style={{ color: 'rgba(255,255,255,0.8)' }}>
            {loading ? (
              <li>Cargando...</li>
            ) : (
              popularByRating.length === 0 ? <li>No hay películas</li> : popularByRating.map((m, idx) => {
                const src = m.posterUrl || (m.images && m.images.length ? m.images[0] : '') || '/images/movie-default.svg';
                return (
                  <li key={m._id} className="flex items-center space-x-3">
                    <div className="w-14 h-20 flex-shrink-0 bg-gray-800 rounded overflow-hidden border" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                      <Image src={src} alt={m.title} className="w-full h-full object-cover" width={56} height={80} />
                    </div>
                    <div>
                      <div className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>{idx+1}. {m.title}</div>
                      <div className="text-xs" style={{ color: 'rgba(255,255,255,0.7)' }}>Rating: {(m.rating || 0).toFixed(1)} ({m.ratingCount || 0})</div>
                    </div>
                  </li>
                );
              })
            )}
          </ul>
        </div>

        <div className="p-4 rounded-lg" style={cardStyle}>
          <h2 className="font-semibold mb-4" style={{ color: 'var(--foreground)' }}>Ocupación por Horario</h2>
          {loading ? (
            <div>Cargando...</div>
          ) : upcomingShowtimes.length === 0 ? (
            <div>No hay horarios programados</div>
          ) : (
            <div className="space-y-3">
              {upcomingShowtimes.map(({ showtime, booked, capacity, occupancy }) => {
                const movie = typeof showtime.movie === 'string' ? null : showtime.movie;
                const hall = typeof showtime.hall === 'string' ? null : showtime.hall;
                const dt = new Date(showtime.startAt);
                const timeStr = dt.toLocaleString(undefined, { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
                return (
                  <div key={showtime._id} className="p-3 rounded" style={{ background: 'rgba(11,18,32,0.6)', border: '1px solid rgba(255,255,255,0.03)' }}>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>{movie?.title || '—'}</div>
                        <div className="text-xs" style={{ color: 'rgba(255,255,255,0.6)' }}>{hall?.name || '—'} — {timeStr}</div>
                      </div>
                      <div className="text-sm font-medium" style={{ color: 'var(--color-link)' }}>{occupancy}%</div>
                    </div>
                    <div className="mt-2 w-full bg-white/6 rounded h-3 overflow-hidden">
                      <div style={{ width: `${occupancy}%`, background: 'linear-gradient(90deg,#06b6d4,#3b82f6)' }} className="h-full" />
                    </div>
                    <div className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.55)' }}>{booked}/{capacity} reservados</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
