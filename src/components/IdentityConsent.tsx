import React, { useId, useState } from 'react';

// Lo que se pide para verificar la identidad: la cédula por ambos lados y una selfie
export const WhatWeAsk: React.FC = () => (
  <>
    <h3 className="text-sm font-bold">Lo que te vamos a pedir</h3>
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
  </>
);

interface IdentityConsentProps {
  onStart: () => Promise<void>; // lleva a la página de Didit; si falla, la promesa se rechaza
  startLabel?: string;
}

// La verificación de verdad: quién la hace, qué se guarda y la autorización para datos sensibles (Ley 1581 de 2012)
export const IdentityConsent: React.FC<IdentityConsentProps> = ({ onStart, startLabel = 'Verificar mi identidad' }) => {
  const [consent, setConsent] = useState(false);
  const [state, setState] = useState<'listo' | 'abriendo' | 'error'>('listo');
  const hintId = `${useId()}-ayuda`;

  const start = () => {
    setState('abriendo');
    onStart().catch(() => setState('error'));
  };

  return (
    <>
      <WhatWeAsk />
      <p className="text-[12.5px] text-ink-soft mt-3 leading-relaxed">
        Lo hace Didit, nuestro proveedor de verificación, en su propia página; al terminar vuelves aquí. Tu rostro es un dato sensible: no
        estás obligado a autorizar su tratamiento, pero sin esa autorización no podemos verificarte. Wallex solo guarda el resultado, no las
        fotos.
      </p>

      <label className="mt-4 flex items-start gap-3 text-sm cursor-pointer">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          aria-describedby={hintId}
          className="mt-0.5 size-4 accent-ink shrink-0 cursor-pointer"
        />
        <span>
          Autorizo a Wallex y a Didit a tratar los datos de mi cédula y de mi rostro para verificar mi identidad, según la{' '}
          <a href="/#privacidad" target="_blank" rel="noopener" className="font-semibold underline underline-offset-2">
            política de datos
          </a>{' '}
          (Ley 1581 de 2012).
        </span>
      </label>

      <button
        type="button"
        disabled={!consent || state === 'abriendo'}
        onClick={start}
        className="mt-5 w-full bg-ink text-white font-semibold text-sm py-3 rounded-lg hover:bg-ink-hover disabled:opacity-45 disabled:cursor-not-allowed"
      >
        {state === 'abriendo' ? 'Abriendo la verificación…' : startLabel}
      </button>
      <p id={hintId} role={state === 'error' ? 'alert' : undefined} className="text-xs text-ink-faint mt-2 text-center">
        {state === 'error' ? (
          <span className="text-unverified">No pudimos abrir la verificación. Revisa tu conexión e inténtalo de nuevo.</span>
        ) : consent ? (
          'Te llevamos a la página de Didit y después vuelves a Wallex.'
        ) : (
          'Marca la autorización para continuar.'
        )}
      </p>
    </>
  );
};
