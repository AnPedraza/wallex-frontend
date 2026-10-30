import React from 'react';
import clipPhone from '../assets/landing/bogota-atardecer-centro-celular.mp4';
import posterPhone from '../assets/landing/bogota-atardecer-centro-celular.webp';
import clipDesktop from '../assets/landing/bogota-atardecer-centro-escritorio.mp4';
import posterDesktop from '../assets/landing/bogota-atardecer-centro-escritorio.webp';
import { LoopVideo } from './LoopVideo';
import { easeInOut, easeOut, segment, useMediaQuery, useSmoothSceneProgress, useViewProgress } from './scroll';

const LABEL = 'Atardecer en Bogotá: el centro internacional, los cerros orientales y los tejados tradicionales';
const CREDIT = 'Centro y cerros orientales al atardecer. Video de Julián Armando Santos en Pexels.';

const overlayCopy = (
  <>
    <h2 className="text-[2.75rem] leading-[1.08] lg:text-[4.5rem] lg:leading-[1.08] font-extrabold tracking-[-0.035em] text-white text-balance">
      Toda Bogotá, con las cuentas claras.
    </h2>
    <p className="mt-4 text-[17px] text-white/90 max-w-[46ch]">
      Del norte al sur, cada arriendo te dice lo que pagas al mes, lo que te piden y quién te arrienda.
    </p>
  </>
);

const veil = 'pointer-events-none absolute inset-0 bg-linear-to-t from-night/85 via-night/25 to-transparent';

// Escritorio: el video empieza como una tarjeta a la derecha y se abre hasta llenar la pantalla
export const CityPinned: React.FC = () => {
  const [ref, stageRef, p] = useSmoothSceneProgress<HTMLElement, HTMLDivElement>();
  const o = easeInOut(segment(p, 0.04, 0.55));
  const k = 1 - o;
  const before = 1 - easeInOut(segment(p, 0.12, 0.32));
  const after = easeInOut(segment(p, 0.5, 0.7));
  const exit = easeInOut(segment(p, 0.84, 0.98));

  return (
    <section ref={ref} className="relative h-[190vh]">
      <div ref={stageRef} className="sticky top-0 h-screen overflow-hidden">
        <div className="absolute inset-y-0 left-10 w-[min(560px,40%)] flex flex-col justify-center">
          <h2
            className="text-[3.25rem] leading-[1.08] font-extrabold tracking-[-0.03em]"
            style={{ opacity: before, transform: `translateY(${-(1 - before) * 20}px)` }}
          >
            Es tu ciudad. Que buscar casa no sea un riesgo.
          </h2>
        </div>
        <div
          className="absolute inset-0"
          data-header={o > 0.92 && exit < 0.7 ? 'clear' : undefined}
          style={{ clipPath: `inset(${18 * k}% ${8 * k}% ${18 * k}% ${52 * k}% round ${10 * k}px)` }}
        >
          <div className="size-full" style={{ transform: `scale(${1.1 - 0.1 * o})` }}>
            <LoopVideo cover src={clipDesktop} poster={posterDesktop} width={1280} height={720} label={LABEL} controlClassName="bottom-5 right-8" />
          </div>
          <div aria-hidden="true" className={veil} style={{ opacity: easeInOut(segment(p, 0.4, 0.6)) }} />
        </div>
        <div
          className="absolute left-10 bottom-16 max-w-[820px]"
          style={{
            opacity: after * (1 - exit),
            transform: `translateY(${(1 - after) * 24 - exit * 20}px)`,
          }}
        >
          {overlayCopy}
        </div>
        <p
          className="absolute right-20 bottom-7 text-[12.5px] text-white/85"
          style={{ opacity: after * (1 - exit) }}
        >
          {CREDIT}
        </p>
        {/* Disolución suave del fondo hacia el inicio de la siguiente sección */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-surface via-surface/60 to-transparent transition-opacity duration-300"
          style={{ opacity: exit }}
        />
      </div>
    </section>
  );
};

// Celular o movimiento reducido: a todo el ancho, con un acercamiento leve al cruzar la pantalla.
// En celular va la toma vertical del mismo vuelo; en pantallas anchas, la horizontal.
export const CityStacked: React.FC<{ still: boolean }> = ({ still }) => {
  const [ref, p] = useViewProgress<HTMLElement>();
  const wide = useMediaQuery('(min-width: 768px)');
  const zoom = still ? 1 : 1.12 - 0.12 * easeOut(segment(p, 0.1, 0.6));

  return (
    <section ref={ref}>
      <div className="relative overflow-hidden h-[88svh] min-h-[520px] max-h-[900px]">
        <div className="size-full" style={{ transform: `scale(${zoom})` }}>
          <LoopVideo
            key={wide ? 'ancho' : 'vertical'}
            cover
            src={wide ? clipDesktop : clipPhone}
            poster={wide ? posterDesktop : posterPhone}
            width={wide ? 1280 : 540}
            height={wide ? 720 : 960}
            label={LABEL}
            controlClassName="top-4 right-4"
          />
        </div>
        <div aria-hidden="true" className={veil} />
        <div className="absolute inset-x-0 bottom-0 px-4 sm:px-6 lg:px-10 pb-10">{overlayCopy}</div>
      </div>
      <p className="px-4 sm:px-6 lg:px-10 py-3 text-[12.5px] text-ink-faint">{CREDIT}</p>
    </section>
  );
};
