"use client";

import { useState, FormEvent } from "react";
import { useRouter, usePathname } from "next/navigation";
import { API_BASE } from "@/lib/config";

export default function RegisterPage() {
  const router = useRouter();
  const pathname = usePathname();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password }),
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.message || "Error al registrar usuario.");
        setLoading(false);
        return;
      }

      setSuccess("Usuario registrado exitosamente.");
      setLoading(false);
      setTimeout(() => router.push("/login"), 2000);
    } catch {
      setError("Error de conexión. Asegúrate de que el servidor Express esté encendido (Puerto 5000).");
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-start min-h-screen bg-gradient-to-b from-black via-gray-900 to-black text-white p-6 space-y-6">
      
      {/* Botón Volver */}
      <div className="w-full flex justify-center">
        <button
          onClick={() => router.push("/")}
          className="flex items-center gap-2 px-4 py-2 text-white font-medium border-2 border-red-600 rounded-full hover:bg-red-600 transition-colors text-base md:text-lg"
        >
          <span className="text-white text-lg">←</span>
          Volver al inicio
        </button>
      </div>

      {/* Botones de Login / Register */}
      <div className="w-full flex justify-center gap-4 mt-4">
        <button
          onClick={() => router.push("/login")}
          className={`px-6 py-2 rounded-full font-medium transition-colors text-sm md:text-base ${
            pathname === "/login"
              ? "bg-gray-700 text-white"
              : "bg-gray-800 text-gray-300 hover:bg-gray-700"
          }`}
        >
          Iniciar sesión
        </button>

        <button
          onClick={() => router.push("/register")}
          className={`px-6 py-2 rounded-full font-medium transition-colors text-sm md:text-base ${
            pathname === "/register"
              ? "bg-gray-700 text-white"
              : "bg-gray-800 text-gray-300 hover:bg-gray-700"
          }`}
        >
          Registrarse
        </button>
      </div>

      {/* Formulario */}
      <div className="w-full max-w-md md:max-w-lg lg:max-w-xl p-8 md:p-10 space-y-6 bg-gray-900 rounded-xl shadow-2xl border border-gray-700">
        <div className="space-y-2">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-white">
            Crear cuenta
          </h2>
          <p className="text-center text-gray-400 text-sm md:text-base">
            Regístrate para disfrutar de todas las funciones de la plataforma
          </p>
        </div>

        {error && (
          <div className="p-3 text-sm md:text-base text-red-400 bg-red-900/30 border border-red-700 rounded-lg">
            {error}
          </div>
        )}
        {success && (
          <div className="p-3 text-sm md:text-base text-green-400 bg-green-900/30 border border-green-700 rounded-lg">
            {success}
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="max-w-sm mx-auto">
            <label htmlFor="username" className="block text-sm md:text-base font-medium text-white">
              Nombre de usuario
            </label>
            <input
              id="username"
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2 md:py-3 mt-1 border border-red-600 bg-gray-800 text-white rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 placeholder:text-gray-400"
              placeholder="Tu nombre de usuario"
            />
          </div>

          <div className="max-w-sm mx-auto">
            <label htmlFor="email" className="block text-sm md:text-base font-medium text-white">
              Correo electrónico
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 md:py-3 mt-1 border border-red-600 bg-gray-800 text-white rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 placeholder:text-gray-400"
              placeholder="tu@correo.com"
            />
          </div>

          <div className="max-w-sm mx-auto">
            <label htmlFor="password" className="block text-sm md:text-base font-medium text-white">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 md:py-3 mt-1 border border-red-600 bg-gray-800 text-white rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 placeholder:text-gray-400"
              placeholder="••••••••"
            />
          </div>

          <div className="max-w-sm mx-auto">
            <label htmlFor="confirmPassword" className="block text-sm md:text-base font-medium text-white">
              Confirmar contraseña
            </label>
            <input
              id="confirmPassword"
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3 py-2 md:py-3 mt-1 border border-red-600 bg-gray-800 text-white rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 placeholder:text-gray-400"
              placeholder="Repite tu contraseña"
            />
          </div>

          <div className="max-w-sm mx-auto">
            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl border border-red-600 px-2 py-2 md:py-3 text-base md:text-lg font-medium transition-colors disabled:opacity-50 text-white bg-transparent hover:bg-red-600 shadow-md"
            >
              {loading ? "Registrando..." : "Crear cuenta"}
            </button>
          </div>
        </form>

        <div className="text-center text-sm md:text-base text-gray-400">
          ¿Ya tienes cuenta?{" "}
          <a href="/login" className="font-medium text-red-400 hover:text-red-300">
            Inicia sesión aquí
          </a>
        </div>
      </div>
    </div>
  );
}
