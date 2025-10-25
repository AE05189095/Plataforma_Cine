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
  const endpoint = userType === "admin" ? `${API_BASE}/api/auth/login-admin` : `${API_BASE}/api/auth/login-colaborador`;
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
  // Redirect: administradores van al panel admin, colaboradores al welcome
  if (userType === "admin") router.push("/admin/dashboard");
  else router.push("/welcome");
    } catch {
      setError("Error de conexión. Verifica que el backend esté ejecutándose.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white p-6">
      <h1 className="text-4xl font-bold mb-8 text-orange-500">
        {userType === 'admin' ? 'Inicio de sesión de administradores' : 'Inicio de sesión de colaboradores'}
      </h1>
      <div className="flex flex-col gap-4 w-full max-w-md">
        <div className="w-full p-8 bg-gray-900 rounded-xl border border-gray-700 shadow-2xl">
          {error && <div className="mb-4 text-red-400">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-300">Email</label>
              <input value={email} onChange={e => setEmail(e.target.value)} type="email" required className="w-full px-3 py-2 mt-1 bg-black/70 border border-red-600 rounded-md text-white" />
            </div>
            <div>
              <label className="block text-sm text-gray-300">Contraseña</label>
              <input value={password} onChange={e => setPassword(e.target.value)} type="password" required className="w-full px-3 py-2 mt-1 bg-black/70 border border-red-600 rounded-md text-white" />
            </div>
            <div className="flex items-center justify-between mt-2">
              <div className="flex gap-2">
                <button type="button" onClick={() => router.back()} className="px-4 py-2 bg-gray-700 rounded-lg text-white">Volver</button>
                <button type="submit" disabled={loading} className="px-6 py-2 bg-red-600 rounded-xl text-white font-medium">{loading ? 'Validando...' : 'Iniciar sesión'}</button>
              </div>
              <button type="button" onClick={() => router.push('/recover-password')} className="text-sm text-red-400 underline">Recuperar contraseña</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
