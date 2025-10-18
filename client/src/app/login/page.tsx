"use client";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { API_URL } from "@/services/api";

  import { useEffect } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [userType, setUserType] = useState<"admin" | "colaborador" | "cliente">("cliente");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");


useEffect(() => {
  const pathname = usePathname();
  if (pathname.includes("login-admin")) setUserType("admin");
  else if (pathname.includes("login-colaborador")) setUserType("colaborador");
  else setUserType("cliente");
}, []);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
let endpoint = `${API_URL}/auth/login`;




try {
  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const data = await res.json();

  if (!res.ok) throw new Error(data.message || "Credenciales incorrectas. Por favor, revisa tu email y contraseña.");

  localStorage.setItem("authToken", data.token);
  localStorage.setItem("userData", JSON.stringify(data.user));

  const tipo = data.user.tipoUsuario || data.user.role || "cliente";

  if (tipo === "admin") {
    router.push("/admin-dashboard");
  } else if (tipo === "colaborador") {
    router.push("/dashboard-colaborador");
  } else {
    router.push("/dashboard");
  }
} catch (err: any) {
  console.error("Error:", err);
  setError(err.message || "Error de conexión. Asegúrate de que el servidor Express esté encendido.");
  setLoading(false);
}

    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="flex flex-col items-center justify-center min-h-screen text-white p-6 relative"
      style={{
        backgroundImage: "url('/images/fondoRelleno.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(0,0,0,0.65)',
          zIndex: 0,
        }}
      />
      <div style={{ position: 'relative', zIndex: 2, width: '100%' }}>
        <div className="flex flex-col items-center justify-center min-h-[80vh] w-full">
          {/* BOTÓN VOLVER AL INICIO */}
          <div className="w-full flex justify-center mb-4">
            <button
              onClick={() => router.push("/")}
              className="flex items-center gap-2 px-4 py-2 text-white font-medium border-2 border-red-600 rounded-full bg-black/70 hover:bg-red-600 hover:text-white transition-colors"
            >
              <span className="text-white text-lg">←</span>
              Volver al inicio
            </button>
          </div>

          {/* TÍTULO DIFERENCIADO */}
          <div className="text-center mt-6">
            <h2 className="text-3xl font-bold text-white">
              {userType === "admin"
                ? "Iniciar Sesión - Administrador"
                : userType === "colaborador"
                ? "Iniciar Sesión - Colaborador"
                : "Iniciar Sesión"}
            </h2>
            <p className="text-gray-400 text-sm mt-2">
              Ingresa tus credenciales para acceder a tu cuenta
            </p>
          </div>

          {/* FORMULARIO */}
          <div className="w-full max-w-md p-8 space-y-6 bg-gray-900 rounded-xl shadow-2xl border border-gray-700 mt-6">
            {error && (
              <div className="p-3 text-sm text-red-400 bg-red-900/30 border border-red-700 rounded-lg">
                {error}
              </div>
            )}

            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="max-w-xs mx-auto">
                <label htmlFor="email" className="block text-sm font-medium text-white">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 mt-1 border border-red-600 bg-black/70 text-white rounded-md focus:ring-red-500 focus:border-red-500 placeholder:text-gray-400"
                  placeholder="tu@correo.com"
                />
              </div>

              <div className="max-w-xs mx-auto">
                <label htmlFor="password" className="block text-sm font-medium text-white">
                  Contraseña
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 mt-1 border border-red-600 bg-black/70 text-white rounded-md focus:ring-red-500 focus:border-red-500 placeholder:text-gray-400"
                  placeholder="••••••••"
                />
              </div>

              <div className="max-w-xs mx-auto">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl border border-red-600 px-2 py-2 text-base font-medium transition-colors text-white bg-red-600 hover:bg-red-700 hover:text-white focus:ring-red-500 shadow-md"
                >
                  {loading ? "Validando..." : "Iniciar Sesión"}
                </button>
              </div>
            </form>

            {userType ? null : (
              <div className="text-center text-sm text-gray-400 space-y-2">
                {userType ? null : (
                  <div>
                    ¿No tienes cuenta?{" "}
                    <a href="/register" className="font-medium text-red-400 hover:text-red-300">
                      Regístrate aquí
                    </a>
                  </div>
                )}
                <div>
                  <button
                    type="button"
                    onClick={() => router.push("/recover-password")}
                    className="inline-block font-medium text-red-400 hover:text-red-300 border border-red-600 rounded-full px-4 py-2 transition-colors bg-transparent hover:bg-red-600 hover:text-white"
                  >
                    {userType === "admin"
                      ? "¿Recuperar contraseña de administrador?"
                      : userType === "colaborador"
                      ? "¿Recuperar contraseña de colaborador?"
                      : "¿Olvidaste tu contraseña?"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
