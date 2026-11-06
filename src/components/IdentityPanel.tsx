import React, { useEffect, useRef, useState } from 'react';
import type { RealIdentity } from './ContactVerification';
import { FolioSeal } from './FolioSeal';
import { IdentityConsent } from './IdentityConsent';

interface IdentityPanelProps {
  identity: RealIdentity;
  publisher?: boolean; // quien publica: la verificación es lo que hace que sus arriendos salgan con el sello
  className?: string;
}

// En qué va la verificación de identidad de la persona, con el botón para hacerla. Va en Mis publicaciones y en Mi cuenta.
export const IdentityPanel: React.FC<IdentityPanelProps> = ({ identity, publisher = false, className = '' }) => {
  const [open, setOpen] = useState(false);
  const consentRef = useRef<HTMLDivElement>(null);
  const { state } = identity;

  // El botón que abre la autorización desaparece: el foco pasa a la casilla
  useEffect(() => {
    if (open) consentRef.current?.querySelector('input')?.focus();
  }, [open]);

  const box = `bg-surface border border-rule rounded-[10px] p-5 sm:p-6 ${className}`;

  if (state === 'aprobada') {
    return (
      <div className={`${box} flex items-center gap-4`}>
        <FolioSeal seed="identidad-propia" status={publisher ? 'pending' : 'verified'} size={48} />
        <p className="text-sm">
          <span className="font-semibold text-verified">Tu identidad está verificada.</span>{' '}
          <span className="text-ink-soft">
            {publisher
              ? 'Tus arriendos lo muestran en su sello. El certificado de tradición y libertad sigue pendiente de cotejo.'
              : 'Ya puedes ver el contacto de quien publica.'}
          </span>
        </p>
      </div>
    );
  }
  if (state === null) return <p className={`text-sm text-ink-soft ${className}`}>Revisando tu verificación…</p>;
  if (state === 'error' || state === 'en-revision') {
    return (
      <div className={box}>
        <p className="text-sm">
          {state === 'error' ? (
            <span className="text-unverified">No pudimos revisar tu verificación. Revisa tu conexión e inténtalo de nuevo.</span>
          ) : (
            <>
              <span className="font-semibold">Tu verificación está en revisión.</span>{' '}
              <span className="text-ink-soft">
                {publisher
                  ? 'Cuando quede aprobada, tus arriendos lo muestran en su sello.'
                  : 'Cuando quede aprobada, ya puedes ver el contacto de quien publica.'}
              </span>
            </>
          )}
        </p>
        <button type="button" onClick={identity.onRefresh} className="mt-3 px-4 py-2 rounded-lg border border-control text-sm font-semibold hover:bg-paper">
          {state === 'error' ? 'Intentar de nuevo' : 'Revisar de nuevo'}
        </button>
      </div>
    );
  }

  const declined = state === 'rechazada';
  return (
    <div className={box}>
      <div className="flex items-start gap-4">
        <FolioSeal seed="identidad-propia" status="unverified" size={48} />
        <div className="min-w-0">
          <h2 className="text-base font-bold">{declined ? 'No pudimos verificar tu identidad' : 'Verifica tu identidad'}</h2>
          <p className="mt-1 text-sm text-ink-soft">
            {declined
              ? 'Pasa cuando la foto de la cédula sale borrosa o con reflejos, o cuando la selfie no se ve bien. Puedes intentarlo otra vez.'
              : publisher
                ? 'Tus arriendos salen «Sin verificar» hasta que lo hagas. Así quien busca sabe que eres una persona real. Se hace una sola vez.'
                : 'Te la pedimos para ver el contacto de quien publica: así sabe que eres una persona real. Se hace una sola vez.'}
          </p>
          {!open && (
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="mt-4 bg-ink text-white font-semibold text-sm px-5 py-2.5 rounded-lg hover:bg-ink-hover"
            >
              {declined ? 'Intentar de nuevo' : 'Verificar mi identidad'}
            </button>
          )}
        </div>
      </div>
      {open && (
        <div ref={consentRef} className="mt-5 pt-5 border-t border-rule max-w-lg">
          <IdentityConsent onStart={identity.onStart} startLabel={declined ? 'Intentar de nuevo' : 'Verificar mi identidad'} />
        </div>
      )}
    </div>
  );
};
