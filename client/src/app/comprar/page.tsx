"use client";
import React, { useEffect, useState, useCallback } from "react";
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

interface ShowtimeResponse {
  _id?: string;
  seatsBooked?: string[];
  seatsLocked?: string[];
  movie?: { title?: string };
  startAt?: string;
  hall?: { name?: string };
  price?: number;
}

interface PaymentPayload {
  method: 'card' | 'paypal';
  card?: {
    number: string;
    name: string;
    expMonth: string;
    expYear: string;
    cvv: string;
  };
  paypal?: {
    email: string;
  };
}

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

  // =============================
  // FETCH SHOWTIME
  // =============================
  const fetchShowtime = useCallback(async () => {
    if (!showtimeId) return;

    setLoading(true);
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
        setLoading(false);
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
        const errMsg = await res.json().then(r => r.message).catch(() => 'No se pudo cargar la función');
        throw new Error(`Error ${res.status}: ${errMsg}`);
      }

      const data: ShowtimeResponse = await res.json();
      setShowtime(data);
      setOccupied(data.seatsBooked ?? []);
      setReserved(data.seatsLocked ?? []);

    } catch (err) {
      console.error('Error fetching showtime:', err);
      setToast({ open: true, message: 'Error al cargar la información de la función', type: 'error' });
      setShowtime(null);
    } finally {
      setLoading(false);
    }
  }, [showtimeId]);

  // =============================
  // VALIDACIÓN DE SHOWTIME ID
  // =============================
  useEffect(() => {
    if (!showtimeId) return;
    fetchShowtime();
  }, [showtimeId, fetchShowtime]);

  // =============================
  // LOCK SEATS
  // =============================
  const updateSeatLocks = useCallback(async (seatsToLock: Seat[]) => {
    if (!showtimeId || !showtime) return;

    // ignoramos simulados
    if (showtimeId.includes("-gen-")) return;

    const seatIds = seatsToLock.map(s => s.id);
    const token = localStorage.getItem(TOKEN_KEY);

    try {
      const res = await fetch(`${API_BASE}/api/purchases/showtimes/${showtime._id}/lock-seats`, { 
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ seatIds }),
      });

      if (!res.ok) {
        if (res.status === 401) { router.push('/login'); return; }
        if (res.status === 404) {
          setSelected(seatsToLock);
          return;
        }
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

  // Don't overwrite local selection immediately with server response.
  // Keep client-managed `selected` so users can freely select/deselect while locks
  // are being synchronized. We still update `reserved` and `expirationTime`.

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

  const handleExpiration = useCallback(() => {
    setSelected([]);
    setExpirationTime(null);
    setToast({ open: true, message: 'Reserva expirada', type: 'info' });
  }, []);

  const handlePurchase = useCallback(() => {
    if (selected.length === 0) {
      setToast({ open: true, message: 'Selecciona asientos primero', type: 'error' });
      return;
    }
    const perSeat = typeof showtime?.price === 'number' ? showtime!.price : null;
    const total = selected.reduce((acc, s) => {
      if (perSeat !== null) return acc + perSeat;
      return acc + (s.status === 'premium' ? 65 : 45);
    }, 0);
    setPaymentModal({ open: true, seats: selected, total });
  }, [selected, showtime]);

  const handlePaymentConfirm = useCallback(async (paymentInfo: PaymentPayload) => {
    if (!paymentModal) return;
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      const res = await fetch(`${API_BASE}/api/purchases`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ showtimeId, seats: paymentModal.seats.map(s => s.id), paymentInfo }),
      });
      if (!res.ok) throw new Error('Error en la compra');

      const body = await res.json();
      setOccupied(body.showtime?.seatsBooked || []);
      setReserved([]);
      setSelected([]);
      setExpirationTime(null);
      setPaymentModal(null);

      setToast({ open: true, message: 'Compra exitosa', type: 'success' });
      setTimeout(() => router.push('/mis-compras'), 2000);
    } catch {
      setToast({ open: true, message: 'Error en la compra', type: 'error' });
    }
  }, [paymentModal, router, showtimeId]);

  // =============================
  // RENDER
  // =============================
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
              <div className="text-slate-400 mb-4">
                Película: <span className="text-white font-semibold">{showtime.movie?.title || '—'}</span> —
                Sala: <span className="text-white font-semibold">{showtime.hall?.name || '—'}</span> —
                Precio: <span className="text-white font-semibold">{formatCurrency(typeof showtime?.price === 'number' ? showtime.price : getPriceForHall(showtime?.hall?.name))}</span>
              </div>
            ) : (
              <div className="text-red-400 mb-4">Error al cargar la función</div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
              <div className="lg:col-span-2 flex justify-center">
                <SeatMap
                  occupiedSeats={occupied}
                  reservedSeats={reserved}
                  selectedSeats={selected.map(s => s.id)}
                  currentSelectedObjects={selected}
                  onSelectionChange={handleSelectionChange}
                />
              </div>

              <div className="lg:col-span-1 flex justify-center">
                <ReservationSummary
                  seats={selected}
                  showtimeId={showtimeId}
                  expirationTime={expirationTime}
                  onExpiration={handleExpiration}
                  onPurchase={handlePurchase}
                  perSeatPrice={typeof showtime?.price === 'number' ? showtime.price : null}
                />
              </div>
            </div>
          </div>
        </main>

        {paymentModal?.open && (
          <PaymentMethods
            amount={formatCurrency(paymentModal.total)}
            onCancel={() => setPaymentModal(null)}
            onConfirm={handlePaymentConfirm}
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
