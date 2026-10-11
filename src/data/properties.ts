export interface Requirement {
  label: string;
  required: boolean; // true = obligatorio, false = opcional o alternativa
  detail?: string;
}

export interface Property {
  id: string;
  title: string;
  location: string;
  price: number; // canon mensual en COP
  adminFee: number; // administración mensual en COP
  deposit: number; // depósito en COP (0 = sin depósito)
  area: number; // m²
  bedrooms: number;
  bathrooms: number;
  verified: boolean; // propietario verificado (KYC)
  certified: boolean; // certificado de tradición cotejado
  requiresCoSigner: boolean;
  images: string[]; // galería, la primera es la portada
  description: string;
  requirements: Requirement[];
}

const photo = (id: string) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1200&q=80`;

// La galería usa fotos de 1200 px; las tarjetas piden una versión más liviana
export const cardImage = (property: Property) => property.images[0].replace('w=1200', 'w=600');

export const monthlyTotal = (property: Property) => property.price + property.adminFee;

export const mockProperties: Property[] = [
  {
    id: '1',
    title: 'Apartamento en Chapinero Alto',
    location: 'Chapinero Alto, Bogotá',
    price: 1850000,
    adminFee: 250000,
    deposit: 1850000,
    area: 55,
    bedrooms: 2,
    bathrooms: 1,
    verified: true,
    certified: true,
    requiresCoSigner: true,
    images: [
      photo('photo-1522708323590-d24dbb6b0267'),
      photo('photo-1484154218962-a197022b5858'),
      photo('photo-1505691938895-1758d7feb511'),
      photo('photo-1536376072261-38c75010e6c9'),
    ],
    description:
      'Apartamento luminoso a pocas cuadras de la carrera 13, con cocina integral y buena ventilación. Edificio con portería 24 horas.',
    requirements: [
      {
        label: 'Codeudor con finca raíz en Bogotá',
        required: true,
        detail: 'Debe presentar certificado de libertad y tradición vigente.',
      },
      { label: 'Ingresos de 3 veces el canon', required: true, detail: 'Se comprueban con desprendibles o certificado laboral.' },
      { label: 'Estudio de crédito', required: true },
    ],
  },
  {
    id: '2',
    title: 'Apartamento en Teusaquillo',
    location: 'Teusaquillo, Bogotá',
    price: 2100000,
    adminFee: 300000,
    deposit: 0,
    area: 68,
    bedrooms: 2,
    bathrooms: 2,
    verified: true,
    certified: false,
    requiresCoSigner: false,
    images: [
      photo('photo-1502672260266-1c1ef2d93688'),
      photo('photo-1556909114-f6e7ad7d3136'),
      photo('photo-1540518614846-7eded433c457'),
    ],
    description:
      'Apartamento amplio en una zona tranquila y arbolada, cerca de universidades y transporte. Dos baños y balcón.',
    requirements: [
      {
        label: 'Póliza de arrendamiento en lugar de codeudor',
        required: true,
        detail: 'Con cualquier aseguradora autorizada; la paga el inquilino.',
      },
      { label: 'Certificado laboral o de estudios', required: true },
    ],
  },
  {
    id: '3',
    title: 'Apto Moderno en Cedritos',
    location: 'Cedritos, Bogotá',
    price: 1650000,
    adminFee: 200000,
    deposit: 1650000,
    area: 48,
    bedrooms: 1,
    bathrooms: 1,
    verified: true,
    certified: true,
    requiresCoSigner: false,
    images: [
      photo('photo-1560448204-e02f11c3d0e2'),
      photo('photo-1554995207-c18c203602cb'),
      photo('photo-1513694203232-719a280e022f'),
      photo('photo-1560185007-cde436f6a4d0'),
    ],
    description:
      'Apartamento de una alcoba, moderno y amoblado en parte, ideal para una persona o pareja. Cerca de comercio y ciclorruta.',
    requirements: [
      {
        label: 'Pago de 2 meses por adelantado',
        required: true,
        detail: 'Reemplaza al codeudor; se descuenta del canon de los dos primeros meses.',
      },
      { label: 'Referencias personales', required: false },
    ],
  },
  {
    id: '4',
    title: 'Apartamento en La Soledad',
    location: 'Teusaquillo, Bogotá',
    price: 1950000,
    adminFee: 220000,
    deposit: 3900000,
    area: 60,
    bedrooms: 2,
    bathrooms: 2,
    verified: false,
    certified: false,
    requiresCoSigner: true,
    images: [
      photo('photo-1493809842364-78817add7ffb'),
      photo('photo-1502005229762-cf1b2da7c5d6'),
      photo('photo-1507089947368-19c1da9775ae'),
    ],
    description:
      'Apartamento en un barrio tradicional, con buena iluminación y cuarto de ropas. El propietario aún no ha completado su verificación.',
    requirements: [
      { label: 'Codeudor', required: true },
      { label: 'Extractos bancarios de los últimos 3 meses', required: true },
    ],
  },
];
