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
    <div ref={ref} className="relative">
      <button 
        ref={btnRef} 
        type="button" 
        onClick={() => setOpen(s => !s)} 
        aria-haspopup="listbox" 
        aria-expanded={open} 
        className="w-full text-left p-2 rounded bg-gray-800 text-white border border-gray-600 flex items-center justify-between"
      >
        <span className={selected ? 'text-white' : 'text-gray-400'}>
          {selected ? selected.label : (placeholder || '- Selecciona -')}
        </span>
        <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path fillRule="evenodd" d="M10 3a.75.75 0 01.53.22l3.5 3.5a.75.75 0 01-1.06 1.06L10 4.81 6.53 8.28a.75.75 0 01-1.06-1.06l3.5-3.5A.75.75 0 0110 3zm-3.72 9.28a.75.75 0 011.06 0L10 15.19l2.47-2.47a.75.75 0 111.06 1.06l-3.5 3.5a.75.75 0 01-1.06 0l-3.5-3.5a.75.75 0 010-1.06z" clipRule="evenodd" />
        </svg>
      </button>
      {open && (
        <ul role="listbox" tabIndex={-1} className="absolute z-60 w-full mt-2 max-h-60 overflow-auto rounded-md bg-gray-900 border border-gray-700 p-1">
          {options.map(o => (
            <li 
              key={o.value} 
              role="option" 
              aria-selected={o.value === value} 
              onMouseDown={(e) => { e.preventDefault(); onChange(o.value); setOpen(false); btnRef.current?.focus(); }} 
              className="p-2 cursor-pointer rounded-md hover:bg-gray-800"
            >
              {o.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
