import React, { useEffect, useRef } from 'react';
import { useReducedMotion } from './scroll';

interface MicroprintProps {
  tone?: 'paper' | 'night';
  direction?: 1 | -1; // hacia dónde corre el texto al bajar
}

const WORDS = [
  'wallex',
  'total del mes',
  'canon + administración + transporte',
  'requisitos a la vista',
  'identidad verificada',
  'folio de ejemplo',
];
const REPEAT = 14;

// Franja de letra diminuta, como la de un billete; se desliza con el scroll
export const Microprint: React.FC<MicroprintProps> = ({ tone = 'paper', direction = 1 }) => {
  const ref = useRef<HTMLDivElement>(null);
  const still = useReducedMotion();

  useEffect(() => {
    if (still) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const el = ref.current;
      const first = el?.firstElementChild as HTMLElement | null;
      if (!el || !first) return;
      // El desplazamiento da la vuelta en el ancho de una repetición, así no se nota el corte
      const period = first.offsetWidth;
      const offset = (((window.scrollY * 0.3 * direction) % period) + period) % period;
      el.style.transform = `translate3d(${-offset}px, 0, 0)`;
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    schedule();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
    };
  }, [still, direction]);

  const toneClass = tone === 'night' ? 'bg-night text-night-faint border-white/10' : 'bg-paper text-ink-faint border-rule';

  return (
    <div
      aria-hidden="true"
      data-header={tone === 'night' ? 'night' : undefined}
      className={`overflow-hidden border-y py-[3px] select-none ${toneClass}`}
    >
      <div ref={ref} className="flex w-max whitespace-nowrap will-change-transform">
        {Array.from({ length: REPEAT }, (_, i) => (
          <span key={i} className="flex text-[7px] font-semibold tracking-[0.08em]">
            {WORDS.map((w) => (
              <span key={w} className="pr-[2.5em]">
                {w}
              </span>
            ))}
          </span>
        ))}
      </div>
    </div>
  );
};
