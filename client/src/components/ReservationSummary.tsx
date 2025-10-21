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
    <aside className="bg-gradient-to-br from-gray-900 to-gray-800 p-6 rounded-2xl text-sm border border-gray-700 shadow-2xl">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center text-black font-bold">🎟️</div>
          <div>
            <h3 className="text-lg font-semibold text-white">Resumen de reserva</h3>
            <div className="text-xs text-slate-400">Revisa tus asientos y confirma la compra</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs text-slate-400">Asientos</div>
          <div className="text-amber-300 font-bold text-lg">{seats.length}</div>
        </div>
      </div>
      {seats.length === 0 ? (
        <div className="text-center text-slate-400 py-8">Selecciona al menos un asiento para continuar</div>
      ) : (
        <div className="space-y-3">
          <ul className="divide-y divide-slate-700 max-h-72 overflow-auto">
            {seats.map((s) => (
              <li key={s.id} className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className={`inline-block w-10 h-10 rounded-md flex items-center justify-center text-lg font-semibold ${s.status === 'premium' ? 'bg-red-600 text-white' : 'bg-white text-black'}`}>{s.row}{s.number}</span>
                  <div>
                    <div className="font-medium text-white">{s.id}</div>
                    <div className="text-xs text-slate-400 capitalize">{s.status}</div>
                  </div>
                </div>
                <div className="text-amber-300 font-semibold">{formatCurrency(priceForSeat(s))}</div>
              </li>
            ))}
          </ul>

          <div className="pt-3 border-t border-gray-700">
            <div className="flex justify-between items-center mb-2">
              <div className="text-sm text-gray-400">Subtotal</div>
              <div className="text-sm text-amber-300">{formatCurrency(total)}</div>
            </div>
            <div className="flex justify-between items-center mb-4">
              <div className="text-sm text-gray-400">Tarifa de servicio</div>
              <div className="text-sm text-amber-300">{formatCurrency(0)}</div>
            </div>

            <div className="flex justify-between items-center font-bold text-white text-lg mb-3">
              <div>Total a pagar</div>
              <div className="text-amber-300">{formatCurrency(total)}</div>
            </div>

            <button
              aria-label="Comprar entradas"
              className="mt-1 w-full bg-amber-500 text-black py-3 rounded-2xl font-semibold hover:bg-amber-400 disabled:opacity-60"
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
              Confirmar y Pagar
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}
