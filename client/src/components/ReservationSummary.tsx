"use client";
import React, { useState, useEffect } from 'react';
import { formatCurrency } from '@/lib/format';

type Seat = {
    id: string;
    row: string;
    number: number;
    status: string;
};

interface ReservationSummaryProps {
    seats: Seat[];
    expirationTime: Date | null; 
    onExpiration: () => void;
    onPurchase: () => void;
    perSeatPrice?: number | null; // si se pasa, usar por asiento (deprecated a favor de regularPrice/premiumPrice)
    regularPrice?: number | null; // si ambos están presentes, usar diferenciación por asiento
    premiumPrice?: number | null;
    // Opcional: deshabilitar compra por motivos de rol u otros
    disablePurchase?: boolean;
    disableReason?: string;
}

const calculateTotal = (seats: Seat[], perSeatPrice?: number | null, regularPrice?: number | null, premiumPrice?: number | null) => {
    // Preferir precios diferenciados si ambos están definidos
    if (typeof regularPrice === 'number' && typeof premiumPrice === 'number' && !Number.isNaN(regularPrice) && !Number.isNaN(premiumPrice)) {
        return seats.reduce((acc, s) => acc + (s.status === 'premium' ? premiumPrice : regularPrice), 0);
    }
    if (typeof perSeatPrice === 'number' && !Number.isNaN(perSeatPrice)) {
        return seats.length * perSeatPrice;
    }
    return seats.reduce((acc, s) => acc + (s.status === 'premium' ? 65 : 45), 0);
};

const CountdownTimer = ({ expirationTime, onExpiration }: { expirationTime: Date, onExpiration: () => void }) => {
    const [timeLeft, setTimeLeft] = useState(Math.max(0, Math.floor((expirationTime.getTime() - new Date().getTime()) / 1000)));

    useEffect(() => {
        const timer = setInterval(() => {
            const diff = Math.max(0, Math.floor((expirationTime.getTime() - new Date().getTime()) / 1000));
            setTimeLeft(diff);

            if (diff <= 0) {
                clearInterval(timer);
                onExpiration();
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [expirationTime, onExpiration]);

    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;

    return (
        <div className="p-3 bg-red-800 rounded-lg text-white font-bold text-center border-2 border-red-500 shadow-lg">
            Tiempo de Reserva: {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
        </div>
    );
};

export default function ReservationSummary({ seats, expirationTime, onExpiration, onPurchase, perSeatPrice, regularPrice, premiumPrice, disablePurchase, disableReason }: ReservationSummaryProps) {
    const total = calculateTotal(seats, perSeatPrice ?? null, regularPrice ?? null, premiumPrice ?? null);

    return (
        <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700 w-full">
            <h2 className="text-xl font-bold mb-4 text-amber-400 border-b border-gray-600 pb-2">Resumen de Reserva</h2>

            {/* Mostrar el contador solo si hay asientos y expirationTime */}
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
                disabled={seats.length === 0 || !!disablePurchase}
                className="mt-6 w-full py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition duration-200 disabled:bg-gray-600 disabled:cursor-not-allowed"
                title={disablePurchase ? (disableReason || 'Acción no permitida') : undefined}
            >
                Confirmar Compra ({seats.length} Asiento{seats.length !== 1 ? 's' : ''})
            </button>
            {disablePurchase && (
                <div className="mt-2 text-sm text-red-400">
                    {disableReason || 'Las compras no están disponibles para tu rol.'}
                </div>
            )}
        </div>
    );
}
