// Medición de uso con PostHog: visitas, registro, activación y regreso (lo que pide el Release 3).
// Solo se carga si el proyecto tiene VITE_POSTHOG_KEY; sin ella, nada de esto hace algo.
// Nunca se manda el nombre, el correo ni el celular: a quien tiene cuenta se le identifica con su id de Supabase.
// No hay clics automáticos ni grabación de pantalla: solo los eventos que la app manda a propósito.

const KEY = import.meta.env.VITE_POSTHOG_KEY ?? '';
// En producción PostHog va por /ingest, que Vercel reenvía (vercel.json): así los bloqueadores de anuncios
// no cortan la medición. En local va directo a PostHog.
const API_HOST = import.meta.env.PROD ? '/ingest' : 'https://us.i.posthog.com';
const SCRIPT = import.meta.env.PROD ? '/ingest/static/array.js' : 'https://us-assets.i.posthog.com/static/array.js';
const VISIT_KEY = 'wallex.ultima-visita';

export const analyticsEnabled = Boolean(KEY);

type Properties = Record<string, string | number | boolean | null | undefined>;

interface PostHogClient {
  capture: (event: string, properties?: Properties) => void;
  register: (properties: Properties) => void;
  identify: (id: string, properties?: Properties) => void;
  reset: () => void;
}

// Lo que se pide antes de que cargue el script de PostHog espera aquí
let pending: ((client: PostHogClient) => void)[] = [];
let client: PostHogClient | null = null;
let started = false;

const run = (fn: (client: PostHogClient) => void) => {
  if (!KEY) return;
  if (client) fn(client);
  else pending.push(fn);
};

// Carga PostHog como lo hace su fragmento oficial: la configuración queda en window.posthog._i
// y el script, al cargar, la toma y deja en window.posthog el cliente ya listo
export const initAnalytics = () => {
  if (!KEY || started) return;
  started = true;
  const holder = window as unknown as { posthog?: unknown };
  holder.posthog = Object.assign([], {
    __SV: 1,
    people: [],
    _i: [
      [
        KEY,
        {
          api_host: API_HOST,
          ui_host: 'https://us.posthog.com',
          person_profiles: 'identified_only',
          persistence: 'localStorage',
          autocapture: false,
          capture_pageview: false,
          capture_pageleave: false,
          disable_session_recording: true,
          // Lo que el proyecto de PostHog trae encendido y Wallex no usa: clics "muertos", mapas de calor,
          // métricas de rendimiento, encuestas y banderas de funciones. Así solo se mide lo que dice la política.
          capture_dead_clicks: false,
          capture_heatmaps: false,
          capture_performance: false,
          disable_surveys: true,
          advanced_disable_flags: true,
        },
      ],
    ],
  });
  const script = document.createElement('script');
  script.src = SCRIPT;
  script.async = true;
  script.crossOrigin = 'anonymous';
  script.onload = () => {
    const loaded = holder.posthog as Partial<PostHogClient> | undefined;
    if (!loaded || typeof loaded.capture !== 'function') return;
    const ready = loaded as PostHogClient;
    // Cada evento dice de dónde viene: así el embudo del reporte cuenta solo producción, no las pruebas
    const host = window.location.hostname;
    ready.register({ entorno: host === 'localhost' ? 'local' : host === 'wallex-frontend.vercel.app' ? 'produccion' : 'vista-previa' });
    client = ready;
    pending.forEach((fn) => fn(ready));
    pending = [];
  };
  document.head.appendChild(script);
};

export const track = (event: string, properties?: Properties) => run((ph) => ph.capture(event, properties));

// Una vista: la landing o una vista de la app (el hash va en la dirección que PostHog guarda con el evento)
export const pageview = () => track('$pageview');

// Activación: alguien hizo algo del recorrido principal (guardar, comparar, contactar o publicar)
export const trackActivation = (accion: 'guardar' | 'comparar' | 'contactar' | 'publicar') => track('activacion', { accion });

// Con sesión, los eventos se unen a la cuenta por su id (sin datos personales); al salir, se vuelve anónimo
export const identifyUser = (id: string, rol?: string) => run((ph) => ph.identify(id, { rol: rol ?? null }));
export const resetAnalytics = () => run((ph) => ph.reset());

// Regreso: la primera visita de cada día en este navegador, si ya había venido otro día
export const trackVisit = () => {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const last = localStorage.getItem(VISIT_KEY);
    localStorage.setItem(VISIT_KEY, today);
    if (last && last !== today) {
      track('visita_regreso', { dias_desde_la_anterior: Math.round((Date.parse(today) - Date.parse(last)) / 86_400_000) });
    }
  } catch {
    // Sin almacenamiento no se cuenta el regreso
  }
};
