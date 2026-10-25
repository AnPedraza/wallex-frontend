import { useEffect, useRef, useState, useMemo } from 'react';
import { AuthForm, SESSION_KEY } from './components/AuthForm';
import { ContactVerification } from './components/ContactVerification';
import { Footer } from './components/Footer';
import { Navbar } from './components/Navbar';
import type { NavLink } from './components/Navbar';
import { PropertyPortal } from './components/PropertyPortal';
import { PropertyComparer } from './components/PropertyComparer';
import { INITIAL_PROPERTIES } from './data/mockProperties';
import type { Property } from './types/property';

interface SessionUser {
  email: string;
}

// La sesión es simulada y vive en localStorage (ver AuthForm)
const readSession = (): SessionUser | null => {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : null;
    if (parsed && typeof parsed === 'object' && 'email' in parsed && typeof parsed.email === 'string') {
      return { email: parsed.email };
    }
  } catch {
    // Sin acceso a localStorage se sigue sin sesión
  }
  return null;
};

export default function App() {
  const [user, setUser] = useState<SessionUser | null>(readSession);
  // "Ingresar" de la landing llega con ?ingresar y abre el inicio de sesión de una vez
  const fromLandingLogin = () => new URLSearchParams(window.location.search).has('ingresar');
  const [authOpen, setAuthOpen] = useState(() => fromLandingLogin() && !readSession());
  const [authMode, setAuthMode] = useState<'login' | 'register'>(() => (fromLandingLogin() ? 'login' : 'register'));
  const [currentHash, setCurrentHash] = useState(() => window.location.hash || '#buscar');
  const [comparisonIds, setComparisonIds] = useState<string[]>(['1', '3']); // Inicialmente 2 propiedades (Chapinero Alto vs Cedritos)
  const [contactingProperty, setContactingProperty] = useState<Property | null>(null);
  // Perfil de transporte compartido: el total del mes es el mismo en catálogo, ficha y comparador
  const [transportProfileId, setTransportProfileId] = useState('standard');
  const modalRef = useRef<HTMLDivElement>(null);

  // Quitar ?ingresar de la dirección para que al recargar no se vuelva a abrir
  useEffect(() => {
    const url = new URL(window.location.href);
    if (!url.searchParams.has('ingresar')) return;
    url.searchParams.delete('ingresar');
    window.history.replaceState(null, '', url.pathname + url.search + url.hash);
  }, []);

  // Escuchar cambios de hash para navegación (#buscar o #comparar)
  useEffect(() => {
    const onHashChange = () => {
      setCurrentHash(window.location.hash || '#buscar');
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  // Capa fija en vez de <dialog>: con showModal() Brave se cerraba al autocompletar el correo
  useEffect(() => {
    if (!authOpen) return;
    const opener = document.activeElement as HTMLElement | null;
    const onKeyDown = (e: KeyboardEvent) => e.key === 'Escape' && setAuthOpen(false);

    modalRef.current?.querySelector('input')?.focus();
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKeyDown);
      opener?.focus();
    };
  }, [authOpen]);

  const closeAuth = () => setAuthOpen(false);

  const handleLogout = () => {
    try {
      localStorage.removeItem(SESSION_KEY);
    } catch {
      // Igual se cierra la sesión en pantalla
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
      .map((id) => INITIAL_PROPERTIES.find((p) => p.id === id))
      .filter((p): p is Property => p !== undefined);
  }, [comparisonIds]);

  const navLinks: NavLink[] = [
    { label: 'Buscar vivienda', href: '#buscar' },
    {
      label: 'Comparador lado a lado',
      href: '#comparar',
      badge: comparisonIds.length,
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-paper">
      <Navbar
        user={user}
        onLogout={handleLogout}
        onLoginClick={() => {
          setAuthMode('register');
          setAuthOpen(true);
        }}
        links={navLinks}
      />

      <main className="flex-1">
        {currentHash === '#comparar' ? (
          <PropertyComparer
            transportProfileId={transportProfileId}
            onTransportProfileChange={setTransportProfileId}
            properties={comparedProperties}
            availableProperties={INITIAL_PROPERTIES}
            onRemoveProperty={handleRemoveFromComparison}
            onAddProperty={handleAddToComparison}
            onReplaceProperty={handleReplaceComparison}
            onContactProperty={(prop) => setContactingProperty(prop)}
            onClose={() => {
              window.location.hash = '#buscar';
            }}
          />
        ) : (
          <div id="buscar" className="scroll-mt-16">
            <PropertyPortal
              transportProfileId={transportProfileId}
              onTransportProfileChange={setTransportProfileId}
              comparisonIds={comparisonIds}
              onToggleComparison={handleToggleComparison}
              onOpenComparer={() => {
                window.location.hash = '#comparar';
              }}
              onContactProperty={(prop) => setContactingProperty(prop)}
            />
          </div>
        )}
      </main>

      <Footer />

      {/* Verificación al contactar (simulada y declarada como tal) */}
      {contactingProperty && <ContactVerification property={contactingProperty} onClose={() => setContactingProperty(null)} />}

      {/* Modal Auth */}
      {authOpen && (
        <div
          onClick={(e) => e.target === e.currentTarget && closeAuth()}
          className="fixed inset-0 z-50 bg-ink/55 flex items-center justify-center p-4 overflow-y-auto"
        >
          <div
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            aria-label="Ingresar o crear cuenta"
            className="relative w-full max-w-md"
          >
            <AuthForm
              initialMode={authMode}
              onSuccess={(u) => {
                setUser(u);
                closeAuth();
              }}
            />
            <button
              type="button"
              onClick={closeAuth}
              aria-label="Cerrar"
              className="absolute top-4 right-4 size-9 flex items-center justify-center rounded-full border border-rule text-ink hover:bg-paper"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
