import React from "react";
import Link from "next/link"; // necesario para navegación entre páginas

export default function Header() {
  return (
    <header className="bg-gray-900 text-white p-4 flex flex-col md:flex-row items-center justify-between gap-4">
      {/* Logo */}
      <div className="flex items-center">
        <img
          src="/images/Logo.png"
          alt="Logo CineGT"
          style={{ width: 120, height: 'auto' }}
        />
      </div>

      {/* Buscador, filtros y fecha */}
      <div className="flex flex-col md:flex-row gap-3 md:gap-4 items-center w-full md:w-auto">
        <input
          type="text"
          placeholder="Buscar película"
          className="px-3 py-2 rounded border-2 border-red-600 bg-gray-900 text-white focus:outline-none focus:ring-2 focus:ring-red-600"
        />
        <select className="px-3 py-2 rounded border-2 border-red-600 bg-gray-900 text-white focus:outline-none focus:ring-2 focus:ring-red-600">
          <option>Todos los géneros</option>
          <option>Comedia</option>
          <option>Acción</option>
          <option>Drama</option>
        </select>
        <input
          type="date"
          className="px-3 py-2 rounded border-2 border-red-600 bg-gray-900 text-white focus:outline-none focus:ring-2 focus:ring-red-600 cursor-pointer"
          readOnly={false} // permite seleccionar solo con el calendario
        />
        {/* Botón de inicio de sesión */}
        <Link href="/login">
          <button className="px-4 py-2 bg-red-600 rounded hover:bg-red-700 transition">
            Iniciar sesión
          </button>
        </Link>
      </div>
    </header>
  );
}
