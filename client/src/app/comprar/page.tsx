"use client";
import React, { useEffect, useState } from "react";
let io: any = null;
let Socket: any = null;
const disableSocketsClient = (typeof process !== 'undefined' && process.env && (process.env.NEXT_PUBLIC_DISABLE_SOCKETS || '').toLowerCase() === '1') || (typeof window !== 'undefined' && (window as any).__DISABLE_SOCKETS__);
if (!disableSocketsClient) {
  try {
    // import dinámico para evitar bundling si está deshabilitado
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    ({ io, Socket } = require('socket.io-client'));
  } catch (e) {
    console.warn('socket.io-client no disponible en cliente', e);
    io = null;
    Socket = null;
  }
}
import ProtectedRoute from "@/components/Protectedroute";
import SeatMap from "@/components/SeatMap";
import ReservationSummary from "@/components/ReservationSummary";
import PaymentMethods from "@/components/PaymentMethods";
import Toast from "@/components/Toast";
import Header from "@/components/Header";
import ReservationCountdown from '@/components/ReservationCountdown';
import { API_BASE, TOKEN_KEY } from '@/lib/config';
import { getPriceForHall } from '@/lib/pricing';
import { formatCurrency } from '@/lib/format';

type Seat = {
  id: string;
  row: string;
  number: number;
  status: string;
};

export default function ComprarPage() {
  const [selected, setSelected] = useState<Seat[]>([]);
  const [occupied, setOccupied] = useState<string[]>([]);
  const [paymentModal, setPaymentModal] = useState<{ open: boolean; seats: Seat[]; total: number } | null>(null);
  interface ShowtimeResponse { seatsBooked?: string[]; movie?: { title?: string }; startAt?: string; hall?: { name?: string } }
  const [showtime, setShowtime] = useState<ShowtimeResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ open: boolean; message: string; type?: 'success' | 'error' | 'info'; position?: 'top-right' | 'center' }>({ open: false, message: '' });
  const [holdId, setHoldId] = useState<string | null>(null);
  const [holdReservedUntil, setHoldReservedUntil] = useState<string | null>(null);

  // Obtener showtimeId desde la URL en tiempo de ejecución (cliente)
  const showtimeId = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('showtimeId') : null;
  // función reutilizable para refrescar showtime y asientos ocupados
  const refreshShowtime = async () => {
    if (!showtimeId) return;
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

  useEffect(() => {
    if (!showtimeId) return;

    // ejecutar inicialmente
    refreshShowtime();

    // re-ejecutar cuando la ventana recibe foco (volver desde otra página/tab)
    const onFocus = () => {
      try { refreshShowtime(); } catch {}
    };
    const onPop = () => {
      // cuando el usuario navega de regreso con el historial
      try { refreshShowtime(); } catch {}
    };
    window.addEventListener('focus', onFocus);
    window.addEventListener('popstate', onPop);

    // Conectar socket para recibir actualizaciones en tiempo real
    const socketUrl = typeof window !== 'undefined' ? window.location.origin : '';
  let socket: any = null;
    try {
      socket = io(socketUrl, { autoConnect: true });
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
      try { if (socket) socket.disconnect(); } catch {}
      try { window.removeEventListener('focus', onFocus); window.removeEventListener('popstate', onPop); } catch {}
    };
  }, [showtimeId]);

  // Gestionar release/update del hold de forma controlada:
  // - Si el usuario deselecciona todo y existe un hold, liberarlo (no recrearlo automáticamente)
  // - Si el modal de pago está abierto y hay un hold, actualizarlo cuando cambien los asientos
  useEffect(() => {
    if (!showtimeId) return;
    const token = typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null;
    if (!token) return;

    let active = true;

    const releaseHold = async (id: string) => {
      try {
        await fetch(`${API_BASE}/api/purchases/${id}/release`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      } catch (e) {
        // Silenciar error
      }
    };

    const updateHold = async (id: string, seatIds: string[]) => {
      try {
        const res = await fetch(`${API_BASE}/api/purchases/${id}/update-hold`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ showtimeId, seats: seatIds, holdMinutes: 10 })
        });
        if (!res.ok) {
          const b = await res.json().catch(() => ({} as any));
          setToast({ open: true, message: b.message || 'No se pudo actualizar la reserva', type: 'error' });
          return null;
        }
        const body = await res.json();
        if (body && body.meta && body.meta.reservedUntil) setHoldReservedUntil(body.meta.reservedUntil);
      } catch (e) {
        setToast({ open: true, message: 'Error de red al actualizar reserva', type: 'error' });
      }
    };

    (async () => {
      // Si el usuario deselecciona todo, liberar el hold (si existe) y no recrearlo automáticamente
      if (selected.length === 0) {
        if (holdId) {
          await releaseHold(holdId);
          if (active) { setHoldId(null); setHoldReservedUntil(null); }
          try { await refreshShowtime(); } catch {}
        }
        return;
      }

      // Si la ventana de pago está abierta y ya tenemos un hold, actualizar los asientos del hold
      if (paymentModal && paymentModal.open && holdId) {
        const seatIds = selected.map(s => s.id);
        await updateHold(holdId, seatIds);
      }
    })();

    // Solo liberar con beforeunload si el modal de pago está abierto (evitar liberar por navegación fuera de selección)
    const handleBeforeUnload = async (e?: BeforeUnloadEvent) => {
      if (paymentModal && paymentModal.open && holdId) {
        await releaseHold(holdId);
        setHoldId(null); setHoldReservedUntil(null);
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      active = false;
      try { window.removeEventListener('beforeunload', handleBeforeUnload); } catch {}
    };
  }, [selected, showtimeId, holdId, paymentModal]);

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
                  onSelectionChange={(s) => setSelected(s as Seat[])}
                />
              </div>

              <div className="lg:col-span-1 flex justify-center">
                <div className="w-full max-w-md">
                    <ReservationSummary
                      seats={selected}
                      showtimeId={showtimeId}
                      onPurchase={async () => {
                        // abrir modal de pago: crear hold aquí si no existe
                        if (!showtimeId) {
                          setToast({ open: true, message: 'Showtime no seleccionado', type: 'error' });
                          return;
                        }
                        if (selected.length === 0) {
                          setToast({ open: true, message: 'Selecciona al menos un asiento', type: 'error' });
                          return;
                        }
                        const total = selected.reduce((acc, s) => acc + (s.status === 'premium' ? 65 : 45), 0);

                        // si no hay hold, crear uno de 10 minutos
                        const token = typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null;
                        if (!holdId && token) {
                          try {
                            const res = await fetch(`${API_BASE}/api/purchases/hold`, {
                              method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                              body: JSON.stringify({ showtimeId, seats: selected.map(s => s.id), holdMinutes: 10 })
                            });
                            if (!res.ok) {
                              const b = await res.json().catch(() => ({} as any));
                              setToast({ open: true, message: b.message || 'No se pudo crear la reserva', type: 'error' });
                              return;
                            }
                            const body = await res.json();
                            const newId = body.purchase ? String(body.purchase._id || body.purchase.id) : null;
                            if (newId) {
                              setHoldId(newId);
                              // si el servidor devolvió meta.reservedUntil, guárdalo para el countdown
                              if (body.meta && body.meta.reservedUntil) setHoldReservedUntil(body.meta.reservedUntil);
                            }
                          } catch (e) {
                            setToast({ open: true, message: 'Error de red al crear reserva', type: 'error' });
                            return;
                          }
                        }

                        setPaymentModal({ open: true, seats: selected, total });
                      }}
                    />
                    <div className="mt-4">
                      {/* Mostrar contador sólo si el usuario está en la ventana de pago (paymentModal abierto) */}
                      {paymentModal && paymentModal.open ? (
                        <ReservationCountdown holdId={holdId} reservedUntil={holdReservedUntil} onExpire={() => { setHoldId(null); setSelected([]); setPaymentModal(null); setToast({ open: true, message: 'La reserva expiró', type: 'info' }); }} />
                      ) : null}
                    </div>
                </div>
              </div>
            </div>
          </div>
        </main>
        {paymentModal && paymentModal.open && (
          <PaymentMethods
            amount={formatCurrency(paymentModal.total)}
            onCancel={async () => {
              // liberar hold si existe al cancelar
              try {
                const token = localStorage.getItem(TOKEN_KEY);
                if (holdId && token) await fetch(`${API_BASE}/api/purchases/${holdId}/release`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
              } catch (e) {}
              setHoldId(null); setHoldReservedUntil(null); setPaymentModal(null);
              try { await refreshShowtime(); } catch {}
            }}
            onConfirm={async (paymentInfo) => {
              if (!showtimeId) {
                setToast({ open: true, message: 'Showtime no seleccionado', type: 'error' });
                return;
              }
              try {
                const token = localStorage.getItem(TOKEN_KEY);
                const payload: any = { showtimeId, seats: paymentModal.seats.map(s => s.id), paymentInfo };
                if (holdId) payload.holdId = holdId;
                const res = await fetch(`${API_BASE}/api/purchases`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', Authorization: token ? `Bearer ${token}` : '' },
                  body: JSON.stringify(payload),
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
                // limpiar hold local si existía
                setHoldId(null); setHoldReservedUntil(null);
                setToast({ open: true, message: 'Compra y reserva exitosa', type: 'success', position: 'center' });
                try { await refreshShowtime(); } catch {}
              } catch (err: unknown) {
                let msg = 'No se pudo procesar la compra';
                if (err && typeof err === 'object' && 'message' in err) msg = (err as { message?: string }).message || msg;
                        setToast({ open: true, message: msg, type: 'error', position: 'top-right' });
                        // refrescar asientos en caso de conflicto para evitar inconsistencias visuales
                        try { await refreshShowtime(); } catch {}
              }
            }}
          />
        )}
  <Toast open={toast.open} message={toast.message} type={toast.type} position={toast.position} onClose={() => setToast({ open: false, message: '', type: 'info' })} />
      </div>
    </ProtectedRoute>
  );
}