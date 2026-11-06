import { supabase } from './supabase';

// En qué va la verificación de identidad de la persona, en palabras de Wallex
export type IdentityState = 'ninguna' | 'en-curso' | 'en-revision' | 'aprobada' | 'rechazada' | 'vencida';

// Los estados de Didit (son textos exactos, con mayúsculas) traducidos
export const identityStateOf = (estado: unknown): IdentityState => {
  switch (estado) {
    case 'Approved':
      return 'aprobada';
    case 'In Review':
      return 'en-revision';
    case 'Declined':
      return 'rechazada';
    case 'Not Started':
    case 'In Progress':
    case 'Resubmitted':
      return 'en-curso';
    case 'Abandoned':
    case 'Expired':
    case 'Kyc Expired':
      return 'vencida';
    default:
      return 'ninguna';
  }
};

// Lo guardado en Wallex, sin preguntarle a Didit (cada quien solo lee sus verificaciones)
export const readIdentity = async (): Promise<IdentityState> => {
  if (!supabase) return 'ninguna';
  const { data, error } = await supabase
    .from('verificaciones')
    .select('estado')
    .order('creado', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return identityStateOf((data as { estado: string } | null)?.estado);
};

// Le pregunta a Didit, por la función de Wallex, cómo va la última verificación
export const refreshIdentity = async (): Promise<IdentityState> => {
  if (!supabase) return 'ninguna';
  const { data, error } = await supabase.functions.invoke('verificacion', { body: { accion: 'consultar' } });
  if (error) throw error;
  return identityStateOf((data as { estado?: unknown } | null)?.estado);
};

// Crea la sesión en Didit y devuelve el enlace a su página. "volver" es la dirección de Wallex a la que regresa la persona.
export const startIdentity = async (volver: string): Promise<string> => {
  if (!supabase) throw new Error('sin-supabase');
  const { data, error } = await supabase.functions.invoke('verificacion', { body: { accion: 'iniciar', volver } });
  if (error) throw error;
  const url = (data as { url?: unknown } | null)?.url;
  if (typeof url !== 'string') throw new Error('sin-enlace');
  return url;
};

// Quiénes de los que publican tienen la identidad verificada, para el sello de sus arriendos
export const fetchVerifiedPublishers = async (userIds: string[]): Promise<Set<string>> => {
  if (!supabase || userIds.length === 0) return new Set();
  const { data, error } = await supabase.from('identidades').select('user_id').in('user_id', userIds);
  if (error) throw error;
  return new Set(((data ?? []) as { user_id: string }[]).map((row) => row.user_id));
};
