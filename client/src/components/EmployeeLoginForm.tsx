"use client";
import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { API_BASE, TOKEN_KEY } from "@/lib/config";

interface Props {
  userType: "admin" | "colaborador";
}

export default function EmployeeLoginForm({ userType }: Props) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const endpoint =
        userType === "admin"
          ? `${API_BASE}/api/auth/login-admin`
          : `${API_BASE}/api/auth/login-colaborador`;

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Credenciales inválidas");
        setLoading(false);
        return;
      }

      localStorage.setItem(TOKEN_KEY, data.token);

      // Redirección según tipo de usuario
      if (userType === "admin"){router.push("/admin/dashboard");
      } else if (userType === "colaborador") {router.push("/admin/dashboard");
      }else router.push("/welcome");
    } catch {
      setError("Error de conexión. Verifica que el backend esté ejecutándose.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white px-4 py-10 sm:px-8">
      <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-8 text-orange-500 text-center leading-tight">
        {userType === "admin"
          ? "Inicio de sesión de administradores"
          : "Inicio de sesión de colaboradores"}
      </h1>

      <div className="flex flex-col gap-4 w-full max-w-sm sm:max-w-md md:max-w-lg">
        <div className="w-full p-6 sm:p-8 bg-gray-900 rounded-xl border border-gray-700 shadow-2xl">
          {error && (
            <div className="mb-4 text-red-400 text-sm sm:text-base">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm sm:text-base text-gray-300">
                Email
              </label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                required
                className="w-full px-3 py-2 mt-1 bg-black/70 border border-red-600 rounded-md text-white text-sm sm:text-base"
              />
            </div>

            <div>
              <label className="block text-sm sm:text-base text-gray-300">
                Contraseña
              </label>
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                required
                className="w-full px-3 py-2 mt-1 bg-black/70 border border-red-600 rounded-md text-white text-sm sm:text-base"
              />
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-0 mt-4">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="px-4 py-2 text-sm sm:text-base bg-gray-700 rounded-lg text-white hover:bg-gray-600 transition"
                >
                  Volver
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 text-sm sm:text-base bg-red-600 rounded-xl text-white font-medium hover:bg-red-700 transition"
                >
                  {loading ? "Validando..." : "Iniciar sesión"}
                </button>
              </div>

              <button
                type="button"
                onClick={() => router.push("/recover-password")}
                className="text-sm sm:text-base text-red-400 underline hover:text-red-300"
              >
                Recuperar contraseña
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
