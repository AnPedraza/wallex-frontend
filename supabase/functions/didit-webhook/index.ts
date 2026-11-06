// Didit avisa aquí cada vez que cambia el estado de una verificación. El aviso no trae sesión de Wallex:
// antes de creerle se comprueba que sea reciente y que esté firmado con el secreto del webhook (HMAC SHA-256).
// Se despliega con la verificación de JWT apagada. Secreto: DIDIT_WEBHOOK_SECRET.
import { withSupabase } from 'npm:@supabase/server@1';

const encoder = new TextEncoder();

const firmar = async (secreto: string, texto: string) => {
  const llave = await crypto.subtle.importKey('raw', encoder.encode(secreto), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const firma = new Uint8Array(await crypto.subtle.sign('HMAC', llave, encoder.encode(texto)));
  return Array.from(firma, (b) => b.toString(16).padStart(2, '0')).join('');
};

// Compara sin cortar en la primera diferencia, para no dar pistas por el tiempo de respuesta
const iguales = (a: string, b: string) => {
  if (a.length !== b.length) return false;
  let diferencia = 0;
  for (let i = 0; i < a.length; i++) diferencia |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diferencia === 0;
};

// El JSON canónico de Didit para X-Signature-V2: llaves ordenadas en todos los niveles y sin espacios
const ordenar = (valor: unknown): unknown => {
  if (Array.isArray(valor)) return valor.map(ordenar);
  if (valor && typeof valor === 'object') {
    const objeto = valor as Record<string, unknown>;
    return Object.fromEntries(Object.keys(objeto).sort().map((llave) => [llave, ordenar(objeto[llave])]));
  }
  return valor;
};

export default {
  fetch: withSupabase({ auth: 'none', cors: 'disabled' }, async (req, ctx) => {
    if (req.method !== 'POST') return new Response('Solo POST', { status: 405 });
    const secreto = Deno.env.get('DIDIT_WEBHOOK_SECRET');
    if (!secreto) return new Response('Falta DIDIT_WEBHOOK_SECRET', { status: 503 });

    const crudo = await req.text();
    const marca = Number(req.headers.get('X-Timestamp'));
    if (!marca || Math.abs(Date.now() / 1000 - marca) > 300) return new Response('Aviso vencido', { status: 401 });

    let aviso: Record<string, unknown>;
    try {
      aviso = JSON.parse(crudo);
    } catch {
      return new Response('JSON inválido', { status: 400 });
    }

    // Vale la firma sobre los bytes tal como llegaron (X-Signature) o sobre el JSON canónico (X-Signature-V2).
    // Las "-Previous" llegan solo las 24 horas después de cambiar el secreto en la consola de Didit.
    const [sobreCrudo, sobreCanonico] = await Promise.all([firmar(secreto, crudo), firmar(secreto, JSON.stringify(ordenar(aviso)))]);
    const firmas = (nombre: string) => [req.headers.get(nombre), req.headers.get(`${nombre}-Previous`)].filter((f): f is string => Boolean(f));
    const valida =
      firmas('X-Signature').some((f) => iguales(f, sobreCrudo)) || firmas('X-Signature-V2').some((f) => iguales(f, sobreCanonico));
    if (!valida) return new Response('Firma inválida', { status: 401 });

    const { webhook_type: tipo, session_id: sessionId, status: estado, vendor_data: userId, created_at: creado } = aviso;
    if (tipo !== 'status.updated' || typeof sessionId !== 'string' || typeof estado !== 'string' || typeof userId !== 'string') {
      return Response.json({ recibido: true });
    }

    // Didit puede repetir avisos o mandarlos en desorden: solo cuenta si es más nuevo que lo guardado.
    // Y solo cambia la sesión si es de esa persona (vendor_data es el id de quien la inició en Wallex).
    const cuando = typeof creado === 'number' ? new Date(creado * 1000).toISOString() : new Date().toISOString();
    const db = ctx.supabaseAdmin;
    const { data } = await db
      .from('verificaciones')
      .update({ estado, actualizado: cuando })
      .eq('session_id', sessionId)
      .eq('user_id', userId)
      .lt('actualizado', cuando)
      .select('session_id');
    if (data?.length) {
      if (estado === 'Approved') await db.from('identidades').upsert({ user_id: userId });
      if (estado === 'Kyc Expired') await db.from('identidades').delete().eq('user_id', userId);
    }
    return Response.json({ recibido: true });
  }),
};
