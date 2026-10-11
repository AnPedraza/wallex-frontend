import React, { useState, useMemo } from 'react';
import type { Property, TransportProfile } from '../types/property';
import {
  TRANSPORT_PROFILES,
  calculatePricePerM2,
  formatCOP,
} from '../data/mockProperties';

interface PropertyComparerProps {
  properties: Property[];
  availableProperties: Property[];
  onRemoveProperty: (id: string) => void;
  onAddProperty: (property: Property) => void;
  onReplaceProperty: (oldId: string, newProperty: Property) => void;
  onContactProperty: (property: Property) => void;
  onClose?: () => void;
}

export const PropertyComparer: React.FC<PropertyComparerProps> = ({
  properties,
  availableProperties,
  onRemoveProperty,
  onAddProperty,
  onReplaceProperty,
  onContactProperty,
  onClose,
}) => {
  // Perfil de transporte seleccionado
  const [selectedProfileId, setSelectedProfileId] = useState<string>('standard');
  const [customTransportDayRate, setCustomTransportDayRate] = useState<number>(7100); // 2 pasajes TransMilenio ($3.550 c/u)
  const [commuteDaysPerMonth, setCommuteDaysPerMonth] = useState<number>(22);
  const [isCustomTransport, setIsCustomTransport] = useState<boolean>(false);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [replacingId, setReplacingId] = useState<string | null>(null);

  // Perfil activo
  const activeProfile = useMemo<TransportProfile>(() => {
    return (
      TRANSPORT_PROFILES.find((p) => p.id === selectedProfileId) ||
      TRANSPORT_PROFILES[0]
    );
  }, [selectedProfileId]);

  // Cálculo de transporte por propiedad
  const getTransportForProperty = React.useCallback((prop: Property): number => {
    if (isCustomTransport) {
      // Ajuste proporcional según la zona y días personalizados
      const zoneWeight = prop.zone === 'Chapinero' ? 0.75 : prop.zone === 'Teusaquillo' ? 0.9 : 1.3;
      return Math.round(customTransportDayRate * commuteDaysPerMonth * zoneWeight);
    }
    return Math.round(prop.estimatedTransportMonthly * activeProfile.multiplier);
  }, [isCustomTransport, customTransportDayRate, commuteDaysPerMonth, activeProfile]);

  // Métricas calculadas para cada propiedad
  const calculatedMetrics = useMemo(() => {
    return properties.map((p) => {
      const transport = getTransportForProperty(p);
      const totalMonthly = p.price + p.adminFee + transport;
      const pricePerM2 = calculatePricePerM2(p);
      const firstMonthUpfront = totalMonthly + p.deposit;
      return {
        property: p,
        transport,
        totalMonthly,
        pricePerM2,
        firstMonthUpfront,
      };
    });
  }, [properties, getTransportForProperty]);

  // Identificar ganadores relativos (mínimo costo total, mejor $/m², etc.)
  const lowestTotalMonthly = useMemo(() => {
    if (calculatedMetrics.length === 0) return 0;
    return Math.min(...calculatedMetrics.map((m) => m.totalMonthly));
  }, [calculatedMetrics]);

  const lowestPricePerM2 = useMemo(() => {
    if (calculatedMetrics.length === 0) return 0;
    return Math.min(...calculatedMetrics.map((m) => m.pricePerM2));
  }, [calculatedMetrics]);

  // Propiedades disponibles que no están en la lista actual
  const unselectedProperties = useMemo(() => {
    const currentIds = new Set(properties.map((p) => p.id));
    return availableProperties.filter((p) => !currentIds.has(p.id));
  }, [properties, availableProperties]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-[#F8F5F0] text-[#2B1B17] font-sans pb-20">
      {/* Barra Superior de Navegación / Contexto */}
      <div className="bg-white border-b border-[#EAE4DC] sticky top-16 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="flex items-center gap-1.5 text-xs font-bold text-[#8C5E3C] hover:text-[#2B1B17] bg-[#F8F5F0] hover:bg-[#EAE4DC] px-3 py-2 rounded-xl transition-colors"
                title="Volver al catálogo"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span>Volver al Catálogo</span>
              </button>
            )}
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-[#2B1B17] tracking-tight">
                Comparador Lado a Lado de Costo Total
              </h1>
              <p className="text-xs text-[#6E615A] mt-0.5 hidden sm:block">
                Cálculo transparente de <strong>Valor de arriendo + Cuota de administración + Transporte estimado en Bogotá</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-3 py-1.5 bg-[#F8F5F0] text-[#6E615A] rounded-xl border border-[#EAE4DC]">
              {properties.length} de 3 propiedades
            </span>
            {properties.length < 3 && unselectedProperties.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setReplacingId(null);
                  setShowAddModal(true);
                }}
                className="flex items-center gap-1.5 bg-[#2B1B17] text-white text-xs font-semibold px-3.5 py-2 rounded-xl hover:bg-[#4A3E39] transition-all shadow-xs"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                </svg>
                <span>Agregar Propiedad</span>
              </button>
            )}
            <button
              type="button"
              onClick={handlePrint}
              className="p-2 text-[#6E615A] hover:text-[#2B1B17] hover:bg-[#EAE4DC] rounded-xl transition-colors"
              title="Imprimir o guardar PDF"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        {/* Caso especial: Menos de 2 propiedades seleccionadas */}
        {properties.length < 2 && (
          <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-6 text-amber-900 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-200/80 flex items-center justify-center text-amber-900 shrink-0">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <h2 className="font-bold text-base text-amber-950">
                  Selecciona al menos 2 propiedades para comparar
                </h2>
                <p className="text-xs text-amber-800 mt-0.5">
                  Wallex requiere comparar lado a lado mínimo 2 alternativas para analizar el desglose financiero y requisitos.
                </p>
              </div>
            </div>
            {unselectedProperties.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setReplacingId(null);
                  setShowAddModal(true);
                }}
                className="shrink-0 bg-amber-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-amber-900 transition-colors"
              >
                + Elegir propiedad del catálogo
              </button>
            )}
          </div>
        )}

        {/* Sección Interactiva: Simulador de Transporte en Bogotá */}
        <section className="bg-white rounded-2xl p-5 border border-[#EAE4DC] shadow-xs space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-[#F8F5F0] pb-3">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-[#F8F5F0] flex items-center justify-center text-[#2B1B17]">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h8m-8 4h8m-4 8v-2m-6 2h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v11a2 2 0 002 2z" />
                  </svg>
                </div>
                <h2 className="font-extrabold text-sm sm:text-base text-[#2B1B17]">
                  Simulador de Movilidad y Transporte en Bogotá (Tarifa TransMilenio: $3.550)
                </h2>
              </div>
              <p className="text-xs text-[#6E615A] mt-0.5">
                En Bogotá, una vivienda con arriendo más bajo en periferia suele costar más al sumar el transporte y tiempo diario.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <button
                type="button"
                onClick={() => setIsCustomTransport(false)}
                className={`px-3 py-1.5 rounded-xl font-semibold transition-all ${
                  !isCustomTransport
                    ? 'bg-[#2B1B17] text-white shadow-xs'
                    : 'bg-[#F8F5F0] text-[#6E615A] hover:bg-[#EAE4DC]'
                }`}
              >
                Perfiles Predefinidos
              </button>
              <button
                type="button"
                onClick={() => setIsCustomTransport(true)}
                className={`px-3 py-1.5 rounded-xl font-semibold transition-all ${
                  isCustomTransport
                    ? 'bg-[#2B1B17] text-white shadow-xs'
                    : 'bg-[#F8F5F0] text-[#6E615A] hover:bg-[#EAE4DC]'
                }`}
              >
                Ajuste Manual
              </button>
            </div>
          </div>

          {!isCustomTransport ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {TRANSPORT_PROFILES.map((profile) => {
                const isSelected = selectedProfileId === profile.id;
                return (
                  <button
                    key={profile.id}
                    type="button"
                    onClick={() => setSelectedProfileId(profile.id)}
                    className={`text-left p-3.5 rounded-xl border text-xs transition-all relative ${
                      isSelected
                        ? 'border-[#2B1B17] bg-[#F8F5F0] ring-1 ring-[#2B1B17]'
                        : 'border-[#EAE4DC] hover:border-[#D9A76A] bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold text-[#2B1B17]">
                      <span>{profile.name}</span>
                      {isSelected && (
                        <span className="w-2 h-2 rounded-full bg-[#8C5E3C]" />
                      )}
                    </div>
                    <p className="text-[#6E615A] text-[11px] mt-1 leading-snug">
                      {profile.description}
                    </p>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#F8F5F0] p-4 rounded-xl border border-[#EAE4DC] text-xs">
              <div>
                <label className="block font-bold text-[#4A3E39] mb-1">
                  Días de traslado mensual: <span className="text-[#8C5E3C]">{commuteDaysPerMonth} días</span>
                </label>
                <input
                  type="range"
                  min="5"
                  max="30"
                  step="1"
                  value={commuteDaysPerMonth}
                  onChange={(e) => setCommuteDaysPerMonth(Number(e.target.value))}
                  className="w-full accent-[#2B1B17]"
                />
                <div className="flex justify-between text-[10px] text-[#6E615A] mt-1">
                  <span>5 días (Fines de semana)</span>
                  <span>22 días (Laboral / Estudio)</span>
                  <span>30 días (Diario)</span>
                </div>
              </div>
              <div>
                <label className="block font-bold text-[#4A3E39] mb-1">
                  Gasto diario estimado en pasajes: <span className="text-[#8C5E3C]">{formatCOP(customTransportDayRate)}</span>
                </label>
                <input
                  type="range"
                  min="3550"
                  max="21300"
                  step="3550"
                  value={customTransportDayRate}
                  onChange={(e) => setCustomTransportDayRate(Number(e.target.value))}
                  className="w-full accent-[#2B1B17]"
                />
                <div className="flex justify-between text-[10px] text-[#6E615A] mt-1">
                  <span>$3.550 (1 pasaje)</span>
                  <span>$7.100 (Ida y vuelta)</span>
                  <span>$14.200+ (Interzonal / Transbordos)</span>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Tarjetas Superiores Comparativas (Overview Cards) */}
        {properties.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {calculatedMetrics.map((item, index) => {
              const { property, transport, totalMonthly, pricePerM2 } = item;
              const isLowestCost = totalMonthly === lowestTotalMonthly && calculatedMetrics.length > 1;
              const isLowestPriceM2 = pricePerM2 === lowestPricePerM2 && calculatedMetrics.length > 1;
              const diffFromMin = totalMonthly - lowestTotalMonthly;

              // Proporciones para la barra de costos
              const rentPct = Math.round((property.price / totalMonthly) * 100);
              const adminPct = Math.round((property.adminFee / totalMonthly) * 100);
              const transportPct = 100 - rentPct - adminPct;

              return (
                <div
                  key={property.id}
                  className={`bg-white rounded-2xl overflow-hidden border transition-all flex flex-col justify-between shadow-xs ${
                    isLowestCost
                      ? 'border-emerald-500 ring-2 ring-emerald-400/30'
                      : 'border-[#EAE4DC]'
                  }`}
                >
                  <div>
                    {/* Header de la tarjeta con imagen y badges */}
                    <div className="relative h-44 w-full bg-gray-100 overflow-hidden">
                      <img
                        src={property.image}
                        alt={property.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                      {/* Pill de posición */}
                      <span className="absolute top-3 left-3 bg-[#2B1B17]/90 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg backdrop-blur-xs">
                        Opción {index + 1}
                      </span>

                      {/* Botón para cambiar o quitar */}
                      <div className="absolute top-3 right-3 flex items-center gap-1">
                        {unselectedProperties.length > 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              setReplacingId(property.id);
                              setShowAddModal(true);
                            }}
                            className="bg-white/90 hover:bg-white text-[#2B1B17] text-[10px] font-bold px-2 py-1 rounded-lg backdrop-blur-xs transition-colors shadow-xs"
                            title="Cambiar esta propiedad"
                          >
                            Cambiar
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => onRemoveProperty(property.id)}
                          className="w-6 h-6 bg-black/60 hover:bg-red-600 text-white rounded-lg flex items-center justify-center text-xs transition-colors"
                          title="Quitar de la comparativa"
                          aria-label="Quitar de la comparativa"
                        >
                          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>

                      {/* Título sobre imagen */}
                      <div className="absolute bottom-3 left-3 right-3 text-white">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#D9A76A]">
                          {property.location}
                        </span>
                        <h3 className="text-base font-bold leading-tight truncate">
                          {property.title}
                        </h3>
                      </div>
                    </div>

                    {/* Resumen del Costo Total */}
                    <div className="p-5 space-y-4">
                      {/* Badge de Ganador */}
                      <div className="flex flex-wrap gap-1.5 min-h-[26px]">
                        {isLowestCost && (
                          <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-emerald-300">
                            Menor Costo Total Mensual
                          </span>
                        )}
                        {isLowestPriceM2 && (
                          <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-blue-200">
                            Mejor Precio / m² ({formatCOP(pricePerM2)}/m²)
                          </span>
                        )}
                        {property.verified && property.certified && (
                          <span className="inline-flex items-center gap-1 bg-[#F8F5F0] text-[#2B1B17] text-[10px] font-bold px-2 py-0.5 rounded-full border border-[#D9A76A]">
                            100% Verificado
                          </span>
                        )}
                      </div>

                      {/* Cifra destacada de Costo Total */}
                      <div className="bg-[#F8F5F0] p-4 rounded-xl border border-[#EAE4DC]">
                        <span className="text-[11px] font-bold text-[#6E615A] uppercase tracking-wider block">
                          Costo Total Real Estimado
                        </span>
                        <div className="flex items-baseline gap-1 mt-1">
                          <span className="text-2xl font-black text-[#2B1B17]">
                            {formatCOP(totalMonthly)}
                          </span>
                          <span className="text-xs font-semibold text-[#6E615A]">/ mes</span>
                        </div>

                        {/* Comparación relativa frente al mínimo */}
                        {calculatedMetrics.length > 1 && (
                          <div className="text-[11px] mt-1 font-semibold">
                            {isLowestCost ? (
                              <span className="text-emerald-700 font-bold">
                                Alternativa más económica del comparador
                              </span>
                            ) : (
                              <span className="text-amber-800">
                                +{formatCOP(diffFromMin)} más al mes vs la más económica
                              </span>
                            )}
                          </div>
                        )}

                        {/* Barra Desglosada Proporcional */}
                        <div className="mt-3 space-y-1.5">
                          <div className="h-2.5 w-full bg-gray-200 rounded-full overflow-hidden flex">
                            <div
                              style={{ width: `${rentPct}%` }}
                              className="bg-[#2B1B17] h-full"
                              title={`Arriendo: ${rentPct}%`}
                            />
                            <div
                              style={{ width: `${adminPct}%` }}
                              className="bg-[#8C5E3C] h-full"
                              title={`Admin: ${adminPct}%`}
                            />
                            <div
                              style={{ width: `${transportPct}%` }}
                              className="bg-[#D9A76A] h-full"
                              title={`Transporte: ${transportPct}%`}
                            />
                          </div>
                          <div className="flex justify-between text-[10px] text-[#6E615A] font-medium">
                            <span className="flex items-center gap-1">
                              <span className="w-2 h-2 rounded-full bg-[#2B1B17] inline-block" />
                              Arriendo {rentPct}%
                            </span>
                            <span className="flex items-center gap-1">
                              <span className="w-2 h-2 rounded-full bg-[#8C5E3C] inline-block" />
                              Admin {adminPct}%
                            </span>
                            <span className="flex items-center gap-1">
                              <span className="w-2 h-2 rounded-full bg-[#D9A76A] inline-block" />
                              Transp. {transportPct}%
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Mini desglose numérico */}
                      <div className="space-y-1.5 text-xs">
                        <div className="flex justify-between text-[#4A3E39]">
                          <span>Valor de arriendo:</span>
                          <span className="font-bold">{formatCOP(property.price)}</span>
                        </div>
                        <div className="flex justify-between text-[#4A3E39]">
                          <span>Cuota de administración:</span>
                          <span className="font-bold">{formatCOP(property.adminFee)}</span>
                        </div>
                        <div className="flex justify-between text-[#4A3E39]">
                          <span>Transporte mensual estimado:</span>
                          <span className="font-bold text-[#8C5E3C]">{formatCOP(transport)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Botón de Contacto */}
                  <div className="p-5 pt-0">
                    <button
                      type="button"
                      onClick={() => onContactProperty(property)}
                      className="w-full bg-[#2B1B17] hover:bg-[#4A3E39] text-white text-xs font-bold py-3 rounded-xl transition-all shadow-xs flex items-center justify-center gap-2"
                    >
                      <svg className="w-4 h-4 text-[#D9A76A]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      <span>Contactar con KYC</span>
                    </button>
                  </div>
                </div>
              );
            })}

            {/* Espacio para agregar una 3ra propiedad si hay menos de 3 */}
            {properties.length < 3 && unselectedProperties.length > 0 && (
              <div
                onClick={() => {
                  setReplacingId(null);
                  setShowAddModal(true);
                }}
                className="border-2 border-dashed border-[#EAE4DC] hover:border-[#2B1B17] bg-white/50 hover:bg-white rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all min-h-[360px] group"
              >
                <div className="w-12 h-12 rounded-full bg-[#F8F5F0] group-hover:bg-[#2B1B17] text-[#2B1B17] group-hover:text-white flex items-center justify-center text-xl transition-colors mb-3">
                  +
                </div>
                <h4 className="font-bold text-sm text-[#2B1B17]">
                  Agregar Propiedad #{properties.length + 1}
                </h4>
                <p className="text-xs text-[#6E615A] max-w-[200px] mt-1">
                  Compara hasta 3 inmuebles simultáneamente para tomar la mejor decisión en Bogotá.
                </p>
                <span className="mt-4 text-xs font-bold text-[#8C5E3C] group-hover:underline">
                  Explorar disponibles →
                </span>
              </div>
            )}
          </div>
        )}

        {/* TABLA COMPARATIVA DETALLADA LADO A LADO */}
        {properties.length >= 2 && (
          <section className="bg-white rounded-2xl border border-[#EAE4DC] shadow-xs overflow-hidden">
            <div className="p-5 border-b border-[#EAE4DC] bg-[#FAF8F5] flex items-center justify-between">
              <div>
                <h2 className="font-extrabold text-base text-[#2B1B17]">
                  Matriz de Comparación Detallada Lado a Lado
                </h2>
                <p className="text-xs text-[#6E615A] mt-0.5">
                  Análisis punto por punto de finanzas, seguridad y barreras de entrada.
                </p>
              </div>
              <span className="text-xs text-[#6E615A] italic hidden sm:block">
                Desplaza horizontalmente si es necesario →
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[650px]">
                <thead>
                  <tr className="border-b border-[#EAE4DC] bg-white">
                    <th className="p-4 text-xs font-bold text-[#6E615A] uppercase tracking-wider w-1/4 min-w-[200px] sticky left-0 bg-white shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                      Criterio de Evaluación
                    </th>
                    {calculatedMetrics.map(({ property }, idx) => (
                      <th key={property.id} className="p-4 text-xs font-bold text-[#2B1B17] w-1/3 min-w-[220px]">
                        <div className="flex items-center justify-between">
                          <span className="font-extrabold truncate">Opción {idx + 1}: {property.title}</span>
                        </div>
                        <span className="text-[11px] text-[#8C5E3C] font-normal block truncate">
                          {property.location}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody className="divide-y divide-[#EAE4DC] text-xs">
                  {/* SECCIÓN 1: COSTO TOTAL Y DESGLOSE FINANCIERO */}
                  <tr className="bg-[#F8F5F0]/70 font-extrabold text-[#2B1B17]">
                    <td colSpan={calculatedMetrics.length + 1} className="py-2.5 px-4 text-[11px] uppercase tracking-wider">
                      1. Desglose Financiero y Costo Total Mensual
                    </td>
                  </tr>

                  {/* Costo Total Mensual */}
                  <tr className="bg-amber-50/50 font-bold">
                    <td className="p-4 text-[#2B1B17] sticky left-0 bg-amber-50/90 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                      <div>
                        <span className="font-extrabold text-sm text-[#2B1B17] block">Costo Total Mensual</span>
                        <span className="text-[10px] text-[#6E615A] font-normal">Arriendo + Administración + Transporte</span>
                      </div>
                    </td>
                    {calculatedMetrics.map(({ property, totalMonthly }) => (
                      <td key={property.id} className="p-4">
                        <div className="text-base font-black text-[#2B1B17]">
                          {formatCOP(totalMonthly)}
                        </div>
                        {totalMonthly === lowestTotalMonthly && (
                          <span className="inline-block bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-md mt-1">
                            Más económico
                          </span>
                        )}
                      </td>
                    ))}
                  </tr>

                  {/* Arriendo Mensual */}
                  <tr>
                    <td className="p-4 text-[#4A3E39] font-medium sticky left-0 bg-white shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                      Valor de arriendo mensual
                    </td>
                    {calculatedMetrics.map(({ property }) => (
                      <td key={property.id} className="p-4 font-semibold text-[#2B1B17]">
                        {formatCOP(property.price)}
                      </td>
                    ))}
                  </tr>

                  {/* Cuota de Administración */}
                  <tr>
                    <td className="p-4 text-[#4A3E39] font-medium sticky left-0 bg-white shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                      Cuota de administración
                    </td>
                    {calculatedMetrics.map(({ property }) => (
                      <td key={property.id} className="p-4 font-semibold text-[#2B1B17]">
                        {formatCOP(property.adminFee)}
                      </td>
                    ))}
                  </tr>

                  {/* Transporte Estimado */}
                  <tr>
                    <td className="p-4 text-[#4A3E39] font-medium sticky left-0 bg-white shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                      <div>
                        <span>Transporte estimado mensual</span>
                        <span className="text-[10px] text-[#8C5E3C] block font-normal">
                          {isCustomTransport ? 'Configuración personalizada' : activeProfile.name}
                        </span>
                      </div>
                    </td>
                    {calculatedMetrics.map(({ property, transport }) => (
                      <td key={property.id} className="p-4 font-semibold text-[#8C5E3C]">
                        <div>{formatCOP(transport)}</div>
                        <span className="text-[10px] text-[#6E615A] block mt-0.5 font-normal">
                          {property.transitAccess}
                        </span>
                      </td>
                    ))}
                  </tr>

                  {/* Valor por m2 */}
                  <tr>
                    <td className="p-4 text-[#4A3E39] font-medium sticky left-0 bg-white shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                      Precio por metro cuadrado ($/m²)
                    </td>
                    {calculatedMetrics.map(({ property, pricePerM2 }) => (
                      <td key={property.id} className="p-4 text-[#2B1B17]">
                        <span className="font-semibold">{formatCOP(pricePerM2)} / m²</span>
                        {pricePerM2 === lowestPricePerM2 && (
                          <span className="text-[10px] text-blue-700 block font-bold">
                            Mejor rendimiento espacial
                          </span>
                        )}
                      </td>
                    ))}
                  </tr>

                  {/* Depósito requerido */}
                  <tr>
                    <td className="p-4 text-[#4A3E39] font-medium sticky left-0 bg-white shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                      Depósito de garantía
                    </td>
                    {calculatedMetrics.map(({ property }) => (
                      <td key={property.id} className="p-4 text-[#2B1B17]">
                        <span className="font-semibold">{formatCOP(property.deposit)}</span>
                        <span className="text-[10px] text-[#6E615A] block">
                          ({property.requirements.depositMonths} mes{property.requirements.depositMonths === 1 ? '' : 'es'} de arriendo)
                        </span>
                      </td>
                    ))}
                  </tr>

                  {/* Inversión Inicial Primer Mes */}
                  <tr className="bg-[#F8F5F0]/40">
                    <td className="p-4 text-[#4A3E39] font-bold sticky left-0 bg-[#F8F5F0] shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                      Inversión inicial requerida (Mes 1)
                      <span className="text-[10px] text-[#6E615A] block font-normal">
                        Costo total + Depósito en garantía
                      </span>
                    </td>
                    {calculatedMetrics.map(({ property, firstMonthUpfront }) => (
                      <td key={property.id} className="p-4 font-extrabold text-[#2B1B17]">
                        {formatCOP(firstMonthUpfront)}
                      </td>
                    ))}
                  </tr>

                  {/* SECCIÓN 2: SEGURIDAD Y VERIFICACIÓN WALLEX */}
                  <tr className="bg-[#F8F5F0]/70 font-extrabold text-[#2B1B17]">
                    <td colSpan={calculatedMetrics.length + 1} className="py-2.5 px-4 text-[11px] uppercase tracking-wider">
                      2. Confianza y Verificación Wallex
                    </td>
                  </tr>

                  {/* Verificación KYC Propietario */}
                  <tr>
                    <td className="p-4 text-[#4A3E39] font-medium sticky left-0 bg-white shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                      Identidad del propietario (KYC)
                    </td>
                    {calculatedMetrics.map(({ property }) => (
                      <td key={property.id} className="p-4">
                        {property.verified ? (
                          <div className="flex items-center gap-1.5 text-emerald-700 font-bold">
                            <svg className="w-3.5 h-3.5 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                            <span>Verificada con Cédula y Biometría</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-amber-700 font-bold">
                            <span className="w-3.5 h-3.5 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center text-[10px]">
                              !
                            </span>
                            <span>Sin verificar (Canal informal)</span>
                          </div>
                        )}
                        <span className="text-[10px] text-[#6E615A] block mt-0.5">
                          {property.ownerName}
                        </span>
                      </td>
                    ))}
                  </tr>

                  {/* Certificado de Tradición y Libertad */}
                  <tr>
                    <td className="p-4 text-[#4A3E39] font-medium sticky left-0 bg-white shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                      Certificado de Tradición (VUR / SNR)
                    </td>
                    {calculatedMetrics.map(({ property }) => (
                      <td key={property.id} className="p-4">
                        {property.certified ? (
                          <span className="inline-flex items-center gap-1 bg-[#D9A76A]/20 text-[#2B1B17] font-bold px-2.5 py-1 rounded-md border border-[#D9A76A]">
                            Cotejado y Válido
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-gray-100 text-[#6E615A] font-semibold px-2 py-0.5 rounded-md">
                            Pendiente de Cotejo
                          </span>
                        )}
                      </td>
                    ))}
                  </tr>

                  {/* SECCIÓN 3: REQUISITOS DE ENTRADA */}
                  <tr className="bg-[#F8F5F0]/70 font-extrabold text-[#2B1B17]">
                    <td colSpan={calculatedMetrics.length + 1} className="py-2.5 px-4 text-[11px] uppercase tracking-wider">
                      3. Requisitos de Acceso
                    </td>
                  </tr>

                  {/* Codeudor con finca raíz */}
                  <tr>
                    <td className="p-4 text-[#4A3E39] font-medium sticky left-0 bg-white shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                      ¿Exige Codeudor con Finca Raíz?
                    </td>
                    {calculatedMetrics.map(({ property }) => (
                      <td key={property.id} className="p-4">
                        {!property.requirements.guarantorRequired ? (
                          <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 font-bold px-2 py-0.5 rounded-md border border-emerald-200">
                            No exige codeudor de finca raíz
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-900 font-semibold px-2 py-0.5 rounded-md border border-amber-200">
                            Exige codeudor tradicional
                          </span>
                        )}
                      </td>
                    ))}
                  </tr>

                  {/* Ingresos requeridos */}
                  <tr>
                    <td className="p-4 text-[#4A3E39] font-medium sticky left-0 bg-white shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                      Demostración de Ingresos
                    </td>
                    {calculatedMetrics.map(({ property }) => {
                      const requiredIncome = property.price * property.requirements.minIncomeMultiplier;
                      return (
                        <td key={property.id} className="p-4">
                          <span className="font-semibold text-[#2B1B17]">
                            {property.requirements.minIncomeMultiplier}x el arriendo ({formatCOP(requiredIncome)})
                          </span>
                        </td>
                      );
                    })}
                  </tr>

                  {/* Mascotas */}
                  <tr>
                    <td className="p-4 text-[#4A3E39] font-medium sticky left-0 bg-white shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                      Mascotas Permitidas
                    </td>
                    {calculatedMetrics.map(({ property }) => (
                      <td key={property.id} className="p-4">
                        {property.requirements.petsAllowed ? (
                          <span className="text-emerald-700 font-bold">Sí se admiten</span>
                        ) : (
                          <span className="text-red-700 font-semibold">No permitidas</span>
                        )}
                      </td>
                    ))}
                  </tr>

                  {/* Plazo del contrato */}
                  <tr>
                    <td className="p-4 text-[#4A3E39] font-medium sticky left-0 bg-white shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                      Plazo Mínimo de Contrato
                    </td>
                    {calculatedMetrics.map(({ property }) => (
                      <td key={property.id} className="p-4 text-[#2B1B17]">
                        {property.requirements.leaseTermMonths} meses
                      </td>
                    ))}
                  </tr>

                  {/* SECCIÓN 4: ESPACIO Y AMENIDADES */}
                  <tr className="bg-[#F8F5F0]/70 font-extrabold text-[#2B1B17]">
                    <td colSpan={calculatedMetrics.length + 1} className="py-2.5 px-4 text-[11px] uppercase tracking-wider">
                      4. Características Físicas y del Inmueble
                    </td>
                  </tr>

                  {/* Área */}
                  <tr>
                    <td className="p-4 text-[#4A3E39] font-medium sticky left-0 bg-white shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                      Área Total Construida
                    </td>
                    {calculatedMetrics.map(({ property }) => (
                      <td key={property.id} className="p-4 font-bold text-[#2B1B17]">
                        {property.area} m²
                      </td>
                    ))}
                  </tr>

                  {/* Habitaciones y Baños */}
                  <tr>
                    <td className="p-4 text-[#4A3E39] font-medium sticky left-0 bg-white shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                      Distribución
                    </td>
                    {calculatedMetrics.map(({ property }) => (
                      <td key={property.id} className="p-4 text-[#2B1B17]">
                        {property.bedrooms} Habitación{property.bedrooms === 1 ? '' : 'es'} • {property.bathrooms} Baño{property.bathrooms === 1 ? '' : 's'}
                      </td>
                    ))}
                  </tr>

                  {/* Estrato */}
                  <tr>
                    <td className="p-4 text-[#4A3E39] font-medium sticky left-0 bg-white shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                      Estrato Socioeconómico
                    </td>
                    {calculatedMetrics.map(({ property }) => (
                      <td key={property.id} className="p-4 text-[#2B1B17]">
                        Estrato {property.stratum}
                      </td>
                    ))}
                  </tr>

                  {/* Conectividad */}
                  <tr>
                    <td className="p-4 text-[#4A3E39] font-medium sticky left-0 bg-white shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                      Conectividad y Estaciones
                    </td>
                    {calculatedMetrics.map(({ property }) => (
                      <td key={property.id} className="p-4 text-[#6E615A]">
                        {property.transitAccess}
                      </td>
                    ))}
                  </tr>

                  {/* Características adicionales */}
                  <tr>
                    <td className="p-4 text-[#4A3E39] font-medium sticky left-0 bg-white shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                      Destacados del Inmueble
                    </td>
                    {calculatedMetrics.map(({ property }) => (
                      <td key={property.id} className="p-4">
                        <ul className="list-disc list-inside space-y-0.5 text-[#6E615A] text-[11px]">
                          {property.features?.map((f, i) => (
                            <li key={i}>{f}</li>
                          ))}
                        </ul>
                      </td>
                    ))}
                  </tr>

                  {/* Fila de Acciones Finales */}
                  <tr className="bg-[#FAF8F5]">
                    <td className="p-4 font-bold text-[#2B1B17] sticky left-0 bg-[#FAF8F5] shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                      Siguiente Paso
                    </td>
                    {calculatedMetrics.map(({ property }) => (
                      <td key={property.id} className="p-4">
                        <button
                          type="button"
                          onClick={() => onContactProperty(property)}
                          className="w-full bg-[#2B1B17] hover:bg-[#4A3E39] text-white font-bold py-2.5 px-3 rounded-xl text-xs transition-colors shadow-xs"
                        >
                          Contactar ({property.zone})
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

      {/* Modal para Agregar o Reemplazar Propiedad */}
      {showAddModal && (
        <div
          onClick={(e) => e.target === e.currentTarget && setShowAddModal(false)}
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
        >
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-[#EAE4DC] space-y-5">
            <div className="flex items-center justify-between border-b border-[#EAE4DC] pb-4">
              <div>
                <h3 className="text-lg font-extrabold text-[#2B1B17]">
                  {replacingId ? 'Reemplazar Propiedad' : 'Agregar Propiedad al Comparador'}
                </h3>
                <p className="text-xs text-[#6E615A] mt-0.5">
                  Elige un inmueble disponible de Bogotá para incluirlo en la matriz comparativa.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-gray-500 hover:bg-[#F8F5F0]"
                aria-label="Cerrar"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto p-1">
              {unselectedProperties.map((prop) => {
                const totalCost = prop.price + prop.adminFee + prop.estimatedTransportMonthly;
                return (
                  <div
                    key={prop.id}
                    className="border border-[#EAE4DC] hover:border-[#2B1B17] rounded-2xl p-3 flex flex-col justify-between hover:shadow-md transition-all group bg-white"
                  >
                    <div>
                      <div className="relative h-28 w-full rounded-xl overflow-hidden mb-2 bg-gray-100">
                        <img
                          src={prop.image}
                          alt={prop.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        {prop.verified && (
                          <span className="absolute top-2 left-2 bg-[#2B1B17] text-white text-[9px] font-bold px-2 py-0.5 rounded-md">
                            Verificado
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] font-bold text-[#8C5E3C] uppercase">
                        {prop.location}
                      </span>
                      <h4 className="text-sm font-bold text-[#2B1B17] truncate">
                        {prop.title}
                      </h4>
                      <div className="text-xs font-extrabold text-[#2B1B17] mt-1">
                        {formatCOP(prop.price)}{' '}
                        <span className="text-[10px] font-normal text-[#6E615A]">/ mes</span>
                      </div>
                      <div className="text-[11px] text-[#6E615A] mt-0.5">
                        Costo total estimado: <strong className="text-[#2B1B17]">{formatCOP(totalCost)}</strong>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        if (replacingId) {
                          onReplaceProperty(replacingId, prop);
                        } else {
                          onAddProperty(prop);
                        }
                        setShowAddModal(false);
                      }}
                      className="mt-3 w-full bg-[#2B1B17] group-hover:bg-[#4A3E39] text-white text-xs font-bold py-2 rounded-xl transition-colors"
                    >
                      {replacingId ? 'Seleccionar y Reemplazar' : 'Agregar a Comparativa'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
