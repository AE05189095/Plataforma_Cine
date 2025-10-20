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
};

export default function SeatMap({
  rows = ["A", "B", "C", "D", "E", "F", "G", "H"],
  cols = 8,
  occupiedSeats = [],
  onSelectionChange,
}: Props) {
  const [selected, setSelected] = useState<Record<string, Seat>>({});

  // Efecto 1: Deseleccionar asientos localmente cuando pasan a 'occupied'.
  useEffect(() => {
    if (!occupiedSeats || occupiedSeats.length === 0) return;
    
    // Función para obtener la nueva selección después de filtrar los ocupados
    const newSelection = (prevSelected: Record<string, Seat>) => {
      let changed = false;
      const copy = { ...prevSelected };
      for (const id of occupiedSeats) {
        if (copy[id]) {
          delete copy[id];
          changed = true;
        }
      }
      if (changed) return copy;
      return prevSelected;
    };
    
    setSelected(newSelection);
  }, [occupiedSeats]);
  
  // Efecto 2: Notificar al componente padre CADA VEZ que el estado 'selected' cambia localmente.
  // Esto funciona porque el padre (ComprarPage) ahora usa useCallback.
  useEffect(() => {
      if (onSelectionChange) {
          onSelectionChange(Object.values(selected));
      }
  }, [selected, onSelectionChange]);


  // Mantener una copia local de occupiedSeats para forzar re-render cuando cambie el contenido
  const [localOccupied, setLocalOccupied] = useState<string[]>(occupiedSeats || []);
  const [tick, setTick] = useState(0);
  useEffect(() => {
    setLocalOccupied(Array.isArray(occupiedSeats) ? occupiedSeats.slice() : []);
    // forzar re-render/remontado
    setTick((t) => t + 1);
  }, [occupiedSeats]);

  const makeSeat = (row: string, num: number): Seat => {
    const id = `${row}${num}`;
    // simple premium rule: first two rows are premium
    const status: Seat["status"] = localOccupied.includes(id)
      ? "occupied"
      : rows.indexOf(row) <= 1
      ? "premium"
      : "available";
    return { id, row, number: num, status };
  };

  // Función toggleSeat: Solo actualiza el estado local.
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

  return (
    <div key={tick} className="bg-gray-900 p-8 rounded-xl shadow-2xl border border-gray-700 flex flex-col items-center">
      <div className="flex justify-center mb-6">
        <div className="bg-red-600 text-white px-6 py-2 rounded-xl font-semibold border border-red-600 hover:bg-red-700">PANTALLA</div>
      </div>

      <div className="w-full flex justify-center">
        {/* Ajustamos la plantilla de la cuadrícula: 1 columna para la letra + N columnas para los asientos */}
        <div className="space-y-2">
          {rows.map((row) => (
            <div 
              key={row} 
              className="grid gap-2 items-center" 
              // Agregamos una columna de 20px para la letra de la fila
              style={{ gridTemplateColumns: `20px repeat(${cols}, 48px)` }}
            >
              {/* 🚨 NUEVO: Indicador de Fila (Letra) */}
              <div className="text-gray-400 font-bold text-lg text-center">{row}</div>
              
              {/* Renderizado de Asientos */}
              {Array.from({ length: cols }, (_, i) => {
                const num = i + 1;
                const seat = makeSeat(row, num);
                const isSelected = !!selected[seat.id];
                const baseClass = "w-12 h-12 rounded flex items-center justify-center text-sm font-medium border shadow-sm";
                let statusClass = "bg-white text-black border-gray-300 hover:bg-gray-200";
                if (seat.status === "occupied") statusClass = "bg-gray-600 text-white border-gray-600 cursor-not-allowed";
                if (seat.status === "premium") statusClass = "bg-red-600 text-white border-red-600 hover:bg-red-700";

                // Si el asiento está seleccionado, mostrar estilo de seleccionado
                let selectedClass = "";
                if (isSelected) {
                  // Si era premium, al seleccionarlo debe mostrarse gris
                  if (seat.status === 'premium') {
                    statusClass = 'bg-gray-700 text-white border-gray-600';
                    selectedClass = 'ring-2 ring-gray-400';
                  } else {
                    statusClass = 'bg-green-500 text-white border-green-500 hover:bg-green-600'; // Color claro al seleccionar un asiento estándar
                    selectedClass = 'ring-2 ring-red-500';
                  }
                }

                return (
                  <button
                    key={seat.id}
                    onClick={() => toggleSeat(seat)}
                    disabled={seat.status === "occupied"} // Desactivar el botón
                    className={`${baseClass} ${statusClass} ${selectedClass} transition-colors duration-100`}
                    // 🚨 MOSTRAR ID COMPLETO (A7, B3) en el tooltip
                    title={`Asiento ${seat.id} - ${seat.status}`}
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
          <span className="inline-block w-4 h-4 bg-green-500 border-green-500" /> Seleccionado (estándar)
          <span className="inline-block w-4 h-4 bg-gray-700 border" /> Seleccionado (premium)
          <span className="inline-block w-4 h-4 bg-gray-600 border" /> Ocupado
        </div>
      </div>
    </div>
  );
}