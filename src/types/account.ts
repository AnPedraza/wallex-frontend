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

export const PUBLISHER_TYPES: { id: PublisherType; label: string }[] = [
  { id: 'propietario', label: 'Propietario' },
  { id: 'inmobiliaria', label: 'Inmobiliaria' },
  { id: 'arrendatario', label: 'Arrendatario que cede el contrato' },
];
