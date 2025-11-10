"use client";
export default function WelcomePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-white bg-black text-center p-4">
      <h1 className="text-5xl md:text-6xl font-bold text-orange-500 mb-4">
        Bienvenido
      </h1>
      <p className="text-lg md:text-2xl text-gray-300">
        Has iniciado sesión correctamente.
      </p>
    </div>
  );
}
