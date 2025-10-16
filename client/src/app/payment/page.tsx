"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function PaymentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const movieTitle = searchParams.get("movieTitle");
  const seats = searchParams.get("seats")?.split(",") || [];
  const total = searchParams.get("total");
  const date = searchParams.get("date");
  const time = searchParams.get("time");
  const sala = searchParams.get("sala");

  const [processing, setProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  const handlePayment = () => {
    setProcessing(true);
    setTimeout(() => {
      setProcessing(false);
      setPaymentSuccess(true);

      // 🧾 Simulamos confirmación y redirigimos al dashboard o inicio
      setTimeout(() => {
        router.push("/"); // puedes cambiar a /dashboard o /movies
      }, 3000);
    }, 2000);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-black via-gray-900 to-black text-white p-6">
      <div className="max-w-lg w-full bg-gray-900/70 rounded-2xl border border-gray-700 shadow-2xl p-8 text-center">
        <h1 className="text-3xl font-bold text-yellow-400 mb-4">
          Información de Pago 💳
        </h1>

        {!paymentSuccess ? (
          <>
            <p className="text-gray-300 mb-6">
              Estás a punto de completar la compra para:
            </p>

            <div className="text-left space-y-2 bg-gray-800/50 p-4 rounded-lg border border-gray-700 mb-6">
              <p><span className="font-semibold text-yellow-400">🎬 Película:</span> {movieTitle}</p>
              <p><span className="font-semibold text-yellow-400">📅 Fecha:</span> {date}</p>
              <p><span className="font-semibold text-yellow-400">🕒 Hora:</span> {time}</p>
              <p><span className="font-semibold text-yellow-400">🏛️ Sala:</span> {sala}</p>
              <p><span className="font-semibold text-yellow-400">🎟️ Asientos:</span> {seats.join(", ")}</p>
              <p className="text-xl font-bold text-green-400 mt-3">
                Total: Q{total}
              </p>
            </div>

            <div className="space-y-3">
              <input
                type="text"
                placeholder="Número de tarjeta (simulado)"
                className="w-full p-3 rounded-lg bg-black/40 border border-gray-600 text-white text-center focus:ring-2 focus:ring-yellow-400"
              />
              <input
                type="text"
                placeholder="Nombre en la tarjeta"
                className="w-full p-3 rounded-lg bg-black/40 border border-gray-600 text-white text-center focus:ring-2 focus:ring-yellow-400"
              />
              <div className="flex gap-3">
                <input
                  type="text"
                  placeholder="MM/AA"
                  className="w-1/2 p-3 rounded-lg bg-black/40 border border-gray-600 text-white text-center focus:ring-2 focus:ring-yellow-400"
                />
                <input
                  type="text"
                  placeholder="CVV"
                  className="w-1/2 p-3 rounded-lg bg-black/40 border border-gray-600 text-white text-center focus:ring-2 focus:ring-yellow-400"
                />
              </div>
              <button
                onClick={handlePayment}
                disabled={processing}
                className={`w-full py-3 rounded-xl font-semibold text-lg mt-4 transition-colors ${
                  processing
                    ? "bg-gray-700 cursor-not-allowed text-gray-400"
                    : "bg-red-600 hover:bg-red-700 text-white"
                }`}
              >
                {processing ? "Procesando pago..." : "Confirmar pago"}
              </button>
            </div>
          </>
        ) : (
          <div className="mt-10">
            <h2 className="text-2xl font-bold text-green-400 mb-4">✅ ¡Pago realizado con éxito!</h2>
            <p className="text-gray-400">Tu compra ha sido confirmada.</p>
            <p className="text-gray-400">Gracias por usar Cine GT 🎥</p>
          </div>
        )}
      </div>
    </div>
  );
}
