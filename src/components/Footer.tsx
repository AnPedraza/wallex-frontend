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
  { label: 'Comparador Lado a Lado', href: '#comparar' },
];

export const Footer: React.FC<FooterProps> = ({ links = defaultLinks }) => {
  return (
    <footer className="bg-[#2B1B17] text-[#EAE4DC]">
      <div className="max-w-7xl mx-auto px-6 py-10 grid gap-8 md:grid-cols-3">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <img src={logo} alt="" className="h-10 w-10" />
            <span className="text-xl font-bold text-white">Wallex</span>
          </div>
          <p className="text-sm text-[#EAE4DC]/80">
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
                  className="text-sm hover:text-white hover:underline rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D9A76A]"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div id="datos" className="space-y-2 scroll-mt-20">
          <h2 className="text-sm font-semibold text-white">Tus datos</h2>
          <p className="text-xs leading-relaxed text-[#EAE4DC]/80">
            El tratamiento de datos personales en Wallex se diseña conforme a la Ley 1581 de 2012.
            En esta versión de prueba tu correo y tu cuenta se guardan solo en tu navegador y no se
            envían a ningún servidor.
          </p>
        </div>
      </div>

      <div className="border-t border-white/10">
        <p className="max-w-7xl mx-auto px-6 py-4 text-xs text-[#EAE4DC]/70">
          Prototipo académico, Pontificia Universidad Javeriana · {new Date().getFullYear()}
        </p>
      </div>
    </footer>
  );
};
