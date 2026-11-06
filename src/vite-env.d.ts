/// <reference types="vite/client" />

// Variables de Supabase: van en .env.local (en local) y en Vercel. Las dos son públicas por diseño.
// VITE_VERIFICACION=didit enciende la verificación de identidad de verdad; sin ella, se simula.
// VITE_POSTHOG_KEY es la clave pública del proyecto de PostHog (empieza por phc_); sin ella no se mide nada.
interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_PUBLISHABLE_KEY?: string;
  readonly VITE_VERIFICACION?: string;
  readonly VITE_POSTHOG_KEY?: string;
}
