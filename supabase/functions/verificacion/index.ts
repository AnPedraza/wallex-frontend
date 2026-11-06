// Verificación de identidad con Didit para quien tiene sesión en Wallex.
//   { accion: 'iniciar', volver }  crea la sesión en Didit y devuelve el enlace a su página.
//   { accion: 'consultar' }        le pregunta a Didit cómo va la última verificación y lo guarda.
// La llave de Didit vive solo en los secretos de Supabase: el navegador nunca la ve.
// Secretos: DIDIT_API_KEY, DIDIT_WORKFLOW_ID y, solo para probar en sandbox, DIDIT_SANDBOX_SCENARIO.
import { withSupabase } from 'npm:@supabase/server@1';

const DIDIT = 'https://verification.didit.me/v3';

// A dónde puede volver la persona después de verificarse: Wallex en Vercel (también las vistas previas) y en local
const VUELTAS = /^(https:\/\/wallex-frontend(-[a-z0-9-]+-wallex2)?\.vercel\.app|http:\/\/localhost:\d{2,5})$/;

// Estados de Didit que ya no cambian sin que alguien intervenga
const FINALES = ['Approved', 'Declined', 'Kyc Expired'];

export default {
  fetch: withSupabase({ auth: 'user' }, async (req, ctx) => {
    const userId = ctx.userClaims?.id;
    const apiKey = Deno.env.get('DIDIT_API_KEY');
    const workflowId = Deno.env.get('DIDIT_WORKFLOW_ID');
    if (!userId) return Response.json({ error: 'sin-sesion' }, { status: 401 });
    if (!apiKey || !workflowId) return Response.json({ error: 'sin-configurar' }, { status: 503 });

    // La llave secreta salta los permisos por fila: todo se filtra por el id de quien llama
    const db = ctx.supabaseAdmin;
    const body: { accion?: unknown; volver?: unknown } = await req.json().catch(() => ({}));

    if (body.accion === 'iniciar') {
      let callback = '';
      try {
        const vuelta = new URL(String(body.volver));
        if (VUELTAS.test(vuelta.origin)) callback = vuelta.toString();
      } catch {
        // Dirección inválida: se responde abajo
      }
      if (!callback) return Response.json({ error: 'vuelta' }, { status: 400 });

      const scenario = Deno.env.get('DIDIT_SANDBOX_SCENARIO');
      const res = await fetch(`${DIDIT}/session/`, {
        method: 'POST',
        headers: { 'x-api-key': apiKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workflow_id: workflowId,
          vendor_data: userId,
          callback,
          language: 'es',
          ...(scenario ? { sandbox_scenario: scenario } : {}),
        }),
      });
      if (!res.ok) {
        console.error('Didit no creó la sesión', res.status, await res.text());
        return Response.json({ error: 'didit' }, { status: 502 });
      }
      const sesion: { session_id: string; url: string; status?: string } = await res.json();
      const { error } = await db
        .from('verificaciones')
        .insert({ session_id: sesion.session_id, user_id: userId, estado: sesion.status ?? 'Not Started' });
      // Si la persona ya tenía una sesión abierta, Didit devuelve esa misma (para seguir donde iba):
      // ya está guardada, y basta con comprobar que sea de quien llama
      if (error?.code === '23505') {
        const { data: guardada } = await db.from('verificaciones').select('user_id').eq('session_id', sesion.session_id).maybeSingle();
        if (guardada?.user_id === userId) return Response.json({ url: sesion.url });
      }
      if (error) {
        console.error('No se guardó la sesión', error.message);
        return Response.json({ error: 'base-de-datos' }, { status: 500 });
      }
      return Response.json({ url: sesion.url });
    }

    if (body.accion === 'consultar') {
      const { data: ultima } = await db
        .from('verificaciones')
        .select('session_id, estado')
        .eq('user_id', userId)
        .order('creado', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!ultima) return Response.json({ estado: null });

      let estado: string = ultima.estado;
      if (!FINALES.includes(estado)) {
        const res = await fetch(`${DIDIT}/session/${ultima.session_id}/decision/`, { headers: { 'x-api-key': apiKey } });
        if (res.ok) {
          const decision: { status?: unknown } = await res.json();
          if (typeof decision.status === 'string' && decision.status !== estado) {
            estado = decision.status;
            await db
              .from('verificaciones')
              .update({ estado, actualizado: new Date().toISOString() })
              .eq('session_id', ultima.session_id)
              .eq('user_id', userId);
            if (estado === 'Approved') await db.from('identidades').upsert({ user_id: userId });
            if (estado === 'Kyc Expired') await db.from('identidades').delete().eq('user_id', userId);
          }
        }
      }
      return Response.json({ estado });
    }

    return Response.json({ error: 'accion' }, { status: 400 });
  }),
};
