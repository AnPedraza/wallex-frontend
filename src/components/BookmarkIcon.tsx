import React from 'react';

// Marcador de "Guardar": de trazo si el arriendo no está guardado, relleno si sí
export const BookmarkIcon: React.FC<{ filled?: boolean; className?: string }> = ({ filled = false, className = 'size-4' }) => (
  <svg
    viewBox="0 0 24 24"
    className={className}
    fill={filled ? 'currentColor' : 'none'}
    stroke="currentColor"
    strokeWidth="2"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M6.5 4.5A1.5 1.5 0 0 1 8 3h8a1.5 1.5 0 0 1 1.5 1.5V21L12 17.25 6.5 21z" />
  </svg>
);
