import React, { useEffect, useState } from 'react';

interface CompareBarProps {
  count: number; // cuántos inmuebles van al comparador (máximo 3)
  onOpen: () => void;
}

// Barra flotante del comparador, en el catálogo y en Guardados.
// Se invierte cuando pasa sobre el pie de página (mismo color tinta).
export const CompareBar: React.FC<CompareBarProps> = ({ count, onOpen }) => {
  const [overFooter, setOverFooter] = useState(false);

  useEffect(() => {
    const footer = document.querySelector('footer');
    if (!footer || !('IntersectionObserver' in window)) return;
    const observer = new IntersectionObserver(([entry]) => setOverFooter(entry.isIntersecting), {
      rootMargin: '0px 0px -16px 0px',
    });
    observer.observe(footer);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="fixed bottom-4 inset-x-0 z-30 px-4 flex justify-center pointer-events-none">
      <div
        className={`pointer-events-auto rounded-[10px] pl-5 pr-2 py-2 flex items-center gap-5 ring-1 transition-colors duration-200 ${
          overFooter ? 'bg-surface text-ink ring-rule' : 'bg-ink text-white ring-white/15'
        }`}
      >
        <p className="text-sm">
          <b>{count} de 3</b> para comparar<span className="hidden sm:inline"> lado a lado</span>
        </p>
        <button
          type="button"
          onClick={onOpen}
          className={`font-semibold text-sm px-4 py-2 rounded-lg transition-colors duration-200 ${
            overFooter ? 'bg-ink text-white hover:bg-ink-hover' : 'bg-surface text-ink hover:bg-paper focus-visible:outline-white'
          }`}
        >
          Abrir comparador
        </button>
      </div>
    </div>
  );
};
