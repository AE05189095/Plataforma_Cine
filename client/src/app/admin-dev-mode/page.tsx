"use client";

import { useRouter } from "next/navigation";
import React from "react";
import AdminReservationTable from '@/components/AdminReservationTable';

export default function AdminDevMode() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-black text-white text-center p-6">
      <h1 className="text-3xl sm:text-5xl font-bold mb-8 text-orange-500">
        Inicio de sesión de empleado
      </h1>

      <div className="flex flex-col gap-4 w-full max-w-xs">
        <button
          onClick={() => router.push("/login-colaborador")}
          className="bg-red-600 hover:bg-red-700 px-6 py-3 rounded-2xl text-lg font-semibold transition"
        >
          Inicio sesión Colaborador
        </button>

        <button
          onClick={() => router.push("/login-admin")}
          className="bg-gray-700 hover:bg-gray-800 px-6 py-3 rounded-2xl text-lg font-semibold transition"
        >
          Inicio sesión Administrador
        </button>

        <button
          onClick={() => router.push("/")}
          className="text-gray-400 hover:text-white mt-6 text-sm"
        >
          ← Volver al inicio
        </button>
      </div>
    </div>
  );
}
