"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RecoverPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      // Verifica si el correo existe con GET
      const verifyRes = await fetch(`http://localhost:5000/api/auth/recover-password?email=${encodeURIComponent(email)}`);
      const verifyData = await verifyRes.json();
      if (!verifyRes.ok) {
        if (verifyRes.status === 404) {
          setMessage("El correo ingresado no está registrado. Por favor verifica o crea una cuenta nueva.");
        } else if (verifyRes.status === 400) {
          setMessage("Debes ingresar un correo electrónico válido.");
        } else {
          setMessage("Ocurrió un error al verificar el correo. Intenta nuevamente.");
        }
        setLoading(false);
        return;
      }
      // Si existe, procede con el POST para recuperación
      const res = await fetch("http://localhost:5000/api/auth/recover-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage("¡Correo de recuperación enviado! Revisa tu bandeja de entrada y la carpeta de spam.");
      } else if (res.status === 404) {
        setMessage("No se pudo enviar el correo porque el email no está registrado.");
      } else if (res.status === 400) {
        setMessage("Debes ingresar un correo electrónico válido.");
      } else {
        setMessage("Ocurrió un error al intentar enviar el correo. Intenta nuevamente.");
      }
    } catch {
      setMessage("Error de conexión con el servidor. Verifica tu red e intenta de nuevo.");
    }
    setLoading(false);
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
          {/* BOTÓN VOLVER AL LOGIN */}
          <div className="w-full flex justify-center mb-4">
            <button
              onClick={() => router.push("/login")}
              className="flex items-center gap-2 px-4 py-2 text-white font-medium border-2 border-red-600 rounded-full bg-black/70 hover:bg-red-600 hover:text-white transition-colors"
            >
              <span className="text-white text-lg">←</span>
              Volver al login
            </button>
          </div>
          <div className="text-center mt-6">
            <h2 className="text-3xl font-bold text-white">Recuperar contraseña</h2>
            <p className="text-center text-gray-400 text-sm">Ingresa tu correo electrónico para recibir el enlace de recuperación</p>
          </div>
          <div className="w-full max-w-md p-8 space-y-6 bg-gray-900 rounded-xl shadow-2xl border border-gray-700 mt-6">
            {message && (
              <div
                className={`p-3 text-sm rounded-lg ${
                  message.includes("no existe")
                    ? "text-red-400 bg-red-900/30 border border-red-700"
                    : "text-green-400 bg-green-900/30 border border-green-700"
                }`}
              >
                {message}
              </div>
            )}
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="max-w-xs mx-auto">
                <label htmlFor="email" className="block text-sm font-medium text-white">Correo electrónico</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full px-3 py-2 mt-1 border border-red-600 bg-black/70 text-white rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 placeholder:text-gray-400"
                  placeholder="tu@correo.com"
                />
              </div>
              <div className="max-w-xs mx-auto">
                <button
                  className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl border border-red-600 px-2 py-2 text-base font-medium whitespace-nowrap transition-colors focus-visible:ring-[3px] focus-visible:outline-1 disabled:pointer-events-none disabled:opacity-50 text-white bg-red-600 hover:bg-red-700 hover:text-white focus:ring-red-500 shadow-md"
                  type="submit"
                  disabled={loading}
                >
                  {loading ? "Enviando..." : "Confirmar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
