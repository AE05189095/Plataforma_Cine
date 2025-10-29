"use client";
import React, { useState, useRef, useEffect } from 'react';

type Option = { value: string; label: string };

export default function DarkSelect({ value, options, onChange, placeholder }: { value: string; options: Option[]; onChange: (v: string) => void; placeholder?: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);
  const btnRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const selected = options.find(o => o.value === value);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button ref={btnRef} type="button" onClick={() => setOpen(s => !s)} aria-haspopup="listbox" aria-expanded={open} className="w-full text-left p-2 rounded" style={{ background: 'var(--background)', color: 'var(--foreground)', border: '1px solid rgba(255,255,255,0.04)' }}>
        <span style={{ color: selected ? 'var(--foreground)' : 'rgba(255,255,255,0.45)' }}>{selected ? selected.label : (placeholder || '- Selecciona -')}</span>
      </button>
      {open && (
        <ul role="listbox" tabIndex={-1} style={{ position: 'absolute', zIndex: 60, left: 0, right: 0, marginTop: 6, maxHeight: 240, overflow: 'auto', background: '#0b1220', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 6, padding: 6 }}>
          {options.map(o => (
            <li key={o.value} role="option" aria-selected={o.value === value} onMouseDown={(e) => { e.preventDefault(); onChange(o.value); setOpen(false); if (btnRef.current) { setTimeout(() => btnRef.current?.focus(), 0); } }} style={{ padding: '8px 10px', cursor: 'pointer', color: 'var(--foreground)', borderRadius: 4 }} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); onChange(o.value); setOpen(false); if (btnRef.current) { setTimeout(() => btnRef.current?.focus(), 0); } } }}>
              {o.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
