import React, { useEffect, useRef, useState } from 'react';

export type SealStatus = 'verified' | 'pending' | 'unverified';

interface FolioSealProps {
  seed: string; // id del inmueble: la misma roseta siempre para el mismo inmueble
  status: SealStatus;
  size?: number;
}

type Phase = 'still' | 'waiting' | 'draw';

// Hash corto y estable (FNV-1a) para derivar los detalles de la roseta
const hash = (text: string) => {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
};

// Curva de guilloche: un círculo que ondula `lobes` veces. Devuelve el trazo y su longitud real,
// para que todas las curvas terminen de dibujarse al mismo tiempo sin importar su tamaño.
const guilloche = (base: number, amp: number, lobes: number, phase: number, steps = 240) => {
  let d = '';
  let length = 0;
  let px = 0;
  let py = 0;
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * Math.PI * 2;
    const r = base + amp * Math.cos(lobes * t + phase);
    const x = r * Math.cos(t);
    const y = r * Math.sin(t);
    d += `${i === 0 ? 'M' : 'L'}${x.toFixed(2)} ${y.toFixed(2)}`;
    if (i > 0) length += Math.hypot(x - px, y - py);
    px = x;
    py = y;
  }
  return { d: `${d}Z`, length: Math.ceil(length) + 1 };
};

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

  if (status === 'unverified') {
    return (
      <svg width={size} height={size} viewBox="-22 -22 44 44" aria-hidden="true" className="shrink-0">
        <circle r="19" fill="none" stroke="var(--color-unverified)" strokeWidth="1.1" strokeDasharray="2.4 2.4" />
        <path d="M-6 -6 L6 6 M6 -6 L-6 6" stroke="var(--color-unverified)" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    );
  }

  // Misma estructura para todos; solo cambian las ondas y el giro
  const h = hash(seed);
  const outerLobes = 10 + (h % 4); // 10 a 13 ondas
  const innerLobes = 6 + ((h >> 4) % 3); // 6 a 8 ondas
  const turn = ((h >> 8) % 360) * (Math.PI / 180);
  const outer = [0, 1, 2].map((j) => guilloche(16.2, 3.6, outerLobes, turn + (j * 2 * Math.PI) / 3));
  const inner = [0, 1].map((j) => guilloche(8.6, 1.9, innerLobes, turn + j * Math.PI));

  const outerColor = status === 'verified' ? 'var(--color-verified)' : 'var(--color-pending)';
  const innerColor = status === 'verified' ? 'var(--color-ink)' : 'var(--color-pending)';
  const animated = status === 'verified' && phase !== 'still';

  // Cada curva se dibuja con su propia longitud (--len) y entra escalonada (--i)
  const strokeProps = (len: number, i: number) =>
    animated
      ? {
          className: 'seal-stroke',
          style: { ['--len' as string]: len, ['--i' as string]: i, ...(phase === 'waiting' ? { strokeDashoffset: len } : null) } as React.CSSProperties,
        }
      : {};

  return (
    <svg
      ref={ref}
      width={size}
      height={size}
      viewBox="-22 -22 44 44"
      aria-hidden="true"
      className={`shrink-0 ${phase === 'draw' ? 'seal-draw' : ''}`}
    >
      {/* Marca de agua: la roseta completa en tinta tenue, siempre visible */}
      {animated && (
        <g fill="none" stroke={outerColor} strokeWidth="0.7" opacity="0.18">
          {[...outer, ...inner].map((c, k) => (
            <path key={k} d={c.d} />
          ))}
        </g>
      )}
      <g fill="none" strokeWidth="0.7" strokeLinejoin="round" strokeDasharray={status === 'pending' ? '1.4 1.3' : undefined}>
        {outer.map((c, k) => (
          <path key={`o${k}`} d={c.d} stroke={outerColor} {...strokeProps(c.length, k)} />
        ))}
        {inner.map((c, k) => (
          <path key={`i${k}`} d={c.d} stroke={innerColor} {...strokeProps(c.length, 3 + k)} />
        ))}
        <circle r="2.2" stroke={innerColor} strokeWidth="0.8" />
      </g>
    </svg>
  );
};

interface VerificationStampProps {
  seed: string;
  status: SealStatus;
  folio?: string | null;
  size?: number;
}

const STAMP_TEXT: Record<SealStatus, { title: string; detail: string; className: string }> = {
  verified: { title: 'Verificado', detail: 'identidad y tradición', className: 'text-verified' },
  pending: { title: 'Tradición pendiente de cotejo', detail: 'identidad verificada', className: 'text-pending' },
  unverified: { title: 'Sin verificar', detail: 'quien publica no ha mostrado su identidad', className: 'text-unverified' },
};

// Sello + estado + folio: el mismo bloque en el catálogo y en el comparador
export const VerificationStamp: React.FC<VerificationStampProps> = ({ seed, status, folio = null, size = 48 }) => {
  const text = STAMP_TEXT[status];
  return (
    <div className="flex items-center gap-3">
      <FolioSeal seed={seed} status={status} size={size} />
      <p className="text-[12.5px] leading-snug">
        <span className={`font-bold ${text.className}`}>{text.title}</span> · {text.detail}
        <br />
        <span className="text-ink-faint">{folio ? `Folio ${folio} (ejemplo)` : 'Sin folio registrado'}</span>
      </p>
    </div>
  );
};
