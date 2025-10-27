"use client";
import React from "react";

export default function AdminReservasPage() {
  const boxStyle: React.CSSProperties = { background: 'rgba(6,18,30,0.7)', border: '1px solid rgba(255,255,255,0.04)' };

  return (
    <div className="py-8">
      <div className="p-4 rounded-lg mb-4" style={boxStyle}>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>Reservas</h1>
        <p style={{ color: 'rgba(255,255,255,0.85)' }}>Aquí verás las reservas y podrás gestionarlas.</p>
      </div>
    </div>
  );
}
