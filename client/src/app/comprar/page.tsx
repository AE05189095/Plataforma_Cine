"use client";
import ProtectedRoute from "@/components/Protectedroute";

export default function ComprarPage() {
  return (
    <ProtectedRoute>
      <main className="p-8">
        <h1 className="text-2xl font-bold">Proceso de Compra</h1>
        <p>Solo usuarios autenticados pueden ver esto.</p>
        {/* Aquí después irá la lógica de pago o selección de asientos */}
      </main>
    </ProtectedRoute>
  );
}
