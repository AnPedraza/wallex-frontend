import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import { fetchContact, type ListingContact } from '../lib/listings';
import type { IdentityState } from '../lib/verification';
import type { Property } from '../types/property';
import { FolioSeal } from './FolioSeal';
import { IdentityConsent, WhatWeAsk } from './IdentityConsent';

// Verificación de verdad con Didit. Si no llega, la verificación se simula y la pantalla lo dice.
export interface RealIdentity {
  state: IdentityState | 'error' | null; // null mientras se revisa
  onStart: () => Promise<void>; // lleva a la página de Didit
  onRefresh: () => void; // vuelve a preguntar cómo va
}

interface ContactVerificationProps {
  property: Property;
  onClose: () => void;
  signedIn?: boolean; // el contacto solo lo ve quien tiene cuenta
  onSignIn?: () => void;
  identity?: RealIdentity;
}

const celularText = (c: string) => `${c.slice(0, 3)} ${c.slice(3, 6)} ${c.slice(6)}`;

const titleClass = 'text-[21px] sm:text-[28px] font-extrabold tracking-[-0.02em] leading-tight pr-10';
const primaryButton = 'w-full bg-ink text-white font-semibold text-sm py-3 rounded-lg hover:bg-ink-hover';
const secondaryButton = 'w-full border border-control font-semibold text-sm py-3 rounded-lg hover:bg-paper';

const unverifiedWarning = (
  <p className="text-sm">
    <span className="font-semibold text-unverified">Quien publica no ha verificado su identidad.</span>{' '}
    <span className="text-ink-soft">No consignes dinero para "separar" el inmueble antes de verlo en persona.</span>
  </p>
);

// Verificación de identidad al contactar (US-02).
// Con Didit es de verdad: se verifica una sola vez y después se ve el contacto de quien publica.
// Sin Didit es una simulación: no se toma ninguna foto, no se guarda nada y la pantalla lo dice tal cual.
export const ContactVerification: React.FC<ContactVerificationProps> = ({ property, onClose, signedIn = false, onSignIn, identity }) => {
  const [step, setStep] = useState<'consent' | 'done'>('consent');
  const [consent, setConsent] = useState(false);
  const real = Boolean(property.publisherType); // publicado por una persona en Wallex, no de ejemplo
  const [contact, setContact] = useState<ListingContact | null>(null);
  const [contactState, setContactState] = useState<'loading' | 'ready' | 'error'>('loading');
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

  const needsAccount = (real || Boolean(identity)) && !signedIn;
  const verifiedPerson = identity ? identity.state === 'aprobada' : step === 'done';
  const showContact = real && signedIn && verifiedPerson;

  // Escape cierra, se bloquea el scroll de fondo y el foco vuelve al botón que abrió el modal.
  // Va antes del efecto del foco: tiene que guardar ese botón antes de que el foco entre al modal.
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    const onKeyDown = (e: KeyboardEvent) => e.key === 'Escape' && onCloseRef.current();
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKeyDown);
      opener?.focus();
    };
  }, []);

  // Qué parte se ve. Cuando cambia, el foco pasa a lo primero que se puede usar en ella.
  const panel = needsAccount
    ? 'cuenta'
    : verifiedPerson
      ? real
        ? 'contacto'
        : 'ejemplo'
      : identity
        ? (identity.state ?? 'revisando')
        : 'simulada';
  useEffect(() => {
    const target = panelRef.current?.querySelector<HTMLElement>('[data-autofocus], input');
    (target ?? panelRef.current)?.focus();
  }, [panel]);

  // Solo cambia el estado cuando llega la respuesta (el "cargando" ya es el estado inicial)
  const loadContact = useCallback(() => {
    fetchContact(property.id)
      .then((c) => {
        setContact(c);
        setContactState(c ? 'ready' : 'error');
      })
      .catch(() => setContactState('error'));
  }, [property.id]);

  // Con la identidad verificada, se trae el contacto de lo publicado en Wallex
  useEffect(() => {
    if (showContact) loadContact();
  }, [showContact, loadContact]);

  const publisherState = (
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
        unverifiedWarning
      )}
    </div>
  );

  const purpose = (
    <p className="text-sm text-ink-soft mt-2">
      Así quien publica sabe que eres una persona real, igual que el sello te dice a ti quién publica. Se pide una sola vez y después ves el
      contacto de quien publica <span className="font-semibold text-ink">{property.title}</span>.
    </p>
  );

  const content = (() => {
    if (panel === 'cuenta') {
      return (
        <>
          <h2 id={titleId} className={titleClass}>
            Entra a tu cuenta para ver el contacto
          </h2>
          <p className="text-sm text-ink-soft mt-2">
            {identity ? (
              <>
                Para ver el contacto de quien publica <span className="font-semibold text-ink">{property.title}</span> entras a tu cuenta y
                verificas tu identidad una sola vez. Crear la cuenta toma menos de un minuto.
              </>
            ) : (
              <>
                El nombre y el celular de quien publica <span className="font-semibold text-ink">{property.title}</span> solo los ven las
                personas con cuenta en Wallex. Crearla toma menos de un minuto.
              </>
            )}
          </p>
          {publisherState}
          <button type="button" data-autofocus onClick={onSignIn} className={`mt-5 ${primaryButton}`}>
            Ingresar o crear cuenta
          </button>
        </>
      );
    }

    if (panel === 'revisando') {
      return (
        <div role="status">
          <h2 id={titleId} className={titleClass}>
            Revisando tu verificación…
          </h2>
          <p className="text-sm text-ink-soft mt-2">Un momento: estamos viendo si ya verificaste tu identidad.</p>
        </div>
      );
    }

    if (panel === 'error' && identity) {
      return (
        <>
          <h2 id={titleId} className={titleClass}>
            No pudimos revisar tu verificación
          </h2>
          <p className="text-sm text-ink-soft mt-2">Revisa tu conexión e inténtalo de nuevo.</p>
          <button type="button" data-autofocus onClick={identity.onRefresh} className={`mt-5 ${primaryButton}`}>
            Intentar de nuevo
          </button>
        </>
      );
    }

    if (panel === 'en-revision' && identity) {
      return (
        <div role="status">
          <h2 id={titleId} className={titleClass}>
            Tu verificación está en revisión
          </h2>
          <p className="text-sm text-ink-soft mt-2">
            Didit no pudo decidirla sola y el equipo de Wallex la está revisando. Vuelve a abrir el contacto en un rato.
          </p>
          <div className="mt-5 grid gap-2.5">
            <button type="button" data-autofocus onClick={identity.onRefresh} className={primaryButton}>
              Revisar de nuevo
            </button>
            <button type="button" onClick={onClose} className={secondaryButton}>
              Cerrar
            </button>
          </div>
        </div>
      );
    }

    if (panel === 'rechazada' && identity) {
      return (
        <>
          <h2 id={titleId} className={titleClass}>
            No pudimos verificar tu identidad
          </h2>
          <p className="text-sm text-ink-soft mt-2 mb-5">
            Pasa cuando la foto de la cédula sale borrosa o con reflejos, o cuando la selfie no se ve bien. Puedes intentarlo otra vez.
          </p>
          <IdentityConsent onStart={identity.onStart} startLabel="Intentar de nuevo" />
        </>
      );
    }

    if (identity && !verifiedPerson) {
      // ninguna, en curso o vencida: se pide la verificación de verdad
      return (
        <>
          <h2 id={titleId} className={titleClass}>
            Verifica tu identidad para contactar
          </h2>
          {purpose}
          {panel === 'en-curso' && (
            <p className="text-sm text-ink-soft mt-2">Empezaste una verificación y no la terminaste: puedes hacerla otra vez desde el principio.</p>
          )}
          {panel === 'vencida' && <p className="text-sm text-ink-soft mt-2">Tu verificación anterior venció: hay que hacerla otra vez.</p>}
          {publisherState}
          <div className="mt-5">
            <IdentityConsent onStart={identity.onStart} />
          </div>
        </>
      );
    }

    if (panel === 'contacto') {
      return (
        <div role="status">
          <h2 id={titleId} className={titleClass}>
            El contacto de quien publica
          </h2>
          <p className="text-[12.5px] text-ink-faint mt-2">
            {identity
              ? 'Tu identidad está verificada: puedes escribirle a quien publica.'
              : 'Por ahora la verificación es simulada: no se tomó ninguna foto ni se guardó tu información.'}
          </p>
          {contactState === 'loading' && <p className="mt-5 text-sm text-ink-soft">Buscando el contacto…</p>}
          {contactState === 'error' && (
            <div className="mt-5">
              <p className="text-sm text-unverified">No pudimos traer el contacto. Revisa tu conexión e inténtalo de nuevo.</p>
              <button
                type="button"
                onClick={() => {
                  setContactState('loading');
                  loadContact();
                }}
                className="mt-3 px-4 py-2 rounded-lg border border-control text-sm font-semibold hover:bg-paper"
              >
                Intentar de nuevo
              </button>
            </div>
          )}
          {contactState === 'ready' && contact && (
            <>
              <dl className="mt-5 divide-y divide-rule border-y border-rule text-sm">
                <div className="flex justify-between gap-4 py-3">
                  <dt className="text-ink-soft">Nombre</dt>
                  <dd className="font-semibold text-right">{contact.nombre}</dd>
                </div>
                <div className="flex justify-between gap-4 py-3">
                  <dt className="text-ink-soft">Celular</dt>
                  <dd className="font-semibold">{celularText(contact.celular)}</dd>
                </div>
              </dl>
              <div className="mt-5 grid grid-cols-2 gap-2.5">
                <a
                  href={`https://wa.me/57${contact.celular}?text=${encodeURIComponent(`Hola, vi tu arriendo "${property.title}" en Wallex.`)}`}
                  target="_blank"
                  rel="noopener"
                  className="text-center bg-ink text-white font-semibold text-sm py-3 rounded-lg hover:bg-ink-hover"
                >
                  Escribir por WhatsApp
                </a>
                <a href={`tel:+57${contact.celular}`} className="text-center border border-control font-semibold text-sm py-3 rounded-lg hover:bg-paper">
                  Llamar
                </a>
              </div>
            </>
          )}
          <div className="mt-5">
            {property.verified ? (
              <p className="text-sm">
                <span className="font-semibold text-verified">Quien publica verificó su identidad.</span>{' '}
                <span className="text-ink-soft">Aun así, no consignes dinero antes de ver el inmueble en persona.</span>
              </p>
            ) : (
              unverifiedWarning
            )}
          </div>
          <button type="button" data-autofocus onClick={onClose} className={`mt-6 ${secondaryButton}`}>
            Cerrar
          </button>
        </div>
      );
    }

    if (panel === 'ejemplo') {
      return (
        <div role="status" className="text-center">
          <div className="flex justify-center">
            <FolioSeal seed={`persona-${property.id}`} status="verified" size={76} />
          </div>
          <h2 id={titleId} className="text-[28px] font-extrabold tracking-[-0.02em] leading-tight mt-4">
            {identity ? 'Tu identidad está verificada' : 'Listo, tu identidad quedó verificada'}
          </h2>
          {identity ? (
            <p className="text-sm text-ink-soft mt-2 max-w-[42ch] mx-auto">
              Este arriendo es de ejemplo y no tiene un contacto real. En los que publica la gente en Wallex, aquí ves el nombre y el celular
              de quien publica.
            </p>
          ) : (
            <>
              <p className="text-sm text-ink-soft mt-2 max-w-[42ch] mx-auto">
                Es una simulación. En la versión real aquí verías el teléfono y el correo de {ownerName} y podrías escribirle desde Wallex.
              </p>
              <p className="text-[12.5px] text-ink-faint mt-3">No se envía ningún correo ni se guardan tus datos.</p>
            </>
          )}
          <button type="button" data-autofocus onClick={onClose} className={`mt-6 ${primaryButton}`}>
            Entendido
          </button>
        </div>
      );
    }

    // Simulada: el paso de explicación y autorización
    return (
      <>
        <h2 id={titleId} className={titleClass}>
          Verifica tu identidad para contactar
        </h2>
        {purpose}
        {publisherState}
        <div className="mt-5">
          <WhatWeAsk />
        </div>
        <p className="text-[12.5px] text-ink-faint mt-3">Por ahora la verificación es simulada: no se toma ninguna foto ni se guarda tu información.</p>

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

        <button type="button" disabled={!consent} onClick={() => setStep('done')} className={`mt-5 ${primaryButton} disabled:opacity-45 disabled:cursor-not-allowed`}>
          Verificar mi identidad
        </button>
        <p id={hintId} className="text-xs text-ink-faint mt-2 text-center">
          {consent ? 'Tarda unos segundos en la versión real.' : 'Marca la autorización para continuar.'}
        </p>
      </>
    );
  })();

  return (
    <div className="fixed inset-0 z-50 bg-ink/55 overflow-y-auto">
      {/* Con contenido alto, la capa se desplaza y el modal nunca queda cortado por arriba */}
      <div onClick={(e) => e.target === e.currentTarget && onClose()} className="min-h-full flex items-center justify-center p-4">
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          tabIndex={-1}
          className="relative bg-surface rounded-[10px] border border-rule w-full max-w-lg p-6 sm:p-7 focus:outline-none"
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
          {content}
        </div>
      </div>
    </div>
  );
};
