"use client";
import React, { useEffect, useState, useCallback } from "react"; // 🚨 Agregado useCallback
import { io, Socket } from 'socket.io-client';
import ProtectedRoute from "@/components/Protectedroute";
import SeatMap from "@/components/SeatMap";
import ReservationSummary from "@/components/ReservationSummary";
import PaymentMethods from "@/components/PaymentMethods";
import Toast from "@/components/Toast";
import Header from "@/components/Header";
import { API_BASE, TOKEN_KEY } from '@/lib/config';
import { getPriceForHall } from '@/lib/pricing';
import { formatCurrency } from '@/lib/format';

type Seat = {
  id: string;
  row: string;
  number: number;
  status: string;
};

// 🚨 CORRECCIÓN SOCKET.IO: Usar el puerto 5000 del backend, no el puerto de la ventana
const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function ComprarPage() {
  const [selected, setSelected] = useState<Seat[]>([]);
  const [occupied, setOccupied] = useState<string[]>([]);
  const [paymentModal, setPaymentModal] = useState<{ open: boolean; seats: Seat[]; total: number } | null>(null);
  interface ShowtimeResponse { seatsBooked?: string[]; movie?: { title?: string }; startAt?: string; hall?: { name?: string } }
  const [showtime, setShowtime] = useState<ShowtimeResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ open: boolean; message: string; type?: 'success' | 'error' | 'info'; position?: 'top-right' | 'center' }>({ open: false, message: '' });

  // Obtener showtimeId desde la URL en tiempo de ejecución (cliente)
  const showtimeId = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('showtimeId') : null;

  // 🚨 CORRECCIÓN BUCLE INFINITO: Estabilizar la función onSelectionChange con useCallback
  const handleSelectionChange = useCallback((s: Seat[]) => {
    setSelected(s);
  }, [setSelected]); // Dependencia setSelected es estable

  useEffect(() => {
    if (!showtimeId) return;

    // extraer función para poder llamarla desde otros eventos (focus, popstate)
    const fetchShowtime = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/api/showtimes/${showtimeId}`);
        if (!res.ok) throw new Error('No se pudo obtener showtime');
        const data: ShowtimeResponse = await res.json();
        setShowtime(data);
        setOccupied(data.seatsBooked || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    // ejecutar inicialmente
    fetchShowtime();

    // re-ejecutar cuando la ventana recibe foco (volver desde otra página/tab)
    const onFocus = () => {
      try { fetchShowtime(); } catch (e) {}
    };
    const onPop = () => {
      // cuando el usuario navega de regreso con el historial
      try { fetchShowtime(); } catch (e) {}
    };
    window.addEventListener('focus', onFocus);
    window.addEventListener('popstate', onPop);

    // Conectar socket para recibir actualizaciones en tiempo real
    let socket: Socket | null = null;
    try {
      // 🚨 USO DE SOCKET_URL CORREGIDA
      socket = io(SOCKET_URL, { autoConnect: true }); 
      socket.on('connect', () => console.log('socket connected', socket?.id));
      socket.on('showtimeUpdated', (payload: unknown) => {
        try {
          if (!payload || typeof payload !== 'object') return;
          const p = payload as { _id?: string; seatsBooked?: unknown };
          if (!p._id) return;
          if (p._id === showtimeId) {
            // actualizar asientos ocupados
            if (Array.isArray(p.seatsBooked)) setOccupied(p.seatsBooked as string[]);
            // opcionalmente actualizar showtime meta
          }
        } catch (e) {
          console.error('Error procesando showtimeUpdated', e);
        }
      });
    } catch (e) {
      console.warn('No se pudo conectar socket', e);
    }

    return () => {
      try { if (socket) socket.disconnect(); } catch (e) {}
      try { window.removeEventListener('focus', onFocus); window.removeEventListener('popstate', onPop); } catch (e) {}
    };
  }, [showtimeId]);

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black text-white">
        <Header />

        <main className="p-8">
          <div className="max-w-6xl mx-auto">
            <h1 className="text-2xl font-bold text-amber-300 mb-2">Selecciona tus asientos</h1>
            {loading ? (
              <div className="text-slate-400 mb-4">Cargando información de la función...</div>
              ) : showtime ? (
              <div className="text-slate-400 mb-4">Película: <span className="text-white font-semibold">{showtime.movie?.title || '—'}</span> — Sala: <span className="text-white font-semibold">{showtime.hall?.name || '—'}</span>{' '}
                — Precio: <span className="text-white font-semibold">{formatCurrency(getPriceForHall(showtime.hall?.name, undefined))}</span></div>
            ) : (
              <div className="text-slate-400 mb-4">Selecciona un horario para ver los asientos</div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
              <div className="lg:col-span-2 flex justify-center">
                <SeatMap
                  occupiedSeats={occupied}
                  // 🚨 USO DE LA FUNCIÓN ESTABILIZADA
                  onSelectionChange={handleSelectionChange}
                />
              </div>

              <div className="lg:col-span-1 flex justify-center">
                <div className="w-full max-w-sm">
                    <ReservationSummary
                    seats={selected}
                    showtimeId={showtimeId}
                    onPurchase={async () => {
                      // abrir modal de pago y luego enviar compra
                      if (!showtimeId) {
                        setToast({ open: true, message: 'Showtime no seleccionado', type: 'error' });
                        return;
                      }
                      const total = selected.reduce((acc, s) => acc + (s.status === 'premium' ? 65 : 45), 0);
                      setPaymentModal({ open: true, seats: selected, total });
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </main>
        {paymentModal && paymentModal.open && (
          <PaymentMethods
            amount={formatCurrency(paymentModal.total)}
            onCancel={() => setPaymentModal(null)}
            onConfirm={async (paymentInfo) => {
              if (!showtimeId) {
                setToast({ open: true, message: 'Showtime no seleccionado', type: 'error' });
                return;
              }
              try {
                const token = localStorage.getItem(TOKEN_KEY);
                const res = await fetch(`${API_BASE}/api/purchases`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', Authorization: token ? `Bearer ${token}` : '' },
                  body: JSON.stringify({ showtimeId, seats: paymentModal.seats.map(s => s.id), paymentInfo }),
                });
                if (!res.ok) {
                  const b = await res.json().catch(() => ({} as { message?: string }));
                  throw new Error(b.message || 'Error al crear compra');
                }
                const body = await res.json();
                // body.showtime contiene seatsBooked
                setOccupied(body.showtime?.seatsBooked || []);
                setSelected([]);
                setPaymentModal(null);
                setToast({ open: true, message: 'Compra y reserva exitosa', type: 'success', position: 'center' });
              } catch (err: unknown) {
                let msg = 'No se pudo procesar la compra';
                if (err && typeof err === 'object' && 'message' in err) msg = (err as { message?: string }).message || msg;
                setToast({ open: true, message: msg, type: 'error', position: 'top-right' });
              }
            }}
          />
        )}
    <Toast open={toast.open} message={toast.message} type={toast.type} position={toast.position} onClose={() => setToast({ open: false, message: '', type: 'info' })} />
      </div>
    </ProtectedRoute>
  );
}