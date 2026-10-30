import React, { useId, useState } from 'react';
import { INITIAL_PROPERTIES } from '../data/mockProperties';
import { TRANSPORT_PROFILES } from '../data/mockProperties';
import { RANGE_MAX, RANGE_MIN, appLink, cop } from './data';

// Parámetros de proyección isométrica precisa (azimuth 40°, elevación 28°)
const AZIMUTH = (40.0 * Math.PI) / 180.0;
const ELEVATION = (28.0 * Math.PI) / 180.0;
const SINA = Math.sin(AZIMUTH);
const COSA = Math.cos(AZIMUTH);
const SINE = Math.sin(ELEVATION);
const COSE = Math.cos(ELEVATION);

const WIDTH = 640;
const HEIGHT = 460;
const ORIGIN_X = 280;
const ORIGIN_Y = 370;
const SCALE = 1.14;

function iso(x: number, y: number, z: number): [number, number] {
  const sx = ORIGIN_X + (x * SINA - y * COSA) * SCALE;
  const sy = ORIGIN_Y + ((x * COSA + y * SINA) * SINE - z * COSE) * SCALE;
  return [Math.round(sx * 10) / 10, Math.round(sy * 10) / 10];
}

function pathD(pts: [number, number][], closed = true): string {
  return 'M ' + pts.map((p) => `${p[0]} ${p[1]}`).join(' L ') + (closed ? ' Z' : '');
}

interface BoxProps {
  x0: number;
  x1: number;
  y0: number;
  y1: number;
  z0: number;
  z1: number;
  top: string;
  right: string;
  left: string;
  stroke?: string;
  strokeWidth?: number;
}

const Box: React.FC<BoxProps> = ({
  x0,
  x1,
  y0,
  y1,
  z0,
  z1,
  top,
  right,
  left,
  stroke = '#12223f',
  strokeWidth = 0.8,
}) => {
  const p000 = iso(x0, y0, z0);
  const p100 = iso(x1, y0, z0);
  const p110 = iso(x1, y1, z0);
  const p010 = iso(x0, y1, z0);
  const p001 = iso(x0, y0, z1);
  const p101 = iso(x1, y0, z1);
  const p111 = iso(x1, y1, z1);
  const p011 = iso(x0, y1, z1);

  return (
    <g>
      {/* Cara lateral izquierda (hacia +y, en sombra) */}
      <path
        d={pathD([p010, p110, p111, p011])}
        fill={left}
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
      />
      {/* Cara lateral derecha (hacia +x, con luz media) */}
      <path
        d={pathD([p000, p100, p101, p001])}
        fill={right}
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
      />
      {/* Cara superior (plano z=z1, iluminada desde arriba) */}
      <path
        d={pathD([p001, p101, p111, p011])}
        fill={top}
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
      />
    </g>
  );
};

// Inmuebles reales del mock para el comparador del medidor
const SAMPLE_IDS = ['5', '1', '2'];
const SAMPLES = SAMPLE_IDS.map((id) => INITIAL_PROPERTIES.find((p) => p.id === id)!).filter(Boolean);

interface FigureProps {
  canon: number;
  admin: number;
  transport: number;
  budget: number;
}

export const MonthGaugeFigure: React.FC<FigureProps> = ({ canon, admin, transport, budget }) => {
  const total = canon + admin + transport;
  const inBudget = total <= budget;

  // Altura base de referencia: $ 3.500.000 -> 190 unidades de altura
  const MAX_VAL = 3_500_000;
  const SCALE_HEIGHT = 190;
  const Z_BASE = 20;

  const hCanon = (canon / MAX_VAL) * SCALE_HEIGHT;
  const hAdmin = (admin / MAX_VAL) * SCALE_HEIGHT;
  const hTrans = Math.max(6, (transport / MAX_VAL) * SCALE_HEIGHT);

  const zCanonTop = Z_BASE + hCanon;
  const zAdminTop = zCanonTop + hAdmin;
  const zTotal = zAdminTop + hTrans;

  const zBudget = Z_BASE + (budget / MAX_VAL) * SCALE_HEIGHT;

  // Coordenadas calculadas
  const pBadge = iso(82, 0, zTotal);
  const pNeedle0 = iso(58, -10, zTotal);
  const pNeedle1 = iso(52, -10, zTotal);

  const pBudgetLine0 = iso(58, -5, zBudget);
  const pBudgetLine1 = iso(-80, -5, zBudget);

  return (
    <div className="relative w-full max-w-[640px] mx-auto select-none">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="w-full h-auto block overflow-visible"
        aria-label={`Medidor del mes de Wallex: Canon ${cop(canon)}, Administración ${cop(admin)}, Transporte estimado ${cop(transport)}. Total del mes ${cop(total)} frente a presupuesto ${cop(budget)}`}
        role="img"
      >
        {/* Patas cilíndricas del instrumento */}
        {[
          [-125, -35],
          [-125, 35],
          [85, -35],
          [85, 35],
        ].map(([fx, fy], i) => (
          <Box
            key={i}
            x0={fx - 7}
            x1={fx + 7}
            y0={fy - 7}
            y1={fy + 7}
            z0={-22}
            z1={-14}
            top="#e5e7e4"
            right="#d4d8d3"
            left="#c2c7c0"
          />
        ))}

        {/* Placa base rectificada */}
        <Box
          x0={-140}
          x1={105}
          y0={-50}
          y1={50}
          z0={-14}
          z1={0}
          top="#f4f6f3"
          right="#dce2dd"
          left="#cfd6d0"
          strokeWidth={1.0}
        />

        {/* Tornillos avellanados de las esquinas */}
        {[
          [-130, -40],
          [-130, 40],
          [95, -40],
          [95, 40],
        ].map(([sx, sy], i) => {
          const sp = iso(sx, sy, 0);
          return (
            <g key={i}>
              <circle cx={sp[0]} cy={sp[1]} r={2.5} fill="#cfd6d0" stroke="#12223f" strokeWidth={0.8} />
              <line
                x1={sp[0] - 1.5}
                y1={sp[1] - 0.8}
                x2={sp[0] + 1.5}
                y2={sp[1] + 0.8}
                stroke="#12223f"
                strokeWidth={0.7}
              />
            </g>
          );
        })}

        {/* Placa técnica de calibración grabada en el frente de la base */}
        {(() => {
          const np0 = iso(-80, -49.5, -3.5);
          const np1 = iso(40, -49.5, -3.5);
          const np2 = iso(40, -49.5, -11);
          const np3 = iso(-80, -49.5, -11);
          return (
            <g>
              <polygon
                points={`${np0[0]},${np0[1]} ${np1[0]},${np1[1]} ${np2[0]},${np2[1]} ${np3[0]},${np3[1]}`}
                fill="#ffffff"
                stroke="#7a869b"
                strokeWidth={0.8}
              />
              <text
                x={(np0[0] + np1[0]) / 2}
                y={(np0[1] + np2[1]) / 2 + 2.5}
                fontFamily="Schibsted Grotesk, sans-serif"
                fontSize={7}
                fontWeight={800}
                fill="#4a5873"
                textAnchor="middle"
                letterSpacing="0.08em"
              >
                WALLEX · METROLOGÍA INMOBILIARIA · BOGOTÁ
              </text>
            </g>
          );
        })()}

        {/* Brida y Columna vertical graduada */}
        <Box x0={55} x1={85} y0={-15} y1={15} z0={0} z1={6} top="#e8ece7" right="#dce2dd" left="#cbd3cc" />
        <Box
          x0={60}
          x1={80}
          y0={-10}
          y1={10}
          z0={6}
          z1={225}
          top="#e5e9e5"
          right="#d6ddd6"
          left="#c5cec5"
          strokeWidth={1.0}
        />
        {/* Remate superior de la columna */}
        <Box x0={58} x1={82} y0={-12} y1={12} z0={225} z1={232} top="#12223f" right="#0e1b32" left="#1a3055" />

        {/* Graduación métrica en la cara frontal de la columna (en pesos) */}
        {[0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 3.5].map((millions) => {
          const tz = Z_BASE + (millions / 3.5) * SCALE_HEIGHT;
          const t0 = iso(60, -10, tz);
          const t1 = iso(67, -10, tz);
          const tp = iso(57, -10, tz);
          return (
            <g key={millions}>
              <line x1={t0[0]} y1={t0[1]} x2={t1[0]} y2={t1[1]} stroke="#12223f" strokeWidth={1.2} />
              <text
                x={tp[0] - 4}
                y={tp[1] + 3}
                fontFamily="Schibsted Grotesk, sans-serif"
                fontSize={8.5}
                fontWeight={700}
                fill="#4a5873"
                textAnchor="end"
              >
                {millions.toFixed(1)}M
              </text>
            </g>
          );
        })}

        {/* Ticks menores de la regla */}
        {Array.from({ length: 35 }).map((_, i) => {
          const kVal = i + 1;
          if (kVal % 5 === 0) return null;
          const tz = Z_BASE + (kVal / 35.0) * SCALE_HEIGHT;
          const t0 = iso(60, -10, tz);
          const t1 = iso(63, -10, tz);
          return <line key={kVal} x1={t0[0]} y1={t0[1]} x2={t1[0]} y2={t1[1]} stroke="#7a869b" strokeWidth={0.6} />;
        })}

        {/* Pedestal de apoyo para los bloques */}
        <Box x0={-80} x1={25} y0={-30} y1={20} z0={0} z1={Z_BASE} top="#e8ece8" right="#d8dfd8" left="#c8d0c8" />

        {/* 1. Bloque de CANON (azul tinta oscuro) */}
        <Box
          x0={-75}
          x1={20}
          y0={-25}
          y1={15}
          z0={Z_BASE}
          z1={zCanonTop}
          top="#1e3560"
          right="#12223f"
          left="#0c182e"
          strokeWidth={1.0}
        />
        {/* Rótulo lateral sobre el bloque de Canon */}
        {(() => {
          const lp = iso(-27.5, -25, (Z_BASE + zCanonTop) / 2);
          return (
            <text
              x={lp[0]}
              y={lp[1] + 3}
              fontFamily="Schibsted Grotesk, sans-serif"
              fontSize={9}
              fontWeight={800}
              fill="#ffffff"
              textAnchor="middle"
              letterSpacing="0.04em"
            >
              CANON {cop(canon)}
            </text>
          );
        })()}

        {/* 2. Bloque de ADMINISTRACIÓN (azul tinta suave) */}
        <Box
          x0={-75}
          x1={20}
          y0={-25}
          y1={15}
          z0={zCanonTop}
          z1={zAdminTop}
          top="#5e6e8c"
          right="#4a5873"
          left="#384357"
          strokeWidth={0.9}
        />
        {hAdmin >= 6 &&
          (() => {
            const lp = iso(-27.5, -25, (zCanonTop + zAdminTop) / 2);
            return (
              <text
                x={lp[0]}
                y={lp[1] + 3}
                fontFamily="Schibsted Grotesk, sans-serif"
                fontSize={8}
                fontWeight={700}
                fill="#ffffff"
                textAnchor="middle"
              >
                ADMIN {cop(admin)}
              </text>
            );
          })()}

        {/* 3. Bloque de TRANSPORTE (tono control grisáceo) */}
        <Box
          x0={-75}
          x1={20}
          y0={-25}
          y1={15}
          z0={zAdminTop}
          z1={zTotal}
          top="#929eb5"
          right="#7a869b"
          left="#616c80"
          strokeWidth={0.9}
        />
        {(() => {
          const lp = iso(-27.5, -25, (zAdminTop + zTotal) / 2);
          return (
            <text
              x={lp[0]}
              y={lp[1] + 2.5}
              fontFamily="Schibsted Grotesk, sans-serif"
              fontSize={7.5}
              fontWeight={700}
              fill="#ffffff"
              textAnchor="middle"
            >
              PASAJES {cop(transport)}
            </text>
          );
        })()}

        {/* Brazo medidor / Palpador que conecta el tope del bloque con la corredera */}
        <Box
          x0={20}
          x1={62}
          y0={-7}
          y1={-3}
          z0={zTotal - 2}
          z1={zTotal + 2}
          top="#ffffff"
          right="#e8ece8"
          left="#d0d8d0"
          strokeWidth={0.8}
        />

        {/* Corredera del Total del Mes sobre la columna */}
        <Box
          x0={58}
          x1={82}
          y0={-12}
          y1={12}
          z0={zTotal - 6}
          z1={zTotal + 6}
          top="#ffffff"
          right="#f0f4f0"
          left="#dce2dd"
          strokeWidth={1.0}
        />
        {/* Aguja indicadora que señala en la regla */}
        <polygon
          points={`${pNeedle0[0]},${pNeedle0[1] - 3.5} ${pNeedle1[0]},${pNeedle1[1]} ${pNeedle0[0]},${pNeedle0[1] + 3.5}`}
          fill={inBudget ? '#087a57' : '#8f6316'}
          stroke="#12223f"
          strokeWidth={0.8}
        />

        {/* Placa de lectura del TOTAL DEL MES */}
        <g transform={`translate(${pBadge[0] + 12}, ${pBadge[1] - 13})`}>
          <rect
            x={0}
            y={0}
            width={142}
            height={26}
            rx={4}
            fill="#12223f"
            stroke="#dce2dd"
            strokeWidth={1}
          />
          <circle cx={12} cy={13} r={4} fill={inBudget ? '#087a57' : '#8f6316'} />
          <text
            x={22}
            y={17}
            fontFamily="Schibsted Grotesk, sans-serif"
            fontSize={11}
            fontWeight={800}
            fill="#ffffff"
          >
            TOTAL: {cop(total)}
          </text>
        </g>

        {/* Tope ajustable del presupuesto sobre la columna */}
        <Box
          x0={58}
          x1={82}
          y0={-12}
          y1={12}
          z0={zBudget - 6}
          z1={zBudget + 6}
          top={inBudget ? '#087a57' : '#8f6316'}
          right={inBudget ? '#066346' : '#734e11'}
          left={inBudget ? '#055038' : '#5a3d0d'}
          strokeWidth={1.0}
        />
        {/* Perilla moleteada de ajuste */}
        <Box
          x0={66}
          x1={74}
          y0={-4}
          y1={4}
          z0={zBudget + 6}
          z1={zBudget + 14}
          top="#dce2dd"
          right="#b8c2ba"
          left="#a0aca2"
          strokeWidth={0.7}
        />

        {/* Línea horizontal del tope de presupuesto */}
        <line
          x1={pBudgetLine0[0]}
          y1={pBudgetLine0[1]}
          x2={pBudgetLine1[0]}
          y2={pBudgetLine1[1]}
          stroke={inBudget ? '#087a57' : '#8f6316'}
          strokeWidth={1.5}
          strokeDasharray="4 3"
        />

        {/* Etiqueta flotante del Tope de Presupuesto */}
        <g transform={`translate(${pBudgetLine1[0] - 146}, ${pBudgetLine1[1] - 11})`}>
          <rect
            x={0}
            y={0}
            width={140}
            height={22}
            rx={4}
            fill="#f4f6f3"
            stroke={inBudget ? '#087a57' : '#8f6316'}
            strokeWidth={1}
          />
          <text
            x={8}
            y={15}
            fontFamily="Schibsted Grotesk, sans-serif"
            fontSize={9.5}
            fontWeight={800}
            fill={inBudget ? '#087a57' : '#8f6316'}
          >
            PRESUPUESTO: {cop(budget)}
          </text>
        </g>
      </svg>
    </div>
  );
};

export const MonthGaugeSection: React.FC = () => {
  const ids = useId();

  // Estados interactivos
  const [selectedId, setSelectedId] = useState('5'); // Chapinero Central
  const [profileId, setProfileId] = useState('standard');
  const [budget, setBudget] = useState(2_500_000);

  const property = SAMPLES.find((p) => p.id === selectedId) ?? SAMPLES[0];
  const profile = TRANSPORT_PROFILES.find((pr) => pr.id === profileId) ?? TRANSPORT_PROFILES[0];

  const canon = property.price;
  const admin = property.adminFee;
  const transport = Math.round(property.estimatedTransportMonthly * profile.multiplier);
  const total = canon + admin + transport;

  const diff = budget - total;
  const inBudget = diff >= 0;
  const fill = `${((budget - RANGE_MIN) / (RANGE_MAX - RANGE_MIN)) * 100}%`;

  return (
    <section id="medidor" className="border-t border-rule bg-surface scroll-mt-16">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 py-16 lg:py-24">
        {/* Encabezado editorial */}
        <div className="max-w-[760px]">
          <span className="inline-block text-[12.5px] font-bold text-ink-faint tracking-[0.06em] uppercase mb-2">
            Mecanismo interactivo · Figura isométrica
          </span>
          <h2 className="text-[2.25rem] lg:text-[3.25rem] leading-[1.08] font-extrabold tracking-[-0.03em] text-balance">
            El medidor del mes: la cuenta real del arriendo.
          </h2>
          <p className="mt-4 text-[17px] text-ink-soft max-w-[54ch]">
            En Bogotá el arriendo nunca es solo el canon. El canon, la administración y los pasajes se apilan cada mes.
            Mueve tu presupuesto y comprueba si la suma entra dentro de tu tope.
          </p>
        </div>

        {/* Grilla principal: Figura isométrica a la izquierda y Consola de control a la derecha */}
        <div className="mt-12 lg:mt-16 grid gap-10 lg:grid-cols-[1.1fr_1fr] items-center">
          {/* Columna izquierda: La máquina isométrica */}
          <div className="bg-paper border border-rule rounded-[10px] p-4 sm:p-6 lg:p-8 flex flex-col justify-center items-center shadow-none">
            <MonthGaugeFigure
              canon={canon}
              admin={admin}
              transport={transport}
              budget={budget}
            />

            {/* Leyenda técnica bajo la figura */}
            <div className="mt-4 pt-4 border-t border-rule/70 w-full flex flex-wrap justify-between items-center gap-3 text-[12.5px] text-ink-soft">
              <div className="flex flex-wrap items-center gap-4">
                <span className="inline-flex items-center gap-1.5">
                  <span className="size-3 rounded-[2px] bg-ink" />
                  <span>Canon</span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="size-3 rounded-[2px] bg-ink-soft" />
                  <span>Administración</span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="size-3 rounded-[2px] bg-control" />
                  <span>Pasajes</span>
                </span>
              </div>
              <span className="font-semibold text-ink-faint">
                Escala uniforme: $ 20.000 / subdivisión
              </span>
            </div>
          </div>

          {/* Columna derecha: Consola de control interactivo */}
          <div className="space-y-6">
            {/* 1. Selector de inmueble de prueba */}
            <div className="bg-paper/50 border border-rule rounded-[10px] p-5">
              <label className="block text-[13px] font-semibold text-ink-soft mb-2.5">
                Inmueble de prueba en Bogotá
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {SAMPLES.map((s) => {
                  const active = s.id === selectedId;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setSelectedId(s.id)}
                      className={`text-left p-3 rounded-lg border text-xs transition-colors duration-150 ${
                        active
                          ? 'bg-ink text-white border-ink font-semibold'
                          : 'bg-surface text-ink border-control/40 hover:border-ink'
                      }`}
                    >
                      <strong className="block text-[13px] line-clamp-1">{s.title}</strong>
                      <span className={`block mt-0.5 ${active ? 'text-white/80' : 'text-ink-soft'}`}>
                        {s.zone} · {s.area} m²
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Selector de perfil de transporte */}
            <div className="bg-paper/50 border border-rule rounded-[10px] p-5">
              <label className="block text-[13px] font-semibold text-ink-soft mb-2.5">
                Cómo te mueves en la ciudad
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {TRANSPORT_PROFILES.map((p) => {
                  const active = p.id === profileId;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setProfileId(p.id)}
                      className={`text-left p-3 rounded-lg border text-xs transition-colors duration-150 ${
                        active
                          ? 'bg-ink text-white border-ink font-semibold'
                          : 'bg-surface text-ink border-control/40 hover:border-ink'
                      }`}
                    >
                      <strong className="block text-[13px] line-clamp-1">{p.name.split(' ')[0]}</strong>
                      <span className={`block mt-0.5 text-[11.5px] line-clamp-2 ${active ? 'text-white/80' : 'text-ink-soft'}`}>
                        {p.description}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Control deslizante de presupuesto mensual */}
            <div className="bg-paper/50 border border-rule rounded-[10px] p-5">
              <div className="flex justify-between items-baseline mb-2">
                <label htmlFor={`${ids}-budget`} className="text-[13px] font-semibold text-ink-soft">
                  Tu presupuesto mensual máximo
                </label>
                <output htmlFor={`${ids}-budget`} className="text-[20px] font-extrabold text-ink tracking-tight">
                  {cop(budget)}
                </output>
              </div>
              <input
                id={`${ids}-budget`}
                type="range"
                min={RANGE_MIN}
                max={RANGE_MAX}
                step={50_000}
                value={budget}
                onChange={(e) => setBudget(Number(e.target.value))}
                aria-valuetext={cop(budget)}
                className="folio-range mt-1"
                style={{ ['--fill' as string]: fill } as React.CSSProperties}
              />
              <div className="flex justify-between text-[11px] text-ink-faint mt-1.5 font-semibold">
                <span>{cop(RANGE_MIN)}</span>
                <span>{cop(RANGE_MAX)}</span>
              </div>
            </div>

            {/* 4. Diagnóstico de la cuenta mensual */}
            <div
              className={`p-5 rounded-[10px] border transition-colors duration-200 ${
                inBudget ? 'bg-verified/5 border-verified/40 text-ink' : 'bg-pending/5 border-pending/40 text-ink'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <span
                  className={`size-2.5 rounded-full ${inBudget ? 'bg-verified' : 'bg-pending'}`}
                  aria-hidden="true"
                />
                <span className="text-[13px] font-bold uppercase tracking-wider">
                  {inBudget ? 'Dentro de tu presupuesto' : 'Excede tu presupuesto'}
                </span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1">
                <span className="text-[24px] font-extrabold tracking-tight">
                  Total: {cop(total)} <span className="text-sm font-normal text-ink-soft">al mes</span>
                </span>
                <span className={`text-[14px] font-bold ${inBudget ? 'text-verified' : 'text-pending'}`}>
                  {inBudget ? `Te sobran ${cop(diff)}` : `Faltan ${cop(Math.abs(diff))}`}
                </span>
              </div>

              <dl className="mt-3 pt-3 border-t border-rule grid grid-cols-3 gap-2 text-xs">
                <div>
                  <dt className="text-ink-soft">Canon</dt>
                  <dd className="font-bold text-ink mt-0.5">{cop(canon)}</dd>
                </div>
                <div>
                  <dt className="text-ink-soft">Administración</dt>
                  <dd className="font-bold text-ink mt-0.5">{cop(admin)}</dd>
                </div>
                <div>
                  <dt className="text-ink-soft">Pasajes</dt>
                  <dd className="font-bold text-ink mt-0.5">{cop(transport)}</dd>
                </div>
              </dl>
            </div>

            {/* 5. Botón de enlace hacia la app */}
            <a
              href={appLink(property.zone, budget)}
              className="block w-full text-center bg-ink text-white font-semibold text-[15px] px-6 py-3.5 rounded-lg hover:bg-ink-hover active:scale-[0.98] transition-[background-color,transform] duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
            >
              Buscar arriendos en {property.zone} hasta {cop(budget)}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};
