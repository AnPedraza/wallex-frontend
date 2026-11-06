import type { PublisherType, Role } from '../types/account';

// La cuenta simulada, cuando el proyecto no tiene las variables de Supabase: vive en el localStorage de este
// navegador con el correo, los datos del registro y un hash SHA-256 con sal, nunca la contraseña.
export const USERS_KEY = 'wallex.users';
export const SESSION_KEY = 'wallex.session';

export interface StoredUser {
  salt: string;
  hash: string;
  nombre?: string;
  rol?: Role;
  tipoAnunciante?: PublisherType;
  celular?: string;
}

export const toHex = (bytes: Uint8Array) => Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');

export const newSalt = () => toHex(crypto.getRandomValues(new Uint8Array(16)));

export const hashPassword = async (password: string, salt: string) => {
  const data = new TextEncoder().encode(`${salt}:${password}`);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return toHex(new Uint8Array(digest));
};

export const readUsers = (): Record<string, StoredUser> => {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    return raw ? (JSON.parse(raw) as Record<string, StoredUser>) : {};
  } catch {
    return {};
  }
};

export const writeUsers = (users: Record<string, StoredUser>) => {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
};
