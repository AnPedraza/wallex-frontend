import React, { useEffect, useRef, useState } from 'react';
import { VerificationStamp } from '../components/FolioSeal';
import { sampleFolio } from '../data/folio';
import { DEMO, cop, num, totalOf, transportOf } from './data';
import { easeInOut, followScroll, sceneProgress, segment, useInView } from './scroll';

type Slot = 'photo' | 'title' | 'total' | 'req' | 'seal';
const SLOTS: Slot[] = ['photo', 'title', 'total', 'req', 'seal'];

interface Fragment {
  kind: 'them' | 'me' | 'tag' | 'post';
  text: string;
  source?: string;
  x: number; // posición inicial en % del escenario
  y: number;
  r: number; // giro inicial en grados
  to: Slot; // parte de la ficha que lo responde
  depth: number; // 0..1, qué tanto sube antes de volar (sensación de profundidad)
}

// Mensajes de ejemplo de una búsqueda de arriendo, basados en las entrevistas del One-Pager
const FRAGMENTS: Fragment[] = [
  { kind: 'them', text: 'Precio por interno', source: 'Grupo de arriendos en Facebook', x: 6, y: 50, r: -4, to: 'total', depth: 0.9 },
  { kind: 'me', text: '¿La administración está incluida?', x: 25, y: 64, r: 3, to: 'total', depth: 0.5 },
  { kind: 'them', text: 'Consigna $500.000 para separarlo y te lo guardo', source: 'Marketplace', x: 5, y: 76, r: 2, to: 'seal', depth: 1 },
  { kind: 'them', text: 'Piden codeudor con finca raíz', x: 31, y: 86, r: -3, to: 'req', depth: 0.6 },
  { kind: 'tag', text: 'Ingresos de 3 veces el canon', x: 58, y: 13, r: 5, to: 'req', depth: 0.35 },
  { kind: 'post', text: 'Misma foto, otro precio', x: 80, y: 66, r: -6, to: 'photo', depth: 0.8 },
  { kind: 'me', text: '¿Aún está disponible?', x: 83, y: 22, r: 4, to: 'title', depth: 0.45 },
  { kind: 'tag', text: 'Publicado en 4 grupos de WhatsApp', x: 40, y: 7, r: -2, to: 'title', depth: 0.25 },
  { kind: 'tag', text: '¿Y quién es el dueño?', x: 55, y: 88, r: 2, to: 'seal', depth: 0.7 },
];

const FragmentCard: React.FC<{ f: Fragment }> = ({ f }) => {
  if (f.kind === 'post') {
    return (
      <div className="bg-surface text-ink rounded-lg w-[200px] overflow-hidden">
        <img src={DEMO.image} alt="" className="block w-full h-[100px] object-cover" />
        <p className="px-3 py-2 text-[13px] leading-snug">
          <s className="text-ink-faint">{cop(1_300_000)}</s> {cop(DEMO.price)}
          <br />
          {f.text}
        </p>
      </div>
    );
  }
  if (f.kind === 'tag') {
    return (
      <span className="inline-block border border-night-text/45 text-night-text rounded-full px-3.5 py-1.5 text-[13px] whitespace-nowrap">
        {f.text}
      </span>
    );
  }
  const mine = f.kind === 'me';
  return (
    <div
      className={`max-w-[270px] px-3.5 py-2.5 text-[15px] leading-snug text-ink ${
        mine ? 'bg-night-text rounded-[14px_14px_4px_14px]' : 'bg-surface rounded-[14px_14px_14px_4px]'
      }`}
    >
      {f.text}
      {f.source && <span className="block mt-1 text-[12.5px] text-ink-faint">{f.source}</span>}
    </div>
  );
};

// La ficha donde cae cada mensaje; las partes se encienden a medida que llegan sus respuestas
const ChaosFicha: React.FC<{ lit: (s: Slot) => boolean; rowRef?: (s: Slot) => (el: HTMLDivElement | null) => void; stagger?: boolean }> = ({
  lit,
  rowRef,
  stagger = false,
}) => {
  const p = DEMO;
  const row = (s: Slot, i: number, className: string, children: React.ReactNode) => (
    <div
      ref={rowRef?.(s)}
      className={`${className} transition-opacity duration-500 ${lit(s) ? 'opacity-100' : 'opacity-[0.12]'}`}
      style={stagger ? { transitionDelay: `${i * 220}ms` } : undefined}
    >
      {children}
    </div>
  );

  return (
    <article className="bg-surface text-ink rounded-[10px] w-full max-w-[400px] overflow-hidden" aria-label={`Ficha de ejemplo: ${p.title}`}>
      {row('photo', 0, '', <img src={p.image} alt="" className="block w-full aspect-[16/8] object-cover" />)}
      {row(
        'title',
        1,
        'px-5 pt-4 pb-3',
        <>
          <h3 className="text-[17px] font-bold tracking-[-0.01em]">{p.title}</h3>
          <p className="text-[13px] text-ink-soft mt-0.5">
            {p.area} m², {p.bedrooms} habitación, disponible
          </p>
        </>
      )}
      {row(
        'total',
        2,
        'px-5 py-3 border-t border-rule',
        <>
          <p className="flex items-baseline gap-1.5">
            <strong className="text-[28px] font-extrabold tracking-[-0.02em] leading-none">{cop(totalOf(p))}</strong>
            <span className="text-[13px] text-ink-soft">al mes</span>
          </p>
          <p className="mt-1.5 text-[12.5px] text-ink-soft">
            Canon {num(p.price)} + admin {num(p.adminFee)} + transporte {num(transportOf(p))}
          </p>
        </>
      )}
      {row(
        'req',
        3,
        'px-5 py-3 border-t border-rule',
        <dl className="grid grid-cols-2 gap-x-4 text-[13px]">
          <div>
            <dt className="text-ink-soft text-[12.5px]">Codeudor</dt>
            <dd className="font-semibold">{p.requirements.guarantorRequired ? 'Te lo piden' : 'No te lo piden'}</dd>
          </div>
          <div>
            <dt className="text-ink-soft text-[12.5px]">Ingresos</dt>
            <dd className="font-semibold">{p.requirements.minIncomeMultiplier} veces el canon</dd>
          </div>
        </dl>
      )}
      {row(
        'seal',
        4,
        'px-5 py-3 border-t border-rule',
        <>
          <VerificationStamp key={lit('seal') ? 1 : 0} seed={p.id} status="verified" folio={sampleFolio(p.id, p.title, p.zone)} />
          <p className="mt-2 text-[12.5px] text-ink-soft">Nunca consignes dinero antes de ver el inmueble.</p>
        </>
      )}
    </article>
  );
};

const copyA = (
  <>
    <h2 className="text-[2rem] lg:text-[3.25rem] leading-[1.08] font-extrabold tracking-[-0.03em] text-white">Hoy buscar arriendo se ve así.</h2>
    <p className="mt-4 text-[17px] text-night-text max-w-[44ch]">
      Buscas en Facebook, Marketplace y grupos de WhatsApp a la vez, y en ninguno te dicen todo.
    </p>
  </>
);

const copyB = (
  <>
    <h2 className="text-[2rem] lg:text-[3.25rem] leading-[1.08] font-extrabold tracking-[-0.03em] text-white">En Wallex cada respuesta tiene su lugar.</h2>
    <p className="mt-4 text-[17px] text-night-text max-w-[44ch]">
      El precio con todo incluido, lo que te piden y quién publica, siempre en la misma ficha.
    </p>
  </>
);

// Escritorio: los mensajes flotan y, con el scroll, cada uno vuela a la parte de la ficha que lo responde
export const ChaosPinned: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const fragRefs = useRef<(HTMLLIElement | null)[]>([]);
  const rowRefs = useRef<Partial<Record<Slot, HTMLDivElement | null>>>({});
  const aRef = useRef<HTMLDivElement>(null);
  const bRef = useRef<HTMLDivElement>(null);
  const [mask, setMask] = useState(0);

  useEffect(() => {
    let last = -1;
    const render = (p: number) => {
      const stage = stageRef.current;
      if (!stage) return;
      const sr = stage.getBoundingClientRect();

      let next = 0;
      FRAGMENTS.forEach((f, i) => {
        const el = fragRefs.current[i];
        const target = rowRefs.current[f.to];
        if (!el || !target) return;
        const tr = target.getBoundingClientRect();
        const sx = (f.x / 100) * sr.width;
        // Antes de volar, cada mensaje sube a su propio ritmo: los "cercanos" más rápido que los lejanos
        const sy = (f.y / 100) * sr.height - segment(p, 0, 0.4) * f.depth * 90;
        const tx = tr.left - sr.left + 20;
        const ty = tr.top - sr.top + tr.height / 2 - el.offsetHeight / 2;
        const t = segment(p, 0.12 + i * 0.04, 0.56 + i * 0.04);
        const e = easeInOut(t);
        el.style.transform = `translate3d(${sx + (tx - sx) * e}px, ${sy + (ty - sy) * e}px, 0) rotate(${f.r * (1 - e)}deg) scale(${1 - 0.32 * e})`;
        el.style.opacity = String(1 - easeInOut(segment(t, 0.6, 1)));
        if (t >= 0.97) next |= 1 << SLOTS.indexOf(f.to);
      });

      // Un titular se va antes de que llegue el otro, sin encimarse
      const a = easeInOut(segment(p, 0.42, 0.52));
      const b = easeInOut(segment(p, 0.56, 0.68));
      if (aRef.current) {
        aRef.current.style.opacity = String(1 - a);
        aRef.current.style.transform = `translateY(${-a * 16}px)`;
      }
      if (bRef.current) {
        bRef.current.style.opacity = String(b);
        bRef.current.style.transform = `translateY(${(1 - b) * 16}px)`;
      }
      if (next !== last) {
        last = next;
        setMask(next);
      }
    };
    return followScroll(
      () => (sectionRef.current && stageRef.current ? sceneProgress(sectionRef.current, stageRef.current, 64) : 0),
      render
    );
  }, []);

  const lit = (s: Slot) => (mask & (1 << SLOTS.indexOf(s))) !== 0;
  const rowRef = (s: Slot) => (el: HTMLDivElement | null) => {
    rowRefs.current[s] = el;
  };

  return (
    <section ref={sectionRef} className="relative h-[240vh] bg-night">
      <div ref={stageRef} className="sticky top-16 h-[calc(100vh-4rem)] overflow-hidden max-w-[1440px] mx-auto">
        <div className="absolute left-10 top-[9%] max-w-[480px] z-10">
          <div ref={aRef}>{copyA}</div>
          <div ref={bRef} className="absolute inset-x-0 top-0" style={{ opacity: 0 }}>
            {copyB}
          </div>
        </div>
        <div className="absolute left-[54%] top-1/2 -translate-y-1/2 w-[400px]">
          <ChaosFicha lit={lit} rowRef={rowRef} />
        </div>
        <ul aria-label="Mensajes de una búsqueda de arriendo">
          {FRAGMENTS.map((f, i) => (
            <li
              key={f.text}
              ref={(el) => {
                fragRefs.current[i] = el;
              }}
              className="absolute left-0 top-0 z-20 will-change-transform"
            >
              <div className="drift" style={{ animationDelay: `${-i * 0.7}s` }}>
                <FragmentCard f={f} />
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
};

// Celular o movimiento reducido: primero el desorden, debajo la ficha que se enciende parte por parte
export const ChaosStacked: React.FC<{ still: boolean }> = ({ still }) => {
  const [ref, seen] = useInView<HTMLDivElement>(0.35);
  const on = still || seen;

  return (
    <section className="bg-night">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 py-16 lg:py-24 grid gap-16 lg:grid-cols-2 lg:items-start">
        <div>
          {copyA}
          {/* En celular los mensajes quedan como un chat revuelto: lo tuyo a la derecha, lo de ellos a la izquierda */}
          <ul className="mt-8 flex flex-col gap-2.5 max-w-[520px]" aria-label="Mensajes de una búsqueda de arriendo">
            {FRAGMENTS.map((f, i) => (
              <li
                key={f.text}
                className={f.kind === 'me' || f.kind === 'post' ? 'self-end' : f.kind === 'tag' ? 'self-center' : 'self-start'}
                style={{ transform: `rotate(${f.r * 0.5}deg)` }}
              >
                <div className={still ? '' : 'drift'} style={{ animationDelay: `${-i * 0.7}s` }}>
                  <FragmentCard f={f} />
                </div>
              </li>
            ))}
          </ul>
        </div>
        <div>
          {copyB}
          <div ref={ref} className="mt-8">
            <ChaosFicha lit={() => on} stagger={!still} />
          </div>
        </div>
      </div>
    </section>
  );
};
