import React, { useId, useState } from 'react';
import { RANGE_MAX, RANGE_MIN, ZONES, appLink, cop, countFor } from './data';

interface LandingSearchProps {
  compact?: boolean;
}

// El buscador de la landing funciona de verdad: abre la app con la zona y el tope ya aplicados
export const LandingSearch: React.FC<LandingSearchProps> = ({ compact = false }) => {
  const [zone, setZone] = useState('Todas');
  const [max, setMax] = useState(2_500_000);
  const ids = useId();
  const count = countFor(zone, max);
  const fill = `${((max - RANGE_MIN) / (RANGE_MAX - RANGE_MIN)) * 100}%`;

  return (
    <form
      action="/"
      onSubmit={(e) => {
        e.preventDefault();
        window.location.href = appLink(zone, max);
      }}
      className={`bg-surface border border-rule rounded-[10px] p-5 grid gap-4 ${compact ? 'sm:grid-cols-[1fr_1.3fr_auto] sm:items-end' : 'sm:grid-cols-2'}`}
    >
      <div>
        <label htmlFor={`${ids}-zona`} className="block text-[13px] font-semibold text-ink-soft mb-2">
          Zona
        </label>
        <select
          id={`${ids}-zona`}
          value={zone}
          onChange={(e) => setZone(e.target.value)}
          className="w-full bg-surface border border-control rounded-lg px-3 py-2.5 text-sm transition-colors duration-150 hover:border-ink"
        >
          <option value="Todas">Todas las zonas</option>
          {ZONES.map((z) => (
            <option key={z} value={z}>
              {z}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor={`${ids}-max`} className="flex justify-between text-[13px] font-semibold text-ink-soft">
          Total del mes hasta
          <output htmlFor={`${ids}-max`} className="text-ink font-extrabold">
            {cop(max)}
          </output>
        </label>
        <input
          id={`${ids}-max`}
          type="range"
          min={RANGE_MIN}
          max={RANGE_MAX}
          step={50_000}
          value={max}
          onChange={(e) => setMax(Number(e.target.value))}
          aria-valuetext={cop(max)}
          className="folio-range mt-1"
          style={{ ['--fill' as string]: fill } as React.CSSProperties}
        />
      </div>
      <button
        type="submit"
        disabled={count === 0}
        className={`${compact ? '' : 'sm:col-span-2'} bg-ink text-white font-semibold text-[15px] px-6 py-3 rounded-lg hover:bg-ink-hover active:scale-[0.98] disabled:opacity-45 disabled:cursor-not-allowed disabled:active:scale-100 transition-[background-color,transform] duration-150`}
      >
        {count === 0 ? 'Sube el tope para ver arriendos' : `Ver ${count} ${count === 1 ? 'arriendo' : 'arriendos'}`}
      </button>
    </form>
  );
};
