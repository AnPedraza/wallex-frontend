import React from 'react';
import { VerificationStamp } from '../components/FolioSeal';
import { sampleFolio } from '../data/folio';
import { DEMO, cop, num, totalOf, transportOf } from './data';
import { easeOut } from './scroll';

export type FichaPart = 'total' | 'req' | 'seal';

interface FichaDemoProps {
  active?: FichaPart | null; // parte iluminada; el resto se atenúa
  totalProgress?: number; // 0..1: la cuenta del total se va sumando
  reqProgress?: number; // 0..1: los requisitos aparecen fila por fila
  sealKey?: number; // cambiarlo vuelve a imprimir la roseta
  leader?: boolean; // línea de referencia desde la parte activa hacia la izquierda
  marks?: readonly string[]; // rótulos numerados junto a cada parte, como en un plano
  only?: FichaPart; // muestra solo esa parte (recorte para celular)
  href?: string; // si llega, la ficha entera abre ese inmueble en la app
  entrance?: boolean; // secuencia de entrada del inicio: la hoja sube, la foto se abre y los rótulos llegan al final
}

const delay = (ms: number) => ({ ['--delay' as string]: `${ms}ms` }) as React.CSSProperties;

// La ficha real de un inmueble del prototipo, con las mismas partes y el mismo orden que en la app
export const FichaDemo: React.FC<FichaDemoProps> = ({
  active = null,
  totalProgress = 1,
  reqProgress = 1,
  sealKey = 0,
  leader = false,
  marks,
  only,
  href,
  entrance = false,
}) => {
  const p = DEMO;
  const total = totalOf(p);
  const transport = transportOf(p);
  const t = easeOut(totalProgress);
  const shown = Math.round(total * t);
  const terms = [
    { label: 'Canon', value: p.price, className: 'bg-ink' },
    { label: 'Administración', value: p.adminFee, className: 'bg-ink-soft' },
    { label: 'Transporte estimado', value: transport, className: 'bg-control' },
  ];
  const reqs = [
    { label: 'Codeudor', value: p.requirements.guarantorRequired ? 'Te lo piden' : 'No te lo piden' },
    { label: 'Ingresos', value: `${p.requirements.minIncomeMultiplier} veces el canon` },
    { label: 'Depósito', value: cop(p.deposit) },
    { label: 'Mascotas', value: p.requirements.petsAllowed ? 'Sí' : 'No' },
  ];

  const partClass = (part: FichaPart) =>
    `relative transition-[opacity,background-color] duration-500 ${
      active === null ? '' : active === part ? 'opacity-100 bg-paper' : 'opacity-30'
    }`;

  const leaderFor = (part: FichaPart) =>
    leader && active === part ? (
      <span aria-hidden="true" className="absolute top-1/2 right-full flex items-center -translate-y-1/2">
        <span className="lead-grow block h-px w-[120px] bg-ink origin-right" />
        <span className="block size-2 rounded-full bg-ink -ml-1" />
      </span>
    ) : null;

  // En escritorio la marca sale por la derecha de la ficha; en celular queda dentro, en la esquina
  const markFor = (n: number) =>
    marks ? (
      <span aria-hidden="true" className="absolute top-4 right-4 lg:right-auto lg:left-full flex items-center">
        <span className="lead-grow hidden lg:block h-px w-10 bg-ink origin-left" style={{ animationDelay: `${(entrance ? 1050 : 300) + n * 170}ms` }} />
        <span
          className={`grid place-items-center size-6 rounded-full border border-ink bg-surface text-[12.5px] font-bold ${entrance ? 'enter-pop' : ''}`}
          style={delay(1050 + n * 170 + 200)}
        >
          {n}
        </span>
        <span className={`hidden lg:block ml-2 text-[13px] font-semibold whitespace-nowrap ${entrance ? 'enter-up' : ''}`} style={delay(1050 + n * 170 + 260)}>
          {marks[n - 1]}
        </span>
      </span>
    ) : null;

  const show = (part: FichaPart) => !only || only === part;
  const ruled = only ? '' : 'border-t border-rule';

  const sheet = (
    <article
      className={`bg-surface border rounded-[10px] w-full max-w-[420px] transition-colors duration-300 ${
        href ? 'border-rule group-hover:border-ink group-focus-visible:border-ink' : 'border-rule'
      } ${entrance ? 'enter-up' : ''}`}
      style={entrance ? delay(180) : undefined}
      aria-label={only || href ? undefined : `Ficha de ejemplo: ${p.title}`}
    >
      {!only && (
        <>
          <div className={`aspect-[16/10] overflow-hidden rounded-t-[10px] bg-rule ${entrance ? 'enter-photo' : ''}`} style={entrance ? delay(320) : undefined}>
            <img
              src={p.image}
              alt=""
              className={`size-full object-cover ${href ? 'transition-transform duration-[900ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.04]' : ''}`}
            />
          </div>
          <div className="px-5 pt-4">
            <h3 className="text-[17px] font-bold tracking-[-0.01em]">{p.title}</h3>
            <p className="text-[13px] text-ink-soft mt-1">
              {p.area} m² · {p.bedrooms} hab · {p.bathrooms} baño · {p.location.replace(', Bogotá', '')}
            </p>
          </div>
        </>
      )}

      {show('total') && (
      <div className={`${partClass('total')} px-5 py-4 ${only ? 'rounded-[10px]' : 'mt-2'}`}>
        {leaderFor('total')}
        {markFor(1)}
        <p className="flex items-baseline gap-1.5">
          <strong className="text-[28px] font-extrabold tracking-[-0.02em] leading-none">{cop(shown)}</strong>
          <span className="text-[13px] text-ink-soft">al mes</span>
        </p>
        <div className="mt-3 h-2.5 bg-rule/60 rounded-[2px] overflow-hidden flex gap-px" aria-hidden="true">
          {terms.map((term) => (
            <span key={term.label} className={term.className} style={{ width: `${(term.value / total) * 100 * t}%` }} />
          ))}
        </div>
        <dl className="mt-2.5 text-[12.5px] space-y-0.5">
          {terms.map((term, i) => (
            <div key={term.label} className="flex justify-between transition-opacity duration-300" style={{ opacity: totalProgress > i * 0.22 ? 1 : 0.15 }}>
              <dt className="text-ink-soft flex items-center gap-1.5">
                <span className={`size-2 rounded-[2px] ${term.className}`} aria-hidden="true" />
                {term.label}
              </dt>
              <dd className="font-semibold">{num(term.value)}</dd>
            </div>
          ))}
        </dl>
      </div>
      )}

      {show('req') && (
      <div className={`${partClass('req')} px-5 py-4 ${ruled}`}>
        {leaderFor('req')}
        {markFor(2)}
        <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[13px]">
          {reqs.map((r, i) => (
            <div key={r.label} className="transition-[opacity,transform] duration-500" style={{ opacity: reqProgress > i * 0.2 ? 1 : 0.12, transform: reqProgress > i * 0.2 ? 'none' : 'translateY(4px)' }}>
              <dt className="text-ink-soft text-[12.5px]">{r.label}</dt>
              <dd className="font-semibold">{r.value}</dd>
            </div>
          ))}
        </dl>
      </div>
      )}

      {show('seal') && (
      <div className={`${partClass('seal')} px-5 py-3 ${ruled} ${only ? 'rounded-[10px]' : 'rounded-b-[10px]'}`}>
        {leaderFor('seal')}
        {markFor(3)}
        <VerificationStamp key={sealKey} seed={p.id} status="verified" folio={sampleFolio(p.id, p.title, p.zone)} />
      </div>
      )}

      {href && (
        <p className="px-5 py-3 border-t border-rule text-[13px] font-semibold">
          <span className="link-grow">Abrir esta ficha en la app</span>
        </p>
      )}
    </article>
  );

  if (!href) return sheet;
  return (
    <a
      href={href}
      className="ficha-link group block w-full max-w-[420px] rounded-[10px] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink"
      aria-label={`Abrir en la app la ficha de ${p.title}`}
    >
      {sheet}
    </a>
  );
};
