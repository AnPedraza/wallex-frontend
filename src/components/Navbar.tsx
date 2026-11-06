import React, { useEffect, useState } from 'react';
import logo from '../assets/wallex-logo.png';
import { BookmarkIcon } from './BookmarkIcon';

export interface NavLink {
  label: string;
  href: string;
  badge?: number;
}

interface NavbarProps {
  user?: { email: string; nombre?: string } | null;
  onLogout?: () => void;
  onLoginClick?: () => void;
  links?: NavLink[];
  // Guardados: va junto a la cuenta, con el marcador y cuántos hay (si no llega, no se muestra)
  saved?: { href: string; count: number };
  // Mi cuenta: con sesión, el nombre lleva ahí (si no llega, el nombre es solo texto)
  accountHref?: string;
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
  saved,
  accountHref,
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
  const hrefs = [...links.map((l) => l.href), ...(saved ? [saved.href] : []), ...(accountHref ? [accountHref] : [])];
  const activeHref = hrefs.find((href) => href === hash) ?? (hash ? undefined : links[0]?.href);
  const savedActive = saved !== undefined && saved.href === activeHref;
  const accountActive = accountHref !== undefined && accountHref === activeHref;

  // El nombre de la persona: enlace a Mi cuenta, o texto si no hay esa vista
  const accountName = (className: string) =>
    user &&
    (accountHref ? (
      <a
        href={accountHref}
        onClick={() => setMenuOpen(false)}
        aria-current={accountActive ? 'page' : undefined}
        title={`Mi cuenta (${user.email})`}
        className={`${className} truncate rounded ${focusRing} ${accountActive ? 'text-ink font-semibold' : 'text-ink-soft hover:text-ink hover:underline'}`}
      >
        {user.nombre || user.email}
      </a>
    ) : (
      <span className={`${className} truncate text-ink-soft`} title={user.email}>
        {user.nombre || user.email}
      </span>
    ));

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
  const savedBadge = saved && saved.count > 0 && <span className={badgeClass}>{saved.count}</span>;

  // En escritorio dice "Guardados" desde 1280 px; entre 1024 y 1279 queda solo el marcador
  const savedLink = saved && (
    <a href={saved.href} aria-current={savedActive ? 'page' : undefined} className={linkClass(saved.href)}>
      <BookmarkIcon className="size-[18px]" />
      <span className="sr-only xl:not-sr-only">Guardados</span>
      {savedBadge}
    </a>
  );

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
        {/* min-w-0: si no cabe todo, se recorta el nombre y no se desborda la barra */}
        <div className="hidden lg:flex flex-1 min-w-0 items-center gap-8 pl-6">
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

          <div className="ml-auto min-w-0 flex items-center gap-6">
            {savedLink}
            {user ? (
              <div className="min-w-0 flex items-center gap-3">
                {accountName('text-sm max-w-[16rem]')}
                <button
                  type="button"
                  onClick={handleLogout}
                  className={`shrink-0 px-4 py-2 rounded-lg text-sm font-semibold border border-control hover:bg-paper transition-colors ${focusRing}`}
                >
                  Salir
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleLogin}
                className={`shrink-0 px-[18px] py-2.5 rounded-lg text-sm font-semibold bg-ink text-white hover:bg-ink-hover transition-colors ${focusRing}`}
              >
                Ingresar / Crear cuenta
              </button>
            )}
          </div>
        </div>

        {/* Celular: con sesión, el nombre queda a la vista; los guardados y el menú, al lado */}
        <div className="lg:hidden ml-auto min-w-0 flex items-center gap-1">
          {accountName('min-w-0 max-w-[10rem] text-[13px] mr-1')}
          {saved && (
            <a
              href={saved.href}
              aria-current={savedActive ? 'page' : undefined}
              className={`shrink-0 h-11 min-w-11 px-2 flex items-center justify-center gap-1 rounded-lg ${
                savedActive ? 'bg-paper text-ink' : 'text-ink-soft hover:bg-paper'
              } ${focusRing}`}
            >
              <BookmarkIcon className="size-[22px]" />
              <span className="sr-only">Guardados</span>
              {savedBadge}
            </a>
          )}
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-expanded={menuOpen}
            aria-controls="menu-movil"
            aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
            className={`shrink-0 size-11 flex items-center justify-center rounded-lg hover:bg-paper ${focusRing}`}
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              {menuOpen ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </button>
        </div>
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
                {accountName('text-sm')}
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
