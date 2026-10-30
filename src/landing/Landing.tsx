import React, { useEffect, useState } from 'react';
import logo from '../assets/wallex-logo.png';
import clipPhone from '../assets/landing/app-recorrido-celular.mp4';
import posterPhone from '../assets/landing/app-recorrido-celular.webp';
import clipDesktop from '../assets/landing/app-recorrido-escritorio.mp4';
import posterDesktop from '../assets/landing/app-recorrido-escritorio.webp';
import { FolioSeal } from '../components/FolioSeal';
import { Footer } from '../components/Footer';
import { ChaosPinned, ChaosStacked } from './ChaosScene';
import { CityPinned, CityStacked } from './CityScene';
import { COMPARE, DEMO, cop, fichaLink, num, totalOf, transportOf } from './data';
import { FichaDemo, type FichaPart } from './FichaDemo';
import { LandingSearch } from './LandingSearch';
import { LoopVideo, VideoToggleIcon, type VideoChoice } from './LoopVideo';
import { Microprint } from './Microprint';
import {
  easeOut,
  segment,
  useAutoplayAllowed,
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

type HeaderTone = 'paper' | 'night' | 'clear';

const TONES: Record<HeaderTone, { bar: string; soft: string; bubble: string; cta: string; ring: string }> = {
  paper: {
    bar: 'bg-paper border-rule text-ink',
    soft: 'text-ink-soft hover:text-ink',
    bubble: 'bg-rule/70',
    cta: 'bg-ink text-white hover:bg-ink-hover',
    ring: 'focus-visible:outline-ink',
  },
  night: {
    bar: 'bg-night border-white/10 text-white',
    soft: 'text-night-text hover:text-white',
    bubble: 'bg-white/10',
    cta: 'bg-white text-ink hover:bg-paper',
    ring: 'focus-visible:outline-white',
  },
  clear: {
    bar: 'bg-night/60 border-transparent text-white',
    soft: 'text-white/85 hover:text-white',
    bubble: 'bg-white/15',
    cta: 'bg-white text-ink hover:bg-paper',
    ring: 'focus-visible:outline-white',
  },
};

// La barra toma el tono de lo que pasa por debajo: papel, la escena de noche o la foto abierta.
// Las secciones lo declaran con data-header; se revisa al hacer scroll y unos cuadros más, por la inercia de las escenas.
const useHeaderTone = () => {
  const [tone, setTone] = useState<HeaderTone>('paper');

  useEffect(() => {
    let frame = 0;
    let until = 0;
    const read = () => {
      const header = document.querySelector('[data-landing-header]');
      const y = (header?.getBoundingClientRect().bottom ?? 64) - 2;
      const below = document.elementsFromPoint(window.innerWidth / 2, y).find((el) => !el.closest('[data-landing-header]'));
      const value = below?.closest<HTMLElement>('[data-header]')?.dataset.header;
      setTone(value === 'night' || value === 'clear' ? value : 'paper');
    };
    const loop = (now: number) => {
      read();
      frame = now < until ? requestAnimationFrame(loop) : 0;
    };
    const schedule = () => {
      until = performance.now() + 700;
      if (!frame) frame = requestAnimationFrame(loop);
    };
    schedule();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
    };
  }, []);

  return tone;
};

const press = 'transition-[background-color,color,transform] duration-150 active:scale-[0.97]';

// Barra superior propia de la landing: a la izquierda la marca y las secciones de esta página,
// a la derecha la cuenta y la búsqueda
const Header: React.FC = () => {
  const t = TONES[useHeaderTone()];
  const ring = `focus-visible:outline-2 focus-visible:outline-offset-2 ${t.ring}`;

  return (
    <header
      data-landing-header
      className={`sticky top-0 z-30 border-b transition-[background-color,border-color,color] duration-300 ${t.bar}`}
    >
      <div className="max-w-[1440px] mx-auto h-16 px-4 sm:px-6 lg:px-10 flex items-center justify-between gap-4">
        <div className="flex items-center gap-10">
          <a href="/inicio/" className={`flex items-center gap-2 rounded-lg ${ring}`}>
            <img src={logo} alt="" className="h-10 w-10" />
            <span className="text-[21px] font-extrabold tracking-[-0.02em]">Wallex</span>
          </a>
          <nav aria-label="Secciones de la página" className="hidden md:flex items-center gap-7">
            <a href="#ficha" className={`link-grow text-[15px] font-semibold transition-colors duration-300 ${t.soft} ${ring}`}>
              La ficha
            </a>
            <a href="#comparar" className={`link-grow text-[15px] font-semibold transition-colors duration-300 ${t.soft} ${ring}`}>
              Comparar
            </a>
            <a href="#como-funciona" className={`link-grow text-[15px] font-semibold transition-colors duration-300 ${t.soft} ${ring}`}>
              Cómo funciona
            </a>
          </nav>
        </div>
        <div className="flex items-center gap-4 sm:gap-5">
          <a href="/?ingresar#buscar" className={`flex items-center gap-2 text-[15px] font-semibold rounded ${ring}`}>
            <span
              aria-hidden="true"
              className={`hidden sm:grid place-items-center size-8 rounded-full transition-colors duration-300 ${t.bubble}`}
            >
              <svg viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="8" cy="5.5" r="2.75" />
                <path d="M2.75 14c.6-2.6 2.7-4.25 5.25-4.25s4.65 1.65 5.25 4.25" strokeLinecap="round" />
              </svg>
            </span>
            <span className="link-grow">Ingresar</span>
          </a>
          <a href="/#buscar" className={`text-[13px] font-semibold px-3 sm:px-4 py-2 rounded-lg whitespace-nowrap ${press} ${t.cta} ${ring}`}>
            Buscar arriendo
          </a>
        </div>
      </div>
    </header>
  );
};

const HEADLINE = 'Arrendar en Bogotá sin adivinar cuánto pagas ni de quién fiarte.';
const enter = (ms: number) => ({ ['--delay' as string]: `${ms}ms` }) as React.CSSProperties;

// La entrada del inicio es la única secuencia al cargar: el titular sube palabra por palabra,
// después el buscador y la ficha, que se arma, suma su total y al final recibe sus rótulos.
const Hero: React.FC<{ still: boolean }> = ({ still }) => {
  const count = useTimedProgress(!still, 1100, 700);

  return (
    <section className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 pt-10 pb-16 lg:pt-14 lg:pb-24 grid gap-12 lg:grid-cols-[1fr_auto] lg:items-center">
      <div className="max-w-[640px]">
        <h1
          className="text-[2.75rem] leading-[1.08] lg:text-[4.5rem] lg:leading-[1.08] font-extrabold tracking-[-0.035em] text-balance"
          aria-label={HEADLINE}
        >
          {HEADLINE.split(' ').map((word, i) => (
            <React.Fragment key={i}>
              {i > 0 && ' '}
              <span className="enter-word" aria-hidden="true">
                <span style={enter(60 + i * 38)}>{word}</span>
              </span>
            </React.Fragment>
          ))}
        </h1>
        <p className="enter-up mt-6 text-[17px] text-ink-soft max-w-[46ch]" style={enter(420)}>
          Cada arriendo con la misma ficha: el total del mes, lo que te piden y quién publica, en el mismo orden.
        </p>
        <div className="enter-up mt-8" style={enter(540)}>
          <LandingSearch />
        </div>
        <p className="enter-up mt-3 text-[12.5px] text-ink-faint text-pretty" style={enter(680)}>
          Prototipo académico: inmuebles de ejemplo y verificación simulada.
        </p>
      </div>

      <div className="lg:pr-28 xl:pr-36 2xl:pr-40 flex flex-col items-center lg:items-end">
        <FichaDemo marks={STEPS.map((s) => s.title)} entrance totalProgress={still ? 1 : count} href={fichaLink(DEMO.id)} />
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
};

// Escritorio: la ficha queda fija y el scroll recorre sus tres partes
const AnatomyPinned: React.FC = () => {
  const [ref, p] = useScrollProgress<HTMLElement>();
  const step = p < 0.36 ? 0 : p < 0.7 ? 1 : 2;
  const active = STEPS[step].part;

  return (
    <section ref={ref} id="ficha" className="relative h-[230vh] border-t border-rule bg-surface scroll-mt-20">
      <div className="sticky top-16 h-[calc(100vh-4rem)] max-w-[1440px] mx-auto px-10 grid grid-cols-[minmax(0,480px)_420px] justify-center gap-x-[160px] items-center">
        <div>
          <h2 className="text-[3.25rem] leading-[1.08] font-extrabold tracking-[-0.03em] max-w-[14ch]">Una ficha, tres respuestas.</h2>
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
  <section id="ficha" className="border-t border-rule bg-surface scroll-mt-20">
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 py-16 lg:py-24">
      <h2 className="text-[2rem] lg:text-[3.25rem] leading-[1.08] font-extrabold tracking-[-0.03em]">Una ficha, tres respuestas.</h2>
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

// Indicadores de posición táctiles para filas deslizables en celular
const SnapDots: React.FC<{
  containerRef: React.RefObject<HTMLElement | null>;
  count: number;
}> = ({ containerRef, count }) => {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handleScroll = () => {
      const scrollLeft = el.scrollLeft;
      const children = Array.from(el.children).filter((c) => c.classList.contains('snap-item')) as HTMLElement[];
      if (children.length > 0) {
        let closestIdx = 0;
        let minDiff = Infinity;
        children.forEach((child, i) => {
          const diff = Math.abs(child.offsetLeft - el.offsetLeft - scrollLeft);
          if (diff < minDiff) {
            minDiff = diff;
            closestIdx = i;
          }
        });
        setActiveIndex(closestIdx);
      }
    };
    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => el.removeEventListener('scroll', handleScroll);
  }, [containerRef]);

  const scrollTo = (idx: number) => {
    const el = containerRef.current;
    if (!el) return;
    const children = Array.from(el.children).filter((c) => c.classList.contains('snap-item')) as HTMLElement[];
    if (children[idx]) {
      children[idx].scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      });
    }
  };

  return (
    <div className="md:hidden flex items-center justify-center gap-1.5 mt-4" aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <button
          key={i}
          type="button"
          tabIndex={-1}
          onClick={() => scrollTo(i)}
          className={`h-1.5 rounded-full transition-all duration-300 focus:outline-none ${
            i === activeIndex ? 'w-6 bg-ink' : 'w-2 bg-rule'
          }`}
          aria-label={`Ver tarjeta ${i + 1} de ${count}`}
        />
      ))}
    </div>
  );
};

const CompareCard: React.FC<{ row: (typeof compareRows)[number]; grow: number; marked: boolean }> = ({ row, grow, marked }) => {
  const { p, transport, total } = row;
  const parts = [
    { label: 'Canon', value: p.price, className: 'bg-ink' },
    { label: 'Administración', value: p.adminFee, className: 'bg-ink-soft' },
    { label: 'Transporte', value: transport, className: 'bg-control' },
  ];
  return (
    <a
      href={fichaLink(p.id)}
      className={`ficha-link group block bg-surface border rounded-[10px] overflow-hidden transition-colors duration-300 hover:border-ink focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink ${
        marked ? 'border-ink' : 'border-rule'
      }`}
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-rule">
        <img
          src={p.image}
          alt={p.title}
          loading="lazy"
          className="size-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.04]"
        />
        {p.verified && (
          <span className="absolute top-2.5 left-2.5 inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-bold bg-surface/95 text-ink border border-rule">
            <span className="size-1.5 rounded-full bg-verified" aria-hidden="true" />
            Verificado
          </span>
        )}
      </div>
      <div className="p-5">
        <h3 className="text-[17px] font-bold tracking-[-0.01em]">
          <span className="link-grow">{p.title}</span>
        </h3>
        <p className="text-[13px] text-ink-soft mt-0.5">
          {p.bedrooms} {p.bedrooms === 1 ? 'hab' : 'habs'} · {p.bathrooms} {p.bathrooms === 1 ? 'baño' : 'baños'} · {p.area} m² · {p.zone}
        </p>
        <p className="mt-4 flex items-baseline gap-1.5">
          <strong
            className="text-[26px] font-extrabold tracking-[-0.02em] leading-none transition-opacity duration-300"
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
        <div className="mt-4 pt-3 border-t border-rule min-h-[46px] flex items-center justify-between text-[12px]">
          {row === cheapest ? (
            <div className={`flex items-center gap-2.5 transition-opacity duration-500 ${marked ? 'opacity-100' : 'opacity-0'}`}>
              <FolioSeal seed={p.id} status="verified" size={24} />
              <div>
                <p className="text-[12px] font-bold leading-tight text-ink">Menor total del mes</p>
                <p className="text-[11px] text-ink-soft leading-tight">Ahorras {cop(saving)} frente a la más cara</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between w-full">
              <div>
                <p className="text-[12px] font-bold leading-tight text-ink">+{cop(total - cheapest.total)} al mes</p>
                <p className="text-[11px] text-ink-soft leading-tight">frente a la menor opción</p>
              </div>
              <span className="text-[11.5px] text-ink-faint hidden sm:inline max-w-[130px] truncate text-right">
                {p.transitAccess.split(' y ')[0]}
              </span>
            </div>
          )}
        </div>
      </div>
    </a>
  );
};

const compareCopy = (
  <>
    <h2 className="text-[2rem] lg:text-[3.25rem] leading-[1.08] font-extrabold tracking-[-0.03em] max-w-[16ch]">
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
    <section ref={ref} id="comparar" className="relative h-[170vh] border-t border-rule scroll-mt-20">
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
        <a href="/#comparar" className={`link-line mt-8 self-start text-[15px] font-semibold rounded ${focusRing}`}>
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
    <section id="comparar" className="border-t border-rule scroll-mt-20 px-4 sm:px-6 lg:px-10 py-16 max-w-[1440px] mx-auto">
      {compareCopy}
      <div
        ref={ref}
        className="snap-row -mx-4 px-4 pr-10 sm:-mx-6 sm:px-6 sm:pr-12 md:mx-0 md:px-0 mt-10 gap-3.5 md:grid md:grid-cols-3 md:gap-4"
      >
        {compareRows.map((row) => (
          <div key={row.p.id} className="snap-item">
            <CompareCard row={row} grow={grow} marked={grow >= 1 && row === cheapest} />
          </div>
        ))}
      </div>
      <SnapDots containerRef={ref} count={compareRows.length} />
      <a href="/#comparar" className={`link-line inline-block mt-6 text-[15px] font-semibold rounded ${focusRing}`}>
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

// Los pasos van unidos por un filete que se traza al entrar; en celular van en fila deslizable
const HowItWorks: React.FC<{ still: boolean }> = ({ still }) => {
  const [ref, seen] = useInView<HTMLOListElement>(0.35);
  const on = still || seen;

  return (
    <section id="como-funciona" className="border-t border-rule bg-surface scroll-mt-20">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 py-16 lg:py-24">
        <h2 className="text-[2rem] lg:text-[3.25rem] leading-[1.08] font-extrabold tracking-[-0.03em]">Así funciona.</h2>
        <ol
          ref={ref}
          className="snap-row relative -mx-4 px-4 pr-10 sm:-mx-6 sm:px-6 sm:pr-12 md:mx-0 md:px-0 mt-10 lg:mt-14 gap-3.5 md:grid md:grid-cols-3 md:gap-8"
        >
          <span
            aria-hidden="true"
            className={`hidden md:block absolute top-[5px] left-0 right-0 h-px bg-ink origin-left transition-transform duration-[1400ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${
              on ? 'scale-x-100' : 'scale-x-0'
            }`}
          />
          {HOW.map((h, i) => (
            <li
              key={h.title}
              className="snap-item relative max-md:bg-paper max-md:border max-md:border-rule max-md:rounded-[10px] max-md:p-5 md:pt-8 transition-opacity duration-700"
              style={{ opacity: on ? 1 : 0, transitionDelay: still ? '0ms' : `${200 + i * 260}ms` }}
            >
              <span aria-hidden="true" className="hidden md:block absolute top-0 left-0 size-[11px] rounded-full bg-ink" />
              <span
                aria-hidden="true"
                className="md:hidden inline-grid place-items-center size-6 rounded-full bg-ink text-white text-[12px] font-bold mb-3"
              >
                {i + 1}
              </span>
              <h3 className="text-[17px] font-bold">{h.title}</h3>
              <p className="mt-2 text-[15px] text-ink-soft max-w-[36ch]">{h.body}</p>
            </li>
          ))}
        </ol>
        <SnapDots containerRef={ref} count={HOW.length} />
      </div>
    </section>
  );
};

// Recorridos grabados de la app real en un portátil y un celular: el portátil se acerca y el celular sube al cruzar la pantalla
const Screens: React.FC<{ still: boolean }> = ({ still }) => {
  const [ref, p] = useViewProgress<HTMLElement>();
  // Un solo control para los dos recorridos, fuera de las pantallas para no confundirlo con la app
  const [choice, setChoice] = useState<VideoChoice>('auto');
  const allowed = useAutoplayAllowed();
  const running = choice === 'play' || (choice === 'auto' && allowed);
  const near = still ? 1 : easeOut(segment(p, 0.05, 0.5));
  const rise = still ? 1 : easeOut(segment(p, 0.15, 0.6));

  return (
    <section ref={ref} className="border-t border-rule overflow-hidden">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 py-16 lg:py-24">
        <h2 className="text-[2rem] lg:text-[3.25rem] leading-[1.08] font-extrabold tracking-[-0.03em] max-w-[20ch]">
          En el computador o en el celular, la misma ficha.
        </h2>
        <div className="mt-12 lg:mt-16 relative md:pr-[200px] lg:pr-[240px] md:pb-10">
          {/* Portátil: pantalla con marco oscuro y la base debajo */}
          <figure className="hidden md:block origin-bottom" style={{ transform: `scale(${0.92 + 0.08 * near})` }}>
            <div className="relative bg-night rounded-t-[18px] px-3 pt-5 pb-3 lg:px-4 lg:pt-6 lg:pb-4">
              <span aria-hidden="true" className="absolute top-2 lg:top-2.5 left-1/2 -translate-x-1/2 size-1.5 rounded-full bg-white/25" />
              <LoopVideo
                src={clipDesktop}
                poster={posterDesktop}
                width={1280}
                height={800}
                className="rounded-[3px]"
                choice={choice}
                label="Recorrido por Wallex en la web: filtrar por zona y total del mes, abrir una ficha y comparar opciones"
              />
            </div>
            <div aria-hidden="true" className="relative -mx-[3%] h-3.5 lg:h-4 bg-rule rounded-b-[14px] border-b border-control/50">
              <span className="absolute left-1/2 top-0 -translate-x-1/2 w-[13%] h-1.5 rounded-b-md bg-control/35" />
            </div>
            <figcaption className="mt-4 text-[13px] font-semibold text-ink-soft">En la web</figcaption>
          </figure>

          {/* Celular: marco redondeado con la isla de la cámara */}
          <figure
            className="md:absolute md:right-0 md:bottom-0 mx-auto w-[230px] lg:w-[260px]"
            style={{ transform: `translateY(${(1 - rise) * 96}px)` }}
          >
            <div className="relative bg-night rounded-[40px] p-[9px]">
              <div className="overflow-hidden rounded-[31px] bg-surface">
                {/* Franja de la barra de estado, donde va la isla de la cámara */}
                <div aria-hidden="true" className="relative h-[30px]">
                  <span className="absolute top-[7px] left-1/2 -translate-x-1/2 w-[32%] h-[18px] rounded-full bg-night" />
                </div>
                <LoopVideo
                  src={clipPhone}
                  poster={posterPhone}
                  width={520}
                  height={1126}
                  choice={choice}
                  label="Recorrido por Wallex en el celular: filtros, ficha del inmueble y comparador"
                />
              </div>
            </div>
            <figcaption className="mt-4 flex flex-col items-center md:items-start gap-2.5 text-[13px] font-semibold text-ink-soft">
              En el celular
              <button
                type="button"
                onClick={() => setChoice(running ? 'pause' : 'play')}
                className={`inline-flex items-center gap-1.5 text-ink rounded ${press} ${focusRing}`}
              >
                <span className="grid place-items-center size-6 rounded-full border border-ink">
                  <VideoToggleIcon playing={running} />
                </span>
                <span className="link-grow">{running ? 'Pausar los recorridos' : 'Ver los recorridos'}</span>
              </button>
            </figcaption>
          </figure>
        </div>
      </div>
    </section>
  );
};

const FinalCta: React.FC = () => (
  <section className="border-t border-rule bg-surface">
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 py-16 lg:py-24">
      <h2 className="text-[2rem] lg:text-[3.25rem] leading-[1.08] font-extrabold tracking-[-0.03em] max-w-[18ch]">
        Empieza por lo que puedes pagar.
      </h2>
      <div className="mt-8 max-w-[1000px]">
        <LandingSearch compact />
      </div>
      <p className="mt-4 text-[13px] text-ink-soft">
        O{' '}
        <a href="/" className={`link-line font-semibold text-ink rounded ${focusRing}`}>
          mira todos los arriendos
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
        <Hero still={still} />
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
      <div data-header="night">
        <Footer
          links={[
            { label: 'Buscar vivienda', href: '/#buscar' },
            { label: 'Comparador lado a lado', href: '/#comparar' },
          ]}
        />
      </div>
    </div>
  );
};
