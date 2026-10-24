import React, { useEffect, useRef, useState } from 'react';
import { monthlyTotal, type Property } from '../data/properties';
import { PropertyBadge } from './PropertyBadge';
import { FolioSeal, type SealStatus } from './FolioSeal';

interface PropertyDetailProps {
  property: Property;
  onClose: () => void;
  onContact: (property: Property) => void;
  // Transporte estimado con el perfil elegido en los filtros; así el total coincide con la tarjeta
  transport?: { amount: number; label: string };
  folio?: string | null;
}

const cop = (value: number) => `$ ${value.toLocaleString('es-CO')}`;

const SWIPE_MIN_PX = 50;

const Chevron: React.FC<{ dir: 'left' | 'right' }> = ({ dir }) => (
  <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d={dir === 'left' ? 'M15 5l-7 7 7 7' : 'M9 5l7 7-7 7'} />
  </svg>
);

export const PropertyDetail: React.FC<PropertyDetailProps> = ({ property, onClose, onContact, transport, folio = null }) => {
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
  const status: SealStatus = !property.verified ? 'unverified' : property.certified ? 'verified' : 'pending';
  const monthTotal = monthlyTotal(property) + (transport?.amount ?? 0);
  const roundBtn =
    'size-10 flex items-center justify-center rounded-full bg-surface text-ink hover:bg-paper transition-colors';

  return (
    <div
      onClick={(e) => e.target === e.currentTarget && onClose()}
      className="fixed inset-0 z-50 bg-ink/55 flex items-end sm:items-center justify-center sm:p-6"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative bg-surface w-full max-w-6xl h-[100dvh] sm:h-auto sm:max-h-[92vh] sm:rounded-[10px] border border-rule flex flex-col lg:flex-row overflow-y-auto lg:overflow-hidden"
      >
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label="Cerrar ficha"
          className={`fixed sm:absolute top-3 right-3 z-20 ${roundBtn} border border-rule`}
        >
          <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>

        {/* Galería: arriba en celular, columna izquierda en escritorio */}
        <div className="bg-paper lg:w-[56%] lg:flex lg:flex-col shrink-0">
          <div
            className="relative aspect-[4/3] lg:aspect-auto lg:flex-1 w-full bg-rule select-none"
            onTouchStart={(e) => {
              touchStartX.current = e.touches[0].clientX;
            }}
            onTouchEnd={handleTouchEnd}
          >
            <img
              src={property.images[current]}
              alt={`${property.title}, foto ${current + 1} de ${total}`}
              className="absolute inset-0 size-full object-cover"
              draggable={false}
            />
            {total > 1 && (
              <>
                <button type="button" onClick={() => goTo(current - 1)} aria-label="Foto anterior" className={`absolute left-3 top-1/2 -translate-y-1/2 ${roundBtn}`}>
                  <Chevron dir="left" />
                </button>
                <button type="button" onClick={() => goTo(current + 1)} aria-label="Foto siguiente" className={`absolute right-3 top-1/2 -translate-y-1/2 ${roundBtn}`}>
                  <Chevron dir="right" />
                </button>
              </>
            )}
            <span aria-live="polite" className="absolute bottom-3 left-3 bg-ink text-white text-xs font-semibold px-2.5 py-1 rounded-md">
              Foto {current + 1} de {total}
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
                  className={`shrink-0 w-16 h-12 rounded-md overflow-hidden border-2 ${
                    index === current ? 'border-ink' : 'border-transparent opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={src} alt="" className="size-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* El folio: datos en orden fijo y el contacto siempre a la vista */}
        <div className="flex-1 lg:min-h-0 flex flex-col">
          <div className="flex-1 lg:overflow-y-auto px-5 sm:px-7 pt-6 pb-6 space-y-7">
            <header className="pr-12">
              <p className="text-[13px] text-ink-soft">{property.location}</p>
              <h2 id={titleId} className="text-[28px] font-extrabold tracking-[-0.02em] leading-tight mt-1">
                {property.title}
              </h2>
              <p className="text-sm text-ink-soft mt-2">
                {property.area} m² · {property.bedrooms} {property.bedrooms === 1 ? 'habitación' : 'habitaciones'} · {property.bathrooms}{' '}
                {property.bathrooms === 1 ? 'baño' : 'baños'}
              </p>
            </header>

            <section aria-label="Verificación" className="flex items-center gap-4 border-y border-rule py-4">
              <FolioSeal seed={property.id} status={status} size={64} />
              <div className="text-sm space-y-1.5 min-w-0">
                <p className={`font-semibold ${property.verified ? 'text-verified' : 'text-unverified'}`}>
                  {property.verified ? 'Identidad de quien publica verificada' : 'Quien publica no ha verificado su identidad'}
                </p>
                <PropertyBadge isVerified={property.certified} />
                <p className="text-[12.5px] text-ink-faint">{folio ? `Folio ${folio} (ejemplo)` : 'Sin folio registrado'}</p>
              </div>
            </section>

            <section aria-labelledby={`${titleId}-costs`}>
              <h3 id={`${titleId}-costs`} className="text-base font-bold">
                Lo que pagas cada mes
              </h3>
              <dl className="mt-3 text-sm">
                <div className="flex justify-between gap-4 py-1.5">
                  <dt className="text-ink-soft">Canon</dt>
                  <dd className="font-semibold">{cop(property.price)}</dd>
                </div>
                <div className="flex justify-between gap-4 py-1.5">
                  <dt className="text-ink-soft">Administración</dt>
                  <dd className="font-semibold">{cop(property.adminFee)}</dd>
                </div>
                {transport && (
                  <div className="flex justify-between gap-4 py-1.5">
                    <dt className="text-ink-soft">
                      Transporte estimado
                      <span className="block text-[12.5px] text-ink-faint">{transport.label}</span>
                    </dt>
                    <dd className="font-semibold">{cop(transport.amount)}</dd>
                  </div>
                )}
                <div className="flex justify-between items-baseline gap-4 border-t border-ink mt-2 pt-3">
                  <dt className="font-bold">Total del mes</dt>
                  <dd className="text-[2rem] font-extrabold tracking-[-0.02em] leading-none">{cop(monthTotal)}</dd>
                </div>
                <div className="flex justify-between gap-4 py-1.5 mt-3 text-ink-soft">
                  <dt>Depósito, una sola vez</dt>
                  <dd className="font-semibold text-ink">{property.deposit === 0 ? 'Sin depósito' : cop(property.deposit)}</dd>
                </div>
              </dl>
            </section>

            <section aria-labelledby={`${titleId}-reqs`}>
              <h3 id={`${titleId}-reqs`} className="text-base font-bold">
                Requisitos del arrendador
              </h3>
              <p className="text-sm text-ink-soft mt-1">Conócelos antes de contactar a quien publica.</p>
              <ul className="mt-3 divide-y divide-rule border-y border-rule">
                {property.requirements.map((req) => (
                  <li key={req.label} className="py-3 flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold">{req.label}</p>
                      {req.detail && <p className="text-[13px] text-ink-soft mt-0.5">{req.detail}</p>}
                    </div>
                    <span className={`shrink-0 text-[13px] font-semibold ${req.required ? 'text-ink' : 'text-verified'}`}>
                      {req.required ? 'Te lo piden' : 'No te lo piden'}
                    </span>
                  </li>
                ))}
              </ul>
            </section>

            <section aria-labelledby={`${titleId}-desc`}>
              <h3 id={`${titleId}-desc`} className="text-base font-bold">
                Descripción
              </h3>
              <p className="text-sm text-ink-soft leading-relaxed mt-2 max-w-[65ch]">{property.description}</p>
            </section>
          </div>

          <div className="sticky bottom-0 lg:static shrink-0 border-t border-rule bg-surface px-5 sm:px-7 py-4 flex items-center gap-5">
            <div className="hidden sm:block">
              <p className="text-[12.5px] text-ink-soft">Total del mes</p>
              <p className="text-lg font-extrabold tracking-[-0.01em]">{cop(monthTotal)}</p>
            </div>
            <div className="flex-1">
              <button
                type="button"
                onClick={() => onContact(property)}
                className="w-full bg-ink text-white font-semibold py-3 rounded-lg hover:bg-ink-hover transition-colors text-sm"
              >
                Contactar a quien publica
              </button>
              <p className="text-xs text-ink-faint mt-1.5 text-center">Antes de compartir el contacto verificamos tu identidad.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
