import React, { useEffect, useRef, useState } from 'react';
import { monthlyTotal, type Property } from '../data/properties';
import { PropertyBadge } from './PropertyBadge';

interface PropertyDetailProps {
  property: Property;
  onClose: () => void;
  onContact: (property: Property) => void;
}

const cop = (value: number) => `$${value.toLocaleString('es-CO')}`;

const focusRing = 'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2B1B17]';
const SWIPE_MIN_PX = 50;

export const PropertyDetail: React.FC<PropertyDetailProps> = ({ property, onClose, onContact }) => {
  const [current, setCurrent] = useState(0);
  const closeRef = useRef<HTMLButtonElement>(null);
  const touchStartX = useRef<number | null>(null);
  // Ref para que el efecto no se reinicie (y pierda el foco original) si el padre cambia onClose
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  const total = property.images.length;
  const goTo = (index: number) => setCurrent((index + total) % total);

  // Capa fija (no <dialog>): Escape cierra, flechas cambian de foto, se bloquea el scroll
  // de la página y al cerrar el foco vuelve a la tarjeta que abrió la ficha
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCloseRef.current();
      if (e.key === 'ArrowLeft') setCurrent((c) => (c - 1 + total) % total);
      if (e.key === 'ArrowRight') setCurrent((c) => (c + 1) % total);
    };

    closeRef.current?.focus();
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKeyDown);
      opener?.focus();
    };
  }, [total]);

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(delta) < SWIPE_MIN_PX) return;
    goTo(delta < 0 ? current + 1 : current - 1);
  };

  const titleId = `property-detail-${property.id}`;

  return (
    <div
      onClick={(e) => e.target === e.currentTarget && onClose()}
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative bg-white w-full max-w-3xl h-[100dvh] sm:h-auto sm:max-h-[90vh] sm:rounded-3xl shadow-2xl border border-[#EAE4DC] flex flex-col overflow-hidden"
      >
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label="Cerrar ficha"
          className={`absolute top-3 right-3 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-white/90 text-[#2B1B17] shadow hover:bg-white ${focusRing}`}
        >
          ✕
        </button>

        <div className="flex-1 overflow-y-auto">
          {/* Galería */}
          <div className="bg-[#F8F5F0]">
            <div
              className="relative aspect-[4/3] sm:aspect-[16/9] w-full bg-gray-200 select-none"
              onTouchStart={(e) => {
                touchStartX.current = e.touches[0].clientX;
              }}
              onTouchEnd={handleTouchEnd}
            >
              <img
                src={property.images[current]}
                alt={`${property.title}, foto ${current + 1} de ${total}`}
                className="w-full h-full object-cover"
                draggable={false}
              />
              {total > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => goTo(current - 1)}
                    aria-label="Foto anterior"
                    className={`absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 text-[#2B1B17] shadow hover:bg-white text-lg ${focusRing}`}
                  >
                    ‹
                  </button>
                  <button
                    type="button"
                    onClick={() => goTo(current + 1)}
                    aria-label="Foto siguiente"
                    className={`absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 text-[#2B1B17] shadow hover:bg-white text-lg ${focusRing}`}
                  >
                    ›
                  </button>
                </>
              )}
              <span
                aria-live="polite"
                className="absolute bottom-3 right-3 bg-[#2B1B17]/80 text-white text-xs font-semibold px-3 py-1 rounded-full"
              >
                {current + 1} / {total}
              </span>
            </div>

            {total > 1 && (
              <div className="flex gap-2 p-3 overflow-x-auto">
                {property.images.map((src, index) => (
                  <button
                    key={src}
                    type="button"
                    onClick={() => setCurrent(index)}
                    aria-label={`Ver foto ${index + 1}`}
                    aria-current={index === current}
                    className={`shrink-0 w-16 h-12 rounded-lg overflow-hidden border-2 ${focusRing} ${
                      index === current ? 'border-[#2B1B17]' : 'border-transparent opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={src} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="p-5 sm:p-6 space-y-6">
            {/* Encabezado */}
            <div className="space-y-3">
              <div>
                <span className="text-xs font-semibold text-[#8C5E3C]">{property.location}</span>
                <h2 id={titleId} className="text-2xl font-bold text-[#2B1B17] mt-1">
                  {property.title}
                </h2>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {property.verified ? (
                  <span className="bg-[#2B1B17] text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                    ✓ Propietario verificado
                  </span>
                ) : (
                  <span className="bg-[#EAE4DC] text-[#4A3E39] text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                    Propietario sin verificar
                  </span>
                )}
                <PropertyBadge isVerified={property.certified} />
              </div>
            </div>

            {/* Costos */}
            <section aria-labelledby={`${titleId}-costs`} className="space-y-3">
              <h3 id={`${titleId}-costs`} className="text-lg font-bold text-[#2B1B17]">
                Lo que pagas
              </h3>
              <dl className="bg-[#F8F5F0] border border-[#EAE4DC] rounded-2xl p-4 space-y-2 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-[#6E615A]">Canon mensual</dt>
                  <dd className="font-semibold text-[#2B1B17]">{cop(property.price)}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-[#6E615A]">Administración</dt>
                  <dd className="font-semibold text-[#2B1B17]">{cop(property.adminFee)}</dd>
                </div>
                <div className="flex justify-between items-baseline gap-4 border-t border-[#EAE4DC] pt-3">
                  <dt className="font-bold text-[#2B1B17]">Total mensual</dt>
                  <dd className="text-2xl font-extrabold text-[#2B1B17]">{cop(monthlyTotal(property))}</dd>
                </div>
                <div className="flex justify-between gap-4 border-t border-[#EAE4DC] pt-3">
                  <dt className="text-[#6E615A]">Depósito (una sola vez)</dt>
                  <dd className="font-semibold text-[#2B1B17]">
                    {property.deposit === 0 ? 'Sin depósito' : cop(property.deposit)}
                  </dd>
                </div>
              </dl>
            </section>

            {/* Características */}
            <section aria-label="Características" className="flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium text-[#4A3E39]">
              <span>📐 {property.area} m²</span>
              <span>🛏️ {property.bedrooms} {property.bedrooms === 1 ? 'habitación' : 'habitaciones'}</span>
              <span>🚿 {property.bathrooms} {property.bathrooms === 1 ? 'baño' : 'baños'}</span>
            </section>

            {/* Requisitos */}
            <section aria-labelledby={`${titleId}-reqs`} className="space-y-3">
              <div>
                <h3 id={`${titleId}-reqs`} className="text-lg font-bold text-[#2B1B17]">
                  Requisitos del arrendador
                </h3>
                <p className="text-sm text-[#6E615A]">
                  Conoce los requisitos antes de contactar al propietario.
                </p>
              </div>

              {!property.requiresCoSigner && (
                <p className="bg-[#2F7A5B]/10 border border-[#2F7A5B]/30 text-[#2F7A5B] p-3 rounded-xl text-sm font-semibold">
                  ✓ No te piden codeudor
                </p>
              )}

              <ul className="space-y-2">
                {property.requirements.map((req) => (
                  <li key={req.label} className="border border-[#EAE4DC] rounded-xl p-3 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#2B1B17]">{req.label}</p>
                      {req.detail && <p className="text-xs text-[#6E615A] mt-0.5">{req.detail}</p>}
                    </div>
                    <span
                      className={`shrink-0 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                        req.required ? 'bg-[#B3453A]/10 text-[#B3453A]' : 'bg-[#EAE4DC] text-[#4A3E39]'
                      }`}
                    >
                      {req.required ? 'Obligatorio' : 'Opcional'}
                    </span>
                  </li>
                ))}
              </ul>
            </section>

            {/* Descripción */}
            <section aria-labelledby={`${titleId}-desc`} className="space-y-2">
              <h3 id={`${titleId}-desc`} className="text-lg font-bold text-[#2B1B17]">
                Descripción
              </h3>
              <p className="text-sm text-[#4A3E39] leading-relaxed">{property.description}</p>
            </section>
          </div>
        </div>

        {/* Pie fijo: el botón de contacto siempre queda a la vista */}
        <div className="shrink-0 border-t border-[#EAE4DC] bg-white p-4 flex items-center gap-4">
          <div className="hidden sm:block">
            <p className="text-xs text-[#6E615A]">Total mensual</p>
            <p className="text-lg font-extrabold text-[#2B1B17]">{cop(monthlyTotal(property))}</p>
          </div>
          <button
            type="button"
            onClick={() => onContact(property)}
            className={`flex-1 bg-[#2B1B17] text-white font-semibold py-3 rounded-xl hover:bg-[#4A3E39] transition-colors text-sm focus-visible:ring-offset-2 ${focusRing}`}
          >
            Contactar al propietario
          </button>
        </div>
      </div>
    </div>
  );
};
