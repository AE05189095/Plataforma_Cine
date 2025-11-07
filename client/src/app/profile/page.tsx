"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import { API_BASE} from "@/lib/config";

// Nota: Asumimos que el token es gestionado con la clave 'app_token'

type User = {
  id: string;
  username: string;
  email: string;
  role?: 'cliente' | 'admin' | 'colaborador' | string;
} | null;

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
        const token = localStorage.getItem('app_token');
        if (!token) {
          setError("No autenticado");
          setLoading(false);
          return;
        }

        const res = await fetch(`${API_BASE}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          setError(body.message || "Error al obtener perfil");
          setLoading(false);
          return;
        }

        const data = await res.json();
        setUser(data.user || null);
      } catch {
        setError("Error de red");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleLogout = async () => {
    const token = localStorage.getItem('app_token');
    if (!token) {
      router.push("/");
      return;
    }
    try {
      // Registrar logout en el backend, usando el token en el header (lógica de semana-final)
      const res = await fetch(`${API_BASE}/api/auth/logout`, {
        method: "POST",
        headers: { "Content-Type": "application/json",
                   Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      console.log("Logout registrado:", data.message);
    } catch (error) {
      console.error("Error registrando logout:", error);
    } finally {
      // Eliminar token local y redirigir siempre
      localStorage.removeItem('app_token');
      router.push("/");
    }
  };

  const submitChange = async () => {
    setChanging(true);
    try {
      const token = localStorage.getItem('app_token'); // Unificado a 'app_token'
      if (!token) throw new Error('No autenticado');
      
      const res = await fetch(`${API_BASE}/api/auth/change-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ oldPassword: currentPassword, newPassword }),
      });

      const body = await res.json();
      if (!res.ok) throw new Error(body.message || "Error");

      alert("Contraseña cambiada correctamente");
      setShowChange(false);
      setCurrentPassword("");
      setNewPassword("");
    } catch (err: unknown) {
      let msg = "Error al cambiar contraseña";
      if (err && typeof err === "object" && "message" in err) {
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
      <main className="px-4 sm:px-6 md:px-8 py-8 max-w-3xl mx-auto">
        <div className="bg-slate-800 p-5 sm:p-6 md:p-8 rounded-lg shadow-md">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-amber-300 mb-6 text-center md:text-left">
            Perfil
          </h1>

          {loading ? (
            <div className="text-slate-400 text-center">Cargando...</div>
          ) : error ? (
            <div className="text-red-400 text-center">{error}</div>
          ) : user ? (
            <div className="space-y-4 sm:space-y-5">
              <div>
                <div className="text-slate-400 text-sm sm:text-base">Nombre de Usuario</div>
                <div className="font-semibold text-white text-base sm:text-lg">{user.username}</div>
              </div>

              <div>
                <div className="text-slate-400 text-sm sm:text-base">Correo</div>
                <div className="font-semibold text-white text-base sm:text-lg">{user.email}</div>
              </div>

              <div>
                <div className="text-slate-400 text-sm sm:text-base">Contraseña</div>
                <div className="font-semibold text-white">***********</div>
              </div>

              {/* Enlace al historial: solo visible para clientes (no admin/colaborador) */}
              {(!user?.role || (user.role !== 'admin' && user.role !== 'colaborador')) && (
                <div className="mt-4">
                  <a
                    href="/profile/UserHistory"
                    className="text-amber-400 underline text-sm sm:text-base"
                  >
                    Ver historial de entradas
                  </a>
                </div>
              )}

              {/* Botones */}
              <div className="flex flex-col sm:flex-row gap-3 mt-5">
                <button
                  onClick={() => setShowChange(true)}
                  className="px-4 py-2 md:px-5 md:py-3 bg-amber-500 text-black rounded text-sm md:text-base font-semibold hover:bg-amber-400 transition"
                >
                  Cambiar contraseña
                </button>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 md:px-5 md:py-3 bg-red-600 rounded text-sm md:text-base font-semibold hover:bg-red-500 transition"
                >
                  Cerrar sesión
                </button>
              </div>

              {showChange && (
                <div className="mt-5 bg-gray-900 p-4 sm:p-6 rounded-lg">
                  <div className="mb-3 text-slate-300 text-sm sm:text-base">
                    Ingresa tu contraseña actual y la nueva:
                  </div>
                  <input
                    type="password"
                    placeholder="Contraseña actual"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full mb-3 p-2 sm:p-3 rounded bg-slate-800 text-sm sm:text-base"
                  />
                  <input
                    type="password"
                    placeholder="Nueva contraseña"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full mb-3 p-2 sm:p-3 rounded bg-slate-800 text-sm sm:text-base"
                  />
                  <div className="flex flex-col sm:flex-row gap-2">
                    <button
                      onClick={submitChange}
                      disabled={changing}
                      className="px-4 py-2 md:px-5 md:py-3 bg-amber-500 text-black rounded text-sm md:text-base font-semibold hover:bg-amber-400 transition"
                    >
                      {changing ? "Guardando..." : "Guardar"}
                    </button>
                    <button
                      onClick={() => setShowChange(false)}
                      className="px-4 py-2 md:px-5 md:py-3 bg-gray-700 rounded text-sm md:text-base font-semibold hover:bg-gray-600 transition"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-slate-400 text-center">
              No hay datos de usuario disponibles.
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
