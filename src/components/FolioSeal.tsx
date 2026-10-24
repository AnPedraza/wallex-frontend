import React, { useEffect, useRef, useState } from 'react';

export type SealStatus = 'verified' | 'pending' | 'unverified';

interface FolioSealProps {
  seed: string; // id del inmueble: la misma roseta siempre para el mismo inmueble
  status: SealStatus;
  size?: number;
}

type Phase = 'still' | 'waiting' | 'draw';

// Hash corto y estable (FNV-1a) para derivar la forma de la roseta
const hash = (text: string) => {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
};

// Elipse como path para animar el trazo (ver .seal-stroke en index.css)
const ellipsePath = (rx: number, ry: number) => `M ${-rx} 0 a ${rx} ${ry} 0 1 0 ${2 * rx} 0 a ${rx} ${ry} 0 1 0 ${-2 * rx} 0`;

const initialPhase = (): Phase => {
  if (typeof window === 'undefined' || !('IntersectionObserver' in window)) return 'still';
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'still' : 'waiting';
};

export const FolioSeal: React.FC<FolioSealProps> = ({ seed, status, size = 48 }) => {
  const ref = useRef<SVGSVGElement>(null);
  const [phase, setPhase] = useState<Phase>(initialPhase);

  useEffect(() => {
    const node = ref.current;
    if (phase !== 'waiting' || !node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setPhase('draw');
          observer.disconnect();
        }
      },
      { threshold: 0.6 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [phase]);

  const h = hash(seed);
  const petals = 5 + (h % 5); // 5 a 9 elipses exteriores
  const outerRy = 5 + ((h >> 3) % 6); // 5 a 10
  const innerKind = (h >> 7) % 3;
  const offset = (h >> 9) % 30;

  const strokeClass = phase === 'still' ? undefined : 'seal-stroke';
  const waitingStyle = phase === 'waiting' ? { strokeDashoffset: 140 } : undefined;
  let i = 0;
  // --i escalona el trazo de cada elipse
  const next = () => ({ ['--i' as string]: i++ }) as React.CSSProperties;

  if (status === 'unverified') {
    return (
      <svg width={size} height={size} viewBox="-22 -22 44 44" aria-hidden="true" className="shrink-0">
        <circle r="19" fill="none" stroke="var(--color-unverified)" strokeWidth="1.2" strokeDasharray="2.5 2.5" />
        <path d="M-6 -6 L6 6 M6 -6 L-6 6" stroke="var(--color-unverified)" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    );
  }

  const outerColor = status === 'verified' ? 'var(--color-verified)' : 'var(--color-pending)';

  return (
    <svg
      ref={ref}
      width={size}
      height={size}
      viewBox="-22 -22 44 44"
      aria-hidden="true"
      className={`shrink-0 ${phase === 'draw' ? 'seal-draw' : ''}`}
    >
      <g fill="none" strokeWidth="0.8" stroke={outerColor} strokeDasharray={status === 'pending' ? '1.6 1.4' : undefined}>
        {Array.from({ length: petals }, (_, k) => (
          <path
            key={k}
            d={ellipsePath(20, outerRy)}
            transform={`rotate(${offset + (180 / petals) * k})`}
            className={status === 'pending' ? undefined : strokeClass}
            style={status === 'pending' ? undefined : { ...next(), ...waitingStyle }}
          />
        ))}
      </g>
      {status === 'verified' && (
        <g fill="none" strokeWidth="0.8" stroke="var(--color-ink)">
          {innerKind === 0 &&
            [0, 60, 120].map((r) => (
              <path key={r} d={ellipsePath(13, 4.5)} transform={`rotate(${offset + r + 15})`} className={strokeClass} style={{ ...next(), ...waitingStyle }} />
            ))}
          {innerKind === 1 &&
            [7, 4].map((r) => <path key={r} d={ellipsePath(r, r)} className={strokeClass} style={{ ...next(), ...waitingStyle }} />)}
          {innerKind === 2 && (
            <>
              <path d={ellipsePath(11, 11)} className={strokeClass} style={{ ...next(), ...waitingStyle }} />
              {[0, 90].map((r) => (
                <path key={r} d={ellipsePath(11, 3.5)} transform={`rotate(${offset + r + 45})`} className={strokeClass} style={{ ...next(), ...waitingStyle }} />
              ))}
            </>
          )}
        </g>
      )}
    </svg>
  );
};
