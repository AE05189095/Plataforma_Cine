// client/src/components/SeatMap.tsx
"use client";
import React, { useCallback, useMemo } from "react";
// Asumiendo que el tipo 'Seat' es accesible aquí, ya sea a través de '@/types' o definido arriba.
// He incluido una definición placeholder para Seat, pero se usa la importación.
import { Seat } from '@/types'; 

// Definición de tipo para Seat (en caso de que '@/types' no la exporte o sea inaccesible)
// type Seat = {
//     id: string;
//     row: string;
//     number: number;
//     status: "available" | "occupied" | "reserved" | "premium" | string;
// };

// 🛑 Props combinadas y mejoradas
type Props = {
    rows?: string[];
    cols?: number;
    occupiedSeats: string[]; // Asientos ya vendidos
    reservedSeats: string[]; // Asientos temporalmente bloqueados (por ejemplo, por temporizador)
    selectedSeats: string[]; // IDs de asientos seleccionados actualmente (controlado por el padre)
    currentSelectedObjects: Seat[]; // Objetos Seat seleccionados actualmente (controlado por el padre)
    onSelectionChange?: (selected: Seat[]) => void;
    onMaxSelectionAttempt?: () => void;
    totalSeats?: number; // Capacidad total de la sala para mapa dinámico
};

const MAX_SEATS = 10;

export default function SeatMap({
    rows = ["A", "B", "C", "D", "E", "F", "G", "H"],
    cols = 8,
    occupiedSeats = [],
    reservedSeats = [],
    selectedSeats = [],
    currentSelectedObjects = [],
    onSelectionChange,
    onMaxSelectionAttempt,
    totalSeats,
}: Props) {

    // 1. Lógica de cálculo dinámico de filas/columnas (de HU6-Semana-2)
    const { computedRows, computedCols } = useMemo(() => {
        let finalRows = rows;
        let finalCols = cols;

        if (typeof totalSeats === 'number' && totalSeats > 0) {
            // Intentar columnas cercanas a la raíz cuadrada
            const approx = Math.max(4, Math.round(Math.sqrt(totalSeats)));
            // Limitar columnas entre 4 y 12 para mantener el layout razonable
            finalCols = Math.max(4, Math.min(12, approx)); 
            const neededRows = Math.ceil(totalSeats / finalCols);
            
            const letters = [] as string[];
            for (let i = 0; i < neededRows; i++) {
                // Generar etiquetas de filas: A, B, C...
                letters.push(String.fromCharCode(65 + i));
            }
            finalRows = letters;
        }

        return { computedRows: finalRows, computedCols: finalCols };
    }, [rows, cols, totalSeats]);


    // 2. Función para crear el objeto Seat con estado (basada en test/semana3)
    const makeSeat = useCallback((row: string, num: number): Seat => {
        const id = `${row}${num}`;
        // Las primeras dos filas son premium
        const isPremium = computedRows.indexOf(row) <= 1;

        let status: Seat["status"] = 'available';

        if (occupiedSeats.includes(id)) {
            status = "occupied";
        } else if (reservedSeats.includes(id)) {
            status = "reserved"; // Bloqueado temporalmente
        } else if (isPremium) {
            status = "premium";
        } else {
            status = "available";
        }

        return { id, row, number: num, status };
    }, [computedRows, occupiedSeats, reservedSeats]);


    // 3. Función para determinar la clase de estilo (de test/semana3)
    const getSeatClass = useCallback((status: Seat["status"], isSelected: boolean): string => {
        const baseClass = "w-12 h-12 rounded flex items-center justify-center text-sm font-medium border shadow-sm transition-colors duration-200";

        if (isSelected) {
            return `${baseClass} bg-green-500 text-white border-green-500 border-2 ring-2 ring-green-300`;
        }

        switch (status) {
            case "occupied":
                return `${baseClass} bg-gray-600 text-white border-gray-600 cursor-not-allowed`;
            case "reserved":
                return `${baseClass} bg-orange-500 text-white border-orange-500 cursor-not-allowed`; // Bloqueado por reserva
            case "premium":
                return `${baseClass} bg-red-600 text-white border-red-600 hover:bg-red-700`;
            case "available":
            default:
                return `${baseClass} bg-white text-black border-gray-300 hover:bg-gray-200`;
        }
    }, []);


    // 4. Función para manejar la selección (de test/semana3)
    const toggleSeat = useCallback((seat: Seat) => {
        // Prevenir selección si está ocupado o reservado/bloqueado
        if (seat.status === "occupied" || seat.status === "reserved") return;

        const isCurrentlySelected = selectedSeats.includes(seat.id);
        let newSelected: Seat[];

        if (isCurrentlySelected) {
            // Deseleccionar: filtrar el asiento de la lista de objetos seleccionados
            newSelected = currentSelectedObjects.filter(s => s.id !== seat.id);
        } else {
            // Lógica de Límite (MAX_SEATS)
            if (currentSelectedObjects.length >= MAX_SEATS) {
                if (onMaxSelectionAttempt) {
                    onMaxSelectionAttempt(); // Notificar al padre sobre el intento fallido
                }
                return; // Prevenir la selección
            }

            // Seleccionar: añadir el nuevo asiento
            newSelected = [...currentSelectedObjects, seat];
        }

        if (onSelectionChange) {
            onSelectionChange(newSelected); // Notificar al componente padre
        }
    }, [selectedSeats, currentSelectedObjects, onSelectionChange, onMaxSelectionAttempt]);

    // Calcular el número total de asientos que se renderizarán
    const totalSeatsToRender = computedRows.length * computedCols;

    return (
        <div className="bg-gray-900 p-8 rounded-xl shadow-2xl border border-gray-700 flex flex-col items-center text-white">
            
            {/* Pantalla */}
            <div className="flex justify-center mb-6 w-full">
                <div className="bg-red-600 text-white px-6 py-2 rounded-xl font-semibold border border-red-600 transform perspective-3d rotateX-10 scaleY-90">
                    PANTALLA
                </div>
            </div>

            {/* Contador de Asientos */}
            <div className="mb-6 text-center">
                <div className="font-semibold text-xl text-amber-400">
                    Selecciona tus Asientos
                </div>
                <div className="text-gray-400">
                    Seleccionados: **{currentSelectedObjects.length}** / {MAX_SEATS}
                </div>
            </div>

            {/* Mapa de Asientos */}
            <div className="w-full max-w-xl overflow-x-auto pb-4">
                <div className="flex justify-center min-w-max">
                    <div className="space-y-2">
                        {computedRows.map((row) => (
                            <div
                                key={row}
                                className="grid gap-2 items-center"
                                // Añade 20px extra para la etiqueta de la fila
                                style={{ gridTemplateColumns: `20px repeat(${computedCols}, 48px)` }}
                            >
                                {/* Etiqueta de la Fila (A, B, C...) */}
                                <div className="text-gray-400 font-bold text-lg text-center">{row}</div>

                                {/* Botones de Asientos */}
                                {Array.from({ length: computedCols }, (_, i) => {
                                    const num = i + 1;
                                    const seatIndex = computedRows.indexOf(row) * computedCols + i; // 0-based global index

                                    // Si totalSeats está definido y este índice excede la capacidad, renderizar un espacio vacío
                                    if (typeof totalSeats === 'number' && seatIndex >= totalSeats) {
                                        return <div key={`${row}-${i}`} className="w-12 h-12" />;
                                    }

                                    const seat = makeSeat(row, num);
                                    const isSelected = selectedSeats.includes(seat.id);

                                    return (
                                        <button
                                            key={seat.id}
                                            onClick={() => toggleSeat(seat)}
                                            disabled={seat.status === "occupied" || seat.status === "reserved"}
                                            className={getSeatClass(seat.status, isSelected)}
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
            </div>

            {/* Leyenda */}
            <div className="mt-6">
                <div className="text-sm text-gray-300 font-semibold mb-2">Leyenda:</div>
                <div className="flex flex-wrap justify-center text-sm gap-x-4 gap-y-2 text-gray-400">
                    <LegendItem color="bg-white border-gray-300" label="Disponible" />
                    <LegendItem color="bg-red-600 border-red-600" label="Premium" />
                    <LegendItem color="bg-green-500 border-green-500" label="Seleccionado" />
                    <LegendItem color="bg-orange-500 border-orange-500" label="Bloqueado" />
                    <LegendItem color="bg-gray-600 border-gray-600" label="Ocupado" />
                </div>
            </div>
        </div>
    );
}

// Helper Componente para la Leyenda
const LegendItem = ({ color, label }: { color: string, label: string }) => (
    <div className="flex items-center gap-2">
        <span className={`inline-block w-4 h-4 rounded border ${color}`} />
        <span>{label}</span>
    </div>
);