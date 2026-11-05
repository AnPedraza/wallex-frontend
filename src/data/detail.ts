import type { SealStatus } from '../components/FolioSeal';
import type { Property } from '../types/property';
import { sampleFolio } from './folio';
import type { Property as DetailProperty } from './properties';

// Lo que comparten las tarjetas del catálogo y de Guardados con la ficha de cada inmueble

export const sealStatus = (p: Property): SealStatus => (!p.verified ? 'unverified' : p.certified ? 'verified' : 'pending');

export const folioOf = (p: Property) => sampleFolio(p.id, p.title, p.zone);

// La ficha usa su propio formato (data/properties): galería, descripción y requisitos en filas
export const toDetail = (property: Property): DetailProperty => ({
  ...property,
  images: property.images ?? [property.image],
  description: property.description ?? `${property.title} ubicado en ${property.location}. ${property.transitAccess}.`,
  requiresCoSigner: property.requirements.guarantorRequired,
  requirements: [
    {
      label: property.requirements.guarantorRequired ? 'Codeudor con finca raíz en Bogotá' : 'Sin codeudor con finca raíz',
      required: property.requirements.guarantorRequired,
      detail: property.requirements.notes,
    },
    property.requirements.minIncomeMultiplier > 0
      ? { label: `Demostración de ingresos de ${property.requirements.minIncomeMultiplier}x el valor de arriendo`, required: true }
      : { label: 'Sin demostración de ingresos', required: false },
  ],
});
