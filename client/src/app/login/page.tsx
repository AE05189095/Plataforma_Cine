// client/src/app/login/page.tsx - CON SUBTÍTULO AGREGADO

"use client";

import { useState, FormEvent } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export default function LoginPage() {
  const pathname = usePathname();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'Credenciales incorrectas. Por favor, revisa tu email y contraseña.');
        setLoading(false);
        return;
      }
      
      localStorage.setItem('authToken', data.token);
      router.push('/dashboard'); 
      
    } catch (err) {
      setError('Error de conexión. Asegúrate de que el servidor Express esté encendido (Puerto 5000).');
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-start min-h-screen bg-black p-6 space-y-6">

      {/* CONTENEDOR DEL BOTÓN VOLVER A INICIO */}
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
        {/* Usamos un div para agrupar el título y el subtítulo, y lo separamos del resto del contenido */}
        <div className="space-y-2">
            <h2 className="text-3xl font-bold text-center text-white">
                Iniciar Sesión
            </h2>
            {/* NUEVO TEXTO: Subtítulo de descripción */}
            <p className="text-center text-gray-400 text-sm">
                Ingresa tus credenciales para acceder a tu cuenta
            </p>
        </div>
        
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
              name="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 mt-1 border border-red-600 bg-gray-800 text-white rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 placeholder:text-gray-400"
              placeholder="tu@correo.com"
            />
          </div>

          <div className="max-w-xs mx-auto">
            <label htmlFor="password" className="block text-sm font-medium text-white">
              Contraseña
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 mt-1 border border-red-600 bg-gray-800 text-white rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 placeholder:text-gray-400"
              placeholder="••••••••"
            />
          </div>

          <div className="max-w-xs mx-auto">
            <button
              className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl border border-red-600 px-2 py-2 text-base font-medium whitespace-nowrap transition-colors focus-visible:ring-[3px] focus-visible:outline-1 disabled:pointer-events-none disabled:opacity-50 text-white bg-transparent hover:bg-red-600 hover:text-white focus:ring-red-500 shadow-md"
              type="submit" 
              disabled={loading} 
            >
              {loading ? 'Validando...' : 'Iniciar Sesión'}
            </button>
          </div>
        </form>
        
        <div className="text-center text-sm text-gray-400">
          ¿No tienes cuenta? <a href="/register" className="font-medium text-red-400 hover:text-red-300">Regístrate aquí</a>
        </div>
      </div>
    </div>
  );
}