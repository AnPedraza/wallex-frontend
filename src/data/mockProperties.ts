import type { Property, TransportProfile } from '../types/property';

export const TRANSPORT_PROFILES: TransportProfile[] = [
  {
    id: 'standard',
    name: 'Uso diario de TransMilenio o SITP',
    description: '2 trayectos al día, 22 días hábiles (tarifa en Bogotá: $3.550 por pasaje)',
    multiplier: 1.0,
  },
  {
    id: 'hybrid',
    name: 'Bici y transporte público',
    description: 'Alternancia de ciclorruta y transporte público 3 días por semana',
    multiplier: 0.6,
  },
  {
    id: 'intensive',
    name: 'Muchos trayectos y transbordos',
    description: 'Trayectos interzonales frecuentes o combinación de SITP + alimentación',
    multiplier: 1.35,
  },
];

export const INITIAL_PROPERTIES: Property[] = [
  {
    id: '1',
    title: 'Apartamento en Chapinero Alto',
    location: 'Chapinero Alto, Bogotá',
    zone: 'Chapinero',
    price: 1850000,
    adminFee: 250000,
    deposit: 1850000,
    estimatedTransportMonthly: 106500,
    transitAccess: 'A 5 min de TransMilenio Calle 63 y ciclorruta Cra 7ma',
    area: 55,
    bedrooms: 2,
    bathrooms: 1,
    stratum: 4,
    verified: true,
    certified: true,
    ownerName: 'Carlos Mendoza (Verificado)',
    image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80',
    requirements: {
      guarantorRequired: false,
      minIncomeMultiplier: 2.0,
      petsAllowed: true,
      leaseTermMonths: 12,
      depositMonths: 1,
      notes: 'No exige codeudor con finca raíz. Se aceptan mascotas medianas.',
    },
    features: ['Balcón con vista oriental', 'Cocina integral', 'Calentador a gas'],
  },
  {
    id: '2',
    title: 'Apartamento en Teusaquillo',
    location: 'Teusaquillo, Bogotá',
    zone: 'Teusaquillo',
    price: 2100000,
    adminFee: 300000,
    deposit: 1000000,
    estimatedTransportMonthly: 156200,
    transitAccess: 'A 6 min de estación Calle 45 y Parkway',
    area: 68,
    bedrooms: 2,
    bathrooms: 2,
    stratum: 4,
    verified: true,
    certified: false,
    ownerName: 'Mariana Duarte (Verificada)',
    image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80',
    requirements: {
      guarantorRequired: true,
      minIncomeMultiplier: 2.5,
      petsAllowed: true,
      leaseTermMonths: 12,
      depositMonths: 0.5,
      notes: 'Requiere codeudor solidario (sin obligación de finca raíz).',
    },
    features: ['Pisos en madera laminada', 'Cerca al Parkway', 'Zona de lavandería'],
  },
  {
    id: '3',
    title: 'Apto moderno en Cedritos',
    location: 'Cedritos, Bogotá',
    zone: 'Cedritos',
    price: 1650000,
    adminFee: 200000,
    deposit: 1650000,
    estimatedTransportMonthly: 248500,
    transitAccess: 'A 12 min de estación Alcalá (AutoNorte) + SITP Cl 140',
    area: 48,
    bedrooms: 1,
    bathrooms: 1,
    stratum: 4,
    verified: true,
    certified: true,
    ownerName: 'Jorge Ramírez (Verificado)',
    image: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80',
    requirements: {
      guarantorRequired: false,
      minIncomeMultiplier: 2.2,
      petsAllowed: false,
      leaseTermMonths: 6,
      depositMonths: 1,
      notes: 'Sin codeudor tradicional. Contrato flexible desde 6 meses. No mascotas.',
    },
    features: ['Gimnasio en edificio', 'Terraza BBQ', 'Parqueadero cubierto'],
  },
  {
    id: '4',
    title: 'Apartamento en La Soledad',
    location: 'Teusaquillo - La Soledad, Bogotá',
    zone: 'Teusaquillo',
    price: 1950000,
    adminFee: 220000,
    deposit: 1950000,
    estimatedTransportMonthly: 142000,
    transitAccess: 'A 8 min de TransMilenio Concejo de Bogotá y Av. El Dorado',
    area: 60,
    bedrooms: 2,
    bathrooms: 2,
    stratum: 4,
    verified: false,
    certified: false,
    ownerName: 'Anuncio particular (sin verificar)',
    image: 'https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=800&q=80',
    requirements: {
      guarantorRequired: true,
      minIncomeMultiplier: 3.0,
      petsAllowed: false,
      leaseTermMonths: 12,
      depositMonths: 1,
      notes: 'Exige codeudor con propiedad raíz en Bogotá y póliza tradicional.',
    },
    features: ['Iluminación natural', 'Cerca a parques', 'Cocina cerrada'],
  },
  {
    id: '5',
    title: 'Apartaestudio en Chapinero Central',
    location: 'Chapinero Central, Bogotá',
    zone: 'Chapinero',
    price: 1400000,
    adminFee: 160000,
    deposit: 800000,
    estimatedTransportMonthly: 71000,
    transitAccess: 'A 3 min de TransMilenio Calle 57, caminable a universidades',
    area: 36,
    bedrooms: 1,
    bathrooms: 1,
    stratum: 3,
    verified: true,
    certified: true,
    ownerName: 'Andrea Beltrán (Verificada)',
    image: 'https://images.unsplash.com/photo-1536376072261-38c75010e6c9?auto=format&fit=crop&w=800&q=80',
    requirements: {
      guarantorRequired: false,
      minIncomeMultiplier: 1.8,
      petsAllowed: true,
      leaseTermMonths: 6,
      depositMonths: 0.5,
      notes: 'Especial para estudiantes o profesionales jóvenes. 100% verificado.',
    },
    features: ['Amoblado básico', 'Internet fibra óptica incluido', 'Lavandería comunal'],
  },
  {
    id: '6',
    title: 'Apartamento familiar en Salitre Oriental',
    location: 'Salitre Oriental, Bogotá',
    zone: 'Teusaquillo',
    price: 2450000,
    adminFee: 340000,
    deposit: 2450000,
    estimatedTransportMonthly: 177500,
    transitAccess: 'A 5 min de estación CAN y Av. Esperanza',
    area: 76,
    bedrooms: 3,
    bathrooms: 2,
    stratum: 5,
    verified: true,
    certified: true,
    ownerName: 'Felipe Gómez (Verificado)',
    image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80',
    requirements: {
      guarantorRequired: false,
      minIncomeMultiplier: 2.3,
      petsAllowed: true,
      leaseTermMonths: 12,
      depositMonths: 1,
      notes: 'Validación por Wallex sin trámites notariales ni codeudor finca raíz.',
    },
    features: ['Parqueadero privado', 'Depósito', 'Piscina y zonas húmedas'],
  },
];

/**
 * Calcula el costo total mensual sumando Arriendo + Administración + Transporte
 */
export function calculateTotalMonthlyCost(
  property: Property,
  transportMultiplier: number = 1.0,
  customTransportOverride?: number
): number {
  const transport =
    customTransportOverride !== undefined
      ? customTransportOverride
      : Math.round(property.estimatedTransportMonthly * transportMultiplier);
  return property.price + property.adminFee + transport;
}

/**
 * Calcula el valor por metro cuadrado del arriendo
 */
export function calculatePricePerM2(property: Property): number {
  if (!property.area || property.area <= 0) return 0;
  return Math.round(property.price / property.area);
}

/**
 * Formatea valores en moneda colombiana COP
 */
export function formatCOP(value: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(value);
}
