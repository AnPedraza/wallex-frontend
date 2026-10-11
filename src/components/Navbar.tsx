import React, { useEffect, useState } from 'react';
import logo from '../assets/wallex-logo.png';

interface NavLink {
  label: string;
  href: string;
}

interface NavbarProps {
  user?: { email: string } | null;
  onLogout?: () => void;
  onLoginClick?: () => void;
  links?: NavLink[];
}

// Solo secciones que existen hoy en la app. Cuando haya más, se pasan por props.
const defaultLinks: NavLink[] = [{ label: 'Buscar vivienda', href: '#buscar' }];

const focusRing =
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2B1B17] focus-visible:ring-offset-2 focus-visible:ring-offset-[#F8F5F0]';

export const Navbar: React.FC<NavbarProps> = ({
  user = null,
  onLogout,
  onLoginClick,
  links = defaultLinks,
}) => {
  const [hash, setHash] = useState(() => window.location.hash);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onHashChange = () => setHash(window.location.hash);
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const onKeyDown = (e: KeyboardEvent) => e.key === 'Escape' && setMenuOpen(false);
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [menuOpen]);

  // Sin hash (o en el inicio) la sección activa es la primera
  const activeHref = links.find((l) => l.href === hash)?.href ?? (hash ? undefined : links[0]?.href);

  const linkClass = (href: string) =>
    `px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${focusRing} ${
      href === activeHref
        ? 'bg-[#2B1B17] text-white'
        : 'text-[#4A3E39] hover:bg-[#EAE4DC]'
    }`;

  const handleLogin = () => {
    setMenuOpen(false);
    onLoginClick?.();
  };

  const handleLogout = () => {
    setMenuOpen(false);
    onLogout?.();
  };

  return (
    <header className="sticky top-0 z-40 bg-[#F8F5F0]/95 backdrop-blur border-b border-[#EAE4DC] text-[#2B1B17]">
      <nav aria-label="Principal" className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
        <a href="#" className={`flex items-center gap-2 rounded-lg ${focusRing}`}>
          <img src={logo} alt="" className="h-10 w-10" />
          <span className="text-xl font-bold tracking-tight">Wallex</span>
        </a>

        {/* Escritorio */}
        <div className="hidden md:flex items-center gap-6">
          <ul className="flex items-center gap-1">
            {links.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  aria-current={link.href === activeHref ? 'page' : undefined}
                  className={linkClass(link.href)}
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>

          {user ? (
            <div className="flex items-center gap-3">
              <span className="text-sm text-[#6E615A] max-w-[16rem] truncate" title={user.email}>
                {user.email}
              </span>
              <button
                type="button"
                onClick={handleLogout}
                className={`px-4 py-2 rounded-xl text-sm font-semibold border border-[#EAE4DC] bg-white hover:bg-[#EAE4DC] transition-colors ${focusRing}`}
              >
                Salir
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleLogin}
              className={`px-4 py-2 rounded-xl text-sm font-semibold bg-[#2B1B17] text-white hover:bg-[#4A3E39] transition-colors ${focusRing}`}
            >
              Ingresar / Crear cuenta
            </button>
          )}
        </div>

        {/* Celular */}
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          aria-expanded={menuOpen}
          aria-controls="menu-movil"
          aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
          className={`md:hidden w-11 h-11 flex items-center justify-center rounded-xl hover:bg-[#EAE4DC] ${focusRing}`}
        >
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            {menuOpen ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
          </svg>
        </button>
      </nav>

      {menuOpen && (
        <div id="menu-movil" className="md:hidden border-t border-[#EAE4DC] bg-[#F8F5F0] px-6 py-4 space-y-4">
          <ul className="space-y-1">
            {links.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  aria-current={link.href === activeHref ? 'page' : undefined}
                  className={`block ${linkClass(link.href)} py-3`}
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>

          <div className="border-t border-[#EAE4DC] pt-4">
            {user ? (
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-[#6E615A] truncate" title={user.email}>
                  {user.email}
                </span>
                <button
                  type="button"
                  onClick={handleLogout}
                  className={`shrink-0 px-4 py-2 rounded-xl text-sm font-semibold border border-[#EAE4DC] bg-white hover:bg-[#EAE4DC] ${focusRing}`}
                >
                  Salir
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleLogin}
                className={`w-full py-3 rounded-xl text-sm font-semibold bg-[#2B1B17] text-white hover:bg-[#4A3E39] ${focusRing}`}
              >
                Ingresar / Crear cuenta
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
