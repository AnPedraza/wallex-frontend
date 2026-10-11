import { useEffect, useRef, useState, useMemo } from 'react';
import { AuthForm, SESSION_KEY } from './components/AuthForm';
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
  const [authOpen, setAuthOpen] = useState(false);
  const [currentHash, setCurrentHash] = useState(() => window.location.hash || '#buscar');
  const [comparisonIds, setComparisonIds] = useState<string[]>(['1', '3']); // Inicialmente 2 propiedades (Chapinero Alto vs Cedritos)
  const [contactingProperty, setContactingProperty] = useState<Property | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

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
      label: 'Comparador Lado a Lado',
      href: '#comparar',
      badge: comparisonIds.length,
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F5F0]">
      <Navbar
        user={user}
        onLogout={handleLogout}
        onLoginClick={() => setAuthOpen(true)}
        links={navLinks}
      />

      <main className="flex-1">
        {currentHash === '#comparar' ? (
          <PropertyComparer
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

      {/* Modal KYC unificado para contacto */}
      {contactingProperty && (
        <div
          onClick={(e) => e.target === e.currentTarget && setContactingProperty(null)}
          className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50"
        >
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-[#EAE4DC] space-y-5 relative">
            <button
              type="button"
              onClick={() => setContactingProperty(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 w-8 h-8 rounded-full flex items-center justify-center"
              aria-label="Cerrar"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-[#F8F5F0] text-[#2B1B17] rounded-full flex items-center justify-center mx-auto">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-[#2B1B17]">
                Verificación KYC para Contactar
              </h3>
              <p className="text-xs text-[#6E615A]">
                Para protegerte ante posibles fraudes y garantizar la seguridad del arrendador, Wallex valida tu identidad antes de compartir datos directos para{' '}
                <strong className="text-[#2B1B17]">{contactingProperty.title}</strong> ({contactingProperty.location}).
              </p>
            </div>

            <div className="space-y-3 bg-[#F8F5F0] p-4 rounded-2xl border border-[#EAE4DC] text-xs">
              <div className="flex items-center gap-2 text-[#2B1B17] font-semibold">
                <svg className="w-4 h-4 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <span>Cédula de Ciudadanía cargada</span>
              </div>
              <div className="flex items-center gap-2 text-[#2B1B17] font-semibold">
                <svg className="w-4 h-4 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <span>Verificación biométrica facial</span>
              </div>
              <div className="flex items-center gap-2 text-[#2B1B17] font-semibold">
                <svg className="w-4 h-4 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <span>Autorización Habeas Data (Ley 1581 de 2012)</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                alert(`¡Verificación KYC aprobada! Los datos de contacto directo de ${contactingProperty.ownerName} han sido enviados a tu correo registrado.`);
                setContactingProperty(null);
              }}
              className="w-full bg-[#2B1B17] text-white font-bold py-3 rounded-xl hover:bg-[#4A3E39] transition-colors text-sm shadow-md"
            >
              Completar y Contactar Arrendador
            </button>
          </div>
        </div>
      )}

      {/* Modal Auth */}
      {authOpen && (
        <div
          onClick={(e) => e.target === e.currentTarget && closeAuth()}
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
        >
          <div
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            aria-label="Ingresar o crear cuenta"
            className="relative w-full max-w-md"
          >
            <AuthForm
              onSuccess={(u) => {
                setUser(u);
                closeAuth();
              }}
            />
            <button
              type="button"
              onClick={closeAuth}
              aria-label="Cerrar"
              className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center rounded-full text-[#6E615A] hover:bg-[#EAE4DC] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2B1B17]"
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
