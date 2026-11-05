import React, { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { SESSION_KEY } from './components/AuthForm';
import { AuthScreen } from './components/AuthScreen';
import { ContactVerification } from './components/ContactVerification';
import { Footer } from './components/Footer';
import { MyListings } from './components/MyListings';
import { Navbar } from './components/Navbar';
import type { NavLink } from './components/Navbar';
import { PrivacyPolicy } from './components/PrivacyPolicy';
import { PropertyPortal } from './components/PropertyPortal';
import { PropertyComparer } from './components/PropertyComparer';
import { PublishForm } from './components/PublishForm';
import { INITIAL_PROPERTIES } from './data/mockProperties';
import { serverAccounts, userFromMetadata } from './lib/accounts';
import { fetchPublished } from './lib/listings';
import { supabase } from './lib/supabase';
import type { Role, SessionUser } from './types/account';
import type { Property } from './types/property';

// Sesión simulada en localStorage (ver AuthForm). Con Supabase, la sesión la guarda Supabase.
const readSession = (): SessionUser | null => {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : null;
    if (parsed && typeof parsed === 'object' && 'email' in parsed && typeof parsed.email === 'string') {
      return userFromMetadata(parsed.email, parsed as Record<string, unknown>);
    }
  } catch {
    // Sin acceso a localStorage se sigue sin sesión
  }
  return null;
};

// "Abrir el comparador" de la landing llega con ?comparar=5,3,1 y trae esas opciones; si no, el comparador empieza vacío
const compareFromLanding = (): string[] => {
  const ids = new URLSearchParams(window.location.search).get('comparar')?.split(',') ?? [];
  return ids.filter((id, i) => ids.indexOf(id) === i && INITIAL_PROPERTIES.some((p) => p.id === id)).slice(0, 3);
};

// Cada vista vive en el hash. #ingresar y #crear-cuenta son la pantalla de cuenta, sin el catálogo detrás.
type View = 'buscar' | 'comparar' | 'privacidad' | 'ingresar' | 'crear-cuenta' | 'publicar' | 'mis-publicaciones';
const VIEWS: Record<string, View> = {
  '#comparar': 'comparar',
  '#privacidad': 'privacidad',
  '#ingresar': 'ingresar',
  '#crear-cuenta': 'crear-cuenta',
  '#publicar': 'publicar',
  '#mis-publicaciones': 'mis-publicaciones',
};
const viewOf = (hash: string): View => VIEWS[hash] ?? 'buscar';
const isAuthView = (v: View) => v === 'ingresar' || v === 'crear-cuenta';

// Publicar y Mis publicaciones piden cuenta: sin sesión se ofrece crearla o entrar
const NeedsAccount: React.FC<{ onCreate: () => void; onLogin: () => void }> = ({ onCreate, onLogin }) => (
  <section className="max-w-[640px] mx-auto px-4 sm:px-6 py-16 lg:py-24 text-center">
    <h1 className="text-[2rem] lg:text-[2.75rem] leading-[1.08] font-extrabold tracking-[-0.03em]">Para publicar necesitas una cuenta</h1>
    <p className="mt-4 text-[15px] text-ink-soft leading-relaxed">
      Así quien busca sabe quién publica y te puede escribir. Crearla toma menos de un minuto.
    </p>
    <div className="mt-8 flex flex-col sm:flex-row gap-2.5 justify-center">
      <button type="button" onClick={onCreate} className="bg-ink text-white font-semibold text-sm px-5 py-3 rounded-lg hover:bg-ink-hover">
        Crear cuenta para publicar
      </button>
      <button type="button" onClick={onLogin} className="border border-control font-semibold text-sm px-5 py-3 rounded-lg hover:bg-surface">
        Ya tengo cuenta
      </button>
    </div>
  </section>
);

// Con sesión iniciada, la pantalla de cuenta no tiene nada que hacer: sigue al catálogo
const leaveAuthIfOpen = () => {
  if (isAuthView(viewOf(window.location.hash))) window.location.replace('#buscar');
};

export default function App() {
  const [user, setUser] = useState<SessionUser | null>(() => (supabase ? null : readSession()));
  // Enlaces viejos de la landing llegan con ?ingresar: se llevan a la pantalla de cuenta
  const fromLandingLogin = () => new URLSearchParams(window.location.search).has('ingresar');
  const [currentHash, setCurrentHash] = useState(() => (fromLandingLogin() ? '#ingresar' : window.location.hash || '#buscar'));
  const [comparisonIds, setComparisonIds] = useState<string[]>(compareFromLanding);
  const [contactingProperty, setContactingProperty] = useState<Property | null>(null);
  // Perfil de transporte compartido: el total del mes es el mismo en catálogo, ficha y comparador
  const [transportProfileId, setTransportProfileId] = useState('standard');
  // A dónde volver después de entrar o crear la cuenta, y con qué rol se abre el registro
  const returnTo = useRef('#buscar');
  const [authRole, setAuthRole] = useState<Role | undefined>(undefined);
  // Lo que publica la gente en Wallex; va antes de los inmuebles de ejemplo
  const [published, setPublished] = useState<Property[]>([]);
  const refreshPublished = useCallback(() => {
    void fetchPublished().then(setPublished);
  }, []);
  useEffect(refreshPublished, [refreshPublished]);
  const allProperties = useMemo(() => [...published, ...INITIAL_PROPERTIES], [published]);

  // Quitar ?ingresar y ?comparar de la dirección para que al recargar no se vuelvan a aplicar
  useEffect(() => {
    const url = new URL(window.location.href);
    if (!url.searchParams.has('ingresar') && !url.searchParams.has('comparar')) return;
    if (url.searchParams.has('ingresar')) url.hash = '#ingresar';
    url.searchParams.delete('ingresar');
    url.searchParams.delete('comparar');
    window.history.replaceState(null, '', url.pathname + url.search + url.hash);
  }, []);

  // Con cuentas de verdad, Supabase guarda la sesión; aquí solo se lee al entrar y se escuchan sus cambios.
  // Con la cuenta local, la sesión ya se leyó del navegador.
  useEffect(() => {
    if (!supabase) {
      if (readSession()) leaveAuthIfOpen();
      return;
    }
    const auth = supabase.auth;
    type Session = { user: { email?: string; user_metadata?: Record<string, unknown> } } | null;
    const toUser = (session: Session) =>
      session?.user.email ? userFromMetadata(session.user.email, session.user.user_metadata) : null;
    auth.getSession().then(({ data }) => {
      setUser(toUser(data.session));
      if (data.session) leaveAuthIfOpen();
    });
    const { data } = auth.onAuthStateChange((_event, session) => setUser(toUser(session)));
    return () => data.subscription.unsubscribe();
  }, []);

  // Escuchar cambios de hash para navegación entre vistas
  useEffect(() => {
    const onHashChange = () => {
      setCurrentHash(window.location.hash || '#buscar');
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  // Al cambiar de vista (catálogo, comparador, política o cuenta), la página empieza arriba
  const view = viewOf(currentHash);
  const authView = isAuthView(view);
  const firstView = useRef(true);
  useEffect(() => {
    if (firstView.current) {
      firstView.current = false;
      return;
    }
    window.scrollTo(0, 0);
  }, [view]);

  const openedInApp = useRef(false);
  const goToAuth = (screen: '#crear-cuenta' | '#ingresar', back: string, role?: Role) => {
    returnTo.current = back;
    setAuthRole(role);
    openedInApp.current = true;
    window.location.hash = screen;
  };
  const openAuth = () => goToAuth('#crear-cuenta', view === 'comparar' ? '#comparar' : '#buscar');

  // Al terminar, se reemplaza la pantalla de cuenta en el historial: "atrás" no vuelve al formulario.
  // Quien acaba de crear su cuenta para publicar llega directo al formulario de publicar.
  const handleAuthSuccess = (u: SessionUser) => {
    setUser(u);
    openedInApp.current = false;
    const newPublisher = view === 'crear-cuenta' && u.rol === 'publica' && returnTo.current === '#buscar';
    window.location.replace(newPublisher ? '#publicar' : returnTo.current);
  };

  // "Volver" regresa a la página anterior si era de Wallex (el catálogo o la landing); si no, al catálogo
  const leaveAuth = () => {
    const fromWallex = openedInApp.current || document.referrer.startsWith(window.location.origin);
    openedInApp.current = false;
    if (fromWallex && window.history.length > 1) window.history.back();
    else window.location.replace(returnTo.current);
  };

  const handleLogout = () => {
    if (supabase) {
      void supabase.auth.signOut();
    } else {
      try {
        localStorage.removeItem(SESSION_KEY);
      } catch {
        // Igual se cierra la sesión en pantalla
      }
    }
    setUser(null);
  };

  // Gestión de comparación
  const handleToggleComparison = (propertyId: string) => {
    setComparisonIds((prev) => {
      if (prev.includes(propertyId)) {
        return prev.filter((id) => id !== propertyId);
      }
      if (prev.length >= 3) {
        alert('Puedes comparar un máximo de 3 propiedades a la vez. Quita una para agregar otra.');
        return prev;
      }
      return [...prev, propertyId];
    });
  };

  const handleRemoveFromComparison = (id: string) => {
    setComparisonIds((prev) => prev.filter((item) => item !== id));
  };

  const handleAddToComparison = (prop: Property) => {
    setComparisonIds((prev) => {
      if (prev.includes(prop.id)) return prev;
      if (prev.length >= 3) {
        alert('Puedes comparar hasta 3 propiedades. Quita una para agregar otra.');
        return prev;
      }
      return [...prev, prop.id];
    });
  };

  const handleReplaceComparison = (oldId: string, newProp: Property) => {
    setComparisonIds((prev) => prev.map((id) => (id === oldId ? newProp.id : id)));
  };

  const comparedProperties = useMemo(() => {
    return comparisonIds
      .map((id) => allProperties.find((p) => p.id === id))
      .filter((p): p is Property => p !== undefined);
  }, [comparisonIds, allProperties]);

  // Publicar necesita las cuentas de verdad: sin Supabase no se muestra. Quien publica ve "Mis publicaciones"
  // (desde ahí publica otro); los demás, "Publicar arriendo". Así la barra nunca pasa de tres enlaces.
  const publishLink: NavLink =
    user?.rol === 'publica' ? { label: 'Mis publicaciones', href: '#mis-publicaciones' } : { label: 'Publicar arriendo', href: '#publicar' };
  const navLinks: NavLink[] = [
    { label: 'Buscar vivienda', href: '#buscar' },
    {
      label: 'Comparador lado a lado',
      href: '#comparar',
      badge: comparisonIds.length,
    },
    ...(serverAccounts ? [publishLink] : []),
  ];


  return (
    <div className="min-h-screen flex flex-col bg-paper">
      {!authView && <Navbar user={user} onLogout={handleLogout} onLoginClick={openAuth} links={navLinks} />}

      <main className="flex-1">
        {authView && (
          <AuthScreen mode={view === 'ingresar' ? 'login' : 'register'} initialRole={authRole} onSuccess={handleAuthSuccess} onBack={leaveAuth} />
        )}
        {(view === 'publicar' || view === 'mis-publicaciones') && !user && (
          <NeedsAccount
            onCreate={() => goToAuth('#crear-cuenta', currentHash, 'publica')}
            onLogin={() => goToAuth('#ingresar', currentHash)}
          />
        )}
        {view === 'publicar' && user && <PublishForm user={user} onPublished={refreshPublished} />}
        {view === 'mis-publicaciones' && user && <MyListings onChanged={refreshPublished} />}
        {/* El catálogo sigue montado mientras se ve otra vista: al volver conserva sus filtros */}
        {view === 'comparar' && (
          <PropertyComparer
            transportProfileId={transportProfileId}
            onTransportProfileChange={setTransportProfileId}
            properties={comparedProperties}
            availableProperties={allProperties}
            onRemoveProperty={handleRemoveFromComparison}
            onAddProperty={handleAddToComparison}
            onReplaceProperty={handleReplaceComparison}
            onContactProperty={(prop) => setContactingProperty(prop)}
            onClose={() => {
              window.location.hash = '#buscar';
            }}
          />
        )}
        {view === 'privacidad' && <PrivacyPolicy />}
        <div id="buscar" className="scroll-mt-16" hidden={view !== 'buscar'}>
          <PropertyPortal
            transportProfileId={transportProfileId}
            onTransportProfileChange={setTransportProfileId}
            comparisonIds={comparisonIds}
            onToggleComparison={handleToggleComparison}
            onOpenComparer={() => {
              window.location.hash = '#comparar';
            }}
            onContactProperty={(prop) => setContactingProperty(prop)}
            properties={allProperties}
          />
        </div>
      </main>

      {!authView && <Footer />}

      {/* Verificación al contactar (simulada y declarada como tal) */}
      {contactingProperty && (
        <ContactVerification
          property={contactingProperty}
          onClose={() => setContactingProperty(null)}
          signedIn={Boolean(user)}
          onSignIn={() => {
            setContactingProperty(null);
            goToAuth('#ingresar', view === 'comparar' ? '#comparar' : '#buscar');
          }}
        />
      )}
    </div>
  );
}
