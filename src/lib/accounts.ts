// Las cuentas van a Supabase cuando el proyecto tiene sus dos variables (en .env.local o en Vercel).
// Sin ellas, la app sigue con la cuenta simulada en el navegador, para correrla en local sin configurar nada.
// Este archivo no carga el cliente de Supabase, así lo pueden usar la landing y el pie sin hacerse pesados.
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL ?? '';
export const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? '';
export const serverAccounts = Boolean(SUPABASE_URL && SUPABASE_KEY);
