export interface PropertyRequirements {
  guarantorRequired: boolean; // ¿Exige codeudor con finca raíz tradicional?
  minIncomeMultiplier: number; // Múltiplo de ingresos mínimos requeridos (ej. 2x o 2.5x el valor de arriendo)
  petsAllowed: boolean; // ¿Acepta mascotas?
  leaseTermMonths: number; // Plazo mínimo de contrato en meses
  depositMonths: number; // Meses de depósito exigidos (0 si no aplica)
  notes?: string;
}

export interface Property {
  id: string;
  title: string;
  location: string;
  zone: string; // Localidad / Zona de Bogotá (Chapinero, Teusaquillo, Cedritos, etc.)
  price: number; // Valor de arriendo mensual (COP)
  adminFee: number; // Cuota de administración mensual (COP)
  deposit: number; // Depósito en garantía (COP)
  estimatedTransportMonthly: number; // Estimación base mensual de transporte (SITP / TransMilenio)
  transitAccess: string; // Conectividad a transporte masivo o ciclorrutas
  area: number; // Área en metros cuadrados (m²)
  bedrooms: number;
  bathrooms: number;
  stratum: number; // Estrato socioeconómico (1-6)
  verified: boolean; // Verificación de identidad y antecedentes del propietario (KYC)
  certified: boolean; // Certificado de Tradición y Libertad cotejado con VUR/SNR
  ownerName: string;
  image: string;
  requirements: PropertyRequirements;
  features?: string[];
}

export interface TransportProfile {
  id: string;
  name: string;
  description: string;
  multiplier: number; // Factor sobre el transporte base
}
