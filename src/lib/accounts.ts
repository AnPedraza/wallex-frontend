// Las cuentas van a Supabase cuando el proyecto tiene sus dos variables (en .env.local o en Vercel).
// Sin ellas, la app sigue con la cuenta simulada en el navegador, para correrla en local sin configurar nada.
// Este archivo no carga el cliente de Supabase, así lo pueden usar la landing y el pie sin hacerse pesados.
import type { Role, SessionUser } from '../types/account';

export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL ?? '';
export const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? '';
export const serverAccounts = Boolean(SUPABASE_URL && SUPABASE_KEY);

const text = (value: unknown) => (typeof value === 'string' && value.trim() ? value.trim() : undefined);

// Los datos del registro que Supabase guarda con la cuenta (user_metadata), ya revisados
export const userFromMetadata = (email: string, meta: Record<string, unknown> | undefined): SessionUser => {
  const rol: Role | undefined = meta?.rol === 'publica' ? 'publica' : meta?.rol === 'busca' ? 'busca' : undefined;
  const tipo = text(meta?.tipo_anunciante);
  return {
    email,
    nombre: text(meta?.nombre),
    rol,
    tipoAnunciante: tipo === 'propietario' || tipo === 'inmobiliaria' || tipo === 'arrendatario' ? tipo : undefined,
    celular: text(meta?.celular),
  };
};
