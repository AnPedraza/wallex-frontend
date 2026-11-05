import React from 'react';

interface NoticeProps {
  children: React.ReactNode;
  onClose: () => void;
  action?: { label: string; onClick: () => void };
}

// Aviso corto que flota sobre la página, en tinta como la barra del comparador.
// Quien lo usa lo pone dentro de una región viva (role="status" o "alert") que ya existe en la página.
export const Notice: React.FC<NoticeProps> = ({ children, onClose, action }) => (
  <div className="pointer-events-auto max-w-[560px] bg-ink text-white ring-1 ring-white/15 rounded-[10px] pl-4 pr-1.5 py-1.5 flex items-center gap-3 text-sm">
    <p className="py-1.5 min-w-0">{children}</p>
    {action && (
      <button
        type="button"
        onClick={action.onClick}
        className="shrink-0 font-semibold px-3 py-1.5 rounded-lg bg-surface text-ink hover:bg-paper focus-visible:outline-white"
      >
        {action.label}
      </button>
    )}
    <button
      type="button"
      onClick={onClose}
      aria-label="Cerrar aviso"
      className="shrink-0 size-8 rounded-lg flex items-center justify-center hover:bg-white/10 focus-visible:outline-white"
    >
      <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M6 6l12 12M18 6L6 18" />
      </svg>
    </button>
  </div>
);
