import React, { useEffect, useId, useRef, useState } from 'react';
import type { AuthError } from '@supabase/supabase-js';
import { serverAccounts } from '../lib/accounts';
import { supabase } from '../lib/supabase';

export type AuthMode = 'login' | 'register';
type Status = 'idle' | 'loading' | 'success';

interface AuthFormProps {
  initialMode?: AuthMode;
  onSuccess?: (user: { email: string }) => void;
}

interface FieldErrors {
  email?: string;
  password?: string;
}

interface StoredUser {
  salt: string;
  hash: string;
}

// Con las variables de Supabase, la cuenta es de verdad: Supabase guarda el correo y la contraseña protegida.
// Sin ellas, la cuenta es simulada y vive en el localStorage de este navegador: el correo y un hash SHA-256
// con sal, nunca la contraseña.
const USERS_KEY = 'wallex.users';
export const SESSION_KEY = 'wallex.session';
const MIN_PASSWORD = 8;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const toHex = (bytes: Uint8Array) =>
  Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');

const hashPassword = async (password: string, salt: string) => {
  const data = new TextEncoder().encode(`${salt}:${password}`);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return toHex(new Uint8Array(digest));
};

const readUsers = (): Record<string, StoredUser> => {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    return raw ? (JSON.parse(raw) as Record<string, StoredUser>) : {};
  } catch {
    return {};
  }
};

const validateEmail = (email: string) => {
  if (!email) return 'Escribe tu correo, por ejemplo nombre@correo.com.';
  if (!EMAIL_PATTERN.test(email))
    return 'Revisa el correo: debe tener la forma nombre@correo.com, sin espacios.';
  return undefined;
};

const validatePassword = (password: string, mode: AuthMode) => {
  if (!password) return 'Escribe tu contraseña.';
  if (mode === 'register' && password.length < MIN_PASSWORD) {
    const missing = MIN_PASSWORD - password.length;
    return `La contraseña debe tener mínimo ${MIN_PASSWORD} caracteres. Te ${
      missing === 1 ? 'falta 1' : `faltan ${missing}`
    }.`;
  }
  return undefined;
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

export const AuthForm: React.FC<AuthFormProps> = ({ initialMode = 'register', onSuccess }) => {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState('');
  const [notice, setNotice] = useState('');
  const [consent, setConsent] = useState(false);
  const [consentError, setConsentError] = useState('');
  const [status, setStatus] = useState<Status>('idle');

  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const consentRef = useRef<HTMLInputElement>(null);
  const successTimer = useRef<number | undefined>(undefined);

  const ids = useId();
  const titleId = `${ids}-title`;
  const emailId = `${ids}-email`;
  const passwordId = `${ids}-password`;
  const consentId = `${ids}-consent`;

  const isRegister = mode === 'register';
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

  const finish = () => {
    setStatus('success');
    // Pausa corta para que se alcance a leer el mensaje de éxito
    successTimer.current = window.setTimeout(() => onSuccess?.({ email: normalizedEmail }), 900);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status !== 'idle') return;

    const nextErrors: FieldErrors = {
      email: validateEmail(normalizedEmail),
      password: validatePassword(password, mode),
    };
    setErrors(nextErrors);
    setFormError('');
    setNotice('');
    if (nextErrors.email) return emailRef.current?.focus();
    if (nextErrors.password) return passwordRef.current?.focus();
    // Con cuentas de verdad el correo sale del navegador: la Ley 1581 pide la autorización antes
    if (isRegister && serverAccounts && !consent) {
      setConsentError('Marca la autorización para crear la cuenta.');
      return consentRef.current?.focus();
    }

    if (supabase) {
      setStatus('loading');
      try {
        const { data, error } = isRegister
          ? await supabase.auth.signUp({ email: normalizedEmail, password })
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
        finish();
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

      if (isRegister) {
        if (existing) {
          setFormError('Ya hay una cuenta con este correo. Inicia sesión con tu contraseña.');
          setStatus('idle');
          return;
        }
        const salt = toHex(crypto.getRandomValues(new Uint8Array(16)));
        users[normalizedEmail] = { salt, hash: await hashPassword(password, salt) };
        localStorage.setItem(USERS_KEY, JSON.stringify(users));
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
      }

      localStorage.setItem(SESSION_KEY, JSON.stringify({ email: normalizedEmail }));
      finish();
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
          Entraste como <strong className="text-ink break-all">{normalizedEmail}</strong>.
        </p>
      </div>
    );
  }

  const loading = status === 'loading';

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
            Solo necesitas tu correo y una contraseña. Verificas tu identidad más adelante, cuando
            quieras escribirle a un propietario.
          </p>
        )}
      </div>

      <div>
        <label htmlFor={emailId} className="block text-sm font-semibold mb-2 text-ink-soft">
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
          <p id={`${emailId}-error`} className="mt-1.5 text-xs text-unverified">
            {errors.email}
          </p>
        )}
      </div>

      <div>
        <label htmlFor={passwordId} className="block text-sm font-semibold mb-2 text-ink-soft">
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
              Autorizo que Wallex guarde mi correo para crear y manejar mi cuenta, según la{' '}
              <a href="/#privacidad" target="_blank" rel="noopener" className="font-semibold text-ink underline underline-offset-2">
                política de datos
              </a>{' '}
              (Ley 1581 de 2012).
            </span>
          </label>
          {consentError && (
            <p id={`${consentId}-error`} className="mt-1.5 text-xs text-unverified">
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
