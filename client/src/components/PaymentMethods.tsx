"use client";
import React, { useState } from 'react';

import { normalizePaymentPayload } from '@/lib/payment';

type CardInfo = { number: string; name: string; exp: string; cvc: string };
type PaymentPayload = { method: 'card' | 'paypal'; card?: CardInfo; paypal?: { email: string } };

type Props = {
  amount: number | string;
  onCancel: () => void;
  onConfirm: (paymentInfo: PaymentPayload) => Promise<void>;
};

export default function PaymentMethods({ amount, onCancel, onConfirm }: Props) {
  const [method, setMethod] = useState<'card' | 'paypal'>('card');
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [cardExp, setCardExp] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const [paypalEmail, setPaypalEmail] = useState('');
  const [loading, setLoading] = useState(false);

  // Helpers to manage formatting
  const onlyDigits = (v: string) => v.replace(/\D/g, '');

  const formatCardNumber = (value: string) => {
    const digits = onlyDigits(value).slice(0, 19); // limitar a 19 dígitos max
    return digits.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
  };

  const formatExp = (value: string) => {
    const digits = onlyDigits(value).slice(0, 4);
    if (digits.length <= 2) return digits;
    return `${digits.slice(0,2)}/${digits.slice(2)}`;
  };

  // Validación relajada para modo demo: aceptar cualquier tarjeta inventada siempre que haya nombre y algunos dígitos
  const validate = () => {
    if (method === 'card') {
      const digits = onlyDigits(cardNumber);
      return cardName.trim().length > 0 && digits.length >= 6 && cardCvc.trim().length >= 2 && cardExp.trim().length >= 3;
    }
    // PayPal: aceptar cualquier entrada no vacía (modo demo)
    return paypalEmail.trim().length > 3;
  };

  const handleConfirm = async () => {
    if (!validate()) return alert('Completa los datos de pago correctamente');
    setLoading(true);
    try {
      // Build raw payload then normalize to a stable shape before sending to parent
      const raw: PaymentPayload = { method };
      if (method === 'card') raw.card = { number: cardNumber.replace(/\s+/g, ''), name: cardName, exp: cardExp, cvc: cardCvc };
      else raw.paypal = { email: paypalEmail };

      const normalized = normalizePaymentPayload(raw as any);
      await onConfirm(normalized as any);
    } catch (e) {
      console.error(e);
      alert('Error procesando el pago');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70" onClick={onCancel} />
      <div className="relative bg-gray-900 text-white rounded-xl shadow-xl w-full max-w-lg p-6">
        <h3 className="text-xl font-semibold mb-3">Selecciona método de pago</h3>
  <div className="text-sm text-gray-300 mb-4">Total a pagar: <span className="text-amber-300 font-semibold">{amount}</span></div>

        <div className="flex gap-2 mb-4">
          <button className={`px-3 py-2 rounded ${method === 'card' ? 'bg-red-600' : 'bg-gray-800'}`} onClick={() => setMethod('card')}>Tarjeta de crédito</button>
          <button className={`px-3 py-2 rounded ${method === 'paypal' ? 'bg-red-600' : 'bg-gray-800'}`} onClick={() => setMethod('paypal')}>PayPal</button>
        </div>

        {method === 'card' ? (
          <div className="space-y-2">
            <input
              className="w-full p-2 rounded bg-gray-800"
              placeholder="Nombre en la tarjeta"
              value={cardName}
              onChange={(e) => setCardName(e.target.value)}
            />
            <input
              className="w-full p-2 rounded bg-gray-800"
              placeholder="Número de tarjeta"
              inputMode="numeric"
              value={cardNumber}
              onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                className="p-2 rounded bg-gray-800"
                placeholder="MM/YY"
                inputMode="numeric"
                value={cardExp}
                onChange={(e) => setCardExp(formatExp(e.target.value))}
              />
              <input
                className="p-2 rounded bg-gray-800"
                placeholder="CVC"
                inputMode="numeric"
                value={cardCvc}
                onChange={(e) => setCardCvc(onlyDigits(e.target.value).slice(0,4))}
              />
            </div>
            <div className="text-xs text-gray-400">Los datos de tarjeta no se procesan realmente (modo demo). Se aceptan tarjetas inventadas.</div>
          </div>
        ) : (
          <div className="space-y-2">
            <input className="w-full p-2 rounded bg-gray-800" placeholder="Email de PayPal" value={paypalEmail} onChange={(e) => setPaypalEmail(e.target.value)} />
            <div className="text-xs text-gray-400">Se simula pago por PayPal; no hay redirección real.</div>
          </div>
        )}

        <div className="mt-4 flex justify-end gap-2">
          <button className="px-4 py-2 rounded bg-gray-700" onClick={onCancel} disabled={loading}>Cancelar</button>
          <button className="px-4 py-2 rounded bg-red-600" onClick={handleConfirm} disabled={loading}>{loading ? 'Procesando...' : 'Confirmar compra'}</button>
        </div>
      </div>
    </div>
  );
}
