"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import { API_BASE, TOKEN_KEY } from "@/lib/config";

type User = { id: string; username: string; email: string } | null;

export default function ProfilePage() {
  const [user, setUser] = useState<User>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showChange, setShowChange] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [changing, setChanging] = useState(false);

  const router = useRouter();

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem(TOKEN_KEY);
        if (!token) {
          setError('No autenticado');
          setLoading(false);
          return;
        }

        const res = await fetch(`${API_BASE}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          setError(body.message || 'Error al obtener perfil');
          setLoading(false);
          return;
        }

        const data = await res.json();
        setUser(data.user || null);
      } catch {
        setError('Error de red');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem(TOKEN_KEY);
    router.push('/');
  };

  const submitChange = async () => {
    setChanging(true);
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      if (!token) throw new Error('No autenticado');
      const res = await fetch(`${API_BASE}/api/auth/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const body = await res.json();
      if (!res.ok) throw new Error(body.message || 'Error');

      alert('Contraseña cambiada correctamente');
      setShowChange(false);
      setCurrentPassword('');
      setNewPassword('');
    } catch (err: unknown) {
      let msg = 'Error al cambiar contraseña';
      if (err && typeof err === 'object' && 'message' in err) {
        msg = (err as { message?: string }).message || msg;
      }
      alert(msg);
    } finally {
      setChanging(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black text-white">
      <Header />
      <main className="p-8 max-w-3xl mx-auto">
        <div className="bg-slate-800 p-6 rounded-lg shadow-md">
          <h1 className="text-2xl font-bold text-amber-300 mb-4">Perfil</h1>

          {loading ? (
            <div className="text-slate-400">Cargando...</div>
          ) : error ? (
            <div className="text-red-400">{error}</div>
          ) : user ? (
            <div className="space-y-3">
              <div>
                <div className="text-slate-400 text-sm">Nombre de Usuario</div>
                <div className="font-semibold text-white">{user.username}</div>
              </div>

              <div>
                <div className="text-slate-400 text-sm">Correo</div>
                <div className="font-semibold text-white">{user.email}</div>
              </div>

              <div>
                <div className="text-slate-400 text-sm">Contraseña</div>
                <div className="font-semibold text-white">***********</div>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setShowChange(true)} className="px-4 py-2 bg-amber-500 text-black rounded">Cambiar contraseña</button>
                <button onClick={handleLogout} className="px-4 py-2 bg-red-600 rounded">Cerrar sesión</button>
              </div>

              {showChange && (
                <div className="mt-4 bg-gray-900 p-4 rounded">
                  <div className="mb-2 text-slate-300">Ingresa tu contraseña actual y la nueva:</div>
                  <input type="password" placeholder="Contraseña actual" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} className="w-full mb-2 p-2 rounded bg-slate-800" />
                  <input type="password" placeholder="Nueva contraseña" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full mb-2 p-2 rounded bg-slate-800" />
                  <div className="flex gap-2">
                    <button onClick={submitChange} disabled={changing} className="px-4 py-2 bg-amber-500 text-black rounded">{changing ? 'Guardando...' : 'Guardar'}</button>
                    <button onClick={() => setShowChange(false)} className="px-4 py-2 bg-gray-700 rounded">Cancelar</button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-slate-400">No hay datos de usuario disponibles.</div>
          )}

        </div>
      </main>
    </div>
  );
}
