"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface UserData {
  username: string;
  email: string;
  role: string; // 'admin', 'colaborador' o 'cliente'
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("userData");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setUser(parsed);
      } catch (error) {
        console.error("Error leyendo usuario:", error);
      }
    }
  }, []);

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white">
        <h1 className="text-3xl font-bold mb-4">No has iniciado sesión</h1>
        <button
          onClick={() => router.push("/login")}
          className="px-4 py-2 bg-red-600 rounded-lg hover:bg-red-700"
        >
          Iniciar sesión
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black text-white p-8">
      <h1 className="text-4xl font-bold text-yellow-400 mb-8 text-center">
        👤 Perfil de Usuario – Cine GT
      </h1>

      <div className="max-w-xl mx-auto bg-gray-800 p-6 rounded-xl shadow-xl border border-gray-700">
        <p className="text-lg">
          <strong>Nombre:</strong> {user.username}
        </p>
        <p className="text-lg">
          <strong>Correo:</strong> {user.email}
        </p>
        <p className="text-lg">
          <strong>Rol:</strong> {user.role}
        </p>

        {/* 🔸 Opciones comunes a todos los usuarios */}
        <div className="mt-6 flex flex-col gap-3">
          <button
            onClick={() => router.push("/movies")}
            className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white font-bold"
          >
            🎬 Ver Cartelera
          </button>

          <button
            onClick={() => {
              localStorage.removeItem("authToken");
              localStorage.removeItem("userData");
              router.push("/");
            }}
            className="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white font-bold"
          >
            Cerrar Sesión
          </button>
        </div>

        {/* 🔹 Sección exclusiva para administradores */}
        {user.role === "admin" && (
          <div className="mt-10 border-t border-gray-600 pt-6">
            <h2 className="text-2xl font-bold text-yellow-400 mb-4 text-center">
              ⚙️ Panel de Administración
            </h2>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => router.push("/login-admin/movies")}
                className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-bold text-white"
              >
                🎞️ Gestionar Películas
              </button>

              <button
                onClick={() => router.push("/login-admin/showtimes")}
                className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg font-bold text-white"
              >
                🕒 Gestionar Funciones
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
