"use client";
import React from "react";

export default function AdminDashboardPage() {
  const cardStyle: React.CSSProperties = {
    background: 'rgba(6,18,30,0.7)',
    border: '1px solid rgba(255,255,255,0.04)'
  };

  return (
    <div className="py-8">
      <h1 className="text-3xl font-bold mb-6" style={{ color: 'var(--foreground)' }}>Panel de Control</h1>

      {/* Cards resumen */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="p-4 rounded-lg" style={cardStyle}> 
          <h3 className="text-sm" style={{ color: 'var(--color-link)' }}>Películas Activas</h3>
          <p className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>4</p>
        </div>
        <div className="p-4 rounded-lg" style={cardStyle}> 
          <h3 className="text-sm" style={{ color: 'var(--color-link)' }}>Funciones Programadas</h3>
          <p className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>20</p>
        </div>
        <div className="p-4 rounded-lg" style={cardStyle}> 
          <h3 className="text-sm" style={{ color: 'var(--color-link)' }}>Ocupación</h3>
          <p className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>40%</p>
        </div>
        <div className="p-4 rounded-lg" style={cardStyle}> 
          <h3 className="text-sm" style={{ color: 'var(--color-link)' }}>Ingresos Estimados</h3>
          <p className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>Q22,895</p>
        </div>
      </div>

      {/* Secciones inferiores (resumen peliculas y salas) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="p-4 rounded-lg" style={cardStyle}>
          <h2 className="font-semibold mb-4" style={{ color: 'var(--foreground)' }}>Películas Más Populares</h2>
          <ul className="space-y-3" style={{ color: 'rgba(255,255,255,0.8)' }}>
            <li>1. Echoes of Tomorrow — 152 reservas</li>
            <li>2. Midnight Heist — 114 reservas</li>
            <li>3. Quantum Nexus — 105 reservas</li>
          </ul>
        </div>

        <div className="p-4 rounded-lg" style={cardStyle}>
          <h2 className="font-semibold mb-4" style={{ color: 'var(--foreground)' }}>Estado de Salas</h2>
          <ul className="space-y-2" style={{ color: 'rgba(255,255,255,0.8)' }}>
            <li>Sala 1 — 3 funciones — 28% ocupación</li>
            <li>Sala 2 — 4 funciones — 43% ocupación</li>
            <li>Sala 3 — 2 funciones — 44% ocupación</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
