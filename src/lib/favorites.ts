import { supabase } from './supabase';

// Los arriendos que cada persona guarda para ver después. Con las cuentas de Supabase van a la tabla
// favoritos, donde cada quien ve y cambia solo lo suyo. Con la cuenta local quedan en este navegador.
const LOCAL_KEY = 'wallex.guardados';

const readLocal = (): Record<string, unknown> => {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(LOCAL_KEY) ?? '{}');
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? (parsed as Record<string, unknown>) : {};
  } catch {
    return {};
  }
};

const localIds = (email: string): string[] => {
  const ids = readLocal()[email];
  return Array.isArray(ids) ? ids.filter((id): id is string => typeof id === 'string') : [];
};

const writeLocal = (email: string, ids: string[]) => {
  localStorage.setItem(LOCAL_KEY, JSON.stringify({ ...readLocal(), [email]: ids }));
};

// Los ids guardados, del más reciente al más antiguo
export const fetchFavorites = async (email: string): Promise<string[]> => {
  if (!supabase) return localIds(email);
  const { data, error } = await supabase.from('favoritos').select('inmueble_id').order('creado', { ascending: false });
  if (error) throw error;
  return ((data ?? []) as { inmueble_id: string }[]).map((row) => row.inmueble_id);
};

export const addFavorite = async (email: string, id: string) => {
  if (!supabase) {
    writeLocal(email, [id, ...localIds(email).filter((x) => x !== id)]);
    return;
  }
  const { error } = await supabase.from('favoritos').insert({ inmueble_id: id });
  // Si ya estaba guardado (por ejemplo, desde otra pestaña), no es un error
  if (error && error.code !== '23505') throw error;
};

export const removeFavorites = async (email: string, ids: string[]) => {
  if (!supabase) {
    writeLocal(email, localIds(email).filter((x) => !ids.includes(x)));
    return;
  }
  const { error } = await supabase.from('favoritos').delete().in('inmueble_id', ids);
  if (error) throw error;
};
