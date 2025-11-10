"use client";
import React, { useCallback } from "react";
import { Seat } from '@/types';

type Props = {
  rows?: string[];
  cols?: number;
  occupiedSeats: string[];
  reservedSeats: string[];
  // selectedSeats kept for backward compatibility with callers that pass just ids;
  // primary selection tracking uses `currentSelectedObjects`.
  selectedSeats: string[];
  currentSelectedObjects: Seat[];
  onSelectionChange?: (seat: Seat) => void; // se envía solo el asiento clickeado
  onMaxSelectionAttempt?: () => void;
  /**
   * Si true, alinea el mapa a la izquierda en vez de centrarlo.
   * Útil para pantallas con layout dividido (mapa izquierda / resumen derecha).
   */
  alignLeft?: boolean;
};

const MAX_SEATS = 10;

export default function SeatMap({
  rows = ["A","B","C","D","E","F","G","H"],
  cols = 8,
  occupiedSeats = [],
  reservedSeats = [],
  selectedSeats = [],
  currentSelectedObjects = [],
  onSelectionChange,
  onMaxSelectionAttempt,
  alignLeft = false
}: Props) {

  const makeSeat = useCallback((row: string, num: number): Seat => {
    const id = `${row}${num}`;
    const isPremium = rows.indexOf(row) <= 1;

    let status: Seat["status"] = 'available';
    if (occupiedSeats.includes(id)) status = "occupied";
    else if (reservedSeats.includes(id)) status = "reserved";
    else if (isPremium) status = "premium";

    return { id, row, number: num, status };
  }, [occupiedSeats, reservedSeats, rows]);

  const getSeatClass = (status: Seat["status"], isSelected: boolean) => {
    const base = "w-12 h-12 rounded flex items-center justify-center text-sm font-medium border shadow-sm transition-colors duration-200 cursor-pointer";
    if (isSelected) return `${base} bg-green-500 text-white border-green-500 border-2 ring-2 ring-green-300`;
    switch(status) {
      case "occupied": return `${base} bg-gray-600 text-white border-gray-600 cursor-not-allowed`;
      case "reserved": return `${base} bg-orange-500 text-white border-orange-500 cursor-not-allowed`;
      case "premium": return `${base} bg-red-600 text-white border-red-600 hover:bg-red-700`;
      default: return `${base} bg-white text-black border-gray-300 hover:bg-gray-200`;
    }
  };

  const toggleSeat = (seat: Seat) => {
    const isSelected = currentSelectedObjects.some(s => s.id === seat.id) || selectedSeats.includes(seat.id);

    // If seat is occupied, never allow interaction.
    if (seat.status === "occupied") return;

    // If seat is reserved by someone else, disallow. But if it's reserved and the
    // current user already has it selected (i.e. it's in currentSelectedObjects),
    // allow toggling so the user can deselect their own locked seats.
    if (seat.status === "reserved" && !isSelected) return;
    if (!isSelected && currentSelectedObjects.length >= MAX_SEATS) {
      if (onMaxSelectionAttempt) onMaxSelectionAttempt();
      return;
    }

    if (onSelectionChange) onSelectionChange(seat); // enviar solo el asiento clickeado
  };

  return (
    <div className={`bg-gray-900 p-8 rounded-xl shadow-2xl border border-gray-700 flex flex-col ${alignLeft ? 'items-start' : 'items-center'}`}>
      <div className={`flex ${alignLeft ? 'justify-start' : 'justify-center'} mb-6 w-full`}>
        <div className="bg-red-600 text-white px-6 py-2 rounded-xl font-semibold border border-red-600">
          PANTALLA
        </div>
      </div>

      <div className={`mb-4 ${alignLeft ? 'text-left' : 'text-center'} text-white font-semibold`}>
        Asientos seleccionados: {currentSelectedObjects.length} / {MAX_SEATS}
      </div>

      <div className={`w-full flex ${alignLeft ? 'justify-start' : 'justify-center'}`}>
        <div className="space-y-2">
          {rows.map(row => (
            <div key={row} className="grid gap-2 items-center" style={{ gridTemplateColumns: `20px repeat(${cols}, 48px)` }}>
              <div className="text-gray-400 font-bold text-lg text-center">{row}</div>
              {Array.from({length: cols}, (_, i) => {
                const seat = makeSeat(row, i+1);
                const isSelected = currentSelectedObjects.some(s => s.id === seat.id) || selectedSeats.includes(seat.id);
                return (
                  <button
                    key={seat.id}
                    onClick={() => toggleSeat(seat)}
            disabled={seat.status === "occupied" || (seat.status === "reserved" && !isSelected)}
                    className={getSeatClass(seat.status, isSelected)}
                    title={`Asiento ${seat.id} - ${isSelected ? 'Seleccionado' : seat.status}`}
                    aria-pressed={isSelected}
                  >
                    {i+1}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Leyenda */}
      <div className="mt-6 flex flex-col items-center gap-3">
        <div className="text-sm text-gray-300 font-semibold mb-2">Leyenda:</div>
        <div className="flex flex-wrap justify-center gap-4">
          <div className="flex items-center gap-2"><span className="w-4 h-4 bg-white border border-gray-300 rounded"/> <span>Disponible</span></div>
          <div className="flex items-center gap-2"><span className="w-4 h-4 bg-red-600 border border-red-600 rounded"/> <span>Premium</span></div>
          <div className="flex items-center gap-2"><span className="w-4 h-4 bg-green-500 border border-green-500 rounded"/> <span>Seleccionado</span></div>
          <div className="flex items-center gap-2"><span className="w-4 h-4 bg-orange-500 border border-orange-500 rounded"/> <span>Bloqueado</span></div>
          <div className="flex items-center gap-2"><span className="w-4 h-4 bg-gray-600 border border-gray-600 rounded"/> <span>Ocupado</span></div>
        </div>
      </div>
    </div>
  );
}
