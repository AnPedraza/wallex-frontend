/// <reference types="vite/client" />

// Variables de Supabase: van en .env.local (en local) y en Vercel. Las dos son públicas por diseño.
interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_PUBLISHABLE_KEY?: string;
}
