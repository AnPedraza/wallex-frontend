import React, { useEffect, useId, useRef, useState } from 'react';
import type { AuthError } from '@supabase/supabase-js';
import { realVerification, serverAccounts, userFromMetadata } from '../lib/accounts';
import { SESSION_KEY, hashPassword, newSalt, readUsers, writeUsers } from '../lib/localAccounts';
import { supabase } from '../lib/supabase';
import { PUBLISHER_TYPES, ROLE_OPTIONS, type PublisherType, type Role, type SessionUser } from '../types/account';
import { MIN_PASSWORD, digitsOf, validateCelular, validateEmail, validateName, validateNewPassword } from '../lib/validation';

export type AuthMode = 'login' | 'register';
type Status = 'idle' | 'loading' | 'success';

interface AuthFormProps {
  initialMode?: AuthMode;
  initialRole?: Role;
  onSuccess?: (user: SessionUser) => void;
}

interface FieldErrors {
  rol?: string;
  nombre?: string;
  tipo?: string;
  celular?: string;
  email?: string;
  password?: string;
}

const validatePassword = (password: string, mode: AuthMode) => {
  if (!password) return 'Escribe tu contraseña.';
  return mode === 'register' ? validateNewPassword(password) : undefined;
};

// Los errores de Supabase, dichos con lo que hay que hacer
const serverMessage = (error: AuthError, register: boolean) => {
  switch (error.code) {
    case 'user_already_exists':
    case 'email_exists':
      return 'Ya hay una cuenta con este correo. Inicia sesión con tu contraseña.';
    case 'invalid_credentials':
      return 'El correo o la contraseña no coinciden. Revisa que el correo esté bien escrito y las mayúsculas de la contraseña.';
    case 'weak_password':
      return 'Esa contraseña es muy fácil de adivinar. Usa una más larga o mezcla letras y números.';
    case 'email_address_invalid':
      return 'Revisa el correo: debe tener la forma nombre@correo.com, sin espacios.';
    case 'email_not_confirmed':
      return 'Confirma tu correo con el enlace que te enviamos y vuelve a entrar.';
    case 'over_request_rate_limit':
    case 'over_email_send_rate_limit':
      return 'Hubo muchos intentos seguidos. Espera un minuto e inténtalo de nuevo.';
    case 'signup_disabled':
      return 'Por ahora no se pueden crear cuentas nuevas. Inténtalo más tarde.';
  }
  if (error.name === 'AuthRetryableFetchError') return 'No pudimos conectarnos. Revisa tu internet e inténtalo de nuevo.';
  return register
    ? 'No pudimos crear la cuenta en este momento. Inténtalo de nuevo en un rato.'
    : 'No pudimos iniciar sesión en este momento. Inténtalo de nuevo en un rato.';
};

const inputClass = (hasError: boolean) =>
  `w-full bg-paper border rounded-lg p-3 text-sm text-ink focus:outline-none focus:ring-2 ${
    hasError ? 'border-unverified focus:ring-unverified' : 'border-control focus:ring-ink'
  }`;
const labelClass = 'block text-sm font-semibold mb-2 text-ink-soft';
const errorClass = 'mt-1.5 text-xs text-unverified';

export const AuthForm: React.FC<AuthFormProps> = ({ initialMode = 'register', initialRole, onSuccess }) => {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [role, setRole] = useState<Role | null>(initialRole ?? null);
  const [nombre, setNombre] = useState('');
  const [tipo, setTipo] = useState<PublisherType | ''>('');
  const [celular, setCelular] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState('');
  const [notice, setNotice] = useState('');
  const [consent, setConsent] = useState(false);
  const [consentError, setConsentError] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [doneUser, setDoneUser] = useState<SessionUser | null>(null);

  const roleRef = useRef<HTMLInputElement>(null);
  const nombreRef = useRef<HTMLInputElement>(null);
  const tipoRef = useRef<HTMLSelectElement>(null);
  const celularRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const consentRef = useRef<HTMLInputElement>(null);
  const successTimer = useRef<number | undefined>(undefined);

  const ids = useId();
  const titleId = `${ids}-title`;
  const nombreId = `${ids}-nombre`;
  const tipoId = `${ids}-tipo`;
  const celularId = `${ids}-celular`;
  const emailId = `${ids}-email`;
  const passwordId = `${ids}-password`;
  const consentId = `${ids}-consent`;

  const isRegister = mode === 'register';
  const publishes = isRegister && role === 'publica';
  const normalizedEmail = email.trim().toLowerCase();

  useEffect(() => () => window.clearTimeout(successTimer.current), []);

  const switchMode = () => {
    setMode(isRegister ? 'login' : 'register');
    setErrors({});
    setFormError('');
    setNotice('');
    setConsentError('');
    setPassword('');
  };

  const finish = (user: SessionUser) => {
    setDoneUser(user);
    setStatus('success');
    // Pausa corta para que se alcance a leer el mensaje de éxito
    successTimer.current = window.setTimeout(() => onSuccess?.(user), 900);
  };

  // Lo que se pide en el registro, revisado en el mismo orden en que aparece
  const validate = (): [FieldErrors, React.RefObject<HTMLElement | null> | null] => {
    const next: FieldErrors = {};
    if (isRegister) {
      if (!role) next.rol = 'Elige si buscas arriendo o quieres publicar.';
      next.nombre = validateName(nombre);
      if (role === 'publica') {
        if (!tipo) next.tipo = 'Elige si publicas como propietario, inmobiliaria o arrendatario.';
        next.celular = validateCelular(celular);
      }
    }
    next.email = validateEmail(normalizedEmail);
    next.password = validatePassword(password, mode);
    const first = next.rol
      ? roleRef
      : next.nombre
        ? nombreRef
        : next.tipo
          ? tipoRef
          : next.celular
            ? celularRef
            : next.email
              ? emailRef
              : next.password
                ? passwordRef
                : null;
    return [next, first];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status !== 'idle') return;

    const [nextErrors, firstInvalid] = validate();
    setErrors(nextErrors);
    setFormError('');
    setNotice('');
    if (firstInvalid) return firstInvalid.current?.focus();
    // Con cuentas de verdad los datos salen del navegador: la Ley 1581 pide la autorización antes
    if (isRegister && serverAccounts && !consent) {
      setConsentError('Marca la autorización para crear la cuenta.');
      return consentRef.current?.focus();
    }

    const profile: SessionUser = {
      email: normalizedEmail,
      nombre: nombre.trim(),
      rol: role ?? 'busca',
      tipoAnunciante: publishes && tipo ? tipo : undefined,
      celular: publishes ? digitsOf(celular) : undefined,
    };

    if (supabase) {
      setStatus('loading');
      try {
        const { data, error } = isRegister
          ? await supabase.auth.signUp({
              email: normalizedEmail,
              password,
              options: {
                data: {
                  nombre: profile.nombre,
                  rol: profile.rol,
                  tipo_anunciante: profile.tipoAnunciante ?? null,
                  celular: profile.celular ?? null,
                },
              },
            })
          : await supabase.auth.signInWithPassword({ email: normalizedEmail, password });
        if (error) {
          setFormError(serverMessage(error, isRegister));
          setStatus('idle');
          return;
        }
        if (!data.session) {
          // Solo pasa si el proyecto de Supabase pide confirmar el correo antes de entrar
          setNotice('Te enviamos un correo para confirmar la cuenta. Ábrelo y después inicia sesión.');
          setStatus('idle');
          return;
        }
        finish(isRegister ? profile : userFromMetadata(normalizedEmail, data.session.user.user_metadata));
      } catch {
        setFormError('No pudimos conectarnos. Revisa tu internet e inténtalo de nuevo.');
        setStatus('idle');
      }
      return;
    }

    if (!window.crypto?.subtle) {
      setFormError('Este navegador no permite crear la cuenta aquí. Abre Wallex desde su dirección https.');
      return;
    }

    setStatus('loading');
    try {
      const users = readUsers();
      const existing = users[normalizedEmail];
      let user: SessionUser = profile;

      if (isRegister) {
        if (existing) {
          setFormError('Ya hay una cuenta con este correo. Inicia sesión con tu contraseña.');
          setStatus('idle');
          return;
        }
        const salt = newSalt();
        users[normalizedEmail] = {
          salt,
          hash: await hashPassword(password, salt),
          nombre: profile.nombre,
          rol: profile.rol,
          tipoAnunciante: profile.tipoAnunciante,
          celular: profile.celular,
        };
        writeUsers(users);
      } else {
        if (!existing) {
          setFormError('No encontramos una cuenta con ese correo. Revisa que esté bien escrito o crea una cuenta.');
          setStatus('idle');
          return;
        }
        if ((await hashPassword(password, existing.salt)) !== existing.hash) {
          setErrors({ password: 'La contraseña no coincide con este correo. Revisa mayúsculas y minúsculas.' });
          setStatus('idle');
          passwordRef.current?.focus();
          return;
        }
        user = {
          email: normalizedEmail,
          nombre: existing.nombre,
          rol: existing.rol,
          tipoAnunciante: existing.tipoAnunciante,
          celular: existing.celular,
        };
      }

      localStorage.setItem(SESSION_KEY, JSON.stringify(user));
      finish(user);
    } catch {
      setFormError('No pudimos guardar tus datos en este navegador. Revisa que no esté en modo privado e inténtalo de nuevo.');
      setStatus('idle');
    }
  };

  if (status === 'success') {
    return (
      <div
        role="status"
        className="bg-white p-6 rounded-[10px] border border-rule max-w-md w-full text-center space-y-2"
      >
        <div className="w-12 h-12 mx-auto rounded-full bg-verified/10 text-verified flex items-center justify-center">
          <svg className="w-6 h-6 text-verified" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-ink">
          {isRegister ? '¡Listo, ya tienes tu cuenta!' : '¡Hola de nuevo!'}
        </h2>
        <p className="text-sm text-ink-soft">
          Entraste como <strong className="text-ink break-all">{doneUser?.nombre || normalizedEmail}</strong>.
        </p>
      </div>
    );
  }

  const loading = status === 'loading';
  const clear = (field: keyof FieldErrors) => errors[field] && setErrors((prev) => ({ ...prev, [field]: undefined }));

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      aria-labelledby={titleId}
      className="bg-white p-6 rounded-[10px] border border-rule max-w-md w-full space-y-5"
    >
      <div className="space-y-1">
        <h2 id={titleId} className="text-2xl font-bold text-ink">
          {isRegister ? 'Crea tu cuenta' : 'Inicia sesión'}
        </h2>
        {isRegister && (
          <p className="text-sm text-ink-soft">
            Para registrarte no te pedimos cédula ni selfie. Verificas tu identidad más adelante, cuando haga falta.
          </p>
        )}
      </div>

      {isRegister && (
        <>
          <fieldset>
            <legend className={labelClass}>¿Qué quieres hacer en Wallex?</legend>
            <div className="grid grid-cols-2 gap-2.5">
              {ROLE_OPTIONS.map((r, i) => (
                <label
                  key={r.id}
                  className={`flex flex-col gap-0.5 rounded-lg border p-3 cursor-pointer transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ink ${
                    role === r.id ? 'border-ink bg-paper' : errors.rol ? 'border-unverified' : 'border-control hover:border-ink'
                  }`}
                >
                  <input
                    ref={i === 0 ? roleRef : undefined}
                    type="radio"
                    name={`${ids}-rol`}
                    value={r.id}
                    checked={role === r.id}
                    onChange={() => {
                      setRole(r.id);
                      clear('rol');
                    }}
                    aria-describedby={errors.rol ? `${ids}-rol-error` : undefined}
                    className="sr-only"
                  />
                  <span className="text-sm font-semibold text-ink">{r.title}</span>
                  <span className="text-xs text-ink-soft">{r.body}</span>
                </label>
              ))}
            </div>
            {errors.rol && (
              <p id={`${ids}-rol-error`} className={errorClass}>
                {errors.rol}
              </p>
            )}
          </fieldset>

          <div>
            <label htmlFor={nombreId} className={labelClass}>
              Tu nombre
            </label>
            <input
              ref={nombreRef}
              id={nombreId}
              type="text"
              autoComplete="name"
              value={nombre}
              onChange={(e) => {
                setNombre(e.target.value);
                if (errors.nombre) setErrors((prev) => ({ ...prev, nombre: validateName(e.target.value) }));
              }}
              aria-invalid={Boolean(errors.nombre)}
              aria-describedby={errors.nombre ? `${nombreId}-error` : undefined}
              placeholder="Nombre y apellido"
              className={inputClass(Boolean(errors.nombre))}
            />
            {errors.nombre && (
              <p id={`${nombreId}-error`} className={errorClass}>
                {errors.nombre}
              </p>
            )}
          </div>

          {publishes && (
            <>
              <div>
                <label htmlFor={tipoId} className={labelClass}>
                  Publicas como
                </label>
                <select
                  ref={tipoRef}
                  id={tipoId}
                  value={tipo}
                  onChange={(e) => {
                    setTipo(e.target.value as PublisherType | '');
                    clear('tipo');
                  }}
                  aria-invalid={Boolean(errors.tipo)}
                  aria-describedby={errors.tipo ? `${tipoId}-error` : undefined}
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
                  <p id={`${tipoId}-error`} className={errorClass}>
                    {errors.tipo}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor={celularId} className={labelClass}>
                  Celular
                </label>
                <input
                  ref={celularRef}
                  id={celularId}
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel-national"
                  value={celular}
                  onChange={(e) => {
                    setCelular(e.target.value);
                    if (errors.celular) setErrors((prev) => ({ ...prev, celular: validateCelular(e.target.value) }));
                  }}
                  aria-invalid={Boolean(errors.celular)}
                  aria-describedby={`${celularId}-hint${errors.celular ? ` ${celularId}-error` : ''}`}
                  placeholder="3001234567"
                  className={inputClass(Boolean(errors.celular))}
                />
                <p id={`${celularId}-hint`} className="mt-1.5 text-xs text-ink-soft">
                  Lo verán las personas {realVerification ? 'con la identidad verificada' : 'con cuenta'} que quieran contactarte por tus
                  arriendos.
                </p>
                {errors.celular && (
                  <p id={`${celularId}-error`} className="mt-1 text-xs text-unverified">
                    {errors.celular}
                  </p>
                )}
              </div>
            </>
          )}
        </>
      )}

      <div>
        <label htmlFor={emailId} className={labelClass}>
          Correo electrónico
        </label>
        <input
          ref={emailRef}
          id={emailId}
          type="email"
          inputMode="email"
          autoComplete="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (errors.email) setErrors((prev) => ({ ...prev, email: validateEmail(e.target.value.trim()) }));
          }}
          onBlur={() => email && setErrors((prev) => ({ ...prev, email: validateEmail(normalizedEmail) }))}
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? `${emailId}-error` : undefined}
          placeholder="nombre@correo.com"
          className={inputClass(Boolean(errors.email))}
        />
        {errors.email && (
          <p id={`${emailId}-error`} className={errorClass}>
            {errors.email}
          </p>
        )}
      </div>

      <div>
        <label htmlFor={passwordId} className={labelClass}>
          Contraseña
        </label>
        <div className="relative">
          <input
            ref={passwordRef}
            id={passwordId}
            type={showPassword ? 'text' : 'password'}
            autoComplete={isRegister ? 'new-password' : 'current-password'}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (errors.password)
                setErrors((prev) => ({ ...prev, password: validatePassword(e.target.value, mode) }));
            }}
            onBlur={() => password && setErrors((prev) => ({ ...prev, password: validatePassword(password, mode) }))}
            aria-invalid={Boolean(errors.password)}
            aria-describedby={[isRegister && `${passwordId}-hint`, errors.password && `${passwordId}-error`].filter(Boolean).join(' ') || undefined}
            className={`${inputClass(Boolean(errors.password))} pr-24`}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-pressed={showPassword}
            aria-controls={passwordId}
            className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-lg text-xs font-semibold text-verified hover:bg-rule focus:outline-none focus-visible:ring-2 focus-visible:ring-ink"
          >
            {showPassword ? 'Ocultar' : 'Mostrar'}
          </button>
        </div>
        {isRegister && (
          <p id={`${passwordId}-hint`} className="mt-1.5 text-xs text-ink-soft">
            Mínimo {MIN_PASSWORD} caracteres.
          </p>
        )}
        {errors.password && (
          <p id={`${passwordId}-error`} className="mt-1 text-xs text-unverified">
            {errors.password}
          </p>
        )}
      </div>

      {isRegister && serverAccounts && (
        <div>
          <label htmlFor={consentId} className="flex items-start gap-3 text-xs text-ink-soft leading-relaxed cursor-pointer">
            <input
              ref={consentRef}
              id={consentId}
              type="checkbox"
              checked={consent}
              onChange={(e) => {
                setConsent(e.target.checked);
                if (e.target.checked) setConsentError('');
              }}
              aria-invalid={Boolean(consentError)}
              aria-describedby={consentError ? `${consentId}-error` : undefined}
              className="mt-0.5 size-4 accent-ink shrink-0 cursor-pointer"
            />
            <span>
              Autorizo que Wallex trate mis datos para crear y manejar mi cuenta, según la{' '}
              <a href="/#privacidad" target="_blank" rel="noopener" className="font-semibold text-ink underline underline-offset-2">
                política de datos
              </a>{' '}
              (Ley 1581 de 2012).
            </span>
          </label>
          {consentError && (
            <p id={`${consentId}-error`} className={errorClass}>
              {consentError}
            </p>
          )}
        </div>
      )}

      {formError && (
        <p role="alert" className="text-sm bg-unverified/10 text-unverified border border-unverified/30 rounded-lg p-3">
          {formError}
        </p>
      )}
      {notice && (
        <p role="status" className="text-sm bg-paper text-ink border border-rule rounded-lg p-3">
          {notice}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-ink text-white font-semibold py-3 rounded-lg hover:bg-ink-hover active:bg-ink disabled:opacity-60 disabled:cursor-not-allowed transition-colors text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2"
      >
        {loading ? (isRegister ? 'Creando cuenta…' : 'Entrando…') : isRegister ? 'Crear cuenta' : 'Entrar'}
      </button>

      <p className="text-sm text-center text-ink-soft">
        {isRegister ? '¿Ya tienes cuenta?' : '¿Aún no tienes cuenta?'}{' '}
        <button
          type="button"
          onClick={switchMode}
          className="font-semibold text-verified hover:underline rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-ink"
        >
          {isRegister ? 'Inicia sesión' : 'Regístrate'}
        </button>
      </p>
    </form>
  );
};
