"use client";
import React, { useEffect, useState } from "react";
import { API_BASE } from "@/lib/config";

type Hall = {
  _id: string;
  name: string;
  capacity: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
};

type HallGroup = {
  movie: { _id?: string; title?: string; posterUrl?: string } | null;
  halls: Hall[];
};

type Movie = { _id: string; title?: string };

export default function AdminSalasPage() {
  const [halls, setHalls] = useState<Hall[]>([]);
  const [groups, setGroups] = useState<HallGroup[] | null>(null);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);
  const [newHall, setNewHall] = useState<Partial<Hall & { movie?: string }>>({ name: '', capacity: 0, isActive: true, movie: undefined });
  const [editingHall, setEditingHall] = useState<Partial<Hall & { movie?: string }> | null>(null);
  // Función para obtener salas (agrupadas si se solicita)
  const fetchHalls = async () => {
    try {
      setLoading(true);
      // Pedimos agrupacion por pelicula
      const res = await fetch(`${API_BASE}/api/halls?groupByMovie=1`, { credentials: 'include' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data && data.groups) {
        setGroups(data.groups || []);
        // También mantener listado plano por compatibilidad
        const flat = data.groups.flatMap((g: any) => g.halls || []);
        setHalls(flat || []);
      } else {
        setHalls(data || []);
      }
    } catch (err: any) {
      console.error('Error fetching halls:', err);
      setError('No se pudo cargar las salas');
    } finally {
      setLoading(false);
    }
  };

  const fetchMovies = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/movies?admin=1`, { credentials: 'include' });
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
  }, []);

  const cardStyle: React.CSSProperties = { background: 'rgba(6,18,30,0.7)', border: '1px solid rgba(255,255,255,0.04)' };
  const groupStyle: React.CSSProperties = { background: 'rgba(6,18,30,0.55)', border: '1px solid rgba(255,255,255,0.04)', padding: '1rem', borderRadius: 10 };

  return (
    <div className="py-8">
      {loading && <p style={{ color: 'var(--foreground)' }}>Cargando salas...</p>}
      {error && <p className="text-red-400">{error}</p>}

      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>Salas</h1>
        <button onClick={() => { setNewHall({ name: '', capacity: 0, isActive: true, movie: undefined }); setCreating(true); }} className="px-3 py-1 bg-green-600 text-white rounded">+ Nueva Sala</button>
      </div>

      {groups ? (
        <div className="space-y-6">
          {groups.map((g, i) => (
            <section key={i} style={groupStyle}>
              <div className="flex items-start gap-4 mb-4">
                {g.movie ? (
                  g.movie.posterUrl ? (
                    <img src={g.movie.posterUrl} alt={g.movie.title || 'Poster'} style={{ width: 80, height: 120, objectFit: 'cover', borderRadius: 6, boxShadow: '0 2px 8px rgba(0,0,0,0.5)' }} />
                  ) : (
                    <div style={{ width: 80, height: 120, background: 'rgba(255,255,255,0.03)', borderRadius: 6 }} />
                  )
                ) : (
                  <div style={{ width: 80, height: 120, background: 'transparent' }} />
                )}

                <div>
                  <h2 className="text-xl font-semibold" style={{ color: 'var(--foreground)' }}>{g.movie ? g.movie.title : 'Sin asignar'}</h2>
                  <p className="text-sm text-gray-400 mt-1">{g.halls.length} {g.halls.length === 1 ? 'sala' : 'salas'}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {g.halls.map(h => (
                  <div key={h._id} className="p-4 rounded-lg" style={cardStyle}>
                    <h3 className="font-semibold" style={{ color: 'var(--foreground)' }}>{h.name}{g.movie ? ` - ${g.movie.title}` : ''}</h3>
                    <p style={{ color: 'rgba(255,255,255,0.85)' }}>{h.capacity} asientos</p>
                    <p style={{ color: h.isActive ? 'var(--color-link)' : 'gray' }}>{h.isActive ? 'Activa' : 'Inactiva'}</p>
                    <div className="mt-3 flex gap-2">
                      <button onClick={() => setEditingHall({ ...h, movie: (g.movie && (g.movie._id as any)) || undefined })} className="px-2 py-1 bg-blue-600 text-white rounded">Editar</button>
                      <button onClick={async () => { if (!confirm('¿Eliminar sala?')) return; try { const res = await fetch(`${API_BASE}/api/halls/${h._id}`, { method: 'DELETE', credentials: 'include' }); if (res.status !== 204 && !res.ok) throw new Error(`HTTP ${res.status}`); await fetchHalls(); } catch (err) { console.error(err); alert('Error eliminando sala'); } }} className="px-2 py-1 bg-red-600 text-white rounded">Eliminar</button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {halls.map(h => (
            <div key={h._id} className="p-4 rounded-lg" style={cardStyle}>
              <h3 className="font-semibold" style={{ color: 'var(--foreground)' }}>{h.name}</h3>
              <p style={{ color: 'rgba(255,255,255,0.85)' }}>{h.capacity} asientos</p>
              <p style={{ color: h.isActive ? 'var(--color-link)' : 'gray' }}>{h.isActive ? 'Activa' : 'Inactiva'}</p>
            </div>
          ))}
        </div>
      )}

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
                <input type="number" value={newHall.capacity as any} onChange={e => setNewHall({ ...newHall, capacity: Number(e.target.value) })} className="mt-1 p-2 bg-gray-800 text-white rounded" />
              </label>
              <label className="flex flex-col col-span-2">
                <span className="text-sm text-gray-300">Asignar a película (opcional)</span>
                <select value={newHall.movie as any || ''} onChange={e => setNewHall({ ...newHall, movie: e.target.value || undefined })} className="mt-1 p-2 bg-gray-800 text-white rounded">
                  <option value="">-- Ninguna --</option>
                  {movies.map(m => <option key={m._id} value={m._id}>{m.title || m._id}</option>)}
                </select>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={!!newHall.isActive} onChange={e => setNewHall({ ...newHall, isActive: e.target.checked })} />
                <span className="text-sm text-gray-300">Activa</span>
              </label>
            </div>
            <div className="flex justify-end gap-3 mt-4">
              <button onClick={() => setCreating(false)} className="px-3 py-1 bg-gray-700 text-white rounded">Cancelar</button>
              <button onClick={async () => { try { const payload = { name: newHall.name, capacity: newHall.capacity, isActive: newHall.isActive, movie: newHall.movie }; const res = await fetch(`${API_BASE}/api/halls`, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }); if (!res.ok) throw new Error(`HTTP ${res.status}`); setCreating(false); await fetchHalls(); } catch (err) { console.error(err); alert('Error creando sala'); } }} className="px-3 py-1 bg-green-600 text-white rounded">Crear</button>
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
              <label className="flex flex-col">
                <span className="text-sm text-gray-300">Nombre</span>
                <input value={editingHall.name || ''} onChange={e => setEditingHall({ ...editingHall, name: e.target.value })} className="mt-1 p-2 bg-gray-800 text-white rounded" />
              </label>
              <label className="flex flex-col">
                <span className="text-sm text-gray-300">Capacidad</span>
                <input type="number" value={editingHall.capacity as any} onChange={e => setEditingHall({ ...editingHall, capacity: Number(e.target.value) })} className="mt-1 p-2 bg-gray-800 text-white rounded" />
              </label>
              <label className="flex flex-col col-span-2">
                <span className="text-sm text-gray-300">Asignar a película (opcional)</span>
                <select value={editingHall.movie as any || ''} onChange={e => setEditingHall({ ...editingHall, movie: e.target.value || undefined })} className="mt-1 p-2 bg-gray-800 text-white rounded">
                  <option value="">-- Ninguna --</option>
                  {movies.map(m => <option key={m._id} value={m._id}>{m.title || m._id}</option>)}
                </select>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={!!editingHall.isActive} onChange={e => setEditingHall({ ...editingHall, isActive: e.target.checked })} />
                <span className="text-sm text-gray-300">Activa</span>
              </label>
            </div>
            <div className="flex justify-end gap-3 mt-4">
              <button onClick={() => setEditingHall(null)} className="px-3 py-1 bg-gray-700 text-white rounded">Cancelar</button>
              <button onClick={async () => { try { if (!editingHall || !editingHall._id) throw new Error('Missing id'); const payload = { name: editingHall.name, capacity: editingHall.capacity, isActive: editingHall.isActive, movie: editingHall.movie }; const res = await fetch(`${API_BASE}/api/halls/${editingHall._id}`, { method: 'PUT', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }); if (!res.ok) throw new Error(`HTTP ${res.status}`); setEditingHall(null); await fetchHalls(); } catch (err) { console.error(err); alert('Error actualizando sala'); } }} className="px-3 py-1 bg-green-600 text-white rounded">Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
