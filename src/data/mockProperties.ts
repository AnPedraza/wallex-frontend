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

// Fotos de ejemplo de bancos gratuitos (Pexels y Unsplash): varias del mismo apartamento.
// La ficha las pide a 1200 px; la tarjeta, el comparador y la landing usan la primera a 800 px.
const pexels = (id: number, w = 1200) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=${w}`;
const unsplash = (id: string, w = 1200) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

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
    image: pexels(19836804, 800),
    images: [19836804, 19836831, 19836834, 19836836, 19836823].map((id) => pexels(id)),
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
    image: pexels(29904150, 800),
    images: [29904150, 29904156, 29904164, 29904143, 29904159, 29904166].map((id) => pexels(id)),
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
    image: pexels(6890390, 800),
    images: [6890390, 6890399, 6890396, 6890405, 6890413, 6890401].map((id) => pexels(id)),
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
    image: pexels(19836843, 800),
    images: [19836843, 19836849, 19836844, 19836850].map((id) => pexels(id)),
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
    image: unsplash('photo-1702014862053-946a122b920d', 800),
    images: [
      'photo-1702014862053-946a122b920d',
      'photo-1702014859878-5d4743176d28',
      'photo-1702014861736-d62834317c5e',
      'photo-1702014861373-527115231f8c',
      'photo-1702014859908-d48b9b844240',
      'photo-1702014860610-06a4c3f83381',
    ].map((id) => unsplash(id)),
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
    image: pexels(19836794, 800),
    images: [19836794, 19836805, 19836796, 19836792, 19836803, 19836800].map((id) => pexels(id)),
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
