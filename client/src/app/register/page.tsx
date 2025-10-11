"use client";

import { useState, FormEvent } from "react";
import { useRouter, usePathname } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const pathname = usePathname();

  // Estados del formulario
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Estados de control
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  // Manejador del envío
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    // Validaciones básicas en el cliente
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
    
    //configuracion al backend 
    try {
      const response = await fetch("http://localhost:5000/api/auth/register", {
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

      // Espera un par de segundos antes de redirigir
      setTimeout(() => router.push("/login"), 2000);
    } catch (err) {
      setError(
        "Error de conexión. Asegúrate de que el servidor Express esté encendido (Puerto 5000)."
      );
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-start min-h-screen bg-black p-6 space-y-6">

      {/* CONTENEDOR DEL BOTÓN VOLVER AL INICIO */}
      <div className="w-full flex justify-center">
        <button
          onClick={() => router.push("/dashboard")}
          className="flex items-center gap-2 px-4 py-2 text-white font-medium border-2 border-red-600 rounded-full hover:bg-red-600 hover:text-white transition-colors"
        >
          <span className="text-white text-lg">←</span>
          Volver al inicio
        </button>
      </div>

      {/* BOTONES DE LOGIN / REGISTER */}
      <div className="w-full flex justify-center gap-4 mt-4">
        <button
          onClick={() => router.push("/login")}
          className={`px-6 py-2 rounded-full font-medium transition-colors ${
            pathname === "/login"
              ? "bg-gray-700 text-white"
              : "bg-gray-800 text-gray-300 hover:bg-gray-700"
          }`}
        >
          Iniciar sesión
        </button>

        <button
          onClick={() => router.push("/register")}
          className={`px-6 py-2 rounded-full font-medium transition-colors ${
            pathname === "/register"
              ? "bg-gray-700 text-white"
              : "bg-gray-800 text-gray-300 hover:bg-gray-700"
          }`}
        >
          Registrarse
        </button>
      </div>


      {/* CUADRO DEL FORMULARIO */}


        <div className="w-full max-w-md p-8 space-y-6 bg-gray-900 rounded-xl shadow-2xl border border-gray-700">

        {/* TÍTULO Y SUBTÍTULO */}
        <div className="space-y-2">
          <h2 className="text-3xl font-bold text-center text-white">
            Crear cuenta
          </h2>
          <p className="text-center text-gray-400 text-sm">
            Regístrate para disfrutar de todas las funciones de la plataforma
          </p>
        </div>

        {/* MENSAJES DE ERROR O ÉXITO */}
        {error && (
          <div className="p-3 text-sm text-red-400 bg-red-900/30 border border-red-700 rounded-lg">
            {error}
          </div>
        )}
        {success && (
          <div className="p-3 text-sm text-green-400 bg-green-900/30 border border-green-700 rounded-lg">
            {success}
          </div>
        )}

        {/* FORMULARIO */}
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="max-w-xs mx-auto">
            <label
              htmlFor="username"
              className="block text-sm font-medium text-white"
            >
              Nombre de usuario
            </label>
            <input
              id="username"
              name="username"
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2 mt-1 border border-red-600 bg-gray-800 text-white rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 placeholder:text-gray-400"
              placeholder="Tu nombre de usuario"
            />
          </div>

          <div className="max-w-xs mx-auto">
            <label
              htmlFor="email"
              className="block text-sm font-medium text-white"
            >
              Correo electrónico
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 mt-1 border border-red-600 bg-gray-800 text-white rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 placeholder:text-gray-400"
              placeholder="tu@correo.com"
            />
          </div>

          <div className="max-w-xs mx-auto">
            <label
              htmlFor="password"
              className="block text-sm font-medium text-white"
            >
              Contraseña
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 mt-1 border border-red-600 bg-gray-800 text-white rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 placeholder:text-gray-400"
              placeholder="••••••••"
            />
          </div>

          <div className="max-w-xs mx-auto">
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-white"
            >
              Confirmar contraseña
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3 py-2 mt-1 border border-red-600 bg-gray-800 text-white rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 placeholder:text-gray-400"
              placeholder="Repite tu contraseña"
            />
          </div>

          <div className="max-w-xs mx-auto">
            <button
              className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl border border-red-600 px-2 py-2 text-base font-medium whitespace-nowrap transition-colors focus-visible:ring-[3px] focus-visible:outline-1 disabled:pointer-events-none disabled:opacity-50 text-white bg-transparent hover:bg-red-600 hover:text-white focus:ring-red-500 shadow-md"
              type="submit"
              disabled={loading}
            >
              {loading ? "Registrando..." : "Crear cuenta"}
            </button>
          </div>
        </form>

        {/* LINK DE NAVEGACIÓN */}
        <div className="text-center text-sm text-gray-400">
          ¿Ya tienes cuenta?{" "}
          <a
            href="/login"
            className="font-medium text-red-400 hover:text-red-300"
          >
            Inicia sesión aquí
          </a>
        </div>
      </div>
    </div>
  );
}
