import InactivityLogout from "@/components/InactivityLogout";

export default function DashboardPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-white bg-black">
      <InactivityLogout />
      <h1 className="text-4xl font-bold mb-4">Dashboard </h1>
      <p>Si estás inactivo 5 minutos, se cerrará tu sesión automáticamente.</p>
    </div>
  );
}
