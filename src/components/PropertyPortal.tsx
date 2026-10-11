import React, { useState } from 'react';
import { cardImage, mockProperties, monthlyTotal, type Property } from '../data/properties';
import { PropertyDetail } from './PropertyDetail';

export const PropertyPortal: React.FC = () => {
  const [selectedZone, setSelectedZone] = useState<string>('Todas');
  const [maxPrice, setMaxPrice] = useState<number>(3000000);
  const [showKycModal, setShowKycModal] = useState<boolean>(false);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [detailProperty, setDetailProperty] = useState<Property | null>(null);

  // Filtrado de propiedades
  const filteredProperties = mockProperties.filter((p) => {
    const matchesZone = selectedZone === 'Todas' || p.location.includes(selectedZone);
    const matchesPrice = p.price <= maxPrice;
    return matchesZone && matchesPrice;
  });

  const handleContact = (property: Property) => {
    setSelectedProperty(property);
    setShowKycModal(true);
  };

  // Desde la ficha: se cierra y se abre el modal KYC con ese inmueble
  const handleContactFromDetail = (property: Property) => {
    setDetailProperty(null);
    handleContact(property);
  };

  return (
    <div className="min-h-screen bg-[#F8F5F0] text-[#2B1B17] font-sans">
      {/* Encabezado del Portal */}
      <div className="max-w-7xl mx-auto px-6 pt-8 pb-4">
        <h1 className="text-3xl font-bold tracking-tight text-[#2B1B17]">
          Inmuebles disponibles en Bogotá
        </h1>
        <p className="text-[#6E615A] mt-1">
          Viviendas verificadas con precios transparentes y sin intermediarios ocultos.
        </p>
      </div>

      {/* Contenedor Principal: Filtros + Grid de Inmuebles */}
      <div className="max-w-7xl mx-auto px-6 py-6 grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar de Filtros (Mockup 05) */}
        <aside className="bg-white p-6 rounded-2xl shadow-sm border border-[#EAE4DC] h-fit space-y-6">
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
              <option value="Chapinero">Chapinero Alto</option>
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
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredProperties.map((property) => (
              <div
                key={property.id}
                className="bg-white rounded-2xl overflow-hidden border border-[#EAE4DC] shadow-sm hover:shadow-md transition-shadow flex flex-col"
              >
                {/* Imagen del Inmueble */}
                <div className="relative h-48 w-full bg-gray-200">
                  <button
                    type="button"
                    onClick={() => setDetailProperty(property)}
                    aria-label={`Ver ficha completa de ${property.title}`}
                    className="block w-full h-full focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#2B1B17]"
                  >
                    <img
                      src={cardImage(property)}
                      alt={property.title}
                      className="w-full h-full object-cover"
                    />
                  </button>
                  {property.verified && (
                    <span className="absolute top-3 left-3 bg-[#2B1B17] text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider pointer-events-none">
                      ✓ Verificada
                    </span>
                  )}
                  {property.certified && (
                    <span className="absolute top-3 right-3 bg-[#D9A76A] text-[#2B1B17] text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider pointer-events-none">
                      Certificado de Tradición
                    </span>
                  )}
                </div>

                {/* Contenido de la Tarjeta */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <span className="text-xs font-semibold text-[#8C5E3C]">
                      {property.location}
                    </span>
                    <h3 className="text-lg font-bold text-[#2B1B17] mt-1">
                      <button
                        type="button"
                        onClick={() => setDetailProperty(property)}
                        className="text-left hover:underline rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2B1B17]"
                      >
                        {property.title}
                      </button>
                    </h3>
                    <div className="text-2xl font-extrabold text-[#2B1B17] mt-2">
                      ${monthlyTotal(property).toLocaleString('es-CO')}{' '}
                      <span className="text-xs font-normal text-[#6E615A]">/ mes en total</span>
                    </div>
                    <p className="text-xs text-[#6E615A] mt-0.5">
                      ${property.price.toLocaleString('es-CO')} de canon + $
                      {property.adminFee.toLocaleString('es-CO')} de administración
                    </p>
                  </div>

                  {/* Detalles del espacio */}
                  <div className="flex items-center gap-4 text-xs font-medium text-[#6E615A] border-t border-[#F8F5F0] pt-3">
                    <span>📐 {property.area} m²</span>
                    <span>🛏️ {property.bedrooms} Hab</span>
                    <span>🚿 {property.bathrooms} Baños</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setDetailProperty(property)}
                    className="w-full border border-[#2B1B17] text-[#2B1B17] font-medium py-3 rounded-xl hover:bg-[#F8F5F0] transition-colors text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2B1B17]"
                  >
                    Ver ficha completa
                  </button>

                  {/* Botón de Contacto KYC */}
                  <button
                    onClick={() => handleContact(property)}
                    className="w-full bg-[#2B1B17] text-white font-medium py-3 rounded-xl hover:bg-[#4A3E39] transition-colors text-sm"
                  >
                    Contactar Propietario
                  </button>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>

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
              onClick={() => setShowKycModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-lg"
            >
              ✕
            </button>

            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-[#F8F5F0] text-[#2B1B17] rounded-full flex items-center justify-center mx-auto text-xl font-bold">
                🔒
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
                <span>✓</span> Cédula de Ciudadanía cargada
              </div>
              <div className="flex items-center gap-2 text-[#2B1B17] font-semibold">
                <span>✓</span> Verificación facial biométrica
              </div>
            </div>

            <button
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