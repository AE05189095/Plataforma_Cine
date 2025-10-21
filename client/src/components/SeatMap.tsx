"use client";
import React, { useState, useEffect } from "react";

type Seat = {
  id: string; // e.g., A1
  row: string;
  number: number;
  status: "available" | "premium" | "occupied";
};

type Props = {
  rows?: string[];
  cols?: number;
  occupiedSeats?: string[]; // list of seat ids
  onSelectionChange?: (selected: Seat[]) => void;
  totalSeats?: number; // capacidad de la sala para construir el mapa
};

export default function SeatMap({
  rows = ["A", "B", "C", "D", "E", "F", "G", "H"],
  cols = 8,
  occupiedSeats = [],
  onSelectionChange,
  totalSeats,
}: Props) {
  const [selected, setSelected] = useState<Record<string, Seat>>({});

  // Si `occupiedSeats` cambia, quitar de la selección cualquier asiento que haya pasado a ocupado
  useEffect(() => {
    if (!occupiedSeats || occupiedSeats.length === 0) return;
    setSelected((prev) => {
      const copy = { ...prev };
      let changed = false;
      for (const id of occupiedSeats) {
        if (copy[id]) {
          delete copy[id];
          changed = true;
        }
      }
      // Si no hubo cambios, devolver el estado previo para evitar re-render infinito
      if (!changed) return prev;
      return copy;
    });
  }, [occupiedSeats]);

  // Mantener una copia local de occupiedSeats para forzar re-render cuando cambie el contenido
  const [localOccupied, setLocalOccupied] = useState<string[]>(occupiedSeats || []);
  const [tick, setTick] = useState(0);
  useEffect(() => {
    setLocalOccupied(Array.isArray(occupiedSeats) ? occupiedSeats.slice() : []);
    // forzar re-render/remontado
    setTick((t) => t + 1);
  }, [occupiedSeats]);

  // Si se proporciona totalSeats, calcular filas/columnas para ajustarse a la capacidad
  let computedRows = rows;
  let computedCols = cols;
  if (typeof totalSeats === 'number' && totalSeats > 0) {
    // intentar columnas cercanas a la raíz cuadrada
    const approx = Math.max(4, Math.round(Math.sqrt(totalSeats)));
    computedCols = Math.max(4, Math.min(12, approx));
    const neededRows = Math.ceil(totalSeats / computedCols);
    // generar etiquetas de filas A, B, C...
    const letters = [] as string[];
    for (let i = 0; i < neededRows; i++) {
      letters.push(String.fromCharCode(65 + i));
    }
    computedRows = letters;
  }

  const makeSeat = (row: string, num: number): Seat => {
    const id = `${row}${num}`;
    // simple premium rule: first two rows are premium
    const status: Seat["status"] = localOccupied.includes(id)
      ? "occupied"
      : computedRows.indexOf(row) <= 1
      ? "premium"
      : "available";
    return { id, row, number: num, status };
  };

  const toggleSeat = (seat: Seat) => {
    if (seat.status === "occupied") return;
    setSelected((prev) => {
      const copy = { ...prev };
      if (copy[seat.id]) {
        delete copy[seat.id];
      } else {
        copy[seat.id] = seat;
      }
      return copy;
    });
  };

  // Notificar al padre cuando la selección local cambie.
  useEffect(() => {
    if (onSelectionChange) {
      onSelectionChange(Object.values(selected));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected]);

  return (
    <div key={tick} className="bg-gray-900 p-8 rounded-xl shadow-2xl border border-gray-700 flex flex-col items-center">
      <div className="flex justify-center mb-6">
        <div className="bg-red-600 text-white px-6 py-2 rounded-xl font-semibold border border-red-600 hover:bg-red-700">PANTALLA</div>
      </div>

      <div className="w-full flex justify-center">
        <div className="space-y-2">
          {computedRows.map((row) => (
            <div key={row} className="grid gap-2" style={{ gridTemplateColumns: `repeat(${computedCols}, 48px)` }}>
              {Array.from({ length: computedCols }, (_, i) => {
                const num = i + 1;
                const seatIndex = computedRows.indexOf(row) * computedCols + i; // 0-based global index
                // Si totalSeats está definido y este índice excede la capacidad, no renderizar botón
                if (typeof totalSeats === 'number' && seatIndex >= totalSeats) {
                  return <div key={`${row}-${i}`} className="w-12 h-12" />;
                }
                const seat = makeSeat(row, num);
                const isSelected = !!selected[seat.id];
                const baseClass = "w-12 h-12 rounded flex items-center justify-center text-sm font-medium border shadow-sm";
                let statusClass = "bg-white text-black border-gray-300";
                if (seat.status === "occupied") statusClass = "bg-gray-600 text-white border-gray-600";
                if (seat.status === "premium") statusClass = "bg-red-600 text-white border-red-600";

                // Si el asiento está seleccionado, mostrar estilo de seleccionado
                let selectedClass = "";
                if (isSelected) {
                  // Si era premium, al seleccionarlo debe mostrarse gris
                  if (seat.status === 'premium') {
                    statusClass = 'bg-gray-700 text-white border-gray-600';
                    selectedClass = 'ring-2 ring-gray-400';
                  } else {
                    selectedClass = 'ring-2 ring-red-500';
                  }
                }

                return (
                  <button
                    key={seat.id}
                    onClick={() => toggleSeat(seat)}
                    className={`${baseClass} ${statusClass} ${selectedClass}`}
                    title={`${seat.id} - ${seat.status}`}
                    aria-pressed={isSelected}
                    aria-label={`Asiento ${seat.id} ${seat.status}`}
                  >
                    {seat.number}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-6 flex justify-center text-sm text-gray-300 font-semibold">
        <div className="flex items-center gap-6">
          <span className="inline-block w-4 h-4 bg-white border" /> Disponible
          <span className="inline-block w-4 h-4 bg-red-600 border-red-600" /> Premium
          <span className="inline-block w-4 h-4 bg-gray-700 border" /> Seleccionado (premium: gris)
          <span className="inline-block w-4 h-4 bg-gray-600 border" /> Ocupado
        </div>
      </div>
    </div>
  );
}
