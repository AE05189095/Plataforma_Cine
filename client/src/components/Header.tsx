<<<<<<< HEAD
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
=======
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function Header({
  onSearch,
  onGenreChange,
  onDateChange,
}: {
  onSearch?: (value: string) => void;
  onGenreChange?: (value: string) => void;
  onDateChange?: (value: string) => void;
}) {
  const router = useRouter();

  // 🔹 Estado de sesión
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  const [role, setRole] = useState("");

  // 🔹 Filtros locales
  const [search, setSearch] = useState("");
  const [genre, setGenre] = useState("Todos los géneros");
  const [date, setDate] = useState("");

  // 🔹 Leer sesión al montar el componente
  useEffect(() => {
    const token = localStorage.getItem("authToken");
    const userData = localStorage.getItem("userData");

    if (token && userData) {
      setIsLoggedIn(true);
      const user = JSON.parse(userData);
      setUsername(user.username || "Usuario");
      setRole(user.tipoUsuario || "cliente");
    }
  }, []);

  // 🔹 Logout
  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("userData");
    setIsLoggedIn(false);
    router.push("/login");
  };

  // 🔹 Handlers para filtros (propagación al padre)
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    onSearch?.(e.target.value);
  };

  const handleGenreChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setGenre(e.target.value);
    onGenreChange?.(e.target.value);
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDate(e.target.value);
    onDateChange?.(e.target.value);
  };

  return (
    <header className="bg-gray-900 border-b-2 border-red-700 text-white px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-lg">
      {/* 🎬 Logo Cine GT */}
      <div
        className="flex items-center gap-3 cursor-pointer"
        onClick={() => router.push("/movies")}
      >
        <Image
          src="/images/Logo.png"
          alt="Cine GT Logo"
          width={60}
          height={60}
          priority
        />
        <h1 className="text-2xl font-bold text-red-500">Cine GT</h1>
      </div>

      {/* 🔍 Barra de búsqueda y filtros */}
      <div className="flex flex-wrap items-center justify-center gap-3">
        <input
          type="text"
          placeholder="Buscar película"
          value={search}
          onChange={handleSearchChange}
          className="px-3 py-2 rounded border-2 border-red-600 bg-gray-900 text-white focus:outline-none focus:ring-2 focus:ring-red-600 w-48 md:w-64"
        />

        <select
          value={genre}
          onChange={handleGenreChange}
          className="px-3 py-2 rounded border-2 border-red-600 bg-gray-900 text-white cursor-pointer"
        >
          <option>Todos los géneros</option>
          <option>Acción</option>
          <option>Comedia</option>
          <option>Drama</option>
          <option>Ciencia Ficción</option>
        </select>

        <input
          type="date"
          value={date}
          onChange={handleDateChange}
          className="px-3 py-2 rounded border-2 border-red-600 bg-gray-900 text-white cursor-pointer"
        />
      </div>

      {/* 👤 Botones de sesión */}
      <div className="flex items-center gap-3">
        {isLoggedIn ? (
          <>
            {/* Si es admin, lo redirigimos a /login-admin */}
            {role === "admin" ? (
              <button
                onClick={() => router.push("/login-admin")}
                className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-black rounded font-semibold transition"
              >
                Panel Admin
              </button>
            ) : (
              <button
                onClick={() => router.push("/profile")}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded transition font-semibold"
              >
                Perfil ({username})
              </button>
            )}

            <button
              onClick={handleLogout}
              className="px-3 py-2 bg-gray-700 hover:bg-gray-800 rounded transition font-semibold"
            >
              Cerrar sesión
            </button>
          </>
        ) : (
          <button
            onClick={() => router.push("/login")}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded transition font-semibold"
          >
            Iniciar sesión
          </button>
        )}
>>>>>>> mapa-asientos
      </div>
    </header>
  );
}
