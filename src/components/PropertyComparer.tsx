import React, { useState, useMemo } from 'react';
import type { Property, TransportProfile } from '../types/property';
import { TRANSPORT_PROFILES, calculatePricePerM2, formatCOP } from '../data/mockProperties';
import { VerificationStamp, type SealStatus } from './FolioSeal';
import { sampleFolio } from '../data/folio';
import { TRANSPORT_LABELS } from '../data/transportLabels';

interface PropertyComparerProps {
  properties: Property[];
  availableProperties: Property[];
  onRemoveProperty: (id: string) => void;
  onAddProperty: (property: Property) => void;
  onReplaceProperty: (oldId: string, newProperty: Property) => void;
  onContactProperty: (property: Property) => void;
  onClose?: () => void;
  // Perfil de transporte compartido con el catálogo, para que los totales coincidan
  transportProfileId?: string;
  onTransportProfileChange?: (id: string) => void;
}

const sealStatus = (p: Property): SealStatus => (!p.verified ? 'unverified' : p.certified ? 'verified' : 'pending');

// Colores del desglose: tres tonos de la misma tinta, nunca colores de estado
const SEGMENTS = [
  { key: 'price', label: 'Canon', className: 'bg-ink' },
  { key: 'adminFee', label: 'Administración', className: 'bg-ink-soft' },
  { key: 'transport', label: 'Transporte', className: 'bg-control' },
] as const;

export const PropertyComparer: React.FC<PropertyComparerProps> = ({
  properties,
  availableProperties,
  onRemoveProperty,
  onAddProperty,
  onReplaceProperty,
  onContactProperty,
  onClose,
  transportProfileId,
  onTransportProfileChange,
}) => {
  const [localProfileId, setLocalProfileId] = useState('standard');
  const selectedProfileId = transportProfileId ?? localProfileId;
  const setSelectedProfileId = onTransportProfileChange ?? setLocalProfileId;

  const [customTransportDayRate, setCustomTransportDayRate] = useState<number>(7100); // 2 pasajes TransMilenio ($3.550 c/u)
  const [commuteDaysPerMonth, setCommuteDaysPerMonth] = useState<number>(22);
  const [isCustomTransport, setIsCustomTransport] = useState<boolean>(false);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [replacingId, setReplacingId] = useState<string | null>(null);

  const activeProfile = useMemo<TransportProfile>(
    () => TRANSPORT_PROFILES.find((p) => p.id === selectedProfileId) || TRANSPORT_PROFILES[0],
    [selectedProfileId]
  );

  // Transporte por inmueble: perfil compartido o ajuste manual de esta vista
  const getTransportForProperty = React.useCallback(
    (prop: Property): number => {
      if (isCustomTransport) {
        // Ajuste proporcional según la zona y los días elegidos
        const zoneWeight = prop.zone === 'Chapinero' ? 0.75 : prop.zone === 'Teusaquillo' ? 0.9 : 1.3;
        return Math.round(customTransportDayRate * commuteDaysPerMonth * zoneWeight);
      }
      return Math.round(prop.estimatedTransportMonthly * activeProfile.multiplier);
    },
    [isCustomTransport, customTransportDayRate, commuteDaysPerMonth, activeProfile]
  );

  const calculatedMetrics = useMemo(
    () =>
      properties.map((p) => {
        const transport = getTransportForProperty(p);
        const totalMonthly = p.price + p.adminFee + transport;
        return {
          property: p,
          transport,
          totalMonthly,
          pricePerM2: calculatePricePerM2(p),
          firstMonthUpfront: totalMonthly + p.deposit,
        };
      }),
    [properties, getTransportForProperty]
  );

  const totals = calculatedMetrics.map((m) => m.totalMonthly);
  const lowestTotalMonthly = totals.length ? Math.min(...totals) : 0;
  const highestTotalMonthly = totals.length ? Math.max(...totals) : 0;
  const lowestPricePerM2 = calculatedMetrics.length ? Math.min(...calculatedMetrics.map((m) => m.pricePerM2)) : 0;
  const comparing = calculatedMetrics.length > 1;

  const unselectedProperties = useMemo(() => {
    const currentIds = new Set(properties.map((p) => p.id));
    return availableProperties.filter((p) => !currentIds.has(p.id));
  }, [properties, availableProperties]);

  const openAdd = (replace: string | null) => {
    setReplacingId(replace);
    setShowAddModal(true);
  };

  const transportLabel = isCustomTransport
    ? `Ajuste manual: ${commuteDaysPerMonth} días, ${formatCOP(customTransportDayRate)} al día`
    : TRANSPORT_LABELS[activeProfile.id] ?? activeProfile.name;

  const fill = (value: number, min: number, max: number) =>
    ({ ['--fill' as string]: `${((value - min) / (max - min)) * 100}%` }) as React.CSSProperties;

  const tabClass = (on: boolean) =>
    `px-3.5 py-2 rounded-lg text-sm font-semibold transition-colors ${on ? 'bg-ink text-white' : 'text-ink-soft hover:bg-paper'}`;

  type Metric = (typeof calculatedMetrics)[number];

  // Filas de la tabla: etiqueta en la primera columna fija y un valor por inmueble
  const row = (label: React.ReactNode, render: (m: Metric) => React.ReactNode, strong = false) => (
    <tr className="border-t border-rule">
      <th scope="row" className={`text-left align-top p-4 sticky left-0 bg-surface text-sm ${strong ? 'font-bold' : 'font-medium text-ink-soft'}`}>
        {label}
      </th>
      {calculatedMetrics.map((m) => (
        <td key={m.property.id} className="align-top p-4 text-sm">
          {render(m)}
        </td>
      ))}
    </tr>
  );

  const section = (title: string) => (
    <tr className="border-t border-ink">
      <th colSpan={calculatedMetrics.length + 1} scope="colgroup" className="text-left px-4 pt-6 pb-2 text-base font-bold sticky left-0 bg-surface">
        {title}
      </th>
    </tr>
  );

  const lowestMark = <span className="ml-2 text-[12.5px] font-semibold underline decoration-2 underline-offset-4">Menor</span>;

  return (
    <div className="min-h-screen bg-paper pb-20">
      {/* Encabezado fijo bajo la barra de navegación */}
      <div className="bg-surface border-b border-rule lg:sticky lg:top-[68px] z-30">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-col items-start sm:flex-row sm:items-center gap-3 sm:gap-4 min-w-0">
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="flex items-center gap-1.5 text-sm font-semibold border border-control rounded-lg px-3 py-2 hover:bg-paper shrink-0"
              >
                <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M15 5l-7 7 7 7" />
                </svg>
                Volver al catálogo
              </button>
            )}
            <div className="min-w-0">
              <h1 className="text-[2rem] lg:text-[2.375rem] font-extrabold tracking-[-0.03em] leading-none">Comparador lado a lado</h1>
              <p className="text-sm text-ink-soft mt-2 hidden sm:block">Lo que pagarías cada mes: canon, administración y transporte estimado en Bogotá.</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-ink-soft px-1">{properties.length} de 3 inmuebles</span>
            {properties.length < 3 && unselectedProperties.length > 0 && (
              <button
                type="button"
                onClick={() => openAdd(null)}
                className="bg-ink text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-ink-hover"
              >
                Agregar inmueble
              </button>
            )}
            <button
              type="button"
              onClick={() => window.print()}
              className="flex items-center gap-1.5 text-sm font-semibold border border-control rounded-lg px-3 py-2 hover:bg-paper"
            >
              <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                <path d="M7 9V3h10v6M7 17H5a2 2 0 01-2-2v-4a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2h-2M7 14h10v7H7z" />
              </svg>
              <span className="hidden sm:inline">Imprimir o guardar PDF</span>
              <span className="sm:hidden">PDF</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 pt-6 space-y-6">
        {properties.length < 2 && (
          <div className="bg-surface border border-rule rounded-[10px] p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold">Elige al menos 2 inmuebles para comparar</h2>
              <p className="text-sm text-ink-soft mt-1">Con dos o tres opciones lado a lado ves cuál te sale más barata al mes y qué te piden en cada una.</p>
            </div>
            {unselectedProperties.length > 0 && (
              <button type="button" onClick={() => openAdd(null)} className="shrink-0 bg-ink text-white text-sm font-semibold px-4 py-2.5 rounded-lg hover:bg-ink-hover">
                Elegir del catálogo
              </button>
            )}
          </div>
        )}

        {/* Transporte: perfiles compartidos con el catálogo o ajuste manual */}
        <section aria-labelledby="cmp-transporte" className="bg-surface border border-rule rounded-[10px] p-5">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div>
              <h2 id="cmp-transporte" className="text-base font-bold">
                Cómo te mueves
              </h2>
              <p className="text-sm text-ink-soft mt-1 max-w-[65ch]">
                Un arriendo más barato lejos de tu universidad o trabajo puede salir más caro al sumar pasajes. Tarifa TransMilenio: $ 3.550.
              </p>
            </div>
            <div className="flex gap-1 bg-paper rounded-lg p-1 self-start" role="group" aria-label="Forma de calcular el transporte">
              <button type="button" aria-pressed={!isCustomTransport} onClick={() => setIsCustomTransport(false)} className={tabClass(!isCustomTransport)}>
                Perfiles
              </button>
              <button type="button" aria-pressed={isCustomTransport} onClick={() => setIsCustomTransport(true)} className={tabClass(isCustomTransport)}>
                Ajuste manual
              </button>
            </div>
          </div>

          {!isCustomTransport ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4" role="radiogroup" aria-label="Perfil de transporte">
              {TRANSPORT_PROFILES.map((profile) => {
                const on = selectedProfileId === profile.id;
                return (
                  <button
                    key={profile.id}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    onClick={() => setSelectedProfileId(profile.id)}
                    className={`text-left p-3.5 rounded-lg border transition-colors ${on ? 'border-ink ring-1 ring-ink' : 'border-rule hover:border-control'}`}
                  >
                    <span className="flex items-center gap-2.5 text-sm font-semibold">
                      <span aria-hidden="true" className={`size-4 rounded-full border-[1.5px] border-ink flex items-center justify-center shrink-0`}>
                        {on && <span className="size-2 rounded-full bg-ink" />}
                      </span>
                      {TRANSPORT_LABELS[profile.id] ?? profile.name}
                    </span>
                    <span className="block text-[13px] text-ink-soft mt-1.5 leading-snug pl-[26px]">{profile.description}</span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-4">
              <div>
                <label htmlFor="cmp-dias" className="flex justify-between text-sm font-semibold">
                  Días de traslado al mes <output htmlFor="cmp-dias">{commuteDaysPerMonth} días</output>
                </label>
                <input
                  id="cmp-dias"
                  type="range"
                  min="5"
                  max="30"
                  step="1"
                  value={commuteDaysPerMonth}
                  onChange={(e) => setCommuteDaysPerMonth(Number(e.target.value))}
                  className="folio-range mt-2"
                  style={fill(commuteDaysPerMonth, 5, 30)}
                />
                <div className="flex justify-between text-xs text-ink-faint">
                  <span>5 días</span>
                  <span>22 días hábiles</span>
                  <span>30 días</span>
                </div>
              </div>
              <div>
                <label htmlFor="cmp-pasajes" className="flex justify-between text-sm font-semibold">
                  Gasto diario en pasajes <output htmlFor="cmp-pasajes">{formatCOP(customTransportDayRate)}</output>
                </label>
                <input
                  id="cmp-pasajes"
                  type="range"
                  min="3550"
                  max="21300"
                  step="3550"
                  value={customTransportDayRate}
                  onChange={(e) => setCustomTransportDayRate(Number(e.target.value))}
                  aria-valuetext={formatCOP(customTransportDayRate)}
                  className="folio-range mt-2"
                  style={fill(customTransportDayRate, 3550, 21300)}
                />
                <div className="flex justify-between text-xs text-ink-faint">
                  <span>1 pasaje</span>
                  <span>Ida y vuelta</span>
                  <span>Con transbordos</span>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Opciones: misma escala para el total, así la diferencia se ve sin calcular */}
        {properties.length > 0 && (
          <section aria-label="Opciones en comparación">
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px] text-ink-soft mb-3" aria-hidden="true">
              {SEGMENTS.map((s) => (
                <span key={s.key} className="flex items-center gap-1.5">
                  <span className={`size-2.5 rounded-[2px] ${s.className}`} />
                  {s.label}
                </span>
              ))}
              <span>· Barras a la misma escala</span>
            </div>

            <ul className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {calculatedMetrics.map(({ property, transport, totalMonthly }, index) => {
                const isLowest = comparing && totalMonthly === lowestTotalMonthly;
                const diff = totalMonthly - lowestTotalMonthly;
                const parts = { price: property.price, adminFee: property.adminFee, transport };
                const status = sealStatus(property);

                return (
                  <li key={property.id} className={`bg-surface border rounded-[10px] overflow-hidden flex flex-col ${isLowest ? 'border-ink ring-1 ring-ink' : 'border-rule'}`}>
                    <div className="relative aspect-[16/9] bg-rule">
                      <img src={property.image} alt="" className="absolute inset-0 size-full object-cover" />
                      <span className="absolute top-2.5 left-2.5 bg-ink text-white text-[13px] font-semibold px-2.5 py-1 rounded-md">Opción {index + 1}</span>
                      <div className="absolute top-2.5 right-2.5 flex gap-1.5">
                        {unselectedProperties.length > 0 && (
                          <button type="button" onClick={() => openAdd(property.id)} className="bg-surface text-[13px] font-semibold px-2.5 py-1 rounded-md hover:bg-paper">
                            Cambiar
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => onRemoveProperty(property.id)}
                          aria-label={`Quitar ${property.title} del comparador`}
                          className="bg-surface size-7 rounded-md flex items-center justify-center hover:bg-paper"
                        >
                          <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
                            <path d="M6 6l12 12M18 6L6 18" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    <div className="px-4 pt-3.5 pb-4 flex-1 flex flex-col">
                      <h3 className="text-[17px] font-bold tracking-[-0.01em] leading-snug">{property.title}</h3>
                      <p className="text-[13px] text-ink-soft mt-1">{property.location}</p>

                      <p className="mt-3 flex items-baseline gap-1.5">
                        <strong className="text-[28px] font-extrabold tracking-[-0.02em] leading-none">{formatCOP(totalMonthly)}</strong>
                        <span className="text-[13px] text-ink-soft">al mes</span>
                      </p>
                      {comparing && (
                        <p className="text-[13px] mt-1.5 font-semibold">
                          {isLowest ? 'La opción más barata al mes' : <span className="text-ink-soft font-normal">{formatCOP(diff)} más al mes que la más barata</span>}
                        </p>
                      )}

                      {/* Barra a escala del total más alto */}
                      <div className="mt-3 h-3 bg-paper rounded-[2px] overflow-hidden" aria-hidden="true">
                        <div className="h-full flex gap-px" style={{ width: `${(totalMonthly / highestTotalMonthly) * 100}%` }}>
                          {SEGMENTS.map((s) => (
                            <span key={s.key} className={s.className} style={{ width: `${(parts[s.key] / totalMonthly) * 100}%` }} />
                          ))}
                        </div>
                      </div>

                      <dl className="mt-3 text-[13px] space-y-1">
                        <div className="flex justify-between gap-3">
                          <dt className="text-ink-soft">Canon</dt>
                          <dd className="font-semibold">{formatCOP(property.price)}</dd>
                        </div>
                        <div className="flex justify-between gap-3">
                          <dt className="text-ink-soft">Administración</dt>
                          <dd className="font-semibold">{formatCOP(property.adminFee)}</dd>
                        </div>
                        <div className="flex justify-between gap-3">
                          <dt className="text-ink-soft">Transporte estimado</dt>
                          <dd className="font-semibold">{formatCOP(transport)}</dd>
                        </div>
                      </dl>

                      <div className="mt-4 pt-3 border-t border-rule">
                        <VerificationStamp
                          seed={property.id}
                          status={status}
                          folio={property.verified ? sampleFolio(property.id, property.title, property.zone) : null}
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => onContactProperty(property)}
                        className="mt-4 w-full bg-ink text-white text-sm font-semibold py-2.5 rounded-lg hover:bg-ink-hover"
                      >
                        Contactar a quien publica
                      </button>
                    </div>
                  </li>
                );
              })}

              {properties.length < 3 && unselectedProperties.length > 0 && (
                <li>
                  <button
                    type="button"
                    onClick={() => openAdd(null)}
                    className="w-full h-full min-h-[160px] md:min-h-[320px] border border-dashed border-control rounded-[10px] flex flex-col items-center justify-center text-center p-8 hover:bg-surface transition-colors"
                  >
                    <svg className="size-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                    <span className="mt-3 text-base font-bold">Agregar un inmueble</span>
                    <span className="mt-1 text-sm text-ink-soft max-w-[24ch]">Puedes comparar hasta 3 a la vez.</span>
                  </button>
                </li>
              )}
            </ul>
          </section>
        )}

        {/* Tabla detallada: mismas filas y mismo orden para todos */}
        {properties.length >= 2 && (
          <section aria-labelledby="cmp-tabla" className="bg-surface border border-rule rounded-[10px] overflow-hidden">
            <div className="px-4 sm:px-5 py-4 flex flex-wrap items-baseline justify-between gap-2">
              <h2 id="cmp-tabla" className="text-lg font-bold">
                Comparación punto por punto
              </h2>
              <p className="text-[13px] text-ink-soft md:hidden">Desliza la tabla para ver todas las opciones.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse min-w-[600px] sm:min-w-[680px]">
                <caption className="sr-only">Comparación detallada de los inmuebles elegidos</caption>
                <thead>
                  <tr className="border-t border-rule">
                    <th scope="col" className="text-left p-4 text-[13px] font-semibold text-ink-soft w-[24%] min-w-[130px] sm:min-w-[190px] sticky left-0 bg-surface">
                      Dato
                    </th>
                    {calculatedMetrics.map(({ property }, idx) => (
                      <th key={property.id} scope="col" className="text-left p-4 align-bottom min-w-[210px]">
                        <span className="block text-[12.5px] text-ink-faint font-medium">Opción {idx + 1}</span>
                        <span className="block text-sm font-bold">{property.title}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {section('Dinero')}
                  {row("Total del mes", ({ totalMonthly }) => (
                      <span className="text-lg font-extrabold tracking-[-0.01em]">
                        {formatCOP(totalMonthly)}
                        {totalMonthly === lowestTotalMonthly && lowestMark}
                      </span>
                    ), true)}
                  {row("Canon", ({ property }) => formatCOP(property.price))}
                  {row("Administración", ({ property }) => formatCOP(property.adminFee))}
                  {row(<>
                        Transporte estimado
                        <span className="block text-[12.5px] text-ink-faint font-normal mt-0.5">{transportLabel}</span>
                      </>, ({ property, transport }) => (
                      <>
                        {formatCOP(transport)}
                        <span className="block text-[12.5px] text-ink-soft mt-0.5">{property.transitAccess}</span>
                      </>
                    ))}
                  {row("Precio por m²", ({ pricePerM2 }) => (
                      <>
                        {formatCOP(pricePerM2)} / m²
                        {pricePerM2 === lowestPricePerM2 && lowestMark}
                      </>
                    ))}
                  {row("Depósito", ({ property }) => (
                      <>
                        {formatCOP(property.deposit)}
                        <span className="block text-[12.5px] text-ink-soft mt-0.5">
                          {property.requirements.depositMonths} {property.requirements.depositMonths === 1 ? 'mes' : 'meses'} de canon
                        </span>
                      </>
                    ))}
                  {row(<>
                        Primer pago
                        <span className="block text-[12.5px] text-ink-faint font-normal mt-0.5">Total del mes + depósito</span>
                      </>, ({ firstMonthUpfront }) => <span className="font-bold">{formatCOP(firstMonthUpfront)}</span>, true)}

                  {section('Confianza')}
                  {row("Identidad de quien publica", ({ property }) => (
                      <>
                        <span className={`font-semibold ${property.verified ? 'text-verified' : 'text-unverified'}`}>
                          {property.verified ? 'Verificada' : 'Sin verificar'}
                        </span>
                        <span className="block text-[12.5px] text-ink-soft mt-0.5">{property.ownerName}</span>
                      </>
                    ))}
                  {row("Certificado de tradición y libertad", ({ property }) => (
                      <span className={`font-semibold ${property.certified ? 'text-verified' : 'text-pending'}`}>
                        {property.certified ? 'Cotejado' : 'Pendiente de cotejo'}
                      </span>
                    ))}

                  {section('Requisitos')}
                  {row("Codeudor con finca raíz", ({ property }) => (property.requirements.guarantorRequired ? <span className="font-semibold">Te lo piden</span> : 'No te lo piden'))}
                  {row("Ingresos que debes demostrar", ({ property }) =>
                      `${property.requirements.minIncomeMultiplier} veces el canon (${formatCOP(property.price * property.requirements.minIncomeMultiplier)})`)}
                  {row("Mascotas", ({ property }) => (property.requirements.petsAllowed ? 'Sí' : 'No'))}
                  {row("Contrato mínimo", ({ property }) => `${property.requirements.leaseTermMonths} meses`)}

                  {section('El inmueble')}
                  {row("Área", ({ property }) => `${property.area} m²`)}
                  {row("Distribución", ({ property }) =>
                      `${property.bedrooms} ${property.bedrooms === 1 ? 'habitación' : 'habitaciones'} · ${property.bathrooms} ${property.bathrooms === 1 ? 'baño' : 'baños'}`)}
                  {row("Estrato", ({ property }) => property.stratum)}
                  {row("Transporte cercano", ({ property }) => <span className="text-ink-soft">{property.transitAccess}</span>)}
                  {row("Lo que tiene", ({ property }) => (
                      <ul className="space-y-0.5 text-ink-soft">
                        {property.features?.map((f) => (
                          <li key={f}>{f}</li>
                        ))}
                      </ul>
                    ))}
                  <tr className="border-t border-ink">
                    <th scope="row" className="p-4 sticky left-0 bg-surface" />
                    {calculatedMetrics.map(({ property }) => (
                      <td key={property.id} className="p-4">
                        <button
                          type="button"
                          onClick={() => onContactProperty(property)}
                          className="w-full bg-ink text-white text-sm font-semibold py-2.5 px-3 rounded-lg hover:bg-ink-hover"
                        >
                          Contactar
                        </button>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>

      {/* Agregar o reemplazar un inmueble */}
      {showAddModal && (
        <div
          onClick={(e) => e.target === e.currentTarget && setShowAddModal(false)}
          className="fixed inset-0 z-50 bg-ink/55 flex items-center justify-center p-4 overflow-y-auto"
        >
          <div role="dialog" aria-modal="true" aria-labelledby="cmp-agregar" className="bg-surface rounded-[10px] max-w-2xl w-full border border-rule">
            <div className="flex items-start justify-between gap-4 px-5 pt-5 pb-4 border-b border-rule">
              <div>
                <h3 id="cmp-agregar" className="text-lg font-bold">
                  {replacingId ? 'Cambiar este inmueble' : 'Agregar un inmueble'}
                </h3>
                <p className="text-sm text-ink-soft mt-1">El total incluye el transporte con {isCustomTransport ? 'tu ajuste manual' : 'el perfil que elegiste'}.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="size-9 rounded-full border border-rule flex items-center justify-center hover:bg-paper shrink-0"
                aria-label="Cerrar"
              >
                <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>

            <ul className="max-h-[60vh] overflow-y-auto divide-y divide-rule">
              {unselectedProperties.map((prop) => {
                const totalCost = prop.price + prop.adminFee + getTransportForProperty(prop);
                return (
                  <li key={prop.id} className="flex items-center gap-4 px-5 py-3">
                    <img src={prop.image} alt="" className="w-24 h-16 rounded-md object-cover shrink-0 bg-rule" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold truncate">{prop.title}</p>
                      <p className="text-[13px] text-ink-soft truncate">{prop.location}</p>
                      <p className="text-sm mt-0.5">
                        <strong className="font-extrabold">{formatCOP(totalCost)}</strong> <span className="text-ink-soft">al mes</span>
                        {!prop.verified && <span className="text-unverified font-semibold"> · sin verificar</span>}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (replacingId) onReplaceProperty(replacingId, prop);
                        else onAddProperty(prop);
                        setShowAddModal(false);
                      }}
                      className="shrink-0 bg-ink text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-ink-hover"
                    >
                      {replacingId ? 'Usar este' : 'Agregar'}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};
