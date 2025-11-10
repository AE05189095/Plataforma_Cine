"use client";
import React, { useEffect, useState } from "react";
import { API_BASE } from "@/lib/config";
import { jwtDecode } from "jwt-decode";

type TokenPayload = {
  userId: string;
  username: string;
  role: string;
};

type Movie = {
  _id: string;
  title: string;
  slug?: string;
  description?: string;
  genres?: string[];
  duration?: number;
  director?: string;
  rating?: number;
  posterUrl?: string;
  images?: string[];
  isActive?: boolean;
  isFeatured?: boolean;
};

export default function AdminPeliculasPage() {

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

  const headerStyle: React.CSSProperties = { background: 'rgba(6,18,30,0.7)', border: '1px solid rgba(255,255,255,0.04)' };

  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<Movie | null>(null);
  const [saving, setSaving] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newMovie, setNewMovie] = useState<Partial<Movie>>({ title: '', slug: '', description: '', genres: [], duration: 0, director: '', posterUrl: '', rating: 0 });

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
  // Pedimos la vista admin para recibir todas las películas
  const res = await fetch(`${API_BASE}/api/movies?admin=1`, { credentials: 'include' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (mounted) setMovies(data || []);
        } catch (err: unknown) {
          console.error('Error cargando películas:', err);
          setError((err as Error)?.message || 'No se pudo cargar las películas');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  const openEditor = (m: Movie) => setEditing(m);
  const closeEditor = () => setEditing(null);

  const handleChange = (field: keyof Movie, value: string | number | boolean | string[] | undefined) => {
    if (!editing) return;
    setEditing({ ...editing, [field]: value });
  };

  const openCreate = () => {
    setNewMovie({ title: '', slug: '', description: '', genres: [], duration: 0, director: '', posterUrl: '', rating: 0 });
    setCreating(true);
  };
  const closeCreate = () => setCreating(false);

  const handleNewChange = (field: keyof Movie | string, value: string | number | boolean | string[] | undefined) => {
    setNewMovie({ ...newMovie, [field]: value });
  };

  const createMovie = async () => {
    setSaving(true);
    try {
      const payloadObj: Record<string, unknown> = { ...newMovie };
      if (payloadObj.duration === '') payloadObj.duration = undefined;
      const token = localStorage.getItem('app_token');
      const res = await fetch(`${API_BASE}/api/movies`, {
       method: 'POST',
      headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
  },
  body: JSON.stringify(payloadObj),
});

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const created = await res.json();
      setMovies([created, ...movies]);
      closeCreate();
    } catch (err: unknown) {
      console.error('Error creando película:', err);
      setError((err as Error)?.message || 'No se pudo crear la película');
    } finally {
      setSaving(false);
    }
  };

  const deleteMovie = async (id: string) => {
    if (!confirm('¿Eliminar esta película? Esta acción no se puede deshacer.')) return;
    try {
      const token = localStorage.getItem('app_token');
      const res = await fetch(`${API_BASE}/api/movies/${id}`, {
       method: 'DELETE',
      headers: {'Authorization': `Bearer ${token}`,},
      });
      if (res.status !== 204 && !res.ok) throw new Error(`HTTP ${res.status}`);
      setMovies(movies.filter(m => m._id !== id));
    } catch (err) {
      console.error('Error eliminando película:', err);
      setError('No se pudo eliminar la película');
    }
  };

  const saveMovie = async () => {
    if (!editing) return;
    setSaving(true);
    try {
     const token = localStorage.getItem('app_token');
    const res = await fetch(`${API_BASE}/api/movies/${editing._id}`, {
     method: 'PUT',
    headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  },
  body: JSON.stringify(editing),
});

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const updated = await res.json();
      setMovies(movies.map(m => m._id === updated._id ? updated : m));
      closeEditor();
    } catch (err: unknown) {
      console.error('Error guardando película:', err);
      setError((err as Error)?.message || 'No se pudo guardar la película');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="py-8">
      <div className="flex items-center justify-between mb-6 p-4 rounded-lg" style={headerStyle}>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>Gestión de Películas</h1>
        {userRole === "admin" && (
        <button onClick={openCreate} className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors font-semibold shadow-lg">+ Agregar Película</button>
        )}
        </div>

      {loading && <p style={{ color: 'var(--foreground)' }}>Cargando películas...</p>}
      {error && <p className="text-red-400">{error}</p>}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {movies.map(m => (
          <div key={m._id} className="bg-gray-800 rounded-lg p-3 flex flex-col" style={{ border: '1px solid rgba(255,255,255,0.04)' }}>
            <div className="aspect-[3/4] bg-gray-700 rounded overflow-hidden mb-3">
              {m.posterUrl ? (
                // <img> para evitar requisitos de next/image en dominios externos
                // muestra la portada desde la URL guardada en la DB
                <img src={m.posterUrl} alt={m.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-sm text-gray-300">Sin imagen</div>
              )}
            </div>

            <h3 className="text-lg font-semibold text-white mb-1 truncate">{m.title}</h3>
            <p className="text-sm text-gray-300 mb-2 line-clamp-2">{m.description}</p>

                <div className="mt-auto flex items-center justify-between">
              <div className="text-sm text-gray-400">{m.duration ? `${m.duration} min` : ''}</div>
              <div className="flex items-center gap-2">
                <button onClick={() => openEditor(m)} className="px-3 py-1 rounded btn-primary">Editar</button>
                {userRole === "admin" && (
                <button onClick={() => deleteMovie(m._id)} className="px-3 py-1 bg-red-600 text-white rounded">Eliminar</button>
                )}
                </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal editor simple */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="w-full max-w-2xl rounded-lg p-6 bg-black text-white border border-gray-700">
            <h2 className="text-xl font-bold mb-4">Editar película</h2>

            <div className="grid grid-cols-2 gap-4">
              <label className="flex flex-col">
                <span className="text-sm text-gray-400">Título</span>
                <input value={editing.title || ''} onChange={e => handleChange('title', e.target.value)} className="mt-1 p-2 rounded bg-gray-800 text-white border border-gray-600" />
              </label>

              <label className="flex flex-col">
                <span className="text-sm text-gray-400">Slug</span>
                <input value={editing.slug || ''} onChange={e => handleChange('slug', e.target.value)} className="mt-1 p-2 rounded bg-gray-800 text-white border border-gray-600" />
              </label>

              <label className="flex flex-col col-span-2">
                <span className="text-sm text-gray-400">Descripción</span>
                <textarea value={editing.description || ''} onChange={e => handleChange('description', e.target.value)} className="mt-1 p-2 rounded h-24 bg-gray-800 text-white border border-gray-600" />
              </label>

              <label className="flex flex-col">
                <span className="text-sm text-gray-400">Géneros (coma separada)</span>
                <input value={(editing.genres || []).join(', ')} onChange={e => handleChange('genres', e.target.value.split(',').map(s => s.trim()).filter(Boolean))} className="mt-1 p-2 rounded bg-gray-800 text-white border border-gray-600" />
              </label>

              <label className="flex flex-col">
                <span className="text-sm text-gray-400">Duración (min)</span>
                <input type="number" value={editing.duration || ''} onChange={e => handleChange('duration', Number(e.target.value))} className="mt-1 p-2 rounded bg-gray-800 text-white border border-gray-600" />
              </label>

              <label className="flex flex-col">
                <span className="text-sm text-gray-400">Director</span>
                <input value={editing.director || ''} onChange={e => handleChange('director', e.target.value)} className="mt-1 p-2 rounded bg-gray-800 text-white border border-gray-600" />
              </label>

              <label className="flex flex-col col-span-2">
                <span className="text-sm text-gray-400">URL de la portada (posterUrl)</span>
                <input value={editing.posterUrl || ''} onChange={e => handleChange('posterUrl', e.target.value)} className="mt-1 p-2 rounded bg-gray-800 text-white border border-gray-600" />
              </label>

              <label className="flex flex-col">
                <span className="text-sm text-gray-400">Ranking (rating) 0-10</span>
                <input type="number" min={0} max={10} step={0.1} value={editing.rating ?? 0} onChange={e => handleChange('rating', Number(e.target.value))} className="mt-1 p-2 rounded bg-gray-800 text-white border border-gray-600" />
              </label>

              <label className="flex items-center gap-2">
                <input type="checkbox" checked={!!editing.isActive} onChange={e => handleChange('isActive', e.target.checked)} />
                <span className="text-sm text-gray-400">Activa</span>
              </label>

              <label className="flex items-center gap-2">
                <input type="checkbox" checked={!!editing.isFeatured} onChange={e => handleChange('isFeatured', e.target.checked)} />
                <span className="text-sm text-gray-400">Destacada</span>
              </label>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button onClick={closeEditor} className="px-4 py-2 rounded bg-gray-700 hover:bg-gray-600">Cancelar</button>
              <button onClick={saveMovie} disabled={saving} className="px-4 py-2 rounded bg-red-600 hover:bg-red-700 text-white">{saving ? 'Guardando...' : 'Guardar cambios'}</button>
            </div>
          </div>
        </div>
      )}
      {/* Modal de creación */}
      {creating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="w-full max-w-2xl rounded-lg p-6 bg-black text-white border border-gray-700">
            <h2 className="text-xl font-bold mb-4">Agregar película</h2>

            <div className="grid grid-cols-2 gap-4">
              <label className="flex flex-col">
                <span className="text-sm text-gray-400">Título</span>
                <input value={newMovie.title || ''} onChange={e => handleNewChange('title', e.target.value)} className="mt-1 p-2 rounded bg-gray-800 text-white border border-gray-600" />
              </label>

              <label className="flex flex-col">
                <span className="text-sm text-gray-400">Slug</span>
                <input value={newMovie.slug || ''} onChange={e => handleNewChange('slug', e.target.value)} className="mt-1 p-2 rounded bg-gray-800 text-white border border-gray-600" />
              </label>

              <label className="flex flex-col col-span-2">
                <span className="text-sm text-gray-400">Descripción</span>
                <textarea value={newMovie.description || ''} onChange={e => handleNewChange('description', e.target.value)} className="mt-1 p-2 rounded h-24 bg-gray-800 text-white border border-gray-600" />
              </label>

              <label className="flex flex-col">
                <span className="text-sm text-gray-400">Géneros (coma separada)</span>
                <input value={(newMovie.genres || []).join(', ')} onChange={e => handleNewChange('genres', e.target.value.split(',').map(s => s.trim()).filter(Boolean))} className="mt-1 p-2 rounded bg-gray-800 text-white border border-gray-600" />
              </label>

              <label className="flex flex-col">
                <span className="text-sm text-gray-400">Duración (min)</span>
                <input type="number" value={newMovie.duration || ''} onChange={e => handleNewChange('duration', Number(e.target.value))} className="mt-1 p-2 rounded bg-gray-800 text-white border border-gray-600" />
              </label>

              <label className="flex flex-col">
                <span className="text-sm text-gray-400">Director</span>
                <input value={newMovie.director || ''} onChange={e => handleNewChange('director', e.target.value)} className="mt-1 p-2 rounded bg-gray-800 text-white border border-gray-600" />
              </label>

              <label className="flex flex-col col-span-2">
                <span className="text-sm text-gray-400">URL de la portada (posterUrl)</span>
                <input value={newMovie.posterUrl || ''} onChange={e => handleNewChange('posterUrl', e.target.value)} className="mt-1 p-2 rounded bg-gray-800 text-white border border-gray-600" />
              </label>

              <label className="flex flex-col">
                <span className="text-sm text-gray-400">Ranking (rating) 0-10</span>
                <input type="number" min={0} max={10} step={0.1} value={newMovie.rating ?? 0} onChange={e => handleNewChange('rating', Number(e.target.value))} className="mt-1 p-2 rounded bg-gray-800 text-white border border-gray-600" />
              </label>

              <label className="flex items-center gap-2">
                <input type="checkbox" checked={!!newMovie.isActive} onChange={e => handleNewChange('isActive', e.target.checked)} />
                <span className="text-sm text-gray-400">Activa</span>
              </label>

              <label className="flex items-center gap-2">
                <input type="checkbox" checked={!!newMovie.isFeatured} onChange={e => handleNewChange('isFeatured', e.target.checked)} />
                <span className="text-sm text-gray-400">Destacada</span>
              </label>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button onClick={closeCreate} className="px-4 py-2 rounded bg-gray-700 hover:bg-gray-600">Cancelar</button>
              <button onClick={createMovie} disabled={saving} className="px-4 py-2 rounded bg-red-600 hover:bg-red-700 text-white">{saving ? 'Creando...' : 'Crear película'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
