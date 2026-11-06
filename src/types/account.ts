// Quien usa Wallex busca arriendo o publica. Si publica, lo hace como propietario, inmobiliaria
// o arrendatario que cede su contrato.
export type Role = 'busca' | 'publica';
export type PublisherType = 'propietario' | 'inmobiliaria' | 'arrendatario';

// Lo que la app sabe de la persona con sesión
export interface SessionUser {
  email: string;
  nombre?: string;
  rol?: Role;
  tipoAnunciante?: PublisherType;
  celular?: string;
}

// Las dos maneras de usar Wallex, como se ofrecen en el registro y en Mi cuenta
export const ROLE_OPTIONS: { id: Role; title: string; body: string }[] = [
  { id: 'busca', title: 'Busco arriendo', body: 'Filtra, compara y guarda tus favoritos.' },
  { id: 'publica', title: 'Quiero publicar', body: 'Publica tu arriendo con la ficha completa.' },
];

export const PUBLISHER_TYPES: { id: PublisherType; label: string }[] = [
  { id: 'propietario', label: 'Propietario' },
  { id: 'inmobiliaria', label: 'Inmobiliaria' },
  { id: 'arrendatario', label: 'Arrendatario que cede el contrato' },
];
