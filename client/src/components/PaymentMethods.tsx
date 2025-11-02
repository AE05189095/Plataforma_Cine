"use client";
import React, { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { formatCurrency } from '@/lib/format';
import { Elements, CardNumberElement, CardExpiryElement, CardCvcElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { API_BASE, TOKEN_KEY } from '@/lib/config';


type Props = {
  amount: number | string;
  onCancel: () => void;
  showtimeId: string;
  seatsSelected?: string[];
  onConflict?: (conflictSeats: string[], message?: string) => void;
};

const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

const stripePromise = publishableKey ? loadStripe(publishableKey) : null;

function PaymentForm({ amount, onCancel, showtimeId, seatsSelected, onConflict }: Props) {
  const [cardName, setCardName] = useState('');
  const [loading, setLoading] = useState(false);
  const [method, setMethod] = useState<'card'|'paypal'>('card');
  const [error, setError] = useState<string | null>(null);
  const stripe = useStripe();
  const elements = useElements();

  const handleConfirm = async () => {
    if (method !== 'card' || !stripe || !elements) {
      if (method === 'paypal') alert('PayPal no implementado en esta versión');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (!publishableKey) {
        throw new Error(
          'La clave publicable de Stripe no está configurada. Asegúrate de que NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY esté en tu archivo .env.local y reinicia el servidor.'
        );
      }

      const cardNumberElement = elements.getElement(CardNumberElement);
      if (!cardNumberElement) {
        throw new Error("El componente de tarjeta no está listo.");
      }

      // 1. Crear un PaymentMethod en el frontend de forma segura
      const { paymentMethod, error: pmError } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardNumberElement,
        billing_details: {
          name: cardName,
        },
      });

      if (pmError || !paymentMethod) {
        throw new Error(pmError?.message || 'Error al validar la tarjeta.');
      }

      // 2. Enviar el paymentMethod.id al backend para procesar el pago
      const chargeRes = await fetch(`${API_BASE}/api/payments/charge-with-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem(TOKEN_KEY)}` },
        body: JSON.stringify({
          amount: amount,
          currency: 'GTQ',
          paymentMethodId: paymentMethod.id,
          metadata: { showtimeId: showtimeId || '', seats: (seatsSelected || []).join(',') },
        }),
      });

      const chargeData = await chargeRes.json();
      if (!chargeRes.ok) {
        throw new Error(chargeData.message || 'Error procesando el pago.');
      }

      const paymentIntentId = chargeData.paymentIntentId;
      if (!paymentIntentId) throw new Error('El servidor no retornó un ID de pago.');

      // 3. Registrar la compra en la base de datos
      const purchaseRes = await fetch(`${API_BASE}/api/purchases`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem(TOKEN_KEY)}` },
        body: JSON.stringify({
          paymentIntentId,
          showtimeId: showtimeId,
          seats: seatsSelected || [],
        }),
      });

      if (!purchaseRes.ok) {
        const purchaseError = await purchaseRes.json().catch(() => ({ message: 'Error creando el registro de la compra.' }));
        const message = purchaseError.message || 'Error creando el registro de la compra.';
        // Si es conflicto por asientos bloqueados/ocupados, notificar al mapa y cerrar modal
        if (purchaseRes.status === 409 && onConflict) {
          try {
            onConflict(seatsSelected || [], message);
          } catch {}
          onCancel();
          return;
        }
        throw new Error(message);
      }

      const purchaseData = await purchaseRes.json();

      // 4. Éxito y redirección
      window.location.href = `/compra-exitosa?purchase_id=${purchaseData.purchase._id}`;

    } catch (err) {
      console.error('Error en pago:', err);
      setError(err instanceof Error ? err.message : 'Error procesando pago');
    } finally {
      setLoading(false);
    }
  };

  const elementOptions = {
    style: {
      base: {
        color: '#ffffff',
        fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
        fontSmoothing: 'antialiased',
        fontSize: '16px',
        '::placeholder': {
          color: '#a0aec0',
        },
      },
      invalid: { color: '#f56565', iconColor: '#f56565' },
    },
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70" onClick={onCancel} />
      <div className="relative bg-gray-900 text-white rounded-xl shadow-xl w-full max-w-lg p-6">
        <h3 className="text-xl font-semibold mb-3">Selecciona método de pago</h3>
        <div className="text-sm text-gray-300 mb-4">
          Total a pagar: <span className="text-amber-300 font-semibold">{formatCurrency(amount)}</span>
        </div>

        <div className="flex gap-2 mb-4">
          <button 
            className={`px-3 py-2 rounded ${method === 'card' ? 'bg-red-600' : 'bg-gray-800'}`} 
            onClick={() => setMethod('card')}
          >
            Tarjeta de crédito
          </button>
          <button 
            className={`px-3 py-2 rounded ${method === 'paypal' ? 'bg-red-600' : 'bg-gray-800'}`} 
            onClick={() => setMethod('paypal')}
          >
            PayPal
          </button>
        </div>

        {method === 'card' ? (
          <div className="space-y-2">
            <input className="w-full p-2 rounded bg-gray-800" placeholder="Nombre en la tarjeta" value={cardName} onChange={(e) => setCardName(e.target.value)} autoComplete="cc-name" />
            <div className="w-full p-2 rounded bg-gray-800"><CardNumberElement options={elementOptions} /></div>
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2 rounded bg-gray-800"><CardExpiryElement options={elementOptions} /></div>
              <div className="p-2 rounded bg-gray-800"><CardCvcElement options={elementOptions} /></div>
            </div>
            {error && <div className="text-red-400 text-sm mt-2">{error}</div>}
          </div>
        ) : (
          <div className="space-y-2">
            <input 
              className="w-full p-2 rounded bg-gray-800" 
              placeholder="Email de PayPal" 
              onChange={() => {}} 
            />
            <div className="text-xs text-gray-400">
              PayPal no implementado en esta versión.
            </div>
          </div>
        )}

        <div className="mt-4 flex justify-end gap-2">
          <button 
            className="px-4 py-2 rounded bg-gray-700" 
            onClick={onCancel} 
            disabled={loading}
          >
            Cancelar
          </button>
          <button 
            className="px-4 py-2 rounded bg-red-600" 
            onClick={handleConfirm} 
            disabled={loading}
          >
            {loading ? 'Procesando...' : 'Confirmar compra'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PaymentMethodsWrapper(props: Props) {
  if (!stripePromise) {
    console.error("Stripe publishable key is not available.");
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/70" />
            <div className="relative bg-gray-900 text-white rounded-xl shadow-xl w-full max-w-lg p-6">
                <h3 className="text-xl font-semibold text-red-400">Error de Configuración</h3>
                <p className="text-gray-300 mt-2">La clave de Stripe no está configurada en el cliente. Revisa el archivo `.env.local`.</p>
            </div>
        </div>
    );
  }
  return (
    <Elements stripe={stripePromise}><PaymentForm {...props} /></Elements>
  );
}