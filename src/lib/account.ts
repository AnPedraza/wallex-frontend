import type { PublisherType, Role, SessionUser } from '../types/account';
import { forgetLocalFavorites, localFavoriteIds } from './favorites';
import { SESSION_KEY, hashPassword, newSalt, readUsers, writeUsers } from './localAccounts';
import { supabase } from './supabase';

// Lo que se hace desde Mi cuenta. Con Supabase va a la cuenta de verdad; sin Supabase, a la cuenta local de este navegador.
// Los errores llevan un código corto en el mensaje (actual, igual, debil, red…) y la pantalla dice qué hacer.

export interface ProfileInput {
  nombre: string;
  rol: Role;
  tipoAnunciante?: PublisherType;
  celular?: string;
}

// Guarda los datos de la cuenta: con Supabase, en la cuenta (lo que lee la sesión) y en la tabla perfiles
export const updateProfile = async (email: string, input: ProfileInput): Promise<SessionUser> => {
  const publishes = input.rol === 'publica';
  const user: SessionUser = {
    email,
    nombre: input.nombre.trim(),
    rol: input.rol,
    tipoAnunciante: publishes ? input.tipoAnunciante : undefined,
    celular: publishes ? input.celular : undefined,
  };
  const row = { nombre: user.nombre, rol: user.rol, tipo_anunciante: user.tipoAnunciante ?? null, celular: user.celular ?? null };

  if (supabase) {
    const { data, error } = await supabase.auth.updateUser({ data: row });
    if (error) throw new Error('red');
    const { error: perfilError } = await supabase.from('perfiles').update(row).eq('id', data.user.id);
    if (perfilError) throw new Error('red');
    return user;
  }

  const users = readUsers();
  const stored = users[email];
  if (!stored) throw new Error('sin-cuenta');
  users[email] = { ...stored, nombre: user.nombre, rol: user.rol, tipoAnunciante: user.tipoAnunciante, celular: user.celular };
  writeUsers(users);
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  return user;
};

// Cambia la contraseña. Primero se comprueba la actual: así nadie la cambia con una sesión que quedó abierta.
export const changePassword = async (email: string, current: string, next: string) => {
  if (current === next) throw new Error('igual');

  if (supabase) {
    const { error: wrong } = await supabase.auth.signInWithPassword({ email, password: current });
    if (wrong) throw new Error(wrong.code === 'invalid_credentials' ? 'actual' : 'red');
    const { error } = await supabase.auth.updateUser({ password: next });
    if (error) throw new Error(error.code === 'same_password' ? 'igual' : error.code === 'weak_password' ? 'debil' : 'red');
    return;
  }

  const users = readUsers();
  const stored = users[email];
  if (!stored || (await hashPassword(current, stored.salt)) !== stored.hash) throw new Error('actual');
  const salt = newSalt();
  users[email] = { ...stored, salt, hash: await hashPassword(next, salt) };
  writeUsers(users);
};

// Todo lo que Wallex tiene de la persona, en un JSON para descargar (Ley 1581: conocer sus datos)
export const exportMyData = async (user: SessionUser): Promise<string> => {
  const generado = new Date().toISOString();
  if (!supabase) {
    return JSON.stringify(
      {
        generado,
        nota: 'Cuenta de prueba guardada solo en este navegador.',
        cuenta: { correo: user.email, nombre: user.nombre, rol: user.rol, tipoAnunciante: user.tipoAnunciante, celular: user.celular },
        guardados: localFavoriteIds(user.email),
      },
      null,
      2
    );
  }

  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError || !auth.user) throw new Error('red');
  const id = auth.user.id;
  // Cada consulta trae solo lo propio: así lo dicen los permisos de la base de datos
  const [perfil, arriendos, contactos, guardados, verificaciones] = await Promise.all([
    supabase.from('perfiles').select('nombre, rol, tipo_anunciante, celular, creado').eq('id', id).maybeSingle(),
    supabase.from('inmuebles').select('*').eq('user_id', id).order('creado', { ascending: false }),
    supabase.from('contactos').select('inmueble_id, nombre, celular').eq('user_id', id),
    supabase.from('favoritos').select('inmueble_id, creado').order('creado', { ascending: false }),
    supabase.from('verificaciones').select('estado, creado, actualizado').order('creado', { ascending: false }),
  ]);
  const failed = [perfil, arriendos, contactos, guardados, verificaciones].find((r) => r.error);
  if (failed) throw new Error('red');

  return JSON.stringify(
    {
      generado,
      cuenta: { correo: auth.user.email, creada: auth.user.created_at },
      perfil: perfil.data,
      arriendos: arriendos.data,
      contactosDeTusArriendos: contactos.data,
      guardados: guardados.data,
      verificacionesDeIdentidad: verificaciones.data,
    },
    null,
    2
  );
};

// Borra la cuenta con todo lo suyo. Con Supabase lo hace la función borrar-cuenta, que tiene la llave para hacerlo.
export const deleteAccount = async (email: string) => {
  if (supabase) {
    const { error } = await supabase.functions.invoke('borrar-cuenta', { body: {} });
    if (error) throw new Error('red');
    // La cuenta ya no existe en el servidor: solo queda cerrar la sesión en este navegador
    await supabase.auth.signOut({ scope: 'local' });
    return;
  }

  const users = readUsers();
  delete users[email];
  writeUsers(users);
  forgetLocalFavorites(email);
  localStorage.removeItem(SESSION_KEY);
};
