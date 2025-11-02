"use client";
import React, { useEffect, useState, useCallback } from "react";
import DarkSelect from '@/components/DarkSelect';
import { io, Socket } from 'socket.io-client';
import ConfirmModal from '@/components/ConfirmModal';
import { API_BASE} from "../../../lib/config";
import { useSearchParams } from 'next/navigation';

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
  premiumPrice?: number;
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
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const [form, setForm] = useState({ movie: "", hall: "", date: "", time: "", price: "", premiumPrice: "" });

  const boxStyle: React.CSSProperties = { background: 'rgba(6,18,30,0.7)', border: '1px solid rgba(255,255,255,0.04)' };

  const token = typeof window !== 'undefined' ? localStorage.getItem('app_token') : null;
  const searchParams = useSearchParams();

  // Socket para actualizaciones en tiempo real
  useEffect(() => {
    // conectar sólo en cliente
    if (typeof window === 'undefined') return;
    const socket: Socket = io(API_BASE, { transports: ['websocket', 'polling'] });

    socket.on('connect', () => {
      // console.log('Socket conectado (horarios):', socket.id);
    });

    socket.on('showtimeCreated', (st: Showtime) => {
      setShowtimes(prev => {
        // evitar duplicados
        if (!st || !st._id) return prev;
        if (prev.some(x => x._id === st._id)) return prev;
        return [...prev, st].sort((a,b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
      });
    });

    socket.on('showtimeUpdated', (st: Showtime) => {
      setShowtimes(prev => prev.map(x => x._id === st._id ? st : x));
    });

    socket.on('showtimeRemoved', (payload: { id?: string; _id?: string }) => {
      const id = payload && (payload.id || payload._id) ? (payload.id || payload._id) : null;
      if (!id) return;
      setShowtimes(prev => prev.filter(x => x._id !== id));
    });

    return () => {
      socket.disconnect();
    };
  }, []);

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
    // Si se pasó ?hall=ID, prefijar el selector de sala
    try {
      const preHall = searchParams ? searchParams.get('hall') : null;
      if (preHall) setForm(prev => ({ ...prev, hall: preHall }));
    } catch {
      // ignore
    }
  }, [loadAll, searchParams]);

  

  const loadShowtimes = async () => {
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${API_BASE}/api/showtimes`, { headers });
    if (!res.ok) throw new Error('No se pudo obtener showtimes');
    const data = await res.json();
    setShowtimes(data || []);
  };

  const loadMovies = async () => {
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${API_BASE}/api/movies`, { headers });
    if (!res.ok) return setMovies([]);
    const data = await res.json();
    setMovies(data || []);
  };

  const loadHalls = async () => {
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${API_BASE}/api/halls`, {headers});
    if (!res.ok) return setHalls([]);
    const data = await res.json();
    setHalls(data || []);
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ movie: '', hall: '', date: '', time: '', price: '', premiumPrice: '' });
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
    setForm({ movie: movieId || '', hall: hallId || '', date: isoDate, time: isoTime, price: String(st.price || ''), premiumPrice: String(st.premiumPrice || '') });
    setModalOpen(true);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);
    try {
      if (!form.movie || !form.hall || !form.date || !form.time) return setError('Todos los campos son requeridos');

      // Validación local de solapamiento: no permitir crear/editar una función que solape con otra en la misma sala
      const DEFAULT_DURATION_MIN = 120;
      const movieDoc = movies.find(m => m._id === form.movie);
      const durationMin = movieDoc && typeof movieDoc.duration === 'number' && movieDoc.duration > 0 ? movieDoc.duration : DEFAULT_DURATION_MIN;
      const startAtDate = new Date(`${form.date}T${form.time}:00`);
      if (isNaN(startAtDate.getTime())) return setError('Fecha u hora inválida');
      const startAt = startAtDate.toISOString();
      const endAtDate = new Date(startAtDate.getTime() + durationMin * 60000);

      // comprobar showtimes existentes en el mismo hall
      const others = showtimes.filter(st => {
        const stHall = typeof st.hall === 'string' ? st.hall : st.hall?._id;
        if (!stHall) return false;
        if (stHall !== form.hall) return false;
        if (!st.isActive) return false;
        // si estamos editando, ignorar el propio registro
        if (editing && editing._id && st._id === editing._id) return false;
        return true;
      });

      const overlapsFn = (aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) => aStart < bEnd && bStart < aEnd;
      let overlappingCount = 0;
      for (const st of others) {
        const sStart = new Date(st.startAt);
        // calcular sEnd: si existe endAt usarlo, sino intentar derivar desde movie.duration
        let sEnd: Date | null = null;
        if (st.endAt) sEnd = new Date(st.endAt);
        else {
          const stMovie = typeof st.movie === 'string' ? movies.find(m => m._id === st.movie) : st.movie;
          const stDur = stMovie && typeof stMovie.duration === 'number' && stMovie.duration > 0 ? stDur : DEFAULT_DURATION_MIN;
          sEnd = new Date(sStart.getTime() + stDur * 60000);
        }
        if (overlapsFn(startAtDate, endAtDate, sStart, sEnd)) {
          overlappingCount++;
          // permitir hasta 2 solapamientos por sala; si ya hay 2, bloquear
          if (overlappingCount >= 2) {
            return setError('Ya existen 2 funciones en ese horario en la misma sala; no se permite más.');
          }
        }
      }

      // 💥 CONFLICTO RESUELTO: Aceptamos premiumPrice del hotfix
      const body = { movie: form.movie, hall: form.hall, startAt, price: form.price ? Number(form.price) : 0, premiumPrice: form.premiumPrice ? Number(form.premiumPrice) : 0 };
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
    // abrir confirmación personalizada
    setDeleteTargetId(id);
    setDeleteConfirmOpen(true);
  };

  const performDelete = async () => {
    if (!deleteTargetId) return;
    setError(null);
    try {
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(`${API_BASE}/api/showtimes/${deleteTargetId}`, { method: 'DELETE', headers });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data?.message || 'No se pudo eliminar');
      }
      setDeleteConfirmOpen(false);
      setDeleteTargetId(null);
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
        <button onClick={openCreate} className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors font-semibold shadow-lg">+ Agregar Función</button>
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
              <th className="px-4 py-3">Precio Premium</th>
              <th className="px-4 py-3">Acciones</th>
            </tr>
          </thead>
          <tbody style={{ color: 'rgba(255,255,255,0.9)' }}>
              {loading && (
              <tr><td colSpan={7} className="px-4 py-6 text-center">Cargando...</td></tr>
              )}
              {!loading && showtimes.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-6 text-center">No hay funciones definidas</td></tr>
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
                    <td className="px-4 py-3">{formatPrice(typeof st.premiumPrice === 'number' ? st.premiumPrice : 0)}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => openEdit(st)} className="mr-3 text-sm px-2 py-1 rounded btn-primary">Editar</button>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <form onSubmit={handleSubmit} className="w-full max-w-lg p-6 rounded-lg bg-black text-white border border-gray-700">
            <h2 className="text-xl font-semibold mb-4">{editing ? 'Editar Función' : 'Agregar Función'}</h2>

            <label className="block mb-2">
              <div className="text-sm mb-1 text-gray-400">Película</div>
              <DarkSelect value={form.movie} onChange={(v) => setForm({ ...form, movie: v })} options={[{ value: '', label: '- Selecciona -' }, ...movies.map(m => ({ value: m._id, label: m.title }))]} />
            </label>

            <label className="block mb-2">
              <div className="text-sm mb-1 text-gray-400">Sala</div>
              <DarkSelect value={form.hall} onChange={(v) => setForm({ ...form, hall: v })} options={[{ value: '', label: '- Selecciona -' }, ...halls.map(h => ({ value: h._id, label: h.name || h._id }))]} />
            </label>

            <div className="flex gap-4">
              <label className="flex-1">
                <div className="text-sm mb-1 text-gray-400">Fecha</div>
                <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className="w-full p-2 rounded bg-gray-800 text-white border border-gray-600" />
              </label>
              <label className="flex-1">
                <div className="text-sm mb-1 text-gray-400">Hora</div>
                <input type="time" value={form.time} onChange={e => setForm({ ...form, time: e.target.value })} className="w-full p-2 rounded bg-gray-800 text-white border border-gray-600" />
              </label>
            </div>

            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="block">
                <div className="text-sm mb-1 text-gray-400">Precio</div>
                <input type="number" min={0} step="0.01" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} className="w-full p-2 rounded bg-gray-800 text-white border border-gray-600" />
              </label>
              <label className="block">
                <div className="text-sm mb-1 text-gray-400">Precio Premium</div>
                <input type="number" min={0} step="0.01" value={form.premiumPrice} onChange={e => setForm({ ...form, premiumPrice: e.target.value })} className="w-full p-2 rounded bg-gray-800 text-white border border-gray-600" />
              </label>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 rounded bg-gray-700 hover:bg-gray-600">Cancelar</button>
              <button type="submit" className="px-4 py-2 rounded bg-red-600 hover:bg-red-700 text-white">{editing ? 'Guardar' : 'Crear'}</button>
            </div>
          </form>
        </div>
      )}

  {/* Confirm modal for deleting a single showtime */}
  <ConfirmModal open={deleteConfirmOpen} small={true} title="Eliminar función" message="¿Desactivar esta función?" onCancel={() => { setDeleteConfirmOpen(false); setDeleteTargetId(null); }} onConfirm={performDelete} confirmLabel="Eliminar" cancelLabel="Cancelar" />
    </div>
  );
}
