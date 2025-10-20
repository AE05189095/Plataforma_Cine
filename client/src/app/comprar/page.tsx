// client/src/app/comprar/page.tsx
"use client";
import React, { useEffect, useState, useCallback } from "react";
import { io, Socket } from 'socket.io-client';
import { useRouter } from 'next/navigation';

// 🛑 SOLUCIÓN FORZADA DE CASING: Usamos 'Protectedroute' (r minúscula)
// para resolver el conflicto de nombre de archivo detectado por TypeScript en su entorno.
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
  status: 'available' | 'premium' | 'occupied' | 'reserved' | 'selected';
};

interface ShowtimeResponse { 
  seatsBooked?: string[];
  seatsLocked?: string[];
  movie?: { title?: string }; 
  startAt?: string; 
  hall?: { name?: string } 
}

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function ComprarPage() {
  const router = useRouter();
  const [selected, setSelected] = useState<Seat[]>([]);
  const [occupied, setOccupied] = useState<string[]>([]);
  const [reserved, setReserved] = useState<string[]>([]);
  const [expirationTime, setExpirationTime] = useState<Date | null>(null);
  const [paymentModal, setPaymentModal] = useState<{ open: boolean; seats: Seat[]; total: number } | null>(null);
  const [showtime, setShowtime] = useState<ShowtimeResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ open: boolean; message: string; type?: 'success' | 'error' | 'info'; position?: 'top-right' | 'center' }>({ open: false, message: '' });

  const showtimeId = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('showtimeId') : null;
  
  // LÓGICA DE BLOQUEO DE ASIENTOS EN EL SERVIDOR
  const updateSeatLocks = useCallback(async (newSelectedSeats: Seat[]) => {
    if (!showtimeId) return;

    const seatIds = newSelectedSeats.map(s => s.id);
    const token = localStorage.getItem(TOKEN_KEY);

    try {
      const res = await fetch(`${API_BASE}/api/showtimes/${showtimeId}/lock-seats`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ seatIds }),
      });

      const data = await res.json();
      
      if (res.ok) {
        setReserved(data.lockedSeats || []);
        
        if (data.expirationTime) {
          setExpirationTime(new Date(data.expirationTime));
        } else {
          setExpirationTime(null);
        }

        if (data.userLockedSeats) {
          const newSelection = newSelectedSeats.filter(s => data.userLockedSeats.includes(s.id));
          if (newSelection.length !== newSelectedSeats.length) {
            setSelected(newSelection);
          }
        }

      } else {
        if (res.status === 401) {
          router.replace(`/login?next=${encodeURIComponent(window.location.pathname + window.location.search)}`);
          return;
        }
        setToast({ open: true, message: data.msg || 'Error al actualizar reserva', type: 'error', position: 'center' });
      }
    } catch (error) {
      console.error(error);
      setToast({ open: true, message: 'Fallo de conexión al servidor.', type: 'error', position: 'top-right' });
    }
  }, [showtimeId, router]);


  // MANEJO DE SELECCIÓN DE ASIENTOS (LLAMA A LA FUNCIÓN DE BLOQUEO)
  const handleSelectionChange = useCallback((s: Seat[]) => {
    setSelected(s);
    updateSeatLocks(s); 
  }, [updateSeatLocks]);

  // FUNCIÓN DE CIERRE DE CONTADOR (AL EXPIRAR)
  const handleExpiration = useCallback(() => {
    setSelected([]);
    setExpirationTime(null);
    updateSeatLocks([]); 
    setToast({ open: true, message: 'Tu reserva temporal ha expirado. Selecciona de nuevo.', type: 'info', position: 'center' });
  }, [updateSeatLocks]);
  
  // FUNCIÓN DE FETCH (Inicial/Refresco)
  const fetchShowtime = useCallback(async () => {
    if (!showtimeId) return;
    setLoading(true);
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      const res = await fetch(`${API_BASE}/api/showtimes/${showtimeId}`, {
        headers: { 'Authorization': token ? `Bearer ${token}` : '' }
      });
      
      if (!res.ok) throw new Error('No se pudo obtener showtime');
      const data: ShowtimeResponse = await res.json();
      setShowtime(data);
      setOccupied(data.seatsBooked || []);
      setReserved(data.seatsLocked || []); 
      
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [showtimeId]);


  // EFFECT (Inicialización/Sockets)
  useEffect(() => {
    if (!showtimeId) return;

    const onFocus = () => { try { fetchShowtime(); } catch (e) {} };
    const onPop = () => { try { fetchShowtime(); } catch (e) {} };
    window.addEventListener('focus', onFocus);
    window.addEventListener('popstate', onPop);

    fetchShowtime();

    let socket: Socket | null = null;
    try {
      socket = io(SOCKET_URL, { autoConnect: true }); 
      socket.on('connect', () => socket?.emit('joinShowtime', showtimeId));

      socket.on('seatsLocked', (payload: unknown) => {
        const p = payload as { showtimeId?: string; seats?: unknown };
        if (p.showtimeId === showtimeId && Array.isArray(p.seats)) setReserved(p.seats as string[]);
      });
      
    } catch (e) {
      console.warn('No se pudo conectar socket', e);
    }

    return () => {
      try { if (socket) socket.disconnect(); } catch (e) {}
      try { window.removeEventListener('focus', onFocus); window.removeEventListener('popstate', onPop); } catch (e) {}
    };
  }, [showtimeId, fetchShowtime]);
  
  
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
                  reservedSeats={reserved}
                  selectedSeats={selected.map(s=>s.id)}
                  onSelectionChange={handleSelectionChange}
                />
              </div>

              <div className="lg:col-span-1 flex justify-center">
                <div className="w-full max-w-sm">
                  <ReservationSummary
                    seats={selected}
                    showtimeId={showtimeId}
                    expirationTime={expirationTime}
                    onExpiration={handleExpiration}
                    onPurchase={async () => {
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
                  setOccupied(body.showtime?.seatsBooked || []);
                  setSelected([]);
                  setExpirationTime(null);
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