"use client";
import { useEffect, useState } from "react";
import { apiFetch } from "@/services/api";
import { useParams, useRouter } from "next/navigation";

interface Showtime {
  _id: string;
  movie?: { title: string };
  hall?: { name: string };
  startAt?: string;
  price: number;
  seatsBooked: string[];
}

export default function ShowtimeSeatsPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [showtime, setShowtime] = useState<Showtime | null>(null);
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [booked, setBooked] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState(600);
  const [showPaymentForm, setShowPaymentForm] = useState(false);

  // 🔹 Datos del pago simulado
  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");

  const seatPrice = 45;
  const premiumPrice = 60;

  // Cargar showtime
  useEffect(() => {
    const fetchShowtime = async () => {
      try {
        const data = await apiFetch<Showtime>(`/showtimes/${id}`);
        setShowtime(data);
        setBooked(data.seatsBooked || []);
      } catch (error: any) {
        alert("Error al cargar función: " + error.message);
      } finally {
        setLoading(false);
      }
    };
    fetchShowtime();
  }, [id]);

  // Temporizador
  useEffect(() => {
    if (loading) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setSelectedSeats([]);
          alert("⏰ Tiempo agotado. Los asientos fueron liberados.");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [loading]);

  const toggleSeat = (seat: string) => {
    if (timeLeft <= 0) return;
    setSelectedSeats((prev) =>
      prev.includes(seat)
        ? prev.filter((s) => s !== seat)
        : [...prev, seat]
    );
  };

  const calculateTotal = () => {
    const premiumSeats = selectedSeats.filter((s) =>
      ["A", "B"].some((row) => s.startsWith(row))
    ).length;
    const regularSeats = selectedSeats.length - premiumSeats;
    return premiumSeats * premiumPrice + regularSeats * seatPrice;
  };

  // 🪙 Mostrar formulario de pago
  const handleReservaClick = () => {
    if (selectedSeats.length === 0) {
      alert("Selecciona al menos un asiento antes de continuar.");
      return;
    }
    setShowPaymentForm(true);
  };

  // 💳 Confirmar pago simulado
  const handleConfirmarPago = async () => {
    if (!cardName || !cardNumber || !expiry || !cvv) {
      alert("Por favor completa todos los campos de pago.");
      return;
    }

    try {
      await apiFetch(`/purchases`, {
        method: "POST",
        body: { showtimeId: id, seats: selectedSeats },
      });

      alert(`🎟️ ¡Compra confirmada para ${showtime?.movie?.title}!`);
      setSelectedSeats([]);
      setShowPaymentForm(false);

      // Refresca los asientos ocupados
      const updated = await apiFetch<Showtime>(`/showtimes/${id}`);
      setBooked(updated.seatsBooked || []);
    } catch (err: any) {
      alert("Error al registrar la compra: " + err.message);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  if (loading)
    return (
      <div className="flex justify-center items-center min-h-screen text-white bg-black">
        Cargando función...
      </div>
    );

  if (!showtime)
    return (
      <div className="flex justify-center items-center min-h-screen text-white bg-black">
        No se encontró la función.
      </div>
    );

  const movieTitle = showtime.movie?.title || "Película desconocida";
  const hallName = showtime.hall?.name || "Sala no especificada";
  const showtimeDate = showtime.startAt
    ? new Date(showtime.startAt).toLocaleString("es-GT", {
        dateStyle: "full",
        timeStyle: "short",
      })
    : "Fecha no disponible";

  const rows = "ABCDEFGHIJ".split("");
  const cols = Array.from({ length: 10 }, (_, i) => i + 1);
  const getSeatId = (row: string, col: number) => `${row}${col}`;

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black text-white flex flex-col items-center py-8">
      <div className="max-w-6xl w-full flex flex-col lg:flex-row justify-between gap-10 px-4">
        {/* Info Película */}
        <div className="flex-1">
          <h1 className="text-4xl font-bold text-yellow-400 mb-2">{movieTitle}</h1>
          <div className="text-gray-300 mb-6 space-y-1">
            <p>📅 {showtimeDate}</p>
            <p>🏛️ {hallName}</p>
            <p>💰 Precio base: Q{showtime.price}</p>
          </div>

          <div className="flex items-center justify-center bg-gray-800 text-yellow-400 rounded-xl py-2 px-4 mb-6 border border-yellow-600 font-bold text-lg">
            ⏰ Tiempo restante: {formatTime(timeLeft)}
          </div>

          {/* Asientos */}
          <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
            <h2 className="text-2xl font-semibold mb-4 text-center">Selecciona tus asientos</h2>

            <div className="text-center mb-4">
              <div className="bg-yellow-500 text-black font-bold rounded-md py-1 px-6 inline-block">
                PANTALLA
              </div>
            </div>

            <div className="flex flex-col items-center gap-2 mt-4">
              {rows.map((row) => (
                <div key={row} className="flex gap-2">
                  {cols.map((col) => {
                    const seatId = getSeatId(row, col);
                    const isBooked = booked.includes(seatId);
                    const isSelected = selectedSeats.includes(seatId);
                    const isPremium = ["A", "B"].includes(row);

                    return (
                      <button
                        key={seatId}
                        onClick={() => toggleSeat(seatId)}
                        disabled={isBooked || timeLeft <= 0}
                        className={`w-8 h-8 text-xs font-semibold rounded-md transition-colors border 
                          ${
                            isBooked
                              ? "bg-gray-600 cursor-not-allowed"
                              : isSelected
                              ? "bg-red-600 border-red-700 text-white"
                              : isPremium
                              ? "bg-yellow-400 text-black hover:bg-yellow-300"
                              : "bg-gray-200 text-black hover:bg-gray-400"
                          }`}
                      >
                        {col}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Panel lateral */}
        <div className="w-full lg:w-80 bg-gray-900/70 rounded-xl shadow-lg border border-gray-700 p-6 flex flex-col justify-between">
          <h2 className="text-2xl font-bold text-yellow-400 mb-4">Resumen</h2>
          <p>🎬 {movieTitle}</p>
          <p>📅 {showtimeDate}</p>
          <p>🏛️ {hallName}</p>
          <p>💺 {selectedSeats.join(", ") || "Ninguno"}</p>
          <p className="text-xl font-bold text-yellow-400 mt-2">
            Total: Q{calculateTotal()}
          </p>
          <button
            onClick={handleReservaClick}
            className="mt-6 py-3 rounded-lg font-semibold text-lg bg-red-600 hover:bg-red-700 text-white"
          >
            Proceder al pago
          </button>
        </div>
      </div>

      {/* 💳 Formulario de pago simulado */}
      {showPaymentForm && (
        <div className="fixed inset-0 bg-black/80 flex justify-center items-center z-50">
          <div className="bg-gray-900 p-8 rounded-2xl shadow-xl w-96 border border-yellow-500">
            <h2 className="text-2xl font-bold text-yellow-400 mb-4 text-center">
              Pago Simulado
            </h2>

            <input
              type="text"
              placeholder="Nombre del titular"
              value={cardName}
              onChange={(e) => setCardName(e.target.value)}
              className="w-full mb-3 p-2 rounded bg-gray-800 text-white border border-gray-600"
            />
            <input
              type="text"
              placeholder="Número de tarjeta"
              value={cardNumber}
              onChange={(e) => setCardNumber(e.target.value)}
              className="w-full mb-3 p-2 rounded bg-gray-800 text-white border border-gray-600"
            />
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                placeholder="MM/AA"
                value={expiry}
                onChange={(e) => setExpiry(e.target.value)}
                className="w-1/2 p-2 rounded bg-gray-800 text-white border border-gray-600"
              />
              <input
                type="text"
                placeholder="CVV"
                value={cvv}
                onChange={(e) => setCvv(e.target.value)}
                className="w-1/2 p-2 rounded bg-gray-800 text-white border border-gray-600"
              />
            </div>

            <div className="flex justify-between mt-6">
              <button
                onClick={() => setShowPaymentForm(false)}
                className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg text-white"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmarPago}
                className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg text-white font-bold"
              >
                Confirmar pago
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
