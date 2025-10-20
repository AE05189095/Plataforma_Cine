// client/src/components/ReservationSummary.tsx
"use client";
import React, { useState, useEffect, useCallback } from 'react';
// Asume que formatCurrency existe en la librería.
import { formatCurrency } from '@/lib/format'; 

type Seat = {
    id: string;
    row: string;
    number: number;
    status: string;
};

interface ReservationSummaryProps {
    seats: Seat[];
    showtimeId: string | null;
    expirationTime: Date | null; // Hora de expiración
    onExpiration: () => void; // Callback al expirar
    onPurchase: () => void;
}

const calculateTotal = (seats: Seat[]) => {
    return seats.reduce((acc, s) => acc + (s.status === 'premium' ? 65 : 45), 0);
};

// Componente Contador
const CountdownTimer = ({ expirationTime, onExpiration }: { expirationTime: Date, onExpiration: () => void }) => {
    const [timeLeft, setTimeLeft] = useState(0);

    useEffect(() => {
        const calculateTimeLeft = () => {
            const now = new Date().getTime();
            const expiration = expirationTime.getTime();
            // 🛑 CORRECCIÓN ESLINT: Cambiado a const
            const difference = Math.max(0, expiration - now); 
            setTimeLeft(Math.floor(difference / 1000));
            return difference;
        };

        // Ejecutar inmediatamente
        // 🛑 CORRECCIÓN ESLINT: Cambiado a const
        const diff = calculateTimeLeft(); 
        if (diff <= 0) {
            onExpiration();
            return;
        }

        // Configurar el intervalo
        const timer = setInterval(() => {
            const remaining = calculateTimeLeft();
            if (remaining <= 0) {
                clearInterval(timer);
                onExpiration();
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [expirationTime, onExpiration]);

    if (timeLeft <= 0) return null;

    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;

    return (
        <div className="p-3 bg-red-800 rounded-lg text-white font-bold text-center border-2 border-red-500 shadow-lg">
            Tiempo de Reserva: {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
        </div>
    );
};


export default function ReservationSummary({ seats, showtimeId, expirationTime, onExpiration, onPurchase }: ReservationSummaryProps) {
    const total = calculateTotal(seats);

    return (
        <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700 w-full">
            <h2 className="text-xl font-bold mb-4 text-amber-400 border-b border-gray-600 pb-2">Resumen de Reserva</h2>
            
            {/* INTEGRACIÓN DEL CONTADOR */}
            {seats.length > 0 && expirationTime && (
                <div className="mb-4">
                    <CountdownTimer expirationTime={expirationTime} onExpiration={onExpiration} />
                </div>
            )}
            
            <div className="space-y-3">
                <div className="flex justify-between text-gray-300">
                    <span>Boletos:</span>
                    <span className="font-semibold">{seats.length}</span>
                </div>
                
                <div className="text-sm text-gray-400 border-b border-dashed border-gray-600 pb-2">
                    {seats.map(s => s.id).join(', ') || 'No hay asientos seleccionados.'}
                </div>

                <div className="flex justify-between text-lg font-bold pt-2 text-white">
                    <span>TOTAL A PAGAR:</span>
                    <span className="text-2xl text-green-400">{formatCurrency(total)}</span>
                </div>
            </div>

            <button
                onClick={onPurchase}
                disabled={seats.length === 0}
                className="mt-6 w-full py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition duration-200 disabled:bg-gray-600 disabled:cursor-not-allowed"
            >
                Confirmar Compra ({seats.length} Asiento{seats.length !== 1 ? 's' : ''})
            </button>
        </div>
    );
}