import { INITIAL_PROPERTIES, calculateTotalMonthlyCost } from '../data/mockProperties';
import type { Property } from '../types/property';

// Datos de la landing: los mismos inmuebles de ejemplo de la app, sin cifras inventadas.

export const ALL = INITIAL_PROPERTIES;

// La ficha que se desarma con el scroll: Apartaestudio en Chapinero Central
export const DEMO: Property = INITIAL_PROPERTIES.find((p) => p.id === '5') ?? INITIAL_PROPERTIES[0];

// Las tres opciones de la escena del comparador (las dos de la app y una más)
export const COMPARE: Property[] = ['5', '3', '1']
  .map((id) => INITIAL_PROPERTIES.find((p) => p.id === id))
  .filter((p): p is Property => Boolean(p));

export const totalOf = (p: Property) => calculateTotalMonthlyCost(p, 1);
export const transportOf = (p: Property) => p.estimatedTransportMonthly;

export const ZONES = Array.from(new Set(INITIAL_PROPERTIES.map((p) => p.zone)));

export const RANGE_MIN = 1_500_000;
export const RANGE_MAX = 3_500_000;

export const countFor = (zone: string, max: number) =>
  INITIAL_PROPERTIES.filter((p) => (zone === 'Todas' || p.zone === zone) && totalOf(p) <= max).length;

// Enlace a la app con los filtros puestos; "desde=landing" deja medir cuántos pasan a la app
export const appLink = (zone: string, max: number) => {
  const params = new URLSearchParams({ desde: 'landing', max: String(max) });
  if (zone !== 'Todas') params.set('zona', zone);
  return `/?${params.toString()}#buscar`;
};

export const cop = (v: number) => `$ ${v.toLocaleString('es-CO')}`;
export const num = (v: number) => v.toLocaleString('es-CO');
