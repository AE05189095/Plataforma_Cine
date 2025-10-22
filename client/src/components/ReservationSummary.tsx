// client/src/components/ReservationSummary.tsx
"use client";
import React, { useState, useEffect, useCallback } from 'react';
// Asume que formatCurrency existe en la librería.
// Nota: 'format' no existe en este scope, se cambia a la asunción del comentario.
import { formatCurrency } from '@/lib/format'; 

type Seat = {
    id: string;
    row: string;
    number: number;
    status: 'regular' | 'premium' | string; // Añadido para mejor tipado
};

interface ReservationSummaryProps {
    seats: Seat[];
    showtimeId: string | null;
    expirationTime: Date | null; // Hora de expiración
    onExpiration: () => void; // Callback al expirar
    onPurchase: (seatIds: string[]) => Promise<void> | void; // La versión Izquierda usa un array de seatIds
}

const PRICE_REGULAR = 45;
const PRICE_PREMIUM = 65;

const priceForSeat = (s: Seat) => (s.status === 'premium' ? PRICE_PREMIUM : PRICE_REGULAR);

const calculateTotal = (seats: Seat[]) => {
    // Usa la función priceForSeat para calcular el total
    return seats.reduce((acc, s) => acc + priceForSeat(s), 0);
};

// Componente Contador
const CountdownTimer = ({ expirationTime, onExpiration }: { expirationTime: Date, onExpiration: () => void }) => {
    const [timeLeft, setTimeLeft] = useState(0);

    const calculateTimeLeft = useCallback(() => {
        const now = new Date().getTime();
        const expiration = expirationTime.getTime();
        const difference = Math.max(0, expiration - now); 
        setTimeLeft(Math.floor(difference / 1000));
        return difference;
    }, [expirationTime]);

    useEffect(() => {
        const diff = calculateTimeLeft(); 

        if (diff <= 0) {
            onExpiration();
            return;
        }

        const timer = setInterval(() => {
            const remaining = calculateTimeLeft();
            if (remaining <= 0) {
                clearInterval(timer);
                onExpiration();
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [expirationTime, onExpiration, calculateTimeLeft]);

    if (timeLeft <= 0) return null;

    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;

    return (
        <div className="p-3 bg-red-800 rounded-lg text-white font-bold text-center border-2 border-red-500 shadow-lg">
            Tiempo de Reserva: {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
        </div>
    );
};

// Componente Principal
export default function ReservationSummary({ seats, showtimeId, expirationTime, onExpiration, onPurchase }: ReservationSummaryProps) {
    // Usar la función calculateTotal definida arriba
    const total = calculateTotal(seats);
    const serviceFee = 0; // Asumimos 0 por simplicidad, como en la versión Izquierda
    const finalTotal = total + serviceFee;

    const handlePurchaseClick = useCallback(async () => {
        if (!showtimeId) return window.alert('No se puede procesar la compra: ID de función no disponible.');
        
        const seatIds = seats.map(s => s.id);
        
        try {
            // Se asume que onPurchase puede ser async o sync
            await onPurchase(seatIds);
        } catch (error) {
            console.error('Error durante la compra:', error);
            window.alert('Error al procesar la compra o la reserva. Intenta de nuevo.');
        }
    }, [seats, showtimeId, onPurchase]);

    return (
        <aside className="bg-gradient-to-br from-gray-900 to-gray-800 p-6 rounded-2xl text-sm border border-gray-700 shadow-2xl">
            {/* Encabezado y Contador */}
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

            {/* INTEGRACIÓN DEL CONTADOR */}
            {seats.length > 0 && expirationTime && (
                <div className="mb-4">
                    <CountdownTimer expirationTime={expirationTime} onExpiration={onExpiration} />
                </div>
            )}
            
            {seats.length === 0 ? (
                <div className="text-center text-slate-400 py-8">Selecciona al menos un asiento para continuar</div>
            ) : (
                <div className="space-y-3">
                    <h4 className='text-sm font-semibold text-gray-300 pb-1 border-b border-gray-700'>Detalles de Asientos:</h4>
                    {/* Lista de asientos detallada de la versión izquierda */}
                    <ul className="divide-y divide-slate-700 max-h-72 overflow-auto">
                        {seats.map((s) => (
                            <li key={s.id} className="py-3 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    {/* Muestra Fila y Número */}
                                    <span className={`inline-block w-10 h-10 rounded-md flex items-center justify-center text-lg font-semibold ${s.status === 'premium' ? 'bg-red-600 text-white' : 'bg-white text-black'}`}>{s.row}{s.number}</span>
                                    <div>
                                        {/* Muestra ID y tipo */}
                                        <div className="font-medium text-white">{s.id}</div>
                                        <div className="text-xs text-slate-400 capitalize">{s.status} (Precio: {s.status === 'premium' ? formatCurrency(PRICE_PREMIUM) : formatCurrency(PRICE_REGULAR)})</div>
                                    </div>
                                </div>
                                <div className="text-amber-300 font-semibold">{formatCurrency(priceForSeat(s))}</div>
                            </li>
                        ))}
                    </ul>

                    {/* Desglose de precios de la versión izquierda */}
                    <div className="pt-3 border-t border-gray-700">
                        <div className="flex justify-between items-center mb-2">
                            <div className="text-sm text-gray-400">Subtotal</div>
                            <div className="text-sm text-amber-300">{formatCurrency(total)}</div>
                        </div>
                        <div className="flex justify-between items-center mb-4">
                            <div className="text-sm text-gray-400">Tarifa de servicio</div>
                            <div className="text-sm text-amber-300">{formatCurrency(serviceFee)}</div>
                        </div>

                        <div className="flex justify-between items-center font-bold text-white text-xl border-t border-gray-600 pt-3 mt-3">
                            <div>Total a pagar</div>
                            <div className="text-amber-300">{formatCurrency(finalTotal)}</div>
                        </div>

                        {/* Botón de compra mejorado */}
                        <button
                            aria-label="Comprar entradas"
                            className="mt-4 w-full bg-amber-500 text-black py-3 rounded-2xl font-semibold hover:bg-amber-400 transition duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
                            disabled={seats.length === 0}
                            onClick={handlePurchaseClick}
                        >
                            Confirmar y Pagar ({seats.length} Asiento{seats.length !== 1 ? 's' : ''})
                        </button>
                    </div>
                </div>
            )}
        </aside>
    );
}