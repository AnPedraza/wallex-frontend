import React, { useEffect, useRef } from 'react';
import logo from '../assets/wallex-logo.png';
import type { Role, SessionUser } from '../types/account';
import { AuthForm, type AuthMode } from './AuthForm';

interface AuthScreenProps {
  mode: AuthMode;
  initialRole?: Role; // "Crear cuenta para publicar" llega con "Quiero publicar" marcado
  onSuccess: (user: SessionUser, created: boolean) => void;
  onBack: () => void;
  note?: React.ReactNode; // por qué se pide la cuenta, cuando se llega desde una acción (por ejemplo, guardar)
}

const focusRing = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink';

// Pantalla propia para entrar o crear la cuenta: solo el formulario, sin el catálogo detrás
export const AuthScreen: React.FC<AuthScreenProps> = ({ mode, initialRole, onSuccess, onBack, note }) => {
  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const before = document.title;
    document.title = mode === 'login' ? 'Inicia sesión · Wallex' : 'Crea tu cuenta · Wallex';
    formRef.current?.querySelector('input')?.focus();
    return () => {
      document.title = before;
    };
  }, [mode]);

  return (
    <div className="min-h-screen flex flex-col">
      <header className="max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-10 h-[68px] flex items-center justify-between">
        <a href="#buscar" className={`flex items-center gap-2 rounded-lg ${focusRing}`}>
          <img src={logo} alt="" className="h-10 w-10" />
          <span className="text-[21px] font-extrabold tracking-[-0.02em]">Wallex</span>
        </a>
        <button
          type="button"
          onClick={onBack}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-control text-sm font-semibold hover:bg-surface ${focusRing}`}
        >
          <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M15 5l-7 7 7 7" />
          </svg>
          Volver
        </button>
      </header>

      <div ref={formRef} className="flex-1 flex justify-center items-start sm:items-center px-4 pt-6 pb-16">
        <div className="w-full max-w-md">
          {note && <p className="mb-3 text-sm text-ink-soft">{note}</p>}
          <AuthForm key={`${mode}-${initialRole ?? ''}`} initialMode={mode} initialRole={initialRole} onSuccess={onSuccess} />
        </div>
      </div>
    </div>
  );
};
