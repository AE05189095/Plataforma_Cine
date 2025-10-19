"use client";
import React, { useEffect } from 'react';

type Props = {
  open: boolean;
  message: string;
  type?: 'success' | 'error' | 'info';
  duration?: number;
  onClose: () => void;
  position?: 'top-right' | 'center';
};

export default function Toast({ open, message, type = 'info', duration = 3000, onClose, position }: Props) {
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => onClose(), duration);
    return () => clearTimeout(t);
  }, [open, duration, onClose]);

  if (!open) return null;

  // Position: top-right by default. For 'center' we render a modal-like card centered on screen.
  const bgClass = type === 'success' ? 'bg-amber-300 text-black' : type === 'error' ? 'bg-red-600 text-white' : 'bg-gray-800 text-white';

  // If position is center, render a larger modal in the middle
  const pos = position ?? 'top-right';
  if (pos === 'center') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/50" onClick={onClose} />
        <div className="relative max-w-md w-full rounded-xl shadow-2xl p-6 bg-gray-900 border border-gray-700 text-white flex flex-col items-center gap-4">
          {type === 'success' ? (
            <div className="w-20 h-20 rounded-full bg-amber-300 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-black" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          ) : null}
          <div className="text-lg font-semibold">{message}</div>
          <button className="mt-2 px-4 py-2 rounded bg-gray-800 border border-gray-700" onClick={onClose}>Cerrar</button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed top-6 right-6 z-50">
      <div className={`max-w-sm w-full rounded-lg shadow-lg px-4 py-3 ${bgClass} border border-gray-700`} role="status">
        <div className="flex items-center justify-between gap-4">
          <div className="text-sm font-medium">{message}</div>
          <button aria-label="Cerrar" className="ml-2 text-sm opacity-80 hover:opacity-100" onClick={onClose}>✕</button>
        </div>
      </div>
    </div>
  );
}
