"use client";
import React, { useEffect, useState } from "react";
import DarkSelect from '@/components/DarkSelect';
import ConfirmModal from '@/components/ConfirmModal';
import { API_BASE } from "@/lib/config";
import { jwtDecode } from "jwt-decode";

type TokenPayload = {
  userId: string;
  username: string;
  role: string;
};

type Hall = {
  _id: string;
  name: string;
  capacity: number;
  isActive: boolean;
  isFixed?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

type HallGroup = {
  movie: { _id?: string; title?: string; posterUrl?: string } | null;
  halls: Hall[];
};

type Movie = { _id: string; title?: string };
type ShowtimeShort = { _id: string; movie?: { _id?: string; title?: string } | string; hall?: { _id?: string; name?: string } | string; startAt: string; time?: string; date?: string; availableSeats?: number };

export default function AdminSalasPage() {
  const [userRole, setUserRole] = useState<string | null>(null);
    useEffect(() => {
      const token = localStorage.getItem("app_token");
      if (token) {
        try {
         const decoded: TokenPayload = jwtDecode(token);
          setUserRole(decoded.role);
        } catch (e) {
          console.error("Error decodificando token:", e);
        }
      }
    }, []);
  const [halls, setHalls] = useState<Hall[]>([]);
  const [groups, setGroups] = useState<HallGroup[] | null>(null);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [showtimes, setShowtimes] = useState<ShowtimeShort[]>([]);
  const [toast, setToast] = useState<{ open: boolean; message: string; hallId?: string; showGoto?: boolean }>({ open: false, message: '', hallId: undefined, showGoto: false });
  const [originalMovieId, setOriginalMovieId] = useState<string | undefined>(undefined);
  // auto-close toast
  useEffect(() => {
    if (!toast.open) return;
    const t = setTimeout(() => setToast({ open: false, message: '', hallId: undefined, showGoto: false }), 4000);
    return () => clearTimeout(t);
  }, [toast.open]);
  // showtimes are managed in the dedicated Horarios page; no local schedule creation here
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);
  // permitir movie null en el estado para representar explícitamente "sin película"
  const [newHall, setNewHall] = useState<Partial<Hall & { movie?: string | null }>>({ name: '', capacity: 0, isActive: true, movie: undefined });
  const [editingHall, setEditingHall] = useState<Partial<Hall & { movie?: string | null }> | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmHallId, setConfirmHallId] = useState<string | null>(null);
  // Función para obtener salas (agrupadas si se solicita)
  const fetchHalls = async () => {
    // Retry logic with exponential backoff for handling HTTP 429 (rate limit)
    const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
    const maxRetries = 4;
    let attempt = 0;
    setLoading(true);
    setError('');
    while (attempt <= maxRetries) {
      try {
        // Obtener listado plano de salas (mostraremos las 6 disponibles)
        const token = typeof window !== 'undefined' ? localStorage.getItem('app_token') : null;
        const res = await fetch(`${API_BASE}/api/halls`, { credentials: 'include', headers: token ? { Authorization: `Bearer ${token}` } : undefined });
        if (res.ok) {
          const data = await res.json();
          setGroups(null);
          setHalls((data as Hall[]) || []);
          setLoading(false);
          return;
        }

        // Handle 429 specially: respect Retry-After header if present, otherwise exponential backoff
        if (res.status === 429) {
          attempt += 1;
          const ra = res.headers.get('Retry-After');
          const waitMs = ra ? Math.max(1000, Number(ra) * 1000) : Math.min(30000, 500 * Math.pow(2, attempt));
          console.warn(`Rate limited when fetching halls (attempt ${attempt}/${maxRetries}), retrying in ${waitMs}ms`);
          setError('Demasiadas solicitudes. Reintentando automáticamente...');
          await sleep(waitMs + Math.floor(Math.random() * 200));
          continue;
        }

        // For other HTTP errors, throw to be handled below
        const text = await res.text().catch(() => `HTTP ${res.status}`);
        throw new Error(text || `HTTP ${res.status}`);
      } catch (err: unknown) {
        // If we've exhausted retries, show an user-friendly message
        attempt += 1;
        console.error('Error fetching halls (attempt)', attempt, err);
        if (attempt > maxRetries) {
          setError((err as Error)?.message || 'No se pudo cargar las salas. Intenta más tarde.');
          setLoading(false);
          return;
        }
        // small backoff before next attempt
        await sleep(300 * attempt + Math.floor(Math.random() * 200));
      }
    }
  };

  const fetchShowtimes = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/showtimes`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setShowtimes((data as ShowtimeShort[]) || []);
    } catch (err) {
      console.warn('No se pudieron cargar los horarios:', err);
    }
  };

  const fetchMovies = async () => {
    try {
  const token = typeof window !== 'undefined' ? localStorage.getItem('app_token') : null;
  const res = await fetch(`${API_BASE}/api/movies?admin=1`, { credentials: 'include', headers: token ? { Authorization: `Bearer ${token}` } : undefined });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setMovies(data || []);
    } catch (err) {
      console.warn('No se pudieron cargar las películas para el selector:', err);
    }
  };


  useEffect(() => {
  fetchHalls();
  fetchMovies();
  fetchShowtimes();
  }, []);

  const cardStyle: React.CSSProperties = { background: 'rgba(6,18,30,0.7)', border: '1px solid rgba(255,255,255,0.04)' };
  const groupStyle: React.CSSProperties = { background: 'rgba(6,18,30,0.55)', border: '1px solid rgba(255,255,255,0.04)', padding: '1rem', borderRadius: 10 };

  return (
    <div className="py-8">
      {loading && <p style={{ color: 'var(--foreground)' }}>Cargando salas...</p>}
      {error && <p className="text-red-400">{error}</p>}

        <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>Salas</h1>
        {/* Creación deshabilitada: las salas son fijas y gestionadas por el sistema */}
        </div>

      <div className="space-y-6">
        <h2 className="text-lg font-semibold mb-3" style={{ color: 'var(--foreground)' }}>Salas disponibles ({halls.length})</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {halls.map(h => {
            const hallShowtimes = showtimes.filter(st => {
              const stHallId = typeof st.hall === 'string' ? st.hall : (st.hall && (st.hall as any)._id ? (st.hall as any)._id : null);
              return stHallId === h._id;
            }).sort((a,b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
            return (
              <div key={h._id} className="p-4 rounded-lg" style={cardStyle}>
                <h3 className="font-semibold" style={{ color: 'var(--foreground)' }}>{h.name}</h3>
                <p style={{ color: 'rgba(255,255,255,0.85)' }}>{h.capacity} asientos {h.isFixed ? <span style={{ color: '#ffd700', marginLeft: 8 }}>(Fija)</span> : null}</p>
                <p style={{ color: h.isActive ? 'var(--color-link)' : 'gray' }}>{h.isActive ? 'Activa' : 'Inactiva'}</p>
                <div className="mt-3">
                  <div className="text-sm text-gray-300 mb-2">Horarios</div>
                  {hallShowtimes.length === 0 && <div className="text-sm text-gray-400">No hay funciones para esta sala</div>}
                  {hallShowtimes.map(st => {
                    const movieTitle = typeof st.movie === 'string' ? '—' : (st.movie && (st.movie as any).title) || '—';
                    const dt = new Date(st.startAt);
                    const dateStr = dt.toLocaleDateString('en-CA');
                    const timeStr = dt.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
                    return (
                      <div key={st._id} className="p-2 mt-1 rounded" style={{ background: 'rgba(11,18,32,0.6)', border: '1px solid rgba(249,115,22,0.08)', boxShadow: 'inset 0 0 8px rgba(0,0,0,0.4)' }}>
                        <div className="flex items-center justify-between">
                          <div className="text-sm" style={{ color: 'var(--foreground)' }}>{movieTitle} — {dateStr} {timeStr}</div>
                          <div className="text-sm text-gray-300">Disponibles: <span style={{ color: 'var(--color-link)', fontWeight: 600 }}>{typeof st.availableSeats === 'number' ? st.availableSeats : '—'}</span></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-3 flex gap-2">
                  <button onClick={() => {
                    setEditingHall({ ...h, movie: (h as any).movie || undefined, isFixed: !!h.isFixed });
                    setOriginalMovieId((h as any).movie ? String((h as any).movie) : undefined);
                  }} className="px-2 py-1 rounded btn-primary">Editar</button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal Crear */}
      {creating && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="w-full max-w-lg bg-gray-900 rounded-lg p-6">
            <h3 className="text-lg font-bold mb-4">Crear Sala</h3>
            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col">
                <span className="text-sm text-gray-300">Nombre</span>
                <input value={newHall.name || ''} onChange={e => setNewHall({ ...newHall, name: e.target.value })} className="mt-1 p-2 bg-gray-800 text-white rounded" />
              </label>
              <label className="flex flex-col">
                <span className="text-sm text-gray-300">Capacidad</span>
                <input type="number" value={newHall.capacity ?? ''} onChange={e => setNewHall({ ...newHall, capacity: Number(e.target.value) })} className="mt-1 p-2 bg-gray-800 text-white rounded" />
              </label>
                <label className="flex flex-col col-span-2">
                <span className="text-sm text-gray-300">Asignar a película (opcional)</span>
                <DarkSelect value={newHall.movie ?? ''} onChange={(v) => setNewHall({ ...newHall, movie: v || null })} options={[{ value: '', label: 'Ninguna Pelicula Asignada' }, ...movies.map(m => ({ value: m._id, label: m.title || m._id }))]} />
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={!!newHall.isActive} onChange={e => setNewHall({ ...newHall, isActive: e.target.checked })} />
                <span className="text-sm text-gray-300">Activa</span>
              </label>
            </div>
            <div className="flex justify-end gap-3 mt-4">
              <button onClick={() => setCreating(false)} className="px-3 py-1 bg-gray-700 text-white rounded">Cancelar</button>
              <button onClick={async () => { try { const payload = { name: newHall.name, capacity: newHall.capacity, isActive: newHall.isActive, movie: newHall.movie }; const token = typeof window !== 'undefined' ? localStorage.getItem('app_token') : null; const headers: Record<string,string> = { 'Content-Type': 'application/json' }; if (token) headers.Authorization = `Bearer ${token}`; const res = await fetch(`${API_BASE}/api/halls`, { method: 'POST', credentials: 'include', headers, body: JSON.stringify(payload) }); if (!res.ok) throw new Error(`HTTP ${res.status}`); setCreating(false); await fetchHalls(); } catch (err) { console.error(err); alert('Error creando sala'); } }} className="px-3 py-1 bg-green-600 text-white rounded">Crear</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Editar */}
      {editingHall && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="w-full max-w-lg bg-gray-900 rounded-lg p-6">
            <h3 className="text-lg font-bold mb-4">Editar Sala</h3>
              <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col col-span-2">
                <span className="text-sm text-gray-300">Nombre</span>
                <input value={editingHall.name || ''} onChange={e => setEditingHall({ ...editingHall, name: e.target.value })} className="mt-1 p-2 bg-gray-800 text-white rounded" disabled={!!editingHall.isFixed && false} />
              </label>

              <label className="flex flex-col">
                <span className="text-sm text-gray-300">Capacidad</span>
                <input type="number" value={editingHall.capacity ?? ''} onChange={e => setEditingHall({ ...editingHall, capacity: Number(e.target.value) })} className="mt-1 p-2 bg-gray-800 text-white rounded" />
              </label>

              {/* Se quitaron el selector de película y el toggle de activa aquí. */}

              {/* Horarios asociados: opción para liberar */}
              <div className="col-span-2">
                <div className="text-sm text-gray-300 mb-1">Horarios asociados</div>
                <div className="text-sm text-gray-400 mb-2">Puedes liberar (desactivar) todos los horarios asociados a esta sala si es necesario.</div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => { setConfirmHallId(editingHall && editingHall._id ? String(editingHall._id) : null); setConfirmOpen(true); }} className="px-3 py-1 rounded" style={{ background: 'var(--color-link)', color: '#0b1220' }}>Liberar horarios</button>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-4">
              <button onClick={() => setEditingHall(null)} className="px-3 py-1 bg-gray-700 text-white rounded">Cancelar</button>
              <button onClick={async () => {
                try {
                  if (!editingHall || !editingHall._id) throw new Error('Missing id');
                  const payload: any = {};
                  if (typeof editingHall.name === 'string') payload.name = editingHall.name;
                  if (typeof editingHall.capacity === 'number') payload.capacity = editingHall.capacity;

                  const token = typeof window !== 'undefined' ? localStorage.getItem('app_token') : null;
                  const headers: Record<string,string> = { 'Content-Type': 'application/json' };
                  if (token) headers.Authorization = `Bearer ${token}`;
                  const res = await fetch(`${API_BASE}/api/halls/${editingHall._id}`, { method: 'PUT', credentials: 'include', headers, body: JSON.stringify(payload) });
                  if (!res.ok) throw new Error(`HTTP ${res.status}`);

                  // Refrescar datos
                  await fetchHalls();

                  setEditingHall(null);
                  setToast({ open: true, message: 'Sala actualizada', hallId: undefined, showGoto: false });
                  // limpiar originalMovieId para próxima edición
                  setOriginalMovieId(undefined);
                } catch (err) {
                  console.error(err);
                  alert('Error actualizando sala (revisa consola)');
                }
              }} className="px-3 py-1 bg-green-600 text-white rounded">Guardar</button>
            </div>
          </div>
        </div>
      )}
      {/* Confirmación para liberar horarios */}
      <ConfirmModal open={confirmOpen} small={true} title="Liberar horarios" message="¿Desactivar todos los horarios asociados a esta sala? Esto no se puede deshacer fácilmente." onCancel={() => { setConfirmOpen(false); setConfirmHallId(null); }} onConfirm={async () => {
        try {
          if (!confirmHallId) return;
          const token = typeof window !== 'undefined' ? localStorage.getItem('app_token') : null;
          const headers: Record<string,string> = {};
          if (token) headers.Authorization = `Bearer ${token}`;
          const hallId = String(confirmHallId);
          const associated = showtimes.filter(st => {
            const stHallId = typeof st.hall === 'string' ? st.hall : (st.hall && (st.hall as any)._id ? (st.hall as any)._id : null);
            return stHallId === hallId;
          });
          for (const st of associated) {
            try { await fetch(`${API_BASE}/api/showtimes/${st._id}`, { method: 'DELETE', headers }); } catch (e) { console.warn('Error desactivando showtime', st._id, e); }
          }
          await fetchShowtimes();
          await fetchHalls();
          setConfirmOpen(false);
          setConfirmHallId(null);
          alert('Horarios desactivados');
        } catch (err) {
          console.error(err);
          alert('Error liberando horarios');
        }
      }} confirmLabel="Liberar" cancelLabel="Cancelar" />
      {/* Toast / sugerencia */}
      {toast.open && (
        <div className="fixed top-6 right-6 z-50">
          <div className="max-w-sm w-full rounded-lg shadow-lg px-4 py-3 bg-gray-800 border border-gray-700 text-white flex items-center justify-between gap-4">
            <div className="text-sm font-medium">{toast.message}</div>
            <div className="flex items-center gap-2">
              {toast.showGoto && toast.hallId && (
                <button onClick={() => {
                  // navegar a Horarios con hall preseleccionada
                  try {
                    const url = `/admin/horarios?hall=${toast.hallId}`;
                    // usar location porque este componente está client-side
                    window.location.href = url;
                  } catch (e) { console.error(e); }
                }} className="px-3 py-1 bg-orange-500 text-white rounded">Ir a Horarios</button>
              )}
              <button onClick={() => setToast({ open: false, message: '', hallId: undefined, showGoto: false })} className="px-2 py-1 bg-gray-700 text-white rounded">Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
