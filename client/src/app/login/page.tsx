"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { API_URL } from "@/services/api";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message || "Error al iniciar sesión");

      // ✅ Guardar token y datos del usuario
      localStorage.setItem("authToken", data.token);
      localStorage.setItem("userData", JSON.stringify(data.user));

      // 🔹 Redirigir según el tipo de usuario
      const tipo = data.user.tipoUsuario || data.user.role || "cliente";

      if (tipo === "admin-dashboard") {
        router.push("/admin-dashboard"); // 👉 Panel admin
      } else {
        router.push("/movies"); // 👉 Página de películas
      }
    } catch (err: any) {
      console.error("Error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <form
        onSubmit={handleSubmit}
        className="bg-gray-900 p-8 rounded-xl shadow-lg border border-red-600 w-full max-w-md"
      >
        <h1 className="text-3xl font-bold text-center mb-6 text-red-500">
          Iniciar sesión
        </h1>

        {error && (
          <p className="text-red-400 bg-red-900/30 p-2 rounded mb-4 text-sm text-center">
            {error}
          </p>
        )}

        <div className="mb-4">
          <label className="block text-gray-300 mb-2">Correo electrónico</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-2 rounded bg-gray-800 border border-red-600 text-white focus:ring-2 focus:ring-red-500"
          />
        </div>

        <div className="mb-6">
          <label className="block text-gray-300 mb-2">Contraseña</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 rounded bg-gray-800 border border-red-600 text-white focus:ring-2 focus:ring-red-500"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`w-full py-2 rounded font-semibold text-lg ${
            loading
              ? "bg-gray-600 text-gray-400 cursor-not-allowed"
              : "bg-red-600 hover:bg-red-700 text-white"
          }`}
        >
          {loading ? "Iniciando..." : "Iniciar sesión"}
        </button>

        <p className="text-center text-gray-400 text-sm mt-6">
          ¿No tienes cuenta?{" "}
          <span
            onClick={() => router.push("/register")}
            className="text-red-500 cursor-pointer hover:underline"
          >
            Regístrate aquí
          </span>
        </p>
      </form>
    </div>
  );
}
