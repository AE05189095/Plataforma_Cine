"use client";
import React from "react";
import { formatCurrency } from '@/lib/format';

type Seat = {
  id: string;
  row: string;
  number: number;
  status: string;
};

type Props = {
  seats: Seat[];
  showtimeId?: string | null;
  onPurchase?: (seatIds: string[]) => Promise<void>;
};

export default function ReservationSummary({ seats, showtimeId, onPurchase }: Props) {
  const PRICE_REGULAR = 45;
  const PRICE_PREMIUM = 65;
  const priceForSeat = (s: Seat) => (s.status === 'premium' ? PRICE_PREMIUM : PRICE_REGULAR);
  const total = seats.reduce((acc, s) => acc + priceForSeat(s), 0);

  return (
    <aside className="bg-gray-900 p-6 rounded-xl text-sm border border-gray-700 shadow-lg">
      <h3 className="text-lg font-semibold text-amber-300 mb-3">Resumen de reserva</h3>
      {seats.length === 0 ? (
        <div className="text-slate-400">Selecciona al menos un asiento para continuar</div>
      ) : (
        <div className="space-y-2">
          <ul className="divide-y divide-slate-700 max-h-48 overflow-auto">
            {seats.map((s) => (
              <li key={s.id} className="py-2 flex justify-between">
                <div>
                  <div className="font-medium text-white">Asiento {s.id}</div>
                  <div className="text-slate-400 text-xs">{s.status}</div>
                </div>
                <div className="text-amber-300">{formatCurrency(priceForSeat(s))}</div>
              </li>
            ))}
          </ul>

          <div className="pt-2 border-t border-gray-700 flex justify-between items-center">
            <div className="text-gray-400">Total</div>
            <div className="text-amber-300 font-semibold">{formatCurrency(total)}</div>
          </div>

          <button
            aria-label="Comprar entradas"
            className="mt-3 w-full bg-red-600 text-white py-2 rounded-xl font-semibold hover:bg-red-700 disabled:opacity-60"
            disabled={seats.length === 0}
            onClick={async () => {
              if (!showtimeId || !onPurchase) return window.alert('No se puede procesar la compra');
              const seatIds = seats.map(s => s.id);
              try {
                await onPurchase(seatIds);
              } catch {
                window.alert('Error al reservar');
              }
            }}
          >
            Comprar
          </button>
        </div>
      )}
    </aside>
  );
}
