import React, { useEffect, useId, useRef, useState } from 'react';
import { changePassword, deleteAccount, exportMyData, updateProfile } from '../lib/account';
import { MIN_PASSWORD, digitsOf, validateCelular, validateName, validateNewPassword } from '../lib/validation';
import { PUBLISHER_TYPES, ROLE_OPTIONS, type PublisherType, type Role, type SessionUser } from '../types/account';
import type { RealIdentity } from './ContactVerification';
import { IdentityPanel } from './IdentityPanel';

interface AccountPageProps {
  user: SessionUser;
  identity?: RealIdentity; // con la verificación de verdad (Didit); si no llega, se dice que es simulada
  onUserChange: (user: SessionUser) => void;
  onDeleted: () => void;
  onLogout: () => void;
}

const inputClass = (hasError: boolean) =>
  `w-full bg-paper border rounded-lg p-3 text-sm text-ink focus:outline-none focus:ring-2 ${
    hasError ? 'border-unverified focus:ring-unverified' : 'border-control focus:ring-ink'
  }`;
const labelClass = 'block text-sm font-semibold mb-2 text-ink-soft';
const errorClass = 'mt-1.5 text-xs text-unverified';
const cardClass = 'bg-surface border border-rule rounded-[10px] p-5 sm:p-7';
const sectionTitle = 'text-lg font-bold';
const primaryButton = 'bg-ink text-white font-semibold text-sm px-5 py-3 rounded-lg hover:bg-ink-hover disabled:opacity-60 disabled:cursor-not-allowed';
const secondaryButton = 'border border-control font-semibold text-sm px-5 py-3 rounded-lg hover:bg-paper disabled:opacity-60';

// Nombre, si busca o publica y, si publica, cómo y su celular. El correo se ve, pero no se cambia desde aquí.
const ProfileSection: React.FC<{ user: SessionUser; onSaved: (user: SessionUser) => void }> = ({ user, onSaved }) => {
  const ids = useId();
  const [nombre, setNombre] = useState(user.nombre ?? '');
  const [rol, setRol] = useState<Role>(user.rol ?? 'busca');
  const [tipo, setTipo] = useState<PublisherType | ''>(user.tipoAnunciante ?? '');
  const [celular, setCelular] = useState(user.celular ?? '');
  const [errors, setErrors] = useState<{ nombre?: string; tipo?: string; celular?: string }>({});
  const [status, setStatus] = useState<'listo' | 'guardando' | 'guardado' | 'error'>('listo');
  const nombreRef = useRef<HTMLInputElement>(null);
  const tipoRef = useRef<HTMLSelectElement>(null);
  const celularRef = useRef<HTMLInputElement>(null);
  const publishes = rol === 'publica';

  // Cualquier cambio deja de estar "guardado"
  const touch = () => status !== 'guardando' && setStatus('listo');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const next = {
      nombre: validateName(nombre),
      tipo: publishes && !tipo ? 'Elige si publicas como propietario, inmobiliaria o arrendatario.' : undefined,
      celular: publishes ? validateCelular(celular) : undefined,
    };
    setErrors(next);
    const first = next.nombre ? nombreRef : next.tipo ? tipoRef : next.celular ? celularRef : null;
    if (first) {
      first.current?.focus();
      return;
    }
    setStatus('guardando');
    try {
      const saved = await updateProfile(user.email, {
        nombre,
        rol,
        tipoAnunciante: publishes && tipo ? tipo : undefined,
        celular: publishes ? digitsOf(celular) : undefined,
      });
      onSaved(saved);
      setStatus('guardado');
    } catch {
      setStatus('error');
    }
  };

  return (
    <form onSubmit={submit} noValidate className={`${cardClass} space-y-5`}>
      <div>
        <p className={labelClass}>Correo</p>
        <p className="text-sm font-semibold break-all">{user.email}</p>
        <p className="mt-1 text-xs text-ink-faint">Es con el que entras. No se puede cambiar desde aquí.</p>
      </div>

      <div>
        <label htmlFor={`${ids}-nombre`} className={labelClass}>
          Tu nombre
        </label>
        <input
          ref={nombreRef}
          id={`${ids}-nombre`}
          type="text"
          autoComplete="name"
          value={nombre}
          onChange={(e) => {
            setNombre(e.target.value);
            touch();
            if (errors.nombre) setErrors((prev) => ({ ...prev, nombre: validateName(e.target.value) }));
          }}
          aria-invalid={Boolean(errors.nombre)}
          aria-describedby={errors.nombre ? `${ids}-nombre-error` : undefined}
          className={inputClass(Boolean(errors.nombre))}
        />
        {errors.nombre && (
          <p id={`${ids}-nombre-error`} className={errorClass}>
            {errors.nombre}
          </p>
        )}
      </div>

      <fieldset>
        <legend className={labelClass}>¿Qué haces en Wallex?</legend>
        <div className="grid grid-cols-2 gap-2.5">
          {ROLE_OPTIONS.map((r) => (
            <label
              key={r.id}
              className={`flex flex-col gap-0.5 rounded-lg border p-3 cursor-pointer transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ink ${
                rol === r.id ? 'border-ink bg-paper' : 'border-control hover:border-ink'
              }`}
            >
              <input
                type="radio"
                name={`${ids}-rol`}
                value={r.id}
                checked={rol === r.id}
                onChange={() => {
                  setRol(r.id);
                  touch();
                }}
                className="sr-only"
              />
              <span className="text-sm font-semibold text-ink">{r.title}</span>
              <span className="text-xs text-ink-soft">{r.body}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {publishes && (
        <>
          <div>
            <label htmlFor={`${ids}-tipo`} className={labelClass}>
              Publicas como
            </label>
            <select
              ref={tipoRef}
              id={`${ids}-tipo`}
              value={tipo}
              onChange={(e) => {
                setTipo(e.target.value as PublisherType | '');
                touch();
                if (errors.tipo) setErrors((prev) => ({ ...prev, tipo: undefined }));
              }}
              aria-invalid={Boolean(errors.tipo)}
              aria-describedby={errors.tipo ? `${ids}-tipo-error` : undefined}
              className={inputClass(Boolean(errors.tipo))}
            >
              <option value="">Elige una opción</option>
              {PUBLISHER_TYPES.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
            {errors.tipo && (
              <p id={`${ids}-tipo-error`} className={errorClass}>
                {errors.tipo}
              </p>
            )}
          </div>
          <div>
            <label htmlFor={`${ids}-celular`} className={labelClass}>
              Celular
            </label>
            <input
              ref={celularRef}
              id={`${ids}-celular`}
              type="tel"
              inputMode="numeric"
              autoComplete="tel-national"
              value={celular}
              onChange={(e) => {
                setCelular(e.target.value);
                touch();
                if (errors.celular) setErrors((prev) => ({ ...prev, celular: validateCelular(e.target.value) }));
              }}
              aria-invalid={Boolean(errors.celular)}
              aria-describedby={`${ids}-celular-hint${errors.celular ? ` ${ids}-celular-error` : ''}`}
              placeholder="3001234567"
              className={inputClass(Boolean(errors.celular))}
            />
            <p id={`${ids}-celular-hint`} className="mt-1.5 text-xs text-ink-soft">
              Con este se llena el contacto de tus próximos arriendos. Los ya publicados conservan el que les pusiste.
            </p>
            {errors.celular && (
              <p id={`${ids}-celular-error`} className={errorClass}>
                {errors.celular}
              </p>
            )}
          </div>
        </>
      )}

      <div className="flex flex-wrap items-center gap-4">
        <button type="submit" disabled={status === 'guardando'} className={primaryButton}>
          {status === 'guardando' ? 'Guardando…' : 'Guardar cambios'}
        </button>
        <p role="status" className={`text-sm ${status === 'error' ? 'text-unverified' : 'text-ink-soft'}`}>
          {status === 'guardado' && 'Listo: guardamos tus cambios.'}
          {status === 'error' && 'No pudimos guardar los cambios. Revisa tu conexión e inténtalo de nuevo.'}
        </p>
      </div>
    </form>
  );
};

// Cambiar la contraseña: se pide la actual antes de poner la nueva
const PasswordSection: React.FC<{ email: string }> = ({ email }) => {
  const ids = useId();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [show, setShow] = useState(false);
  const [errors, setErrors] = useState<{ current?: string; next?: string }>({});
  const [status, setStatus] = useState<'listo' | 'guardando' | 'guardado' | 'error'>('listo');
  const currentRef = useRef<HTMLInputElement>(null);
  const nextRef = useRef<HTMLInputElement>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const found = { current: current ? undefined : 'Escribe tu contraseña actual.', next: validateNewPassword(next) };
    setErrors(found);
    if (found.current) return currentRef.current?.focus();
    if (found.next) return nextRef.current?.focus();
    setStatus('guardando');
    try {
      await changePassword(email, current, next);
      setCurrent('');
      setNext('');
      setStatus('guardado');
    } catch (err) {
      const reason = err instanceof Error ? err.message : '';
      setStatus('listo');
      if (reason === 'actual') {
        setErrors({ current: 'La contraseña actual no coincide. Revisa mayúsculas y minúsculas.' });
        currentRef.current?.focus();
      } else if (reason === 'igual') {
        setErrors({ next: 'La contraseña nueva tiene que ser distinta a la actual.' });
        nextRef.current?.focus();
      } else if (reason === 'debil') {
        setErrors({ next: 'Esa contraseña es muy fácil de adivinar. Usa una más larga o mezcla letras y números.' });
        nextRef.current?.focus();
      } else {
        setStatus('error');
      }
    }
  };

  return (
    <form onSubmit={submit} noValidate className={`${cardClass} space-y-5`}>
      {/* Para que el gestor de contraseñas sepa de qué cuenta es la contraseña nueva */}
      <input type="email" autoComplete="username" value={email} readOnly tabIndex={-1} aria-hidden="true" className="sr-only" />
      <div>
        <label htmlFor={`${ids}-actual`} className={labelClass}>
          Contraseña actual
        </label>
        <input
          ref={currentRef}
          id={`${ids}-actual`}
          type={show ? 'text' : 'password'}
          autoComplete="current-password"
          value={current}
          onChange={(e) => {
            setCurrent(e.target.value);
            setStatus('listo');
            if (errors.current) setErrors((prev) => ({ ...prev, current: undefined }));
          }}
          aria-invalid={Boolean(errors.current)}
          aria-describedby={errors.current ? `${ids}-actual-error` : undefined}
          className={inputClass(Boolean(errors.current))}
        />
        {errors.current && (
          <p id={`${ids}-actual-error`} className={errorClass}>
            {errors.current}
          </p>
        )}
      </div>
      <div>
        <label htmlFor={`${ids}-nueva`} className={labelClass}>
          Contraseña nueva
        </label>
        <input
          ref={nextRef}
          id={`${ids}-nueva`}
          type={show ? 'text' : 'password'}
          autoComplete="new-password"
          value={next}
          onChange={(e) => {
            setNext(e.target.value);
            setStatus('listo');
            if (errors.next) setErrors((prev) => ({ ...prev, next: validateNewPassword(e.target.value) }));
          }}
          aria-invalid={Boolean(errors.next)}
          aria-describedby={`${ids}-nueva-hint${errors.next ? ` ${ids}-nueva-error` : ''}`}
          className={inputClass(Boolean(errors.next))}
        />
        <p id={`${ids}-nueva-hint`} className="mt-1.5 text-xs text-ink-soft">
          Mínimo {MIN_PASSWORD} caracteres.
        </p>
        {errors.next && (
          <p id={`${ids}-nueva-error`} className={errorClass}>
            {errors.next}
          </p>
        )}
      </div>
      <label className="flex items-center gap-2.5 text-sm cursor-pointer">
        <input type="checkbox" checked={show} onChange={(e) => setShow(e.target.checked)} className="size-4 accent-ink cursor-pointer" />
        Mostrar las contraseñas
      </label>
      <div className="flex flex-wrap items-center gap-4">
        <button type="submit" disabled={status === 'guardando'} className={primaryButton}>
          {status === 'guardando' ? 'Cambiando…' : 'Cambiar contraseña'}
        </button>
        <p role="status" className={`text-sm ${status === 'error' ? 'text-unverified' : 'text-ink-soft'}`}>
          {status === 'guardado' && 'Listo: tu contraseña cambió.'}
          {status === 'error' && 'No pudimos cambiar la contraseña. Revisa tu conexión e inténtalo de nuevo.'}
        </p>
      </div>
    </form>
  );
};

// Ley 1581: descargar lo que Wallex tiene de la persona o borrar la cuenta con todo
const DataSection: React.FC<{ user: SessionUser; realVerification: boolean; onDeleted: () => void }> = ({ user, realVerification, onDeleted }) => {
  const ids = useId();
  const [download, setDownload] = useState<'listo' | 'preparando' | 'error'>('listo');
  const [confirming, setConfirming] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [deleting, setDeleting] = useState<'listo' | 'borrando' | 'error'>('listo');
  const confirmRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (confirming) confirmRef.current?.focus();
  }, [confirming]);

  const downloadData = async () => {
    setDownload('preparando');
    try {
      const json = await exportMyData(user);
      const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = `wallex-mis-datos-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      setDownload('listo');
    } catch {
      setDownload('error');
    }
  };

  const remove = async () => {
    setDeleting('borrando');
    try {
      await deleteAccount(user.email);
      onDeleted();
    } catch {
      setDeleting('error');
    }
  };

  const confirmed = confirmText.trim().toUpperCase() === 'BORRAR';

  return (
    <div className={cardClass}>
      <p className="text-sm text-ink-soft leading-relaxed max-w-[60ch]">
        Según la Ley 1581 de 2012 puedes conocer, corregir y pedir que borremos tus datos. Los corriges arriba, en «Tus datos»; aquí los
        descargas o borras tu cuenta. Más detalles en la{' '}
        <a href="#privacidad" className="font-semibold text-ink underline underline-offset-2">
          política de datos
        </a>
        .
      </p>

      <div className="mt-5 flex flex-wrap gap-2.5">
        <button type="button" onClick={() => void downloadData()} disabled={download === 'preparando'} className={secondaryButton}>
          {download === 'preparando' ? 'Preparando el archivo…' : 'Descargar mis datos'}
        </button>
        {!confirming && (
          <button type="button" onClick={() => setConfirming(true)} className={`${secondaryButton} text-unverified`}>
            Borrar mi cuenta
          </button>
        )}
      </div>
      {download === 'error' && (
        <p role="alert" className="mt-3 text-sm text-unverified">
          No pudimos preparar el archivo. Revisa tu conexión e inténtalo de nuevo.
        </p>
      )}

      {confirming && (
        <div className="mt-5 rounded-lg border border-unverified/40 bg-unverified/5 p-4">
          <p className="text-sm font-semibold">¿Borrar tu cuenta?</p>
          <p className="mt-1 text-sm text-ink-soft">
            Se borran tu cuenta, tus arriendos con sus fotos, tus guardados y el resultado de tu verificación. No se puede deshacer.
            {realVerification && ' Las fotos de tu verificación las borra Didit a más tardar en un mes.'}
          </p>
          <label htmlFor={`${ids}-confirmar`} className="mt-4 block text-sm font-semibold text-ink-soft">
            Escribe BORRAR para confirmar
          </label>
          <input
            ref={confirmRef}
            id={`${ids}-confirmar`}
            type="text"
            autoComplete="off"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            className={`${inputClass(false)} mt-2 max-w-xs bg-surface`}
          />
          <div className="mt-4 flex flex-wrap gap-2.5">
            <button
              type="button"
              disabled={!confirmed || deleting === 'borrando'}
              onClick={() => void remove()}
              className="px-5 py-3 rounded-lg bg-unverified text-white text-sm font-semibold disabled:opacity-45 disabled:cursor-not-allowed"
            >
              {deleting === 'borrando' ? 'Borrando…' : 'Sí, borrar mi cuenta'}
            </button>
            <button
              type="button"
              onClick={() => {
                setConfirming(false);
                setConfirmText('');
                setDeleting('listo');
              }}
              className={secondaryButton}
            >
              Cancelar
            </button>
          </div>
          {deleting === 'error' && (
            <p role="alert" className="mt-3 text-sm text-unverified">
              No pudimos borrar tu cuenta. Revisa tu conexión e inténtalo de nuevo.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

// Mi cuenta (#cuenta): se abre tocando el nombre en la barra
export const AccountPage: React.FC<AccountPageProps> = ({ user, identity, onUserChange, onDeleted, onLogout }) => (
  <section aria-labelledby="titulo-cuenta" className="max-w-[720px] mx-auto px-4 sm:px-6 lg:px-10 py-10 lg:py-14">
    <h1 id="titulo-cuenta" className="text-[2rem] lg:text-[2.75rem] leading-[1.08] font-extrabold tracking-[-0.03em]">
      Mi cuenta
    </h1>
    <p className="mt-3 text-[15px] text-ink-soft">
      Entraste como <span className="font-semibold text-ink break-all">{user.nombre || user.email}</span>.
    </p>

    <div className="mt-10 space-y-10">
      <section aria-labelledby="cuenta-datos">
        <h2 id="cuenta-datos" className={`${sectionTitle} mb-3`}>
          Tus datos
        </h2>
        <ProfileSection user={user} onSaved={onUserChange} />
      </section>

      <section aria-labelledby="cuenta-verificacion">
        <h2 id="cuenta-verificacion" className={`${sectionTitle} mb-3`}>
          Verificación de identidad
        </h2>
        {identity ? (
          <IdentityPanel identity={identity} publisher={user.rol === 'publica'} />
        ) : (
          <p className={`${cardClass} text-sm text-ink-soft`}>
            Por ahora la verificación de identidad es simulada: se hace al contactar a quien publica y no se guarda nada.
          </p>
        )}
      </section>

      <section aria-labelledby="cuenta-contrasena">
        <h2 id="cuenta-contrasena" className={`${sectionTitle} mb-3`}>
          Contraseña
        </h2>
        <PasswordSection email={user.email} />
      </section>

      <section aria-labelledby="cuenta-ley">
        <h2 id="cuenta-ley" className={`${sectionTitle} mb-3`}>
          Tus datos personales
        </h2>
        <DataSection user={user} realVerification={Boolean(identity)} onDeleted={onDeleted} />
      </section>

      <button type="button" onClick={onLogout} className={secondaryButton}>
        Salir de tu cuenta
      </button>
    </div>
  </section>
);
