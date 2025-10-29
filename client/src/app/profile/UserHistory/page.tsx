"use client";
import React, { useEffect, useState } from "react";
import ProtectedRoute from "@/components/Protectedroute";
import { API_BASE, TOKEN_KEY } from "@/lib/config";

type ShowtimeType = {
  _id: string;
  movie?: { title: string };
  hall?: { name: string };
  startAt?: string;
  date?: string;
  time?: string;
  price?: number;
  seatsBooked?: string[];
};


type Purchase = {
  _id: string;
  showtime: string | ShowtimeType;
  seats: string[];
  totalPrice: number;
  status?: string;
  createdAt?: string;
};

function isShowtimeObject(showtime: string | ShowtimeType): showtime is ShowtimeType {
  return typeof showtime === "object" && showtime !== null;
}

export default function UserHistoryPage() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; type: "error" | "success" } | null>(null);
  const [cancelingId, setCancelingId] = useState<string | null>(null);

  useEffect(() => {
    const fetchPurchases = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem(TOKEN_KEY);
        if (!token) {
          setError("No autenticado");
          setLoading(false);
          return;
        }
        const res = await fetch(`${API_BASE}/api/purchases/user/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          setError(body.message || "Error al obtener historial");
          setLoading(false);
          return;
        }
        const data: Purchase[] = await res.json();
        setPurchases(data);
      } catch {
        setError("Error de red");
      } finally {
        setLoading(false);
      }
    };
    fetchPurchases();
  }, []);

  const formatDateTime = (isoString?: string | Date) => {
    if (!isoString) return "N/A";
    const date = isoString instanceof Date ? isoString : new Date(isoString);
    return date.toLocaleString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const canCancel = (purchase: Purchase) => purchase.status !== "cancelled";

  const handleCancel = async (id: string) => {
    if (!window.confirm("¿Estás seguro que quieres cancelar esta compra?")) return;

    setCancelingId(id);
    setMessage(null);
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      const res = await fetch(`${API_BASE}/api/purchases/${id}/cancel`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        console.error("Cancel purchase error:", { status: res.status, statusText: res.statusText, body });
        setMessage({
          text: `Error cancelando compra: ${res.status} ${res.statusText} ${JSON.stringify(body)}`,
          type: "error",
        });
        setCancelingId(null);
        return;
      }
      setPurchases(prev =>
        prev.map(p => (p._id === id ? { ...p, status: "cancelled" } : p))
      );
      setMessage({ text: "Compra cancelada", type: "success" });
    } catch (err) {
      console.error("Cancel purchase error:", err);
      setMessage({ text: "Error cancelando compra", type: "error" });
    } finally {
      setCancelingId(null);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black text-white p-8 max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold text-amber-300 mb-4">Historial de entradas</h1>

        {message && (
          <div className={message.type === "error" ? "text-red-400 mb-2" : "text-green-400 mb-2"}>
            {message.text}
          </div>
        )}

        {loading ? (
          <div className="text-slate-400">Cargando...</div>
        ) : error ? (
          <div className="text-red-400">{error}</div>
        ) : purchases.length === 0 ? (
          <div className="text-slate-400">No hay compras realizadas.</div>
        ) : (
          <table className="w-full text-left border-collapse border border-gray-600">
            <thead>
              <tr className="bg-gray-800">
                <th className="px-4 py-2 border border-gray-600">Película</th>
                <th className="px-4 py-2 border border-gray-600">Sala</th>
                <th className="px-4 py-2 border border-gray-600">Fecha y hora</th>
                <th className="px-4 py-2 border border-gray-600">Asientos</th>
                <th className="px-4 py-2 border border-gray-600">Precio total</th>
                <th className="px-4 py-2 border border-gray-600">Acción</th>
              </tr>
            </thead>
            <tbody>
              {purchases.map(p => {
                let movieTitle = "N/A";
                let purchaseDate = "N/A";
                if (isShowtimeObject(p.showtime)) {
                  movieTitle = p.showtime.movie?.title || "N/A";
                  // usar startAt si existe
                  if (p.showtime.startAt) {
                    purchaseDate = formatDateTime(p.showtime.startAt);
                  } else if (p.showtime.date && p.showtime.time) {
                    purchaseDate = formatDateTime(`${p.showtime.date}T${p.showtime.time}`);
                  }
                } else if (typeof p.showtime === "string") {
                  const parts = p.showtime.split("-gen-")[0];
                  movieTitle = parts
                    .split("-")
                    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(" ");
                  purchaseDate = formatDateTime(p.createdAt);
                }

                const hallName = isShowtimeObject(p.showtime) ? p.showtime.hall?.name || "Sala" : "Sala";
                const status = p.status || "reserved";

                return (
                  <tr key={p._id} className="border-t border-gray-600 hover:bg-gray-800">
                    <td className="px-4 py-2">{movieTitle}</td>
                    <td className="px-4 py-2">{hallName}</td>
                    <td className="px-4 py-2">{purchaseDate}</td>
                    <td className="px-4 py-2">{p.seats.join(", ")}</td>
                    <td className="px-4 py-2">{p.totalPrice.toFixed(2)}</td>
                    <td className="px-4 py-2">
                      {status === "cancelled" ? (
                        <span className="text-red-400 font-bold">Cancelada</span>
                      ) : (
                        <button
                          className="bg-red-600 px-3 py-1 rounded hover:bg-red-700"
                          onClick={() => handleCancel(p._id)}
                          disabled={!canCancel(p) || cancelingId === p._id}
                        >
                          {cancelingId === p._id ? "Cancelando..." : "Cancelar"}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </ProtectedRoute>
  );
}

















