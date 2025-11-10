"use client";
import React, { useEffect, useState, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from 'next/navigation';

import ProtectedRoute from "@/components/Protectedroute";
import SeatMap from "@/components/SeatMap";
import ReservationSummary from "@/components/ReservationSummary";
import PaymentMethods from "@/components/PaymentMethods";
import Toast from "@/components/Toast";
import Header from "@/components/Header";
import { API_BASE, TOKEN_KEY } from '@/lib/config';
import { getPriceForHall } from '@/lib/pricing';
import { formatCurrency } from '@/lib/format';
import { Seat } from '@/types';
import { io, Socket } from "socket.io-client";

interface ShowtimeResponse {
  _id?: string;
  seatsBooked?: string[];
  seatsLocked?: string[];
  movie?: { title?: string };
  startAt?: string;
  hall?: { name?: string };
  price?: number;
  premiumPrice?: number;
}

// (interfaz de pago eliminada por no usarse)

const MAX_SEATS = 10;

export default function ComprarPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const showtimeId = searchParams.get('showtimeId');

  const [selected, setSelected] = useState<Seat[]>([]);
  const [occupied, setOccupied] = useState<string[]>([]);
  const [reserved, setReserved] = useState<string[]>([]);
  const [expirationTime, setExpirationTime] = useState<Date | null>(null);
  const [paymentModal, setPaymentModal] = useState<{ open: boolean; seats: Seat[]; total: number } | null>(null);
  const [showtime, setShowtime] = useState<ShowtimeResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ open: boolean; message: string; type?: 'success' | 'error' | 'info' }>({
    open: false,
    message: ''
  });
  const [isRestrictedRole, setIsRestrictedRole] = useState<boolean>(false);

  // Detectar rol desde el token para bloquear compras a admin/colaborador
  useEffect(() => {
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      if (!token) { setIsRestrictedRole(false); return; }
      const parseJwt = (t: string) => {
        try {
          const payload = t.split(".")[1];
          const decoded = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
          return JSON.parse(
            decodeURIComponent(
              decoded
                .split("")
                .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
                .join("")
            )
          );
        } catch { return null; }
      };
      const payload = parseJwt(token) as { role?: string } | null;
      const role = payload?.role || 'cliente';
      setIsRestrictedRole(role === 'admin' || role === 'colaborador');
    } catch { setIsRestrictedRole(false); }
  }, []);

  // Control de llamadas para evitar ráfagas y duplicados (React Strict Mode)
  const inFlightRef = useRef<boolean>(false);
  const lastFetchAtRef = useRef<number>(0);
  const backoffAttemptRef = useRef<number>(0);
  const pausedUntilRef = useRef<number>(0);
  const backoffTimerRef = useRef<number | null>(null);

  // =============================
  // FETCH SHOWTIME
  // =============================
  const fetchShowtime = useCallback(async (isBackground: boolean = false) => {
    if (!showtimeId) return;

    // Respetar pausas por rate limit
    const now = Date.now();
    if (pausedUntilRef.current && now < pausedUntilRef.current) {
      // Ya hay una pausa activa; evitar más solicitudes
      return;
    }

    // Evitar duplicados cercanos (doble render de StrictMode / overlaps)
    if (inFlightRef.current) {
      return;
    }
    const sinceLast = now - lastFetchAtRef.current;
    if (sinceLast < 500) {
      // Anti-rafaga: si la última llamada fue hace <500ms, saltamos
      return;
    }
    inFlightRef.current = true;
    lastFetchAtRef.current = now;

    if (!isBackground) setLoading(true);
    try {
      const token = localStorage.getItem(TOKEN_KEY);

      // ✅ Manejo de IDs simulados
      if (showtimeId.includes("-gen-")) {
        const simulatedStart = new Date();
        simulatedStart.setHours(simulatedStart.getHours() + 1);
        const simulated: ShowtimeResponse = {
          _id: showtimeId,
          movie: { title: showtimeId.split("-gen-")[0].replace(/-/g, " ") },
          hall: { name: "Sala 1" },
          startAt: simulatedStart.toISOString(),
          seatsBooked: [],
          seatsLocked: [],
        };
        setShowtime(simulated);
        setOccupied(simulated.seatsBooked ?? []);
        setReserved(simulated.seatsLocked ?? []);
        if (!isBackground) setLoading(false);
        return;
      }

      // Fetch real desde backend
      const res = await fetch(`${API_BASE}/api/showtimes/${showtimeId}`, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json'
        }
      });

      if (!res.ok) {
        // Manejo especial de 429 (rate limit)
        if (res.status === 429) {
          const retryAfterHeader = res.headers.get('Retry-After');
          // Si el servidor pasa segundos en Retry-After, usarlo; si no, exponencial con jitter
          let waitMs = retryAfterHeader ? Math.max(1000, Number(retryAfterHeader) * 1000) : 0;
          if (!waitMs || Number.isNaN(waitMs)) {
            const attempt = Math.min(5, backoffAttemptRef.current + 1);
            waitMs = Math.min(30000, 750 * Math.pow(2, attempt)) + Math.floor(Math.random() * 200);
            backoffAttemptRef.current = attempt;
          } else {
            backoffAttemptRef.current = Math.min(5, backoffAttemptRef.current + 1);
          }
          pausedUntilRef.current = Date.now() + waitMs;
          // Informar sólo si no es background para no saturar toast
          if (!isBackground) {
            setToast({ open: true, message: 'Muchas solicitudes. Reintentando automáticamente…', type: 'info' });
          }
          // Programar un reintento único si no hay ya un timer
          if (backoffTimerRef.current) {
            window.clearTimeout(backoffTimerRef.current);
          }
          backoffTimerRef.current = window.setTimeout(() => {
            backoffTimerRef.current = null;
            // Llamada en background para actualizar cuando termine la pausa
            fetchShowtime(true);
          }, waitMs) as unknown as number;

          return;
        }

        const errMsg = await res.json().then(r => r.message).catch(() => 'No se pudo cargar la función');
        throw new Error(`Error ${res.status}: ${errMsg}`);
      }

      const data: ShowtimeResponse = await res.json();
      setShowtime(data);
      setOccupied(data.seatsBooked ?? []);
      setReserved(data.seatsLocked ?? []);
      // Resetear backoff al tener éxito
      backoffAttemptRef.current = 0;
      pausedUntilRef.current = 0;

    } catch (err) {
      console.error('Error fetching showtime:', err);
      if (!isBackground) {
        setToast({ open: true, message: 'Error al cargar la información de la función', type: 'error' });
        setShowtime(null);
      }
    } finally {
      inFlightRef.current = false;
      if (!isBackground) setLoading(false);
    }
  }, [showtimeId]);

  // =============================
  // VALIDACIÓN DE SHOWTIME ID
  // =============================
  useEffect(() => {
    if (!showtimeId) return;
    fetchShowtime();
    return () => {
      // limpiar cualquier timer pendiente de backoff si desmonta
      if (backoffTimerRef.current) {
        window.clearTimeout(backoffTimerRef.current);
        backoffTimerRef.current = null;
      }
    };
  }, [showtimeId, fetchShowtime]);

  // =============================
// SOCKET.IO: ACTUALIZACIÓN EN TIEMPO REAL
// =============================
useEffect(() => {
  if (!showtimeId) return;

  // Conectamos socket.io al backend
  const socket: Socket = io(API_BASE, {
    transports: ["websocket"],
  });

  // Nos unimos a la sala del showtime
  socket.emit("joinShowtime", showtimeId);

  // Escuchamos cuando el backend emite cambios
  socket.on("showtimeUpdated", (updatedShowtime) => {
    console.log("🎥 Showtime actualizado:", updatedShowtime);
    setOccupied(updatedShowtime.seatsBooked ?? []);
    setReserved(updatedShowtime.seatsLocked ?? []);
  });

  // Limpieza al desmontar
  return () => {
    socket.emit("leaveShowtime", showtimeId);
    socket.disconnect();
  };
}, [showtimeId]);


  // Refresco periódico
  useEffect(() => {
    if (!showtimeId) return;
    let pollTimer: number | undefined;
    let initialTimer: number | undefined;

    const tick = () => {
      // No poll si estamos en pausa por 429
      if (pausedUntilRef.current && Date.now() < pausedUntilRef.current) return;
      fetchShowtime(true);
    };

    const startPolling = () => {
      const initialDelay = 500 + Math.floor(Math.random() * 1500);
      initialTimer = window.setTimeout(tick, initialDelay) as unknown as number;
      // Intervalo un poco mayor para aliviar rate limit cuando hay varias pestañas
      pollTimer = window.setInterval(tick, 5000) as unknown as number;
    };

    startPolling();

    const onVis = () => {
      if (document.visibilityState === 'hidden') {
        if (pollTimer !== undefined) window.clearInterval(pollTimer);
        if (initialTimer !== undefined) window.clearTimeout(initialTimer);
      } else if (document.visibilityState === 'visible') {
        if (pollTimer !== undefined) window.clearInterval(pollTimer);
        if (initialTimer !== undefined) window.clearTimeout(initialTimer);
        startPolling();
      }
    };
    document.addEventListener('visibilitychange', onVis);

    return () => {
      document.removeEventListener('visibilitychange', onVis);
      if (pollTimer !== undefined) window.clearInterval(pollTimer);
      if (initialTimer !== undefined) window.clearTimeout(initialTimer);
    };
  }, [showtimeId, fetchShowtime]);

  // =============================
  // LOCK SEATS
  // =============================
  const updateSeatLocks = useCallback(async (seatsToLock: Seat[]) => {
    if (!showtimeId || !showtime) return;

    if (showtimeId.includes("-gen-")) return;

    const seatIds = seatsToLock.map(s => s.id);
    const token = localStorage.getItem(TOKEN_KEY);

    try {
      const res = await fetch(`${API_BASE}/api/showtimes/${showtime._id}/lock-seats`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ seatIds }),
      });

      if (!res.ok) {
        if (res.status === 401) { router.push('/login'); return; }
        if (res.status === 404) { setSelected(seatsToLock); return; }
        throw new Error(`Error ${res.status} al actualizar reserva`);
      }

      const data: { lockedSeats?: string[]; userLockedSeats?: string[]; expirationTime?: string } = await res.json();
      setReserved(data.lockedSeats ?? []);

      if (data.expirationTime) {
        setExpirationTime(new Date(data.expirationTime));
      } else if (!expirationTime && seatsToLock.length > 0) {
        const tenMinutesLater = new Date();
        tenMinutesLater.setMinutes(tenMinutesLater.getMinutes() + 10);
        setExpirationTime(tenMinutesLater);
      }

    } catch (error) {
      console.error('Error updating seat locks:', error);
      setSelected(seatsToLock);
    }
  }, [showtime, showtimeId, router, expirationTime]);

  // =============================
  // HANDLE SELECTION
  // =============================
  const handleSelectionChange = useCallback((seat: Seat) => {
    const isSelected = selected.some(s => s.id === seat.id);
    let newSelected: Seat[];

    if (isSelected) {
      newSelected = selected.filter(s => s.id !== seat.id);
    } else {
      if (selected.length >= MAX_SEATS) {
        setToast({ open: true, message: `Máximo ${MAX_SEATS} asientos`, type: 'info' });
        return;
      }
      newSelected = [...selected, seat];
    }

    setSelected(newSelected);

    if (!expirationTime && newSelected.length > 0) {
      const tenMinutesLater = new Date();
      tenMinutesLater.setMinutes(tenMinutesLater.getMinutes() + 10);
      setExpirationTime(tenMinutesLater);
    }

    updateSeatLocks(newSelected);
  }, [selected, updateSeatLocks, expirationTime]);

  const handleExpiration = useCallback(async () => {
    setSelected([]);
    setExpirationTime(null);
    setToast({ open: true, message: 'Reserva expirada', type: 'info' });
    try {
      await updateSeatLocks([]);
      await fetchShowtime(true);
    } catch (e) {
      console.warn('No se pudo sincronizar limpieza de locks al expirar:', e);
    }
  }, [updateSeatLocks, fetchShowtime]);

  const handlePurchase = useCallback(() => {
    if (isRestrictedRole) {
      setToast({ open: true, message: 'Las compras están deshabilitadas para administradores y colaboradores.', type: 'error' });
      return;
    }
    if (selected.length === 0) {
      setToast({ open: true, message: 'Selecciona asientos primero', type: 'error' });
      return;
    }
    
    // Lógica de cálculo de precios mejorada en el cliente para reflejar el backend
    const regularPrice = typeof showtime?.price === 'number' ? showtime.price : getPriceForHall(showtime?.hall?.name);
    const premiumPrice = typeof showtime?.premiumPrice === 'number' && showtime.premiumPrice > 0 ? showtime.premiumPrice : regularPrice;

    const total = selected.reduce((acc, s) => {
      const price = s.status === 'premium' ? premiumPrice : regularPrice;
      return acc + price;
    }, 0);

    setPaymentModal({ open: true, seats: selected, total });
  }, [selected, showtime, isRestrictedRole]);

  // =============================
  // RENDER
  // =============================
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black text-white">
  <Header hideFilters />
        
                    <main className="min-h-screen w-full overflow-x-hidden p-4 sm:p-6 md:p-8 bg-black text-white">
          <div className="max-w-6xl mx-auto w-full">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-amber-300 mb-4 text-center sm:text-left">
              Selecciona tus asientos
            </h1>

            {loading ? (
              <div className="text-slate-400 mb-4 text-center sm:text-left">
                Cargando información de la función...
              </div>
            ) : showtime ? (
              <div className="text-slate-400 mb-4 text-center sm:text-left text-sm sm:text-base">
                Película: <span className="text-white font-semibold">{showtime.movie?.title || '—'}</span> —{" "}
                Sala: <span className="text-white font-semibold">{showtime.hall?.name || '—'}</span> —{" "}
                Precio:{" "}
                <span className="text-white font-semibold">
                  {typeof showtime?.premiumPrice === 'number' && showtime.premiumPrice > 0
                    ? `${formatCurrency(showtime.price ?? getPriceForHall(showtime?.hall?.name))} (Reg) / ${formatCurrency(showtime.premiumPrice)} (Prem)`
                    : formatCurrency(typeof showtime?.price === 'number' ? showtime.price : getPriceForHall(showtime?.hall?.name))}
                </span>
              </div>
            ) : (
              <div className="text-red-400 mb-4 text-center sm:text-left">Error al cargar la función</div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start w-full">
              {/* Mapa de asientos */}
              <div className="lg:col-span-2 flex justify-center w-full">
                <div className="w-full overflow-x-auto px-2">
                  <SeatMap
                    occupiedSeats={occupied}
                    reservedSeats={reserved}
                    selectedSeats={selected.map(s => s.id)}
                    currentSelectedObjects={selected}
                    onSelectionChange={handleSelectionChange}
                  />
                </div>
              </div>

              {/* Resumen de reserva */}
              <div className="lg:col-span-1 flex justify-center w-full">
                <ReservationSummary
                  seats={selected}
                  expirationTime={expirationTime}
                  onExpiration={handleExpiration}
                  onPurchase={handlePurchase}
                  regularPrice={typeof showtime?.price === 'number' ? showtime.price : null}
                  premiumPrice={typeof showtime?.premiumPrice === 'number' && showtime.premiumPrice > 0 ? showtime.premiumPrice : null}
                  disablePurchase={isRestrictedRole}
                  disableReason={isRestrictedRole ? 'No disponible para administradores o colaboradores.' : undefined}
                />
              </div>
            </div>
          </div>
        </main>



        {paymentModal?.open && (
          <PaymentMethods
            amount={paymentModal.total}
            onCancel={() => setPaymentModal(null)}
            showtimeId={showtimeId || ''}
            seatsSelected={paymentModal.seats.map(s => s.id)}
            onConflict={(conflictSeats, message) => {
              setToast({ open: true, message: message || 'Estos asientos ya están reservados', type: 'error' });
              setSelected(prev => prev.filter(s => !conflictSeats.includes(s.id)));
              fetchShowtime();
              setPaymentModal(null);
            }}
          />
        )}

        <Toast
          open={toast.open}
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ open: false, message: '' })}
        />
      </div>
    </ProtectedRoute>
  );
}
