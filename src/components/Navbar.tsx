import React, { useEffect, useState } from 'react';
import logo from '../assets/wallex-logo.png';

export interface NavLink {
  label: string;
  href: string;
  badge?: number;
}

interface NavbarProps {
  user?: { email: string } | null;
  onLogout?: () => void;
  onLoginClick?: () => void;
  links?: NavLink[];
}

// Secciones de la app
const defaultLinks: NavLink[] = [
  { label: 'Buscar vivienda', href: '#buscar' },
  { label: 'Comparador Lado a Lado', href: '#comparar' },
];

const focusRing = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink';

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

  // Pestaña activa: subrayado verde de verificación, como el sello del folio
  const linkClass = (href: string) =>
    `relative flex items-center gap-2 px-1 py-[22px] text-[15px] whitespace-nowrap transition-colors ${focusRing} ${
      href === activeHref
        ? 'text-ink font-semibold after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-verified'
        : 'text-ink-soft hover:text-ink'
    }`;
  const mobileLinkClass = (href: string) =>
    `flex items-center justify-between rounded-lg px-3 py-3 text-[15px] ${focusRing} ${
      href === activeHref ? 'bg-paper text-ink font-semibold' : 'text-ink-soft hover:bg-paper'
    }`;
  const badgeClass = 'min-w-5 rounded-full bg-ink px-1.5 text-center text-xs font-semibold leading-5 text-white';

  const handleLogin = () => {
    setMenuOpen(false);
    onLoginClick?.();
  };

  const handleLogout = () => {
    setMenuOpen(false);
    onLogout?.();
  };

  return (
    <header className="sticky top-0 z-40 bg-surface border-b border-rule text-ink">
      <nav aria-label="Principal" className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 h-[68px] flex items-center justify-between gap-6">
        <a href="#buscar" className={`flex items-center gap-2 rounded-lg ${focusRing}`}>
          <img src={logo} alt="" className="h-10 w-10" />
          <span className="text-[21px] font-extrabold tracking-[-0.02em]">Wallex</span>
        </a>

        {/* Escritorio */}
        <div className="hidden lg:flex flex-1 items-center gap-8 pl-6">
          <ul className="flex items-center gap-7">
            {links.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  aria-current={link.href === activeHref ? 'page' : undefined}
                  className={linkClass(link.href)}
                >
                  <span>{link.label}</span>
                  {link.badge !== undefined && link.badge > 0 && <span className={badgeClass}>{link.badge}</span>}
                </a>
              </li>
            ))}
          </ul>

          {user ? (
            <div className="ml-auto flex items-center gap-3">
              <span className="text-sm text-ink-soft max-w-[16rem] truncate" title={user.email}>
                {user.email}
              </span>
              <button
                type="button"
                onClick={handleLogout}
                className={`px-4 py-2 rounded-lg text-sm font-semibold border border-control hover:bg-paper transition-colors ${focusRing}`}
              >
                Salir
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleLogin}
              className={`ml-auto px-[18px] py-2.5 rounded-lg text-sm font-semibold bg-ink text-white hover:bg-ink-hover transition-colors ${focusRing}`}
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
          className={`lg:hidden size-11 flex items-center justify-center rounded-lg hover:bg-paper ${focusRing}`}
        >
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            {menuOpen ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
          </svg>
        </button>
      </nav>

      {menuOpen && (
        <div id="menu-movil" className="lg:hidden border-t border-rule bg-surface px-4 sm:px-6 py-4 space-y-4">
          <ul className="space-y-1">
            {links.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  aria-current={link.href === activeHref ? 'page' : undefined}
                  className={mobileLinkClass(link.href)}
                >
                  <span>{link.label}</span>
                  {link.badge !== undefined && link.badge > 0 && <span className={badgeClass}>{link.badge}</span>}
                </a>
              </li>
            ))}
          </ul>

          <div className="border-t border-rule pt-4">
            {user ? (
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-ink-soft truncate" title={user.email}>
                  {user.email}
                </span>
                <button
                  type="button"
                  onClick={handleLogout}
                  className={`shrink-0 px-4 py-2 rounded-lg text-sm font-semibold border border-control hover:bg-paper ${focusRing}`}
                >
                  Salir
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleLogin}
                className={`w-full py-3 rounded-lg text-sm font-semibold bg-ink text-white hover:bg-ink-hover ${focusRing}`}
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
