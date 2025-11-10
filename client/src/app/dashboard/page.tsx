// client/src/app/dashboard/page.tsx - CON FONDO DEGRADADO APLICADO

import InactivityLogout from "@/components/InactivityLogout";

export default function DashboardPage() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center text-white text-center p-4 sm:p-6 md:p-10"
      style={{
        background: "linear-gradient(180deg, #000000 0%, #1a1a1a 100%)",
      }}
    >
      <InactivityLogout />

      <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold mb-4 text-orange-500 drop-shadow-lg">
        Dashboard
      </h1>

      <p className="text-sm sm:text-base md:text-lg text-gray-300 mb-2">
        ¡Inicio de Sesión Exitoso! 🎉
      </p>

      <p className="text-xs sm:text-sm md:text-base text-gray-400 mb-1">
        Has completado el Login (R1). ¡Este será el panel de usuario!
      </p>

      <p className="text-xs sm:text-sm md:text-base text-gray-500 mt-2">
        Si estás inactivo 30 minutos, se cerrará tu sesión automáticamente.
      </p>
    </div>
  );
}
