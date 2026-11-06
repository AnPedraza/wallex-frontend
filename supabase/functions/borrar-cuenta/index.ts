// Borra la cuenta de quien llama, con todo lo suyo (Ley 1581: derecho a que borren sus datos).
// Perfil, arriendos, contactos, guardados y verificaciones se van solos al borrar la cuenta, porque esas
// tablas apuntan a ella con "on delete cascade". Las fotos de los arriendos hay que borrarlas aparte.
// Las fotos de la verificación de identidad las borra Didit según el plazo configurado allá (un mes).
// Se despliega con "Verify JWT with legacy secret" apagado: la sesión la revisa withSupabase.
import { withSupabase } from 'npm:@supabase/server@1';

export default {
  fetch: withSupabase({ auth: 'user' }, async (req, ctx) => {
    const userId = ctx.userClaims?.id;
    if (!userId) return Response.json({ error: 'sin-sesion' }, { status: 401 });
    if (req.method !== 'POST') return Response.json({ error: 'metodo' }, { status: 405 });

    const db = ctx.supabaseAdmin;
    const fotos = db.storage.from('fotos');

    // Las fotos están todas en la carpeta de la persona. Se listan de a 100 hasta que no quede ninguna.
    for (let vuelta = 0; vuelta < 50; vuelta++) {
      const { data: archivos, error } = await fotos.list(userId, { limit: 100 });
      if (error) {
        console.error('No se listaron las fotos', error.message);
        return Response.json({ error: 'fotos' }, { status: 500 });
      }
      if (!archivos || archivos.length === 0) break;
      const { error: borrado } = await fotos.remove(archivos.map((archivo) => `${userId}/${archivo.name}`));
      if (borrado) {
        console.error('No se borraron las fotos', borrado.message);
        return Response.json({ error: 'fotos' }, { status: 500 });
      }
    }

    const { error } = await db.auth.admin.deleteUser(userId);
    if (error) {
      console.error('No se borró la cuenta', error.message);
      return Response.json({ error: 'cuenta' }, { status: 500 });
    }
    return Response.json({ borrada: true });
  }),
};
