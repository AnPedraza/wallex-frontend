import { useEffect, useRef, useState } from 'react';
import { AuthForm, SESSION_KEY } from './components/AuthForm';
import { Footer } from './components/Footer';
import { Navbar } from './components/Navbar';
import { PropertyPortal } from './components/PropertyPortal';

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
  const modalRef = useRef<HTMLDivElement>(null);

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

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F5F0]">
      <Navbar user={user} onLogout={handleLogout} onLoginClick={() => setAuthOpen(true)} />

      <div id="buscar" className="flex-1 scroll-mt-16">
        <PropertyPortal />
      </div>

      <Footer />

      {authOpen && (
        <div
          onClick={(e) => e.target === e.currentTarget && closeAuth()}
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
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
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
