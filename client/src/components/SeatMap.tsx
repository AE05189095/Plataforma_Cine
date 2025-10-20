// client/src/components/SeatMap.tsx
"use client";
import React, { useState, useEffect, useCallback } from "react";

type Seat = {
  id: string;
  row: string;
  number: number;
  status: "available" | "premium" | "occupied" | "reserved"; // 🛑 status ajustado
};

type Props = {
  rows?: string[];
  cols?: number;
  occupiedSeats: string[]; // IDs de asientos vendidos (permanente, gris)
  reservedSeats: string[]; // 🛑 NUEVO: IDs de asientos bloqueados por otros (temporal, naranja/rojo)
  selectedSeats: string[]; // 🛑 NUEVO: IDs de asientos seleccionados por ESTE usuario (verde)
  onSelectionChange?: (selected: Seat[]) => void;
};

export default function SeatMap({
  rows = ["A", "B", "C", "D", "E", "F", "G", "H"],
  cols = 8,
  occupiedSeats = [],
  reservedSeats = [],
  selectedSeats = [],
  onSelectionChange,
}: Props) {
  
  // 🛑 1. GENERADOR DE ASIENTOS Y ESTADO FINAL
  const makeSeat = useCallback((row: string, num: number): Seat => {
    const id = `${row}${num}`;
    const isPremium = rows.indexOf(row) <= 1;

    let status: Seat["status"] = 'available';

    if (occupiedSeats.includes(id)) {
      status = "occupied"; // Vendido (Gris)
    } else if (reservedSeats.includes(id) && !selectedSeats.includes(id)) {
      status = "reserved"; // Bloqueado por otro (Naranja/Rojo)
    } else if (isPremium) {
      status = "premium"; // Disponible Premium (Rojo/Morado)
    }
    // Si está en selectedSeats, se manejará en el renderizado

    return { id, row, number: num, status };
  }, [occupiedSeats, reservedSeats, selectedSeats, rows]);


  // 🛑 2. LÓGICA DE CLASES CSS
  const getSeatClass = (status: Seat["status"], isSelected: boolean, isPremium: boolean): string => {
    const baseClass = "w-12 h-12 rounded flex items-center justify-center text-sm font-medium border shadow-sm transition-colors duration-100";

    if (isSelected) {
        // Asientos seleccionados por el usuario actual
        return `${baseClass} bg-green-500 text-white border-green-500 hover:bg-green-600 ring-2 ring-red-500`;
    }
    
    switch (status) {
        case "occupied":
            return `${baseClass} bg-gray-600 text-white border-gray-600 cursor-not-allowed`;
        case "reserved":
            // Asientos bloqueados por OTROS (no por el usuario actual)
            return `${baseClass} bg-orange-700 text-white border-orange-700 cursor-not-allowed`;
        case "premium":
            return `${baseClass} bg-red-600 text-white border-red-600 hover:bg-red-700`;
        case "available":
        default:
            return `${baseClass} bg-white text-black border-gray-300 hover:bg-gray-200`;
    }
  };

  // 🛑 3. MANEJO DE CLIC (Solo actualiza el estado local y llama al padre)
  const toggleSeat = (seat: Seat) => {
    if (seat.status === "occupied" || seat.status === "reserved") return;
    
    // Obtener la lista actual de objetos Seat seleccionados
    const currentSelectedObjects = rows.flatMap(row => 
      Array.from({ length: cols }, (_, i) => makeSeat(row, i + 1))
    ).filter(s => selectedSeats.includes(s.id));
    
    let newSelected: Seat[];

    if (selectedSeats.includes(seat.id)) {
      // Deseleccionar
      newSelected = currentSelectedObjects.filter(s => s.id !== seat.id);
    } else {
      // Seleccionar (con límite, por ejemplo 10)
      if (selectedSeats.length >= 10) return; 
      newSelected = [...currentSelectedObjects, seat];
    }
    
    // Notificar al padre (ComprarPage) para que active la llamada al bloqueo en el servidor
    if (onSelectionChange) {
      onSelectionChange(newSelected);
    }
  };


  return (
    <div className="bg-gray-900 p-8 rounded-xl shadow-2xl border border-gray-700 flex flex-col items-center">
      <div className="flex justify-center mb-6">
        <div className="bg-red-600 text-white px-6 py-2 rounded-xl font-semibold border border-red-600 hover:bg-red-700">PANTALLA</div>
      </div>

      <div className="w-full flex justify-center">
        <div className="space-y-2">
          {rows.map((row) => (
            <div 
              key={row} 
              className="grid gap-2 items-center" 
              style={{ gridTemplateColumns: `20px repeat(${cols}, 48px)` }}
            >
              <div className="text-gray-400 font-bold text-lg text-center">{row}</div>
              
              {Array.from({ length: cols }, (_, i) => {
                const num = i + 1;
                const seat = makeSeat(row, num);
                const isSelected = selectedSeats.includes(seat.id);
                const statusClass = getSeatClass(seat.status, isSelected, seat.status === 'premium');

                return (
                  <button
                    key={seat.id}
                    onClick={() => toggleSeat(seat)}
                    disabled={seat.status === "occupied" || seat.status === "reserved"}
                    className={`${statusClass} transition-colors duration-100`}
                    title={`Asiento ${seat.id} - ${isSelected ? 'Seleccionado' : seat.status}`}
                    aria-pressed={isSelected}
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
          <span className="inline-block w-4 h-4 bg-green-500 border-green-500" /> Seleccionado
          <span className="inline-block w-4 h-4 bg-orange-700 border" /> Bloqueado
          <span className="inline-block w-4 h-4 bg-gray-600 border" /> Ocupado
        </div>
      </div>
    </div>
  );
}