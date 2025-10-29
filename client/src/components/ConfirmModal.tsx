"use client";
import React from 'react';

export default function ConfirmModal({ open, title, message, onConfirm, onCancel, confirmLabel = 'Confirmar', cancelLabel = 'Cancelar', small = false }: { open: boolean; title?: string; message: string; onConfirm: () => void; onCancel: () => void; confirmLabel?: string; cancelLabel?: string; small?: boolean }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center">
      <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.6)' }} onClick={onCancel} />
      <div className="relative z-10" style={{ width: small ? 420 : 640 }}>
        <div style={{ background: 'var(--background)', color: 'var(--foreground)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: '18px' }}>
          {title && <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--foreground)' }}>{title}</h3>}
          <div className="text-sm mb-4" style={{ color: 'rgba(255,255,255,0.9)' }}>{message}</div>
          <div className="flex justify-end gap-3">
            <button onClick={onCancel} className="px-3 py-2 rounded" style={{ background: 'transparent', color: 'var(--foreground)', border: '1px solid rgba(255,255,255,0.06)' }}>{cancelLabel}</button>
            <button onClick={onConfirm} className="px-3 py-2 rounded" style={{ background: 'var(--color-link)', color: '#0b1220' }}>{confirmLabel}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
