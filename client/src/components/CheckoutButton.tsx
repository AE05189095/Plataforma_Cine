'use client';
import React, { useState } from 'react';
import { API_BASE } from '@/lib/config';

type Props = {
  amount: number; // in GTQ
  metadata?: Record<string, unknown>;
  children?: React.ReactNode;
};

export default function CheckoutButton({ amount, metadata = {}, children }: Props) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/payments/create-checkout-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, currency: 'GTQ', metadata }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: 'Error creando sesión' }));
        throw new Error(err.message || 'Error creando sesión de pago');
      }
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url; // redirect to hosted Stripe Checkout
      } else {
        throw new Error('No checkout url returned');
      }
    } catch (err) {
      console.error('Checkout error:', err);
      const msg = err instanceof Error ? err.message : 'Error al iniciar pago';
      alert(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button onClick={handleClick} disabled={loading} className="px-4 py-2 bg-amber-500 text-black rounded font-semibold">
      {loading ? 'Redirigiendo...' : (children || 'Pagar con tarjeta')}
    </button>
  );
}
