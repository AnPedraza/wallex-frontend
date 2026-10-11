import React, { useEffect, useId, useRef, useState } from 'react';

type AuthMode = 'login' | 'register';
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

// Auth simulada: todo vive en el localStorage de este navegador, no hay servidor.
// Se guarda el correo y un hash SHA-256 con sal, nunca la contraseña.
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

const inputClass = (hasError: boolean) =>
  `w-full bg-[#F8F5F0] border rounded-xl p-3 text-sm text-[#2B1B17] focus:outline-none focus:ring-2 ${
    hasError ? 'border-[#B3453A] focus:ring-[#B3453A]' : 'border-[#EAE4DC] focus:ring-[#2B1B17]'
  }`;

export const AuthForm: React.FC<AuthFormProps> = ({ initialMode = 'register', onSuccess }) => {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState('');
  const [status, setStatus] = useState<Status>('idle');

  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const successTimer = useRef<number | undefined>(undefined);

  const ids = useId();
  const titleId = `${ids}-title`;
  const emailId = `${ids}-email`;
  const passwordId = `${ids}-password`;

  const isRegister = mode === 'register';
  const normalizedEmail = email.trim().toLowerCase();

  useEffect(() => () => window.clearTimeout(successTimer.current), []);

  const switchMode = () => {
    setMode(isRegister ? 'login' : 'register');
    setErrors({});
    setFormError('');
    setPassword('');
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
    if (nextErrors.email) return emailRef.current?.focus();
    if (nextErrors.password) return passwordRef.current?.focus();

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
      setStatus('success');
      // Pausa corta para que se alcance a leer el mensaje de éxito
      successTimer.current = window.setTimeout(() => onSuccess?.({ email: normalizedEmail }), 900);
    } catch {
      setFormError('No pudimos guardar tus datos en este navegador. Revisa que no esté en modo privado e inténtalo de nuevo.');
      setStatus('idle');
    }
  };

  if (status === 'success') {
    return (
      <div
        role="status"
        className="bg-white p-6 rounded-2xl border border-[#EAE4DC] max-w-md w-full text-center space-y-2"
      >
        <div className="w-12 h-12 mx-auto rounded-full bg-[#2F7A5B]/10 text-[#2F7A5B] flex items-center justify-center">
          <svg className="w-6 h-6 text-[#2F7A5B]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-[#2B1B17]">
          {isRegister ? '¡Listo, ya tienes tu cuenta!' : '¡Hola de nuevo!'}
        </h2>
        <p className="text-sm text-[#6E615A]">
          Entraste como <strong className="text-[#2B1B17] break-all">{normalizedEmail}</strong>.
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
      className="bg-white p-6 rounded-2xl border border-[#EAE4DC] max-w-md w-full space-y-5"
    >
      <div className="space-y-1">
        <h2 id={titleId} className="text-2xl font-bold text-[#2B1B17]">
          {isRegister ? 'Crea tu cuenta' : 'Inicia sesión'}
        </h2>
        {isRegister && (
          <p className="text-sm text-[#6E615A]">
            Solo necesitas tu correo y una contraseña. Verificas tu identidad más adelante, cuando
            quieras escribirle a un propietario.
          </p>
        )}
      </div>

      <div>
        <label htmlFor={emailId} className="block text-sm font-semibold mb-2 text-[#4A3E39]">
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
          <p id={`${emailId}-error`} className="mt-1.5 text-xs text-[#B3453A]">
            {errors.email}
          </p>
        )}
      </div>

      <div>
        <label htmlFor={passwordId} className="block text-sm font-semibold mb-2 text-[#4A3E39]">
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
            aria-describedby={`${passwordId}-hint${errors.password ? ` ${passwordId}-error` : ''}`}
            className={`${inputClass(Boolean(errors.password))} pr-24`}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-pressed={showPassword}
            aria-controls={passwordId}
            className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-lg text-xs font-semibold text-[#8C5E3C] hover:bg-[#EAE4DC] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2B1B17]"
          >
            {showPassword ? 'Ocultar' : 'Mostrar'}
          </button>
        </div>
        <p id={`${passwordId}-hint`} className="mt-1.5 text-xs text-[#6E615A]">
          {isRegister ? `Mínimo ${MIN_PASSWORD} caracteres. ` : ''}Es un prototipo: no uses una
          contraseña de otro servicio.
        </p>
        {errors.password && (
          <p id={`${passwordId}-error`} className="mt-1 text-xs text-[#B3453A]">
            {errors.password}
          </p>
        )}
      </div>

      {formError && (
        <p role="alert" className="text-sm bg-[#B3453A]/10 text-[#B3453A] border border-[#B3453A]/30 rounded-xl p-3">
          {formError}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-[#2B1B17] text-white font-semibold py-3 rounded-xl hover:bg-[#4A3E39] active:bg-[#1A100D] disabled:opacity-60 disabled:cursor-not-allowed transition-colors text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2B1B17] focus-visible:ring-offset-2"
      >
        {loading ? (isRegister ? 'Creando cuenta…' : 'Entrando…') : isRegister ? 'Crear cuenta' : 'Entrar'}
      </button>

      <p className="text-sm text-center text-[#6E615A]">
        {isRegister ? '¿Ya tienes cuenta?' : '¿Aún no tienes cuenta?'}{' '}
        <button
          type="button"
          onClick={switchMode}
          className="font-semibold text-[#8C5E3C] hover:underline rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2B1B17]"
        >
          {isRegister ? 'Inicia sesión' : 'Regístrate'}
        </button>
      </p>

      <p className="text-xs text-center text-[#6E615A]">
        Tus datos quedan solo en este navegador; Wallex no los envía a ningún servidor.
      </p>
    </form>
  );
};
