"use client";
import React from "react";
import { useRouter } from "next/navigation";

export default function AdminShowtimes() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <h1 className="text-3xl font-bold text-yellow-400 mb-6">🕒 Administración de Funciones</h1>

      <button
        onClick={() => router.push("/admin-dashboard")}
        className="mb-6 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg"
      >
        ← Volver al panel
      </button>

      <div className="bg-gray-900 p-6 rounded-xl border border-gray-700 shadow-lg">
        <p className="text-gray-400">
          Aquí podrás agregar, editar y eliminar funciones de películas.
        </p>
      </div>
    </div>
  );
}
