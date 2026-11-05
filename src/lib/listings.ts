import type { PublisherType } from '../types/account';
import type { Property } from '../types/property';
import { supabase } from './supabase';

// Las 20 localidades de Bogotá, para la zona de cada publicación
export const BOGOTA_ZONES = [
  'Antonio Nariño',
  'Barrios Unidos',
  'Bosa',
  'Chapinero',
  'Ciudad Bolívar',
  'Engativá',
  'Fontibón',
  'Kennedy',
  'La Candelaria',
  'Los Mártires',
  'Puente Aranda',
  'Rafael Uribe Uribe',
  'San Cristóbal',
  'Santa Fe',
  'Suba',
  'Sumapaz',
  'Teusaquillo',
  'Tunjuelito',
  'Usaquén',
  'Usme',
];

// Transporte estimado de lo publicado: 2 pasajes al día, 22 días hábiles, a $ 3.550 el pasaje.
// Es la misma base del perfil "TransMilenio o SITP a diario" del comparador.
export const BASE_TRANSPORT = 3550 * 2 * 22;

export interface ListingRow {
  id: string;
  user_id: string;
  estado: 'publicado' | 'pausado';
  tipo_anunciante: PublisherType;
  titulo: string;
  zona: string;
  barrio: string;
  estrato: number;
  area: number;
  habitaciones: number;
  banos: number;
  canon: number;
  administracion: number;
  deposito: number;
  pide_codeudor: boolean;
  ingresos_veces: number;
  acepta_mascotas: boolean;
  plazo_meses: number;
  transporte: string;
  descripcion: string;
  fotos: string[];
  creado: string;
}

export type ListingInput = Omit<ListingRow, 'id' | 'user_id' | 'estado' | 'fotos' | 'creado'>;

export interface ListingContact {
  nombre: string;
  celular: string;
}

const COLUMNS =
  'id,user_id,estado,tipo_anunciante,titulo,zona,barrio,estrato,area,habitaciones,banos,canon,administracion,deposito,' +
  'pide_codeudor,ingresos_veces,acepta_mascotas,plazo_meses,transporte,descripcion,fotos,creado';

const PUBLISHER_LABEL: Record<PublisherType, string> = {
  propietario: 'Propietario',
  inmobiliaria: 'Inmobiliaria',
  arrendatario: 'Arrendatario que cede el contrato',
};

export const monthTotalOf = (row: Pick<ListingRow, 'canon' | 'administracion'>) => row.canon + row.administracion + BASE_TRANSPORT;

// Una publicación con la misma forma que los inmuebles de ejemplo, para que el catálogo y la ficha la traten igual.
// Mientras la verificación de identidad sea simulada, nada de lo publicado sale como verificado.
export const toProperty = (row: ListingRow): Property => ({
  id: row.id,
  title: row.titulo,
  location: `${row.barrio}, Bogotá`,
  zone: row.zona,
  price: row.canon,
  adminFee: row.administracion,
  deposit: row.deposito,
  estimatedTransportMonthly: BASE_TRANSPORT,
  transitAccess: row.transporte || 'Sin datos de transporte',
  area: row.area,
  bedrooms: row.habitaciones,
  bathrooms: row.banos,
  stratum: row.estrato,
  verified: false,
  certified: false,
  ownerName: `${PUBLISHER_LABEL[row.tipo_anunciante]} (sin verificar)`,
  image: row.fotos[0],
  images: row.fotos,
  description: row.descripcion || undefined,
  publisherType: row.tipo_anunciante,
  requirements: {
    guarantorRequired: row.pide_codeudor,
    minIncomeMultiplier: Number(row.ingresos_veces),
    petsAllowed: row.acepta_mascotas,
    leaseTermMonths: row.plazo_meses,
    depositMonths: row.canon > 0 ? Math.round((row.deposito / row.canon) * 10) / 10 : 0,
  },
});

// Si falla, quien llama decide: el catálogo sigue con los de ejemplo y Guardados no da por perdido nada
export const fetchPublished = async (): Promise<Property[]> => {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('inmuebles')
    .select(COLUMNS)
    .eq('estado', 'publicado')
    .order('creado', { ascending: false })
    .limit(200);
  if (error) throw error;
  return ((data ?? []) as unknown as ListingRow[]).map(toProperty);
};

export const fetchMine = async (userId: string): Promise<ListingRow[]> => {
  if (!supabase) return [];
  const { data, error } = await supabase.from('inmuebles').select(COLUMNS).eq('user_id', userId).order('creado', { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as ListingRow[];
};

const pathOf = (url: string) => url.split('/storage/v1/object/public/fotos/')[1] ?? '';

export const removePhotos = async (urls: string[]) => {
  const paths = urls.map(pathOf).filter(Boolean);
  if (!supabase || paths.length === 0) return;
  await supabase.storage.from('fotos').remove(paths);
};

// Sube las fotos una por una a la carpeta de quien publica. Si una falla, borra las que alcanzó a subir.
export const uploadPhotos = async (userId: string, photos: Blob[], onProgress?: (done: number) => void): Promise<string[]> => {
  if (!supabase) throw new Error('sin-supabase');
  const bucket = supabase.storage.from('fotos');
  const urls: string[] = [];
  for (const [i, photo] of photos.entries()) {
    const path = `${userId}/${crypto.randomUUID()}.jpg`;
    const { error } = await bucket.upload(path, photo, { contentType: 'image/jpeg', cacheControl: '31536000', upsert: false });
    if (error) {
      await removePhotos(urls);
      throw error;
    }
    urls.push(bucket.getPublicUrl(path).data.publicUrl);
    onProgress?.(i + 1);
  }
  return urls;
};

// Guarda la ficha y el contacto. Si el contacto falla, se borra la ficha para no dejar un anuncio sin contacto.
export const publishListing = async (input: ListingInput, fotos: string[], contact: ListingContact): Promise<string> => {
  if (!supabase) throw new Error('sin-supabase');
  const { data, error } = await supabase.from('inmuebles').insert({ ...input, fotos }).select('id').single();
  if (error) throw error;
  const id = (data as { id: string }).id;
  const { error: contactError } = await supabase.from('contactos').insert({ inmueble_id: id, ...contact });
  if (contactError) {
    await supabase.from('inmuebles').delete().eq('id', id);
    throw contactError;
  }
  return id;
};

export const setListingState = async (id: string, estado: ListingRow['estado']) => {
  if (!supabase) return;
  const { error } = await supabase.from('inmuebles').update({ estado }).eq('id', id);
  if (error) throw error;
};

export const deleteListing = async (row: ListingRow) => {
  if (!supabase) return;
  const { error } = await supabase.from('inmuebles').delete().eq('id', row.id);
  if (error) throw error;
  await removePhotos(row.fotos);
};

// El contacto solo llega a quien tiene sesión iniciada (lo cuidan los permisos de la base de datos)
export const fetchContact = async (inmuebleId: string): Promise<ListingContact | null> => {
  if (!supabase) return null;
  const { data, error } = await supabase.from('contactos').select('nombre,celular').eq('inmueble_id', inmuebleId).maybeSingle();
  if (error) throw error;
  return data as ListingContact | null;
};
