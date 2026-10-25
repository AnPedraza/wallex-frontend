import React, { useEffect, useMemo, useState } from 'react';
import type { Property } from '../types/property';
import { INITIAL_PROPERTIES, TRANSPORT_PROFILES, calculateTotalMonthlyCost, formatCOP } from '../data/mockProperties';
import { PropertyDetail } from './PropertyDetail';
import { VerificationStamp, type SealStatus } from './FolioSeal';
import type { Property as DetailProperty } from '../data/properties';
import { sampleFolio } from '../data/folio';
import { TRANSPORT_LABELS } from '../data/transportLabels';

interface PropertyPortalProps {
  comparisonIds?: string[];
  onToggleComparison?: (propertyId: string) => void;
  onOpenComparer?: () => void;
  onContactProperty?: (property: Property) => void;
  // Perfil de transporte compartido con el comparador (si no llega, se maneja aquí)
  transportProfileId?: string;
  onTransportProfileChange?: (id: string) => void;
}

type SortKey = 'total-asc' | 'total-desc' | 'area-desc';

const RANGE_MIN = 1_500_000;
const RANGE_MAX = 3_500_000;
const RANGE_STEP = 50_000;
const DEFAULT_MAX = 3_000_000;
const BIN_SIZE = 250_000;

const num = (value: number) => value.toLocaleString('es-CO');

// Filtros que llegan desde la landing (/?zona=...&max=...); si no sirven, se usan los de siempre
const initialFilters = () => {
  const params = new URLSearchParams(window.location.search);
  const zone = params.get('zona');
  const max = Number(params.get('max'));
  return {
    zone: zone && INITIAL_PROPERTIES.some((p) => p.zone === zone) ? zone : 'Todas',
    maxTotal: max >= RANGE_MIN && max <= RANGE_MAX ? Math.round(max / RANGE_STEP) * RANGE_STEP : DEFAULT_MAX,
  };
};

const sealStatus = (p: Property): SealStatus => (!p.verified ? 'unverified' : p.certified ? 'verified' : 'pending');

const folioOf = (p: Property) => sampleFolio(p.id, p.title, p.zone);

const toDetail = (property: Property): DetailProperty => ({
  ...property,
  images: [property.image],
  description: `${property.title} ubicado en ${property.location}. ${property.transitAccess}.`,
  requiresCoSigner: property.requirements.guarantorRequired,
  requirements: [
    {
      label: property.requirements.guarantorRequired ? 'Codeudor con finca raíz en Bogotá' : 'Sin codeudor con finca raíz',
      required: property.requirements.guarantorRequired,
      detail: property.requirements.notes,
    },
    {
      label: `Demostración de ingresos de ${property.requirements.minIncomeMultiplier}x el valor de arriendo`,
      required: true,
    },
  ],
});

// Cada dato se mantiene completo en una línea; los cortes caen entre datos
const Segments: React.FC<{ items: string[]; joiner: string }> = ({ items, joiner }) => (
  <>
    {items.map((item, k) => (
      <React.Fragment key={item}>
        {k > 0 && joiner}
        <span className="whitespace-nowrap">{item}</span>
      </React.Fragment>
    ))}
  </>
);

const fieldClass =
  'w-full bg-surface border border-control rounded-lg px-3 py-2.5 text-sm text-ink focus-visible:outline-2 focus-visible:outline-ink';

export const PropertyPortal: React.FC<PropertyPortalProps> = ({
  comparisonIds = [],
  onToggleComparison,
  onOpenComparer,
  onContactProperty,
  transportProfileId,
  onTransportProfileChange,
}) => {
  const [zone, setZone] = useState(() => initialFilters().zone);
  const [maxTotal, setMaxTotal] = useState(() => initialFilters().maxTotal);
  const [onlyVerified, setOnlyVerified] = useState(false);
  const [noGuarantor, setNoGuarantor] = useState(false);
  const [petsOk, setPetsOk] = useState(false);
  const [localTransportId, setLocalTransportId] = useState('standard');
  const transportId = transportProfileId ?? localTransportId;
  const setTransportId = onTransportProfileChange ?? setLocalTransportId;
  const [sort, setSort] = useState<SortKey>('total-asc');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [showKycModal, setShowKycModal] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [detail, setDetail] = useState<{ property: DetailProperty; transport: number; folio: string | null } | null>(null);
  const [overFooter, setOverFooter] = useState(false);

  // La barra del comparador se invierte cuando pasa sobre el pie de página (mismo color tinta)
  useEffect(() => {
    const footer = document.querySelector('footer');
    if (!footer || !('IntersectionObserver' in window)) return;
    const observer = new IntersectionObserver(([entry]) => setOverFooter(entry.isIntersecting), {
      rootMargin: '0px 0px -16px 0px',
    });
    observer.observe(footer);
    return () => observer.disconnect();
  }, []);

  const multiplier = TRANSPORT_PROFILES.find((t) => t.id === transportId)?.multiplier ?? 1;
  const zones = useMemo(() => Array.from(new Set(INITIAL_PROPERTIES.map((p) => p.zone))), []);

  const withTotals = useMemo(
    () =>
      INITIAL_PROPERTIES.map((p) => ({
        property: p,
        transport: Math.round(p.estimatedTransportMonthly * multiplier),
        total: calculateTotalMonthlyCost(p, multiplier),
      })),
    [multiplier]
  );

  // Todo menos el tope de precio: es lo que dibuja el histograma
  const beforePrice = withTotals.filter(({ property: p }) => {
    if (zone !== 'Todas' && p.zone !== zone) return false;
    if (onlyVerified && !p.verified) return false;
    if (noGuarantor && p.requirements.guarantorRequired) return false;
    if (petsOk && !p.requirements.petsAllowed) return false;
    return true;
  });

  const results = beforePrice
    .filter(({ total }) => total <= maxTotal)
    .sort((a, b) =>
      sort === 'total-asc' ? a.total - b.total : sort === 'total-desc' ? b.total - a.total : b.property.area - a.property.area
    );

  const bins = Array.from({ length: (RANGE_MAX - RANGE_MIN) / BIN_SIZE }, (_, k) => {
    const from = RANGE_MIN + k * BIN_SIZE;
    return { from, count: beforePrice.filter(({ total }) => total >= from && total < from + BIN_SIZE).length };
  });
  const tallest = Math.max(1, ...bins.map((b) => b.count));

  const activeFilters =
    (zone !== 'Todas' ? 1 : 0) + (maxTotal !== DEFAULT_MAX ? 1 : 0) + Number(onlyVerified) + Number(noGuarantor) + Number(petsOk);
  const verifiedCount = results.filter((r) => r.property.verified).length;
  const cheapest = results.length ? Math.min(...results.map((r) => r.total)) : 0;
  const fill = `${((maxTotal - RANGE_MIN) / (RANGE_MAX - RANGE_MIN)) * 100}%`;

  const resetFilters = () => {
    setZone('Todas');
    setMaxTotal(DEFAULT_MAX);
    setOnlyVerified(false);
    setNoGuarantor(false);
    setPetsOk(false);
    setTransportId('standard');
  };

  const handleContact = (property: Property) => {
    setSelectedProperty(property);
    if (onContactProperty) onContactProperty(property);
    else setShowKycModal(true);
  };

  const handleContactFromDetail = (property: DetailProperty) => {
    setDetail(null);
    const matched = INITIAL_PROPERTIES.find((p) => p.id === property.id);
    if (matched) handleContact(matched);
  };

  const checkbox = (id: string, label: string, checked: boolean, onChange: (v: boolean) => void) => (
    <label htmlFor={id} className="flex items-center gap-2.5 py-1 text-sm cursor-pointer">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="size-4 accent-ink cursor-pointer"
      />
      {label}
    </label>
  );

  return (
    <div className="bg-paper min-h-screen pb-28">
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-10 py-6 lg:py-8 lg:grid lg:grid-cols-[288px_minmax(0,1fr)] lg:gap-7 lg:items-start">
        {/* Filtros: columna fija en escritorio, panel plegable en celular */}
        <div className="lg:hidden mb-4 flex gap-3">
          <button
            type="button"
            onClick={() => setFiltersOpen((v) => !v)}
            aria-expanded={filtersOpen}
            aria-controls="filtros"
            className="flex-1 flex items-center justify-between bg-surface border border-control rounded-lg px-4 py-3 text-sm font-semibold"
          >
            <span>Filtros{activeFilters > 0 ? ` (${activeFilters})` : ''}</span>
            <svg className={`size-4 transition-transform ${filtersOpen ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>
        </div>

        <aside
          id="filtros"
          aria-label="Filtros"
          className={`${filtersOpen ? 'block' : 'hidden'} lg:block bg-surface border border-rule rounded-[10px] p-5 mb-6 lg:mb-0 lg:sticky lg:top-[88px]`}
        >
          <div className="flex items-baseline justify-between">
            <h2 className="text-base font-bold">Filtrar</h2>
            <button type="button" onClick={resetFilters} className="text-sm font-medium text-verified hover:underline">
              Limpiar
            </button>
          </div>

          <div className="mt-4 pt-4 border-t border-rule">
            <label htmlFor="f-zona" className="block text-[13px] font-semibold text-ink-soft mb-2">
              Zona
            </label>
            <select id="f-zona" value={zone} onChange={(e) => setZone(e.target.value)} className={fieldClass}>
              <option value="Todas">Todas las zonas</option>
              {zones.map((z) => (
                <option key={z} value={z}>
                  {z}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-4 pt-4 border-t border-rule">
            <label htmlFor="f-total" className="block text-[13px] font-semibold text-ink-soft">
              Total del mes máximo
            </label>
            <div className="flex items-baseline justify-between mt-1">
              <output htmlFor="f-total" className="text-xl font-extrabold tracking-[-0.02em]">
                {formatCOP(maxTotal)}
              </output>
              <span className="text-[13px] text-ink-soft">
                {results.length} de {beforePrice.length}
              </span>
            </div>
            <div className="flex items-end gap-[3px] h-9 mt-3" aria-hidden="true">
              {bins.map((b) => (
                <span
                  key={b.from}
                  className={`flex-1 rounded-t-[2px] ${b.from < maxTotal ? 'bg-ink' : 'bg-rule'}`}
                  style={{ height: b.count ? `${(b.count / tallest) * 100}%` : '2px' }}
                />
              ))}
            </div>
            <input
              id="f-total"
              type="range"
              min={RANGE_MIN}
              max={RANGE_MAX}
              step={RANGE_STEP}
              value={maxTotal}
              onChange={(e) => setMaxTotal(Number(e.target.value))}
              aria-valuetext={formatCOP(maxTotal)}
              className="folio-range -mt-px"
              style={{ ['--fill' as string]: fill } as React.CSSProperties}
            />
            <div className="flex justify-between text-xs text-ink-faint">
              <span>{formatCOP(RANGE_MIN)}</span>
              <span>{formatCOP(RANGE_MAX)}</span>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-rule">
            <label htmlFor="f-verificados" className="flex items-center justify-between gap-3 text-sm cursor-pointer">
              Solo quien publica verificado
              <input
                id="f-verificados"
                type="checkbox"
                role="switch"
                checked={onlyVerified}
                onChange={(e) => setOnlyVerified(e.target.checked)}
                className="peer sr-only"
              />
              <span
                aria-hidden="true"
                className="relative w-10 h-6 shrink-0 rounded-full bg-control transition-colors peer-checked:bg-verified peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ink after:absolute after:top-1 after:left-1 after:size-4 after:rounded-full after:bg-surface after:transition-transform peer-checked:after:translate-x-4"
              />
            </label>
          </div>

          <div role="group" aria-labelledby="f-requisitos" className="mt-4 pt-4 border-t border-rule">
            <p id="f-requisitos" className="text-[13px] font-semibold text-ink-soft mb-1.5">
              Requisitos
            </p>
            {checkbox('f-codeudor', 'Sin codeudor', noGuarantor, setNoGuarantor)}
            {checkbox('f-mascotas', 'Acepta mascotas', petsOk, setPetsOk)}
          </div>

          <div className="mt-4 pt-4 border-t border-rule">
            <label htmlFor="f-transporte" className="block text-[13px] font-semibold text-ink-soft mb-2">
              Cómo te mueves
            </label>
            <select id="f-transporte" value={transportId} onChange={(e) => setTransportId(e.target.value)} className={fieldClass}>
              {TRANSPORT_PROFILES.map((t) => (
                <option key={t.id} value={t.id}>
                  {TRANSPORT_LABELS[t.id] ?? t.name}
                </option>
              ))}
            </select>
            <p className="text-xs text-ink-faint mt-2">Cambia el transporte estimado de cada inmueble.</p>
          </div>
        </aside>

        <section aria-labelledby="titulo-catalogo">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-5">
            <div>
              <h1 id="titulo-catalogo" className="text-[2rem] sm:text-[2.375rem] font-extrabold tracking-[-0.03em] leading-none">
                Arriendos en Bogotá
              </h1>
              <p className="text-[15px] text-ink-soft mt-2.5">
                {results.length > 0 ? (
                  <>
                    <b className="text-ink">
                      {results.length} {results.length === 1 ? 'inmueble' : 'inmuebles'}
                    </b>{' '}
                    con la misma ficha, <b className="text-ink">{verifiedCount}</b> con identidad verificada, desde{' '}
                    <b className="text-ink">{formatCOP(cheapest)}</b> al mes.
                  </>
                ) : (
                  'Ningún inmueble cumple estos filtros.'
                )}
              </p>
            </div>
            <div className="sm:w-56">
              <label htmlFor="f-orden" className="block text-[13px] text-ink-soft mb-1.5">
                Ordenar por
              </label>
              <select id="f-orden" value={sort} onChange={(e) => setSort(e.target.value as SortKey)} className={fieldClass}>
                <option value="total-asc">Menor total del mes</option>
                <option value="total-desc">Mayor total del mes</option>
                <option value="area-desc">Más metros cuadrados</option>
              </select>
            </div>
          </div>

          {results.length === 0 ? (
            <div className="bg-surface border border-rule rounded-[10px] px-6 py-12 text-center">
              <p className="text-lg font-bold">No hay arriendos con esos filtros</p>
              <p className="text-sm text-ink-soft mt-1.5">Prueba subir el tope del total del mes o quitar un requisito.</p>
              <button
                type="button"
                onClick={resetFilters}
                className="mt-5 bg-ink text-white font-semibold text-sm px-5 py-2.5 rounded-lg hover:bg-ink-hover"
              >
                Limpiar filtros
              </button>
            </div>
          ) : (
            <ul className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {results.map(({ property, transport, total }) => {
                const inCompare = comparisonIds.includes(property.id);
                const status = sealStatus(property);
                const req = property.requirements;
                const openDetail = () =>
                  setDetail({ property: toDetail(property), transport, folio: property.verified ? folioOf(property) : null });

                return (
                  <li key={property.id} className="bg-surface border border-rule rounded-[10px] overflow-hidden flex flex-col">
                    <div className="relative aspect-[16/10] bg-rule">
                      <img src={property.image} alt="" className="absolute inset-0 size-full object-cover" loading="lazy" />
                      {onToggleComparison && (
                        <button
                          type="button"
                          onClick={() => onToggleComparison(property.id)}
                          aria-pressed={inCompare}
                          aria-label={`${inCompare ? 'Quitar del comparador' : 'Agregar al comparador'}: ${property.title}`}
                          className={`absolute top-2.5 right-2.5 flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[13px] font-semibold transition-colors ${
                            inCompare ? 'bg-ink text-white' : 'bg-surface text-ink hover:bg-paper'
                          }`}
                        >
                          <span
                            aria-hidden="true"
                            className={`size-[15px] rounded-[3px] border-[1.5px] flex items-center justify-center ${
                              inCompare ? 'border-white bg-white' : 'border-ink'
                            }`}
                          >
                            {inCompare && (
                              <svg viewBox="0 0 12 12" className="size-2.5" fill="none" stroke="var(--color-ink)" strokeWidth="2">
                                <path d="M2.5 6.2l2.3 2.3 4.7-5" />
                              </svg>
                            )}
                          </span>
                          {inCompare ? 'En comparador' : 'Comparar'}
                        </button>
                      )}
                    </div>

                    <div className="px-4 pt-3.5 pb-3 flex-1">
                      <h3 className="text-[17px] font-bold tracking-[-0.01em] leading-snug">
                        <button type="button" onClick={openDetail} className="text-left hover:underline">
                          {property.title}
                        </button>
                      </h3>
                      <p className="text-[13px] text-ink-soft mt-1">
                        {property.area} m² · {property.bedrooms} hab · {property.bathrooms} {property.bathrooms === 1 ? 'baño' : 'baños'} ·{' '}
                        {property.location.replace(', Bogotá', '')}
                      </p>
                      <p className="mt-3 flex items-baseline gap-1.5">
                        <strong className="text-[28px] font-extrabold tracking-[-0.02em] leading-none">{formatCOP(total)}</strong>
                        <span className="text-[13px] text-ink-soft">al mes</span>
                      </p>
                      <p className="text-[12.5px] text-ink-soft mt-1.5">
                        <Segments items={[`Canon ${num(property.price)}`, `admin ${num(property.adminFee)}`, `transporte ${num(transport)}`]} joiner=" + " />
                      </p>
                      <p className="text-[13px] mt-2.5">
                        <Segments
                          items={[
                            req.guarantorRequired ? 'Pide codeudor' : 'Sin codeudor',
                            `depósito ${formatCOP(property.deposit)}`,
                            `mascotas ${req.petsAllowed ? 'sí' : 'no'}`,
                          ]}
                          joiner=" · "
                        />
                      </p>
                    </div>

                    <div className="px-4 py-2.5 border-t border-rule">
                      <VerificationStamp seed={property.id} status={status} folio={property.verified ? folioOf(property) : null} />
                    </div>

                    <div className="grid grid-cols-2 gap-2 px-4 pb-4">
                      <button
                        type="button"
                        onClick={openDetail}
                        className="border border-ink rounded-lg py-2 text-sm font-semibold hover:bg-paper"
                      >
                        Ver ficha
                      </button>
                      <button
                        type="button"
                        onClick={() => handleContact(property)}
                        className="bg-ink text-white rounded-lg py-2 text-sm font-semibold hover:bg-ink-hover"
                      >
                        Contactar
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>

      {/* Barra del comparador */}
      {comparisonIds.length > 0 && onOpenComparer && (
        <div className="fixed bottom-4 inset-x-0 z-30 px-4 flex justify-center pointer-events-none">
          <div
            className={`pointer-events-auto rounded-[10px] pl-5 pr-2 py-2 flex items-center gap-5 ring-1 transition-colors duration-200 ${
              overFooter ? 'bg-surface text-ink ring-rule' : 'bg-ink text-white ring-white/15'
            }`}
          >
            <p className="text-sm">
              <b>
                {comparisonIds.length} de 3
              </b>{' '}
              para comparar<span className="hidden sm:inline"> lado a lado</span>
            </p>
            <button
              type="button"
              onClick={onOpenComparer}
              className={`font-semibold text-sm px-4 py-2 rounded-lg transition-colors duration-200 ${
                overFooter ? 'bg-ink text-white hover:bg-ink-hover' : 'bg-surface text-ink hover:bg-paper focus-visible:outline-white'
              }`}
            >
              Abrir comparador
            </button>
          </div>
        </div>
      )}

      {detail && (
        <PropertyDetail
          property={detail.property}
          transport={{ amount: detail.transport, label: TRANSPORT_LABELS[transportId] ?? 'Transporte estimado' }}
          folio={detail.folio}
          onClose={() => setDetail(null)}
          onContact={handleContactFromDetail}
        />
      )}

      {/* KYC de respaldo, solo si quien integra no pasa onContactProperty */}
      {showKycModal && selectedProperty && (
        <div className="fixed inset-0 bg-ink/50 flex items-center justify-center p-4 z-50">
          <div className="bg-surface rounded-[10px] p-6 max-w-md w-full border border-rule space-y-5 relative">
            <button
              type="button"
              onClick={() => setShowKycModal(false)}
              className="absolute top-4 right-4 text-ink-soft hover:text-ink size-8 rounded-full flex items-center justify-center"
              aria-label="Cerrar"
            >
              <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <h3 className="text-xl font-bold pr-8">Verifica tu identidad para contactar</h3>
            <p className="text-sm text-ink-soft">
              Para proteger a ambas partes, Wallex verifica tu perfil antes de compartir el contacto de{' '}
              <span className="font-semibold text-ink">{selectedProperty.title}</span>.
            </p>
            <button
              type="button"
              onClick={() => {
                alert('Verificación simulada: en este prototipo no se envía ningún correo.');
                setShowKycModal(false);
              }}
              className="w-full bg-ink text-white font-semibold py-3 rounded-lg hover:bg-ink-hover text-sm"
            >
              Completar verificación
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
