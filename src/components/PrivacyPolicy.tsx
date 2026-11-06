import React from 'react';
import { realVerification } from '../lib/accounts';
import { analyticsEnabled } from '../lib/analytics';

// Política de tratamiento de datos (Ley 1581 de 2012) en palabras simples. Se abre en #privacidad,
// desde la casilla de autorización del registro y desde el pie de página.
const CONTACT_EMAIL = 'ariza.juand@javeriana.edu.co';

const sections: { title: string; body: React.ReactNode }[] = [
  {
    title: 'Quién responde por tus datos',
    body: (
      <>
        El equipo de Wallex. Para cualquier pregunta sobre tus datos escríbenos a{' '}
        {CONTACT_EMAIL ? (
          <a href={`mailto:${CONTACT_EMAIL}`} className="font-semibold text-ink underline underline-offset-2">
            {CONTACT_EMAIL}
          </a>
        ) : (
          'el correo del equipo (pendiente)'
        )}
        .
      </>
    ),
  },
  {
    title: 'Qué guardamos',
    body: 'Tu nombre, tu correo, tu contraseña y si buscas arriendo o publicas. Si publicas, también cómo publicas (propietario, inmobiliaria o arrendatario que cede el contrato), tu celular, los datos de tus arriendos y sus fotos. Además, los arriendos que guardes para ver después. La contraseña se guarda protegida: nadie del equipo la puede ver. No pedimos datos de pago. ' +
      (realVerification
        ? 'De la verificación de identidad guardamos solo el resultado (aprobada, en revisión o rechazada) y la fecha.'
        : 'La verificación de identidad que ves al contactar es simulada: no pedimos cédula ni selfie y no guarda nada.'),
  },
  {
    title: 'Quién ve qué',
    body:
      'Tus arriendos publicados y sus fotos los puede ver cualquiera. Tu nombre y tu celular de contacto solo los ven las personas ' +
      (realVerification ? 'con cuenta que ya verificaron su identidad' : 'con cuenta en Wallex') +
      ', para escribirte por uno de tus arriendos. Tus guardados y los demás datos de tu cuenta solo los ves tú.' +
      (realVerification ? ' Si publicas, cualquiera ve en el sello de tus arriendos si verificaste tu identidad.' : ''),
  },
  {
    title: 'Para qué los usamos',
    body:
      'Para manejar tu cuenta, mostrar tus arriendos y que te puedan contactar por ellos' +
      (realVerification ? ', y para verificar tu identidad cuando quieres ver un contacto o publicar' : '') +
      '. No vendemos tus datos ni los compartimos con nadie más.',
  },
  ...(realVerification
    ? [
        {
          title: 'Verificación de identidad',
          body: 'Te la pedimos para ver el contacto de quien publica y para que tus arriendos salgan con identidad verificada. La hace Didit Identity Spain, S.L. (Barcelona, España), como encargado de Wallex: en su página toma una foto de tu cédula por ambos lados y una selfie, y revisa que la cédula sea auténtica y que la selfie sea de la misma persona. Tu rostro es un dato sensible: no estás obligado a autorizar su tratamiento y, si no lo haces, puedes seguir usando Wallex, salvo ver el contacto de quien publica. A Wallex solo le llega el resultado. Didit guarda las fotos durante un mes y después las borra.',
        },
      ]
    : []),
  ...(analyticsEnabled
    ? [
        {
          title: 'Medición de uso',
          body: 'Medimos cómo se usa Wallex con PostHog: qué páginas se abren y acciones como abrir una ficha, guardar, comparar, contactar o publicar, con un identificador al azar que queda en tu navegador. Si tienes cuenta, lo unimos a ella con un número interno, nunca con tu nombre, tu correo ni tu celular. No grabamos tu pantalla ni lo que escribes. Lo usamos para saber qué funciona y qué mejorar.',
        },
      ]
    : []),
  {
    title: 'Dónde se guardan',
    body:
      'En Supabase, el servicio que usamos para las cuentas, los arriendos publicados y sus fotos, con servidores en Estados Unidos.' +
      (realVerification ? ' Las fotos de la verificación de identidad las guarda Didit, una empresa de España.' : '') +
      (analyticsEnabled ? ' Los datos de uso, en PostHog, también en Estados Unidos.' : ''),
  },
  {
    title: 'Tus derechos',
    body: 'Puedes conocer, actualizar y corregir tus datos, pedir que los borremos y retirar esta autorización cuando quieras. En «Mi cuenta» (tocando tu nombre arriba) corriges tus datos, los descargas o borras tu cuenta con todo lo que tiene. Para lo demás, escríbenos desde el correo de tu cuenta: respondemos las consultas en máximo 10 días hábiles y los reclamos en máximo 15, como dice la ley.',
  },
  {
    title: 'Vigencia',
    body: 'Esta política rige desde el 5 de noviembre de 2026. Si cambia, lo publicamos aquí.',
  },
];

export const PrivacyPolicy: React.FC = () => (
  <article className="max-w-[720px] mx-auto px-4 sm:px-6 lg:px-10 py-12 lg:py-16">
    <a
      href="#buscar"
      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-control text-sm font-semibold hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
    >
      <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M15 5l-7 7 7 7" />
      </svg>
      Volver al catálogo
    </a>
    <h1 className="mt-6 text-[2rem] lg:text-[2.75rem] leading-[1.08] font-extrabold tracking-[-0.03em]">Política de tratamiento de datos</h1>
    <p className="mt-4 text-[15px] text-ink-soft leading-relaxed">
      Aquí te contamos qué datos guardamos, para qué y cómo puedes pedir que los cambiemos o los borremos, según la Ley 1581 de 2012.
    </p>
    <div className="mt-8 divide-y divide-rule border-y border-rule">
      {sections.map((s) => (
        <section key={s.title} className="py-5">
          <h2 className="text-base font-bold">{s.title}</h2>
          <p className="mt-1.5 text-[15px] text-ink-soft leading-relaxed">{s.body}</p>
        </section>
      ))}
    </div>
  </article>
);
