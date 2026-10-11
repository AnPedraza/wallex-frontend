import React, { useState } from 'react';
import type { Property } from '../types/property';
import { INITIAL_PROPERTIES, formatCOP } from '../data/mockProperties';
import { PropertyDetail } from './PropertyDetail';
import type { Property as DetailProperty } from '../data/properties';

interface PropertyPortalProps {
  comparisonIds?: string[];
  onToggleComparison?: (propertyId: string) => void;
  onOpenComparer?: () => void;
  onContactProperty?: (property: Property) => void;
}

export const PropertyPortal: React.FC<PropertyPortalProps> = ({
  comparisonIds = [],
  onToggleComparison,
  onOpenComparer,
  onContactProperty,
}) => {
  const [selectedZone, setSelectedZone] = useState<string>('Todas');
  const [maxPrice, setMaxPrice] = useState<number>(3000000);
  const [showKycModal, setShowKycModal] = useState<boolean>(false);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [detailProperty, setDetailProperty] = useState<DetailProperty | null>(null);

  // Filtrado de propiedades
  const filteredProperties = INITIAL_PROPERTIES.filter((p) => {
    const matchesZone = selectedZone === 'Todas' || p.location.includes(selectedZone) || p.zone === selectedZone;
    const matchesPrice = p.price <= maxPrice;
    return matchesZone && matchesPrice;
  });

  const handleContact = (property: Property) => {
    setSelectedProperty(property);
    if (onContactProperty) {
      onContactProperty(property);
    } else {
      setShowKycModal(true);
    }
  };

  const handleContactFromDetail = (property: DetailProperty) => {
    setDetailProperty(null);
    const matched = INITIAL_PROPERTIES.find((p) => p.id === property.id);
    if (matched) {
      handleContact(matched);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F5F0] text-[#2B1B17] font-sans pb-24">
      {/* Encabezado del Portal */}
      <div className="max-w-7xl mx-auto px-6 pt-8 pb-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-[#2B1B17]">
              Inmuebles disponibles en Bogotá
            </h1>
            <p className="text-[#6E615A] mt-1 text-sm">
              Viviendas verificadas con precios transparentes, sin intermediarios ocultos ni cobros sorpresivos.
            </p>
          </div>

          {/* Acceso directo a Comparador */}
          {onOpenComparer && (
            <button
              type="button"
              onClick={onOpenComparer}
              className="flex items-center gap-2 bg-white border border-[#EAE4DC] hover:border-[#2B1B17] text-[#2B1B17] px-4 py-2.5 rounded-xl font-bold text-xs shadow-xs hover:shadow-md transition-all self-start md:self-auto"
            >
              <svg className="w-4 h-4 text-[#8C5E3C]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <span>Abrir Comparador Lado a Lado</span>
              {comparisonIds.length > 0 && (
                <span className="bg-[#2B1B17] text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                  {comparisonIds.length} seleccionada{comparisonIds.length === 1 ? '' : 's'}
                </span>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Contenedor Principal: Filtros + Grid de Inmuebles */}
      <div className="max-w-7xl mx-auto px-6 py-6 grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar de Filtros */}
        <aside className="bg-white p-6 rounded-2xl shadow-xs border border-[#EAE4DC] h-fit space-y-6">
          <h2 className="text-lg font-bold border-b border-[#EAE4DC] pb-3 text-[#2B1B17]">
            Filtros de Búsqueda
          </h2>

          {/* Filtro por Zona / Barrio */}
          <div>
            <label className="block text-sm font-semibold mb-2 text-[#4A3E39]">
              Barrio / Zona
            </label>
            <select
              value={selectedZone}
              onChange={(e) => setSelectedZone(e.target.value)}
              className="w-full bg-[#F8F5F0] border border-[#EAE4DC] rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2B1B17]"
            >
              <option value="Todas">Todas las zonas</option>
              <option value="Chapinero">Chapinero</option>
              <option value="Teusaquillo">Teusaquillo</option>
              <option value="Cedritos">Cedritos</option>
            </select>
          </div>

          {/* Filtro por Presupuesto Máximo */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-semibold text-[#4A3E39]">Presupuesto Máximo</label>
              <span className="text-xs font-bold text-[#8C5E3C]">
                ${maxPrice.toLocaleString('es-CO')}
              </span>
            </div>
            <input
              type="range"
              min="1000000"
              max="3500000"
              step="100000"
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="w-full accent-[#2B1B17]"
            />
          </div>

          <button
            type="button"
            onClick={() => {
              setSelectedZone('Todas');
              setMaxPrice(3000000);
            }}
            className="w-full text-xs font-semibold text-[#8C5E3C] hover:underline text-center pt-2"
          >
            Restablecer filtros
          </button>
        </aside>

        {/* Listado / Grid de Propiedades */}
        <main className="lg:col-span-3 space-y-6">
          <div className="flex justify-between items-center text-sm text-[#6E615A]">
            <span>Mostrando {filteredProperties.length} propiedades encontradas</span>
            <span className="text-xs text-[#8C5E3C] font-medium">
              Puedes seleccionar hasta 3 propiedades para comparar lado a lado
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredProperties.map((property) => {
              const isSelectedForCompare = comparisonIds.includes(property.id);
              const estTotalCost = property.price + property.adminFee + property.estimatedTransportMonthly;

              // Propiedad adaptada para PropertyDetail si se abre
              const detailCompatibleProp = {
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
              };

              return (
                <div
                  key={property.id}
                  className={`bg-white rounded-2xl overflow-hidden border transition-all flex flex-col justify-between ${
                    isSelectedForCompare
                      ? 'border-[#2B1B17] ring-2 ring-[#2B1B17]/20 shadow-md'
                      : 'border-[#EAE4DC] shadow-xs hover:shadow-md'
                  }`}
                >
                  {/* Imagen del Inmueble */}
                  <div>
                    <div className="relative h-48 w-full bg-gray-200">
                      <button
                        type="button"
                        onClick={() => setDetailProperty(detailCompatibleProp)}
                        aria-label={`Ver ficha completa de ${property.title}`}
                        className="block w-full h-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#2B1B17]"
                      >
                        <img
                          src={property.image}
                          alt={property.title}
                          className="w-full h-full object-cover"
                        />
                      </button>

                      {property.verified && (
                        <span className="absolute top-3 left-3 bg-[#2B1B17] text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider pointer-events-none">
                          Identidad Verificada
                        </span>
                      )}
                      {property.certified && (
                        <span className="absolute top-3 right-3 bg-[#D9A76A] text-[#2B1B17] text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider pointer-events-none">
                          Certificado de Tradición
                        </span>
                      )}

                      {/* Botón Flotante para Comparar en la Imagen */}
                      {onToggleComparison && (
                        <button
                          type="button"
                          onClick={() => onToggleComparison(property.id)}
                          className={`absolute bottom-3 right-3 text-xs font-extrabold px-3 py-1.5 rounded-xl backdrop-blur-md transition-all shadow-md flex items-center gap-1.5 ${
                            isSelectedForCompare
                              ? 'bg-[#2B1B17] text-white ring-2 ring-white/50'
                              : 'bg-white/90 hover:bg-white text-[#2B1B17]'
                          }`}
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            {isSelectedForCompare ? (
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            ) : (
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                            )}
                          </svg>
                          <span>{isSelectedForCompare ? 'En Comparador' : 'Comparar'}</span>
                        </button>
                      )}
                    </div>

                    {/* Contenido de la Tarjeta */}
                    <div className="p-5 space-y-3">
                      <div>
                        <span className="text-xs font-semibold text-[#8C5E3C]">
                          {property.location}
                        </span>
                        <h3
                          onClick={() => setDetailProperty(detailCompatibleProp)}
                          className="text-lg font-bold text-[#2B1B17] mt-1 cursor-pointer hover:underline"
                        >
                          {property.title}
                        </h3>
                        <div className="text-2xl font-extrabold text-[#2B1B17] mt-2">
                          {formatCOP(property.price)}{' '}
                          <span className="text-xs font-normal text-[#6E615A]">/ mes</span>
                        </div>
                        <p className="text-xs text-[#6E615A] mt-0.5">
                          + {formatCOP(property.adminFee)} administración
                        </p>
                      </div>

                      {/* Costo Total Real Estimado */}
                      <div className="bg-[#F8F5F0] p-3 rounded-xl border border-[#EAE4DC] text-xs">
                        <div className="flex justify-between items-center">
                          <span className="text-[#6E615A] font-medium">Costo Total Mensual estimado:</span>
                          <strong className="text-[#2B1B17]">{formatCOP(estTotalCost)}</strong>
                        </div>
                        <span className="text-[10px] text-[#8C5E3C] block mt-0.5 font-medium">
                          (Incluye {formatCOP(property.estimatedTransportMonthly)} de transporte estimado en Bogotá)
                        </span>
                      </div>

                      {/* Requisitos destacados */}
                      <div className="text-[11px] text-[#4A3E39]">
                        {!property.requirements.guarantorRequired ? (
                          <span className="text-emerald-700 font-bold">Sin codeudor de finca raíz</span>
                        ) : (
                          <span className="text-amber-800 font-medium">Requiere codeudor solidario</span>
                        )}
                        <span className="mx-1.5 text-gray-300">•</span>
                        <span>Depósito: {property.requirements.depositMonths} mes</span>
                      </div>

                      {/* Detalles del espacio */}
                      <div className="flex items-center gap-4 text-xs font-medium text-[#6E615A] border-t border-[#F8F5F0] pt-3">
                        <span>{property.area} m² construidos</span>
                        <span className="text-gray-300">•</span>
                        <span>{property.bedrooms} Hab</span>
                        <span className="text-gray-300">•</span>
                        <span>{property.bathrooms} Baños</span>
                      </div>
                    </div>
                  </div>

                  {/* Botones de Acción */}
                  <div className="p-5 pt-0 space-y-2">
                    <button
                      type="button"
                      onClick={() => setDetailProperty(detailCompatibleProp)}
                      className="w-full bg-[#F8F5F0] hover:bg-[#EAE4DC] text-[#2B1B17] font-semibold py-2 rounded-xl transition-colors text-xs border border-[#EAE4DC]"
                    >
                      Ver Ficha Estandarizada
                    </button>
                    <button
                      type="button"
                      onClick={() => handleContact(property)}
                      className="w-full bg-[#2B1B17] text-white font-medium py-2.5 rounded-xl hover:bg-[#4A3E39] transition-colors text-sm"
                    >
                      Contactar Propietario
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </main>
      </div>

      {/* BARRA FLOTANTE DE COMPARACIÓN (Sticky Bottom Bar) */}
      {comparisonIds.length > 0 && onOpenComparer && (
        <div className="fixed bottom-4 inset-x-0 z-40 px-4 flex justify-center">
          <div className="bg-[#2B1B17] text-white rounded-2xl p-4 shadow-2xl flex flex-wrap items-center justify-between gap-4 max-w-3xl w-full border border-[#4A3E39] backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#4A3E39] flex items-center justify-center text-white">
                <svg className="w-4 h-4 text-[#D9A76A]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <span className="text-sm font-extrabold block">
                  {comparisonIds.length} {comparisonIds.length === 1 ? 'propiedad seleccionada' : 'propiedades seleccionadas'} (Máximo 3)
                </span>
                <span className="text-[11px] text-[#D9A76A]">
                  Compara Arriendo + Administración + Transporte lado a lado
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onOpenComparer}
                className="bg-[#D9A76A] hover:bg-[#e0b57e] text-[#2B1B17] font-extrabold text-xs px-5 py-2.5 rounded-xl transition-all shadow-md hover:scale-102"
              >
                Ver Comparador Lado a Lado ({comparisonIds.length}) →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Ficha Estandarizada */}
      {detailProperty && (
        <PropertyDetail
          property={detailProperty}
          onClose={() => setDetailProperty(null)}
          onContact={handleContactFromDetail}
        />
      )}

      {/* Modal KYC de Verificación (Mockups 03 y 04) */}
      {showKycModal && selectedProperty && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-[#EAE4DC] space-y-5 relative">
            <button
              type="button"
              onClick={() => setShowKycModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 w-8 h-8 rounded-full flex items-center justify-center"
              aria-label="Cerrar"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-[#F8F5F0] text-[#2B1B17] rounded-full flex items-center justify-center mx-auto">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-[#2B1B17]">
                Verifica tu identidad para contactar
              </h3>
              <p className="text-xs text-[#6E615A]">
                Para proteger a ambas partes, Wallex requiere verificar tu perfil antes de agendar una cita o enviar un mensaje para{' '}
                <span className="font-semibold">{selectedProperty.title}</span>.
              </p>
            </div>

            <div className="space-y-3 bg-[#F8F5F0] p-4 rounded-2xl border border-[#EAE4DC] text-xs">
              <div className="flex items-center gap-2 text-[#2B1B17] font-semibold">
                <svg className="w-4 h-4 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <span>Cédula de Ciudadanía cargada</span>
              </div>
              <div className="flex items-center gap-2 text-[#2B1B17] font-semibold">
                <svg className="w-4 h-4 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <span>Verificación facial biométrica</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                alert('¡Verificación KYC completada! Los datos de contacto del propietario han sido enviados a tu correo.');
                setShowKycModal(false);
              }}
              className="w-full bg-[#2B1B17] text-white font-semibold py-3 rounded-xl hover:bg-[#4A3E39] transition-colors text-sm shadow-md"
            >
              Completar Verificación KYC
            </button>
          </div>
        </div>
      )}
    </div>
  );
};