import React from 'react';
import logo from '../assets/wallex-logo.png';

interface FooterLink {
  label: string;
  href: string;
}

interface FooterProps {
  links?: FooterLink[];
}

const defaultLinks: FooterLink[] = [
  { label: 'Buscar vivienda', href: '#buscar' },
  { label: 'Comparador lado a lado', href: '#comparar' },
];

export const Footer: React.FC<FooterProps> = ({ links = defaultLinks }) => {
  return (
    <footer className="bg-night text-night-text">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 py-10 grid gap-8 md:grid-cols-[1.2fr_1fr_1.4fr]">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <img src={logo} alt="" className="h-10 w-10" />
            <span className="text-[21px] font-extrabold tracking-[-0.02em] text-white">Wallex</span>
          </div>
          <p className="text-sm max-w-xs">
            Vivienda en Bogotá con datos completos y quien publica, verificado.
          </p>
        </div>

        <nav aria-label="Pie de página">
          <h2 className="text-sm font-semibold text-white mb-3">Secciones</h2>
          <ul className="space-y-2">
            {links.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className="text-sm hover:text-white hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div id="datos" className="space-y-2 scroll-mt-20">
          <h2 className="text-sm font-semibold text-white">Tus datos</h2>
          <p className="text-[13px] leading-relaxed max-w-md">
            El tratamiento de datos personales en Wallex se diseña conforme a la Ley 1581 de 2012.
            En esta versión de prueba tu correo y tu cuenta se guardan solo en tu navegador y no se
            envían a ningún servidor.
          </p>
        </div>
      </div>

      <div className="border-t border-white/10">
        <p className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 py-4 text-xs text-night-faint">
          Prototipo académico, Pontificia Universidad Javeriana · {new Date().getFullYear()}
        </p>
      </div>
    </footer>
  );
};
