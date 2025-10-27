"use client";
import React, { useEffect, useState, useCallback } from "react";
import { API_BASE, TOKEN_KEY } from "../../../lib/config";

type Movie = { _id: string; title: string; duration?: number };
type Hall = { _id: string; name?: string; capacity?: number };
type Showtime = {
  _id: string;
  movie: Movie | string;
  hall: Hall | string;
  startAt: string;
  endAt?: string;
  date: string;
  time: string;
  price?: number;
  isActive?: boolean;
};

export default function AdminHorariosPage() {
  const [showtimes, setShowtimes] = useState<Showtime[]>([]);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [halls, setHalls] = useState<Hall[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Showtime | null>(null);

  const [form, setForm] = useState({ movie: "", hall: "", date: "", time: "", price: "" });

  const boxStyle: React.CSSProperties = { background: 'rgba(6,18,30,0.7)', border: '1px solid rgba(255,255,255,0.04)' };

  const token = typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null;

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([loadShowtimes(), loadMovies(), loadHalls()]);
    } catch (err: unknown) {
      setError((err as Error)?.message || 'Error cargando datos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  

  const loadShowtimes = async () => {
    const res = await fetch(`${API_BASE}/api/showtimes`);
    if (!res.ok) throw new Error('No se pudo obtener showtimes');
    const data = await res.json();
    setShowtimes(data || []);
  };

  const loadMovies = async () => {
    const res = await fetch(`${API_BASE}/api/movies`);
    if (!res.ok) return setMovies([]);
    const data = await res.json();
    setMovies(data || []);
  };

  const loadHalls = async () => {
    const res = await fetch(`${API_BASE}/api/halls`);
    if (!res.ok) return setHalls([]);
    const data = await res.json();
    setHalls(data || []);
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ movie: '', hall: '', date: '', time: '', price: '' });
    setModalOpen(true);
  };

  const openEdit = (st: Showtime) => {
    setEditing(st);
    // movie and hall can be populated objects
    const movieId = typeof st.movie === 'string' ? st.movie : (st.movie as Movie)?._id;
    const hallId = typeof st.hall === 'string' ? st.hall : (st.hall as Hall)?._id;
    const dt = new Date(st.startAt);
    // usar representación en zona local adecuada para inputs (YYYY-MM-DD, HH:MM)
    const isoDate = dt.toLocaleDateString('en-CA'); // -> 2025-12-25
    const isoTime = dt.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }); // -> 14:30
    setForm({ movie: movieId || '', hall: hallId || '', date: isoDate, time: isoTime, price: String(st.price || '') });
    setModalOpen(true);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);
    try {
      if (!form.movie || !form.hall || !form.date || !form.time) return setError('Todos los campos son requeridos');
      const startAt = new Date(`${form.date}T${form.time}:00`).toISOString();
      const body = { movie: form.movie, hall: form.hall, startAt, price: form.price ? Number(form.price) : 0 };
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      let res;
      if (editing) {
        res = await fetch(`${API_BASE}/api/showtimes/${editing._id}`, { method: 'PATCH', headers, body: JSON.stringify(body) });
      } else {
        res = await fetch(`${API_BASE}/api/showtimes`, { method: 'POST', headers, body: JSON.stringify(body) });
      }

      const data = await res.json();
      if (!res.ok) {
        setError(data?.message || 'Error del servidor');
        return;
      }

      setModalOpen(false);
      await loadShowtimes();
    } catch (err: unknown) {
      setError((err as Error)?.message || 'Error inesperado');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Desactivar esta función?')) return;
    setError(null);
    try {
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(`${API_BASE}/api/showtimes/${id}`, { method: 'DELETE', headers });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data?.message || 'No se pudo eliminar');
      }
      await loadShowtimes();
    } catch (err: unknown) {
      setError((err as Error)?.message || 'Error eliminando');
    }
  };

  const formatPrice = (p?: number | null) => {
    if (p === null || p === undefined || Number.isNaN(Number(p))) return '-';
    // Mostrar como: Q. 45.00
    return `Q. ${Number(p).toFixed(2)}`;
  };

  return (
    <div className="py-8">
      <div className="flex items-center justify-between mb-6 p-4 rounded-lg" style={boxStyle}>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>Gestión de Horarios</h1>
        <button onClick={openCreate} className="px-4 py-2 rounded-lg" style={{ background: 'var(--color-primary)', color: '#fff' }}>+ Agregar Función</button>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded" style={{ background: 'rgba(255,50,50,0.08)', color: 'var(--foreground)' }}>{error}</div>
      )}

      <div className="rounded-lg overflow-x-auto" style={boxStyle}>
        <table className="w-full text-left table-auto">
          <thead className="text-gray-400 text-sm">
            <tr>
              <th className="px-4 py-3">Película</th>
              <th className="px-4 py-3">Fecha</th>
              <th className="px-4 py-3">Hora</th>
              <th className="px-4 py-3">Sala</th>
              <th className="px-4 py-3">Precio</th>
              <th className="px-4 py-3">Acciones</th>
            </tr>
          </thead>
          <tbody style={{ color: 'rgba(255,255,255,0.9)' }}>
              {loading && (
              <tr><td colSpan={6} className="px-4 py-6 text-center">Cargando...</td></tr>
            )}
            {!loading && showtimes.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-6 text-center">No hay funciones definidas</td></tr>
            )}
            {!loading && showtimes.map((st) => {
              const movie = typeof st.movie === 'string' ? null : (st.movie as Movie);
              const hall = typeof st.hall === 'string' ? null : (st.hall as Hall);
              const dt = new Date(st.startAt);
              // Mostrar fecha/hora en zona local (evitar confusión con toISOString que usa UTC)
              const dateStr = dt.toLocaleDateString('en-CA');
              const timeStr = dt.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
              return (
                <tr key={st._id} className="border-t border-gray-800">
                  <td className="px-4 py-3">{movie?.title || '—'}</td>
                  <td className="px-4 py-3">{dateStr}</td>
                  <td className="px-4 py-3">{timeStr}</td>
                  <td className="px-4 py-3">{hall?.name || '—'}</td>
                  <td className="px-4 py-3">{formatPrice(st.price)}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => openEdit(st)} className="mr-3 text-sm" style={{ color: 'var(--color-link)' }}>Editar</button>
                    <button onClick={() => handleDelete(st._id)} className="text-sm" style={{ color: '#ff6b6b' }}>Eliminar</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modal simple */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.6)' }} onClick={() => setModalOpen(false)} />
          <form onSubmit={handleSubmit} className="relative z-10 w-full max-w-lg p-6 rounded" style={{ background: 'var(--background)', color: 'var(--foreground)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <h2 className="text-xl font-semibold mb-4">{editing ? 'Editar Función' : 'Agregar Función'}</h2>

            <label className="block mb-2">
              <div className="text-sm mb-1">Película</div>
              <select value={form.movie} onChange={e => setForm({ ...form, movie: e.target.value })} className="w-full p-2 rounded" style={{ background: 'var(--background)', color: 'var(--foreground)', border: '1px solid rgba(255,255,255,0.04)' }}>
                <option value="" style={{ color: 'rgba(255,255,255,0.45)', background: 'var(--background)' }}>- Selecciona -</option>
                {movies.map(m => (<option key={m._id} value={m._id} style={{ background: 'var(--background)', color: 'var(--foreground)' }}>{m.title}</option>))}
              </select>
            </label>

            <label className="block mb-2">
              <div className="text-sm mb-1">Sala</div>
              <select value={form.hall} onChange={e => setForm({ ...form, hall: e.target.value })} className="w-full p-2 rounded" style={{ background: 'var(--background)', color: 'var(--foreground)', border: '1px solid rgba(255,255,255,0.04)' }}>
                <option value="" style={{ color: 'rgba(255,255,255,0.45)', background: 'var(--background)' }}>- Selecciona -</option>
                {halls.map(h => (<option key={h._id} value={h._id} style={{ background: 'var(--background)', color: 'var(--foreground)' }}>{h.name || h._id}</option>))}
              </select>
            </label>

            <div className="flex gap-2">
              <label className="flex-1">
                <div className="text-sm mb-1">Fecha</div>
                <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className="w-full p-2 rounded" style={{ background: 'rgba(255,255,255,0.02)', color: 'var(--foreground)' }} />
              </label>
              <label className="flex-1">
                <div className="text-sm mb-1">Hora</div>
                <input type="time" value={form.time} onChange={e => setForm({ ...form, time: e.target.value })} className="w-full p-2 rounded" style={{ background: 'rgba(255,255,255,0.02)', color: 'var(--foreground)' }} />
              </label>
            </div>

            <label className="block mt-3">
              <div className="text-sm mb-1">Precio</div>
              <input type="number" min={0} value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} className="w-40 p-2 rounded" style={{ background: 'rgba(255,255,255,0.02)', color: 'var(--foreground)' }} />
            </label>

            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 rounded" style={{ background: 'transparent', color: 'var(--foreground)', border: '1px solid rgba(255,255,255,0.06)' }}>Cancelar</button>
              <button type="submit" className="px-4 py-2 rounded" style={{ background: 'var(--color-primary)', color: '#fff' }}>{editing ? 'Guardar' : 'Crear'}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
