"use client";
import React, { useEffect, useState, useRef } from 'react';
import { API_BASE, TOKEN_KEY } from '@/lib/config';

type Props = {
  holdId: string | null;
  reservedUntil?: string | null; // ISO string desde servidor
  minutes?: number; // duración del hold en minutos (por defecto 10) - fallback
  onExpire?: () => void; // se llama cuando el contador llega a 0
};

export default function ReservationCountdown({ holdId, reservedUntil = null, minutes = 10, onExpire }: Props) {
  const [secondsLeft, setSecondsLeft] = useState<number | null>(holdId ? minutes * 60 : null);
  const intervalRef = useRef<number | null>(null);

  // iniciar timer cuando haya holdId
  // calcular segundos restantes desde reservedUntil si está presente, si no usar minutes como fallback
  useEffect(() => {
    if (!holdId) {
      setSecondsLeft(null);
      return;
    }

    if (reservedUntil) {
      const until = Date.parse(reservedUntil);
      if (!isNaN(until)) {
        const secs = Math.max(0, Math.floor((until - Date.now()) / 1000));
        setSecondsLeft(secs);
      } else {
        setSecondsLeft(minutes * 60);
      }
    } else {
      setSecondsLeft(minutes * 60);
    }

    // decremento cada segundo
    intervalRef.current = window.setInterval(() => {
      setSecondsLeft(prev => (prev !== null ? prev - 1 : prev));
    }, 1000);

    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
    };
  }, [holdId, reservedUntil, minutes]);

  // cuando llega a 0, llamar onExpire y liberar hold (por seguridad)
  useEffect(() => {
    if (secondsLeft === null) return;
    if (secondsLeft <= 0) {
      // limpiar timer
      if (intervalRef.current) { window.clearInterval(intervalRef.current); }
      // intentar liberar el hold en background
      (async () => {
        try {
          const token = localStorage.getItem(TOKEN_KEY);
          if (!holdId) return;
          await fetch(`${API_BASE}/api/purchases/${holdId}/release`, { method: 'DELETE', headers: { Authorization: token ? `Bearer ${token}` : '' } });
        } catch (e) { console.warn('No se pudo liberar hold en expire', e); }
      })();
      if (onExpire) onExpire();
    }
  }, [secondsLeft, holdId, onExpire]);

  // liberar hold si el usuario abandona la página
  useEffect(() => {
    if (!holdId) return;

  const onBeforeUnload = () => {
      try {
        const token = localStorage.getItem(TOKEN_KEY);
        const url = `${API_BASE}/api/purchases/${holdId}/release`;
        // intentar sendBeacon (no admite headers)
        try { if (typeof navigator !== 'undefined' && 'sendBeacon' in navigator) navigator.sendBeacon(url); } catch {}
        // intentar fetch con keepalive para mayor probabilidad de completar
        try { fetch(url, { method: 'DELETE', headers: { Authorization: token ? `Bearer ${token}` : '' }, keepalive: true }); } catch {}
      } catch {
        /* ignore */
      }
    };

    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') onBeforeUnload();
    };

  window.addEventListener('beforeunload', onBeforeUnload);
  document.addEventListener('visibilitychange', handleVisibility);

    return () => {
  window.removeEventListener('beforeunload', onBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [holdId]);

  if (!holdId || secondsLeft === null) return null;

  const mm = Math.floor(Math.max(0, secondsLeft) / 60).toString().padStart(2, '0');
  const ss = Math.floor(Math.max(0, secondsLeft) % 60).toString().padStart(2, '0');

  return (
    <div className="bg-gray-800 text-amber-300 rounded-md px-3 py-2 text-sm font-semibold">
      Tiempo restante: {mm}:{ss}
    </div>
  );
}

