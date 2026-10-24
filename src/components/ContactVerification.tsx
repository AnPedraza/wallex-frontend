import React, { useEffect, useId, useRef, useState } from 'react';
import type { Property } from '../types/property';
import { FolioSeal } from './FolioSeal';

interface ContactVerificationProps {
  property: Property;
  onClose: () => void;
}

// Verificación de identidad al contactar (US-02). Es una simulación: no se toma ninguna foto,
// no se guarda nada y no se envía ningún correo. La pantalla lo dice tal cual.
export const ContactVerification: React.FC<ContactVerificationProps> = ({ property, onClose }) => {
  const [step, setStep] = useState<'consent' | 'done'>('consent');
  const [consent, setConsent] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  const ids = useId();
  const titleId = `${ids}-titulo`;
  const hintId = `${ids}-ayuda`;
  // "Carlos Mendoza (Verificado)" -> "Carlos Mendoza"; los anuncios sin verificar no tienen nombre útil
  const ownerName = property.verified ? property.ownerName.replace(/\s*\(.*\)\s*$/, '') : 'quien publica';

  // Al pasar al paso final el foco va al botón "Entendido"
  useEffect(() => {
    if (step === 'done') panelRef.current?.querySelector<HTMLElement>('button[data-autofocus]')?.focus();
  }, [step]);

  // Escape cierra, se bloquea el scroll de fondo y el foco vuelve al botón que abrió el modal
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    const onKeyDown = (e: KeyboardEvent) => e.key === 'Escape' && onCloseRef.current();
    panelRef.current?.querySelector<HTMLElement>('input, button[data-autofocus]')?.focus();
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKeyDown);
      opener?.focus();
    };
  }, []);

  return (
    <div
      onClick={(e) => e.target === e.currentTarget && onClose()}
      className="fixed inset-0 z-50 bg-ink/55 flex items-center justify-center p-4 overflow-y-auto"
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative bg-surface rounded-[10px] border border-rule w-full max-w-lg p-6 sm:p-7"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          className="absolute top-4 right-4 size-9 rounded-full border border-rule flex items-center justify-center hover:bg-paper"
        >
          <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>

        {step === 'consent' ? (
          <>
            <h2 id={titleId} className="text-[21px] sm:text-[28px] font-extrabold tracking-[-0.02em] leading-tight pr-10">
              Verifica tu identidad para contactar
            </h2>
            <p className="text-sm text-ink-soft mt-2">
              Se pide una sola vez. Después ves el contacto de quien publica <span className="font-semibold text-ink">{property.title}</span>.
            </p>

            <div className="mt-5 flex items-start gap-3 border-y border-rule py-4">
              <FolioSeal seed={property.id} status={!property.verified ? 'unverified' : property.certified ? 'verified' : 'pending'} size={40} />
              {property.verified ? (
                <p className="text-sm">
                  <span className="font-semibold text-verified">Quien publica ya verificó su identidad.</span>{' '}
                  <span className="text-ink-soft">
                    {property.certified ? 'El certificado de tradición y libertad está cotejado.' : 'El certificado de tradición y libertad está pendiente de cotejo.'}
                  </span>
                </p>
              ) : (
                <p className="text-sm">
                  <span className="font-semibold text-unverified">Quien publica no ha verificado su identidad.</span>{' '}
                  <span className="text-ink-soft">No consignes dinero para "separar" el inmueble antes de verlo en persona.</span>
                </p>
              )}
            </div>

            <h3 className="text-sm font-bold mt-5">Lo que te vamos a pedir</h3>
            <ul className="mt-2 space-y-2 text-sm">
              <li className="flex gap-2.5">
                <svg className="size-5 shrink-0 text-ink-soft" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
                  <rect x="3" y="5" width="18" height="14" rx="2" />
                  <circle cx="9" cy="11" r="2.2" />
                  <path d="M6 16c.6-1.6 1.8-2.4 3-2.4s2.4.8 3 2.4M14 10h4M14 13h3" />
                </svg>
                Foto de tu cédula por ambos lados.
              </li>
              <li className="flex gap-2.5">
                <svg className="size-5 shrink-0 text-ink-soft" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
                  <circle cx="12" cy="9" r="3.5" />
                  <path d="M5 20c1.2-3.4 3.8-5 7-5s5.8 1.6 7 5" />
                </svg>
                Una selfie para compararla con la foto de la cédula.
              </li>
            </ul>
            <p className="text-[12.5px] text-ink-faint mt-3">
              En este prototipo la verificación es simulada: no se toma ninguna foto ni se guarda tu información.
            </p>

            <label className="mt-5 flex items-start gap-3 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                aria-describedby={hintId}
                className="mt-0.5 size-4 accent-ink shrink-0 cursor-pointer"
              />
              Autorizo el tratamiento de mis datos personales para verificar mi identidad, según la Ley 1581 de 2012.
            </label>

            <button
              type="button"
              disabled={!consent}
              onClick={() => setStep('done')}
              className="mt-5 w-full bg-ink text-white font-semibold text-sm py-3 rounded-lg hover:bg-ink-hover disabled:opacity-45 disabled:cursor-not-allowed"
            >
              Verificar mi identidad
            </button>
            <p id={hintId} className="text-xs text-ink-faint mt-2 text-center">
              {consent ? 'Tarda unos segundos en la versión real.' : 'Marca la autorización para continuar.'}
            </p>
          </>
        ) : (
          <div role="status" className="text-center">
            <div className="flex justify-center">
              <FolioSeal seed={`persona-${property.id}`} status="verified" size={76} />
            </div>
            <h2 id={titleId} className="text-[28px] font-extrabold tracking-[-0.02em] leading-tight mt-4">
              Listo, tu identidad quedó verificada
            </h2>
            <p className="text-sm text-ink-soft mt-2 max-w-[42ch] mx-auto">
              Es una simulación. En la versión real aquí verías el teléfono y el correo de {ownerName} y podrías escribirle desde Wallex.
            </p>
            <p className="text-[12.5px] text-ink-faint mt-3">Este prototipo no envía correos ni guarda tus datos.</p>
            <button
              type="button"
              data-autofocus
              onClick={onClose}
              className="mt-6 w-full bg-ink text-white font-semibold text-sm py-3 rounded-lg hover:bg-ink-hover"
            >
              Entendido
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
