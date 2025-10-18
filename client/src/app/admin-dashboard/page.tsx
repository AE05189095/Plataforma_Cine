"use client";
import React from "react";
import { useRouter } from "next/navigation";

export default function AdminDashboard() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black text-white p-8">
      <h1 className="text-4xl font-bold text-yellow-400 mb-8 text-center">
        🎬 Panel de Administración – Cine GT
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10">
        {/* Películas */}
        <div
          onClick={() => router.push("/login-admin/movies")}
          className="bg-gray-800 hover:bg-gray-700 cursor-pointer rounded-xl p-6 border-l-4 border-red-600 shadow-lg transition-all"
        >
          <h2 className="text-2xl font-bold text-orange-400">🎞️ Gestionar Películas</h2>
          <p className="text-gray-300 mt-2">
            Agrega, edita o elimina películas en la cartelera.
          </p>
        </div>

        {/* Funciones */}
        <div
          onClick={() => router.push("/login-admin/showtimes")}
          className="bg-gray-800 hover:bg-gray-700 cursor-pointer rounded-xl p-6 border-l-4 border-yellow-500 shadow-lg transition-all"
        >
          <h2 className="text-2xl font-bold text-yellow-400">🕒 Gestionar Funciones</h2>
          <p className="text-gray-300 mt-2">
            Añade o elimina horarios y salas para cada película.
          </p>
        </div>

        {/* Volver */}
        <div
          onClick={() => router.push("/")}
          className="bg-gray-800 hover:bg-gray-700 cursor-pointer rounded-xl p-6 border-l-4 border-green-500 shadow-lg transition-all"
        >
          <h2 className="text-2xl font-bold text-green-400">🏠 Volver al inicio</h2>
          <p className="text-gray-300 mt-2">
            Regresar a la cartelera principal de Cine GT.
          </p>
        </div>
      </div>
    </div>
  );
}
