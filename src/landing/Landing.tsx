import React from 'react';
import logo from '../assets/wallex-logo.png';
import shotDesktop from '../assets/landing/app-catalogo-escritorio.webp';
import shotPhone from '../assets/landing/app-catalogo-celular.webp';
import { Footer } from '../components/Footer';
import { ChaosPinned, ChaosStacked } from './ChaosScene';
import { CityPinned, CityStacked } from './CityScene';
import { COMPARE, cop, num, totalOf, transportOf } from './data';
import { FichaDemo, type FichaPart } from './FichaDemo';
import { LandingSearch } from './LandingSearch';
import { Microprint } from './Microprint';
import {
  easeOut,
  segment,
  useInView,
  useMediaQuery,
  useReducedMotion,
  useScrollProgress,
  useTimedProgress,
  useViewProgress,
} from './scroll';

const focusRing = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink';

const STEPS: { part: FichaPart; n: number; title: string; body: string }[] = [
  {
    part: 'total',
    n: 1,
    title: 'Total del mes',
    body: 'Canon, administración y transporte estimado, sumados en una sola cifra. Con esa cifra filtras y ordenas.',
  },
  {
    part: 'req',
    n: 2,
    title: 'Lo que te piden',
    body: 'Codeudor, ingresos, depósito y mascotas, a la vista antes de que escribas.',
  },
  {
    part: 'seal',
    n: 3,
    title: 'Quién publica',
    body: 'El sello dice si la identidad de quien publica y el certificado de tradición están verificados. En el prototipo esa verificación es simulada.',
  },
];

// Barra superior propia de la landing: solo marca y la salida a la app
const Header: React.FC = () => (
  <header className="sticky top-0 z-30 bg-paper border-b border-rule">
    <div className="max-w-[1440px] mx-auto h-16 px-4 sm:px-6 lg:px-10 flex items-center justify-between gap-4">
      <a href="/inicio/" className={`flex items-center gap-2 rounded-lg ${focusRing}`}>
        <img src={logo} alt="" className="h-10 w-10" />
        <span className="text-[21px] font-extrabold tracking-[-0.02em]">Wallex</span>
      </a>
      <nav aria-label="Landing" className="flex items-center gap-2 sm:gap-6">
        <a href="#anatomia" className={`hidden sm:inline text-[13px] font-semibold text-ink-soft hover:text-ink rounded ${focusRing}`}>
          Cómo funciona
        </a>
        <a
          href="/"
          className={`bg-ink text-white text-[13px] font-semibold px-4 py-2 rounded-lg hover:bg-ink-hover transition-colors ${focusRing}`}
        >
          Abrir la app
        </a>
      </nav>
    </div>
  </header>
);

const Hero: React.FC = () => (
  <section className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 pt-10 pb-16 lg:pt-14 lg:pb-24 grid gap-12 lg:grid-cols-[1fr_auto] lg:items-center">
    <div className="max-w-[640px]">
      <h1 className="text-[2.75rem] leading-[1.02] lg:text-[4.5rem] lg:leading-[0.98] font-extrabold tracking-[-0.035em] text-balance">
        Arrendar en Bogotá sin adivinar cuánto pagas ni de quién fiarte.
      </h1>
      <p className="mt-6 text-[17px] text-ink-soft max-w-[46ch]">
        Cada arriendo con la misma ficha: el total del mes, lo que te piden y quién publica, en el mismo orden.
      </p>
      <div className="mt-8">
        <LandingSearch />
      </div>
      <p className="mt-3 text-[12.5px] text-ink-faint">Prototipo académico: inmuebles de ejemplo y verificación simulada.</p>
    </div>

    <div className="lg:pr-40">
      <FichaDemo marks={STEPS.map((s) => s.title)} />
      <ol className="lg:hidden mt-4 grid gap-1.5 text-[13px] max-w-[420px]">
        {STEPS.map((s) => (
          <li key={s.n} className="flex gap-2">
            <span className="font-bold w-4">{s.n}</span>
            <span className="text-ink-soft">{s.title}</span>
          </li>
        ))}
      </ol>
    </div>
  </section>
);

// Escritorio: la ficha queda fija y el scroll recorre sus tres partes
const AnatomyPinned: React.FC = () => {
  const [ref, p] = useScrollProgress<HTMLElement>();
  const step = p < 0.36 ? 0 : p < 0.7 ? 1 : 2;
  const active = STEPS[step].part;

  return (
    <section ref={ref} id="anatomia" className="relative h-[230vh] border-t border-rule bg-surface">
      <div className="sticky top-16 h-[calc(100vh-4rem)] max-w-[1440px] mx-auto px-10 grid grid-cols-[minmax(0,480px)_420px] justify-center gap-x-[160px] items-center">
        <div>
          <h2 className="text-[3.25rem] leading-[1.02] font-extrabold tracking-[-0.03em] max-w-[14ch]">Una ficha, tres respuestas.</h2>
          <ol className="mt-12 space-y-8 max-w-[440px]">
            {STEPS.map((s, i) => (
              <li
                key={s.n}
                className="grid grid-cols-[2rem_1fr] gap-x-3 transition-opacity duration-500"
                style={{ opacity: i === step ? 1 : 0.28 }}
                aria-current={i === step ? 'step' : undefined}
              >
                <span
                  className={`grid place-items-center size-7 rounded-full border text-[13px] font-bold transition-colors duration-500 ${
                    i === step ? 'bg-ink border-ink text-white' : 'border-control'
                  }`}
                >
                  {s.n}
                </span>
                <div>
                  <h3 className="text-[17px] font-bold">{s.title}</h3>
                  <p className="mt-1 text-[15px] text-ink-soft">{s.body}</p>
                </div>
              </li>
            ))}
          </ol>
          {/* Riel de avance de la escena */}
          <div className="mt-12 h-[2px] max-w-[440px] bg-rule rounded-[2px] overflow-hidden" aria-hidden="true">
            <div className="h-full bg-ink origin-left" style={{ transform: `scaleX(${p})` }} />
          </div>
        </div>
        <FichaDemo
          active={active}
          leader
          totalProgress={segment(p, 0.04, 0.3)}
          reqProgress={segment(p, 0.38, 0.62)}
          sealKey={step === 2 ? 1 : 0}
        />
      </div>
    </section>
  );
};

// Celular (o sin animaciones): cada parte va sola y se revela al entrar
const AnatomyStep: React.FC<{ index: number; still: boolean }> = ({ index, still }) => {
  const [ref, seen] = useInView<HTMLLIElement>(0.4);
  const run = useTimedProgress(seen && !still, 1300);
  const t = still ? 1 : run;
  const s = STEPS[index];

  return (
    <li ref={ref} className="grid gap-4">
      <div className="grid grid-cols-[2rem_1fr] gap-x-3">
        <span className="grid place-items-center size-7 rounded-full bg-ink text-white text-[13px] font-bold">{s.n}</span>
        <div>
          <h3 className="text-[17px] font-bold">{s.title}</h3>
          <p className="mt-1 text-[15px] text-ink-soft">{s.body}</p>
        </div>
      </div>
      <FichaDemo only={s.part} totalProgress={t} reqProgress={t} sealKey={seen ? 1 : 0} />
    </li>
  );
};

const AnatomyStacked: React.FC<{ still: boolean }> = ({ still }) => (
  <section id="anatomia" className="border-t border-rule bg-surface">
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 py-16 lg:py-24">
      <h2 className="text-[2rem] lg:text-[3.25rem] leading-[1.02] font-extrabold tracking-[-0.03em]">Una ficha, tres respuestas.</h2>
      <ol className="mt-10 grid gap-12 max-w-[520px] lg:max-w-none lg:grid-cols-3 lg:gap-8 lg:items-start">
        {STEPS.map((s, i) => (
          <AnatomyStep key={s.n} index={i} still={still} />
        ))}
      </ol>
    </div>
  </section>
);

// Las tres opciones del comparador, medidas con la misma regla
const compareRows = COMPARE.map((p) => {
  const transport = transportOf(p);
  return { p, transport, total: totalOf(p) };
});
const scaleMax = Math.max(...compareRows.map((r) => r.total));
const cheapest = compareRows.reduce((a, b) => (b.total < a.total ? b : a));
const saving = scaleMax - cheapest.total;

const CompareCard: React.FC<{ row: (typeof compareRows)[number]; grow: number; marked: boolean }> = ({ row, grow, marked }) => {
  const { p, transport, total } = row;
  const parts = [
    { label: 'Canon', value: p.price, className: 'bg-ink' },
    { label: 'Administración', value: p.adminFee, className: 'bg-ink-soft' },
    { label: 'Transporte', value: transport, className: 'bg-control' },
  ];
  return (
    <article
      className={`bg-surface border rounded-[10px] p-5 transition-colors duration-500 ${marked ? 'border-ink' : 'border-rule'}`}
    >
      <h3 className="text-[17px] font-bold tracking-[-0.01em]">{p.title}</h3>
      <p className="text-[13px] text-ink-soft mt-0.5">
        {p.zone} · {p.area} m²
      </p>
      <p className="mt-5 flex items-baseline gap-1.5">
        <strong
          className="text-[28px] font-extrabold tracking-[-0.02em] leading-none transition-opacity duration-300"
          style={{ opacity: grow > 0 ? 1 : 0.2 }}
        >
          {cop(Math.round(total * easeOut(grow)))}
        </strong>
        <span className="text-[13px] text-ink-soft">al mes</span>
      </p>
      <div className="mt-3 h-2.5 rounded-[2px] bg-paper overflow-hidden" aria-hidden="true">
        <div className="h-full flex gap-px" style={{ width: `${(total / scaleMax) * 100 * easeOut(grow)}%` }}>
          {parts.map((part) => (
            <span key={part.label} className={part.className} style={{ width: `${(part.value / total) * 100}%` }} />
          ))}
        </div>
      </div>
      <dl className="mt-3 text-[12.5px] space-y-0.5">
        {parts.map((part) => (
          <div key={part.label} className="flex justify-between">
            <dt className="text-ink-soft">{part.label}</dt>
            <dd className="font-semibold">{num(part.value)}</dd>
          </div>
        ))}
      </dl>
      <p className={`mt-4 text-[13px] font-semibold transition-opacity duration-500 ${marked ? 'opacity-100' : 'opacity-0'}`}>
        La de menor total del mes
      </p>
    </article>
  );
};

const compareCopy = (
  <>
    <h2 className="text-[2rem] lg:text-[3.25rem] leading-[1.02] font-extrabold tracking-[-0.03em] max-w-[16ch]">
      Tres opciones, la misma regla.
    </h2>
    <p className="mt-4 text-[17px] text-ink-soft max-w-[52ch]">
      El comparador pone el total de cada opción sobre la misma escala. Aquí, el {cheapest.p.title.charAt(0).toLowerCase() + cheapest.p.title.slice(1)} te sale {cop(saving)} menos al mes que la más cara.
    </p>
  </>
);

// Escritorio: las tarjetas llegan apiladas y se abren en fila; luego crecen las barras
const ComparePinned: React.FC = () => {
  const [ref, p] = useScrollProgress<HTMLElement>();
  const fan = easeOut(segment(p, 0.05, 0.4));
  const grow = segment(p, 0.4, 0.72);

  return (
    <section ref={ref} id="comparar" className="relative h-[170vh] border-t border-rule">
      <div className="sticky top-16 h-[calc(100vh-4rem)] max-w-[1440px] mx-auto px-10 flex flex-col justify-center">
        {compareCopy}
        <div className="mt-12 grid grid-cols-3 gap-6">
          {compareRows.map((row, i) => (
            <div
              key={row.p.id}
              style={{
                transform: `translateX(calc(${(1 - i) * (1 - fan)} * (100% + 1.5rem))) rotate(${(i - 1) * 3 * (1 - fan)}deg)`,
                zIndex: i === 1 ? 2 : 1,
              }}
            >
              <CompareCard row={row} grow={grow} marked={p > 0.78 && row === cheapest} />
            </div>
          ))}
        </div>
        <a href="/#comparar" className={`mt-8 self-start text-[15px] font-semibold underline underline-offset-4 hover:text-ink-hover rounded ${focusRing}`}>
          Abrir el comparador
        </a>
      </div>
    </section>
  );
};

const CompareStacked: React.FC<{ still: boolean }> = ({ still }) => {
  const [ref, seen] = useInView<HTMLDivElement>(0.3);
  const run = useTimedProgress(seen && !still, 1100);
  const grow = still ? 1 : run;

  return (
    <section id="comparar" className="border-t border-rule px-4 sm:px-6 lg:px-10 py-16 max-w-[1440px] mx-auto">
      {compareCopy}
      <div ref={ref} className="mt-10 grid gap-4 md:grid-cols-3">
        {compareRows.map((row) => (
          <CompareCard key={row.p.id} row={row} grow={grow} marked={grow >= 1 && row === cheapest} />
        ))}
      </div>
      <a href="/#comparar" className={`inline-block mt-6 text-[15px] font-semibold underline underline-offset-4 rounded ${focusRing}`}>
        Abrir el comparador
      </a>
    </section>
  );
};

const HOW = [
  { title: 'Filtra por lo que puedes pagar', body: 'Eliges la zona y el total del mes que te cabe. La lista muestra solo lo que entra.' },
  { title: 'Lee la ficha completa', body: 'Total, requisitos y sello en el mismo orden, en todos los inmuebles.' },
  {
    title: 'Compara y escribe',
    body: 'Pones hasta tres lado a lado. Cuando quieras escribirle a quien publica, verificas tu identidad; en el prototipo ese paso es simulado.',
  },
];

// Los pasos van unidos por un filete que se traza al entrar
const HowItWorks: React.FC<{ still: boolean }> = ({ still }) => {
  const [ref, seen] = useInView<HTMLOListElement>(0.35);
  const on = still || seen;

  return (
    <section className="border-t border-rule bg-surface">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 py-16 lg:py-24">
        <h2 className="text-[2rem] lg:text-[3.25rem] leading-[1.02] font-extrabold tracking-[-0.03em]">Así funciona.</h2>
        <ol ref={ref} className="relative mt-10 lg:mt-14 grid gap-10 md:grid-cols-3 md:gap-8">
          <span
            aria-hidden="true"
            className={`hidden md:block absolute top-[5px] left-0 right-0 h-px bg-ink origin-left transition-transform duration-[1400ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${
              on ? 'scale-x-100' : 'scale-x-0'
            }`}
          />
          {HOW.map((h, i) => (
            <li
              key={h.title}
              className="relative md:pt-8 transition-opacity duration-700"
              style={{ opacity: on ? 1 : 0, transitionDelay: still ? '0ms' : `${200 + i * 260}ms` }}
            >
              <span aria-hidden="true" className="hidden md:block absolute top-0 left-0 size-[11px] rounded-full bg-ink" />
              <h3 className="text-[17px] font-bold">{h.title}</h3>
              <p className="mt-2 text-[15px] text-ink-soft max-w-[36ch]">{h.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
};

// Capturas reales: el portátil se acerca y el celular sube mientras la sección cruza la pantalla
const Screens: React.FC<{ still: boolean }> = ({ still }) => {
  const [ref, p] = useViewProgress<HTMLElement>();
  const near = still ? 1 : easeOut(segment(p, 0.05, 0.5));
  const rise = still ? 1 : easeOut(segment(p, 0.15, 0.6));

  return (
    <section ref={ref} className="border-t border-rule overflow-hidden">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 py-16 lg:py-24">
        <h2 className="text-[2rem] lg:text-[3.25rem] leading-[1.02] font-extrabold tracking-[-0.03em]">La app, tal como está hoy.</h2>
        <figure className="mt-10 lg:mt-14">
          <div className="relative lg:pr-24">
            <div
              className="hidden md:block border border-rule bg-surface rounded-[10px] p-2 origin-bottom"
              style={{ transform: `scale(${0.9 + 0.1 * near})` }}
            >
              <img src={shotDesktop} alt="Catálogo de Wallex en escritorio, con filtros a la izquierda y tarjetas con el total del mes" className="w-full rounded-[8px] border border-rule" loading="lazy" width={1440} height={900} />
            </div>
            <div
              className="md:absolute md:right-0 md:bottom-[-2rem] mx-auto w-[240px] lg:w-[260px] border border-rule bg-surface rounded-[28px] p-2"
              style={{ transform: `translateY(${(1 - rise) * 96}px)` }}
            >
              <img src={shotPhone} alt="Catálogo de Wallex en celular" className="w-full rounded-[20px] border border-rule" loading="lazy" width={390} height={844} />
            </div>
          </div>
          <figcaption className="mt-6 md:mt-14 text-[12.5px] text-ink-faint">Capturas reales del prototipo, con inmuebles de ejemplo.</figcaption>
        </figure>
      </div>
    </section>
  );
};

const FinalCta: React.FC = () => (
  <section className="border-t border-rule bg-surface">
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 py-16 lg:py-24">
      <h2 className="text-[2rem] lg:text-[3.25rem] leading-[1.02] font-extrabold tracking-[-0.03em] max-w-[18ch]">
        Empieza por lo que puedes pagar.
      </h2>
      <div className="mt-8 max-w-[1000px]">
        <LandingSearch compact />
      </div>
      <p className="mt-4 text-[13px] text-ink-soft">
        O{' '}
        <a href="/" className={`font-semibold text-ink underline underline-offset-4 rounded ${focusRing}`}>
          abre la app sin filtros
        </a>
        .
      </p>
    </div>
  </section>
);

export const Landing: React.FC = () => {
  const wide = useMediaQuery('(min-width: 1024px)');
  const still = useReducedMotion();
  const pinned = wide && !still;

  return (
    <div className="min-h-screen bg-paper text-ink">
      <Header />
      <main>
        <Hero />
        <Microprint tone="night" />
        {pinned ? <ChaosPinned /> : <ChaosStacked still={still} />}
        <Microprint tone="night" direction={-1} />
        {pinned ? <AnatomyPinned /> : <AnatomyStacked still={still} />}
        {pinned ? <ComparePinned /> : <CompareStacked still={still} />}
        {pinned ? <CityPinned /> : <CityStacked still={still} />}
        <HowItWorks still={still} />
        <Screens still={still} />
        <Microprint direction={-1} />
        <FinalCta />
      </main>
      <Footer
        links={[
          { label: 'Buscar vivienda', href: '/#buscar' },
          { label: 'Comparador lado a lado', href: '/#comparar' },
        ]}
      />
    </div>
  );
};
