# Wallex

Plataforma web para buscar, comparar y contactar vivienda en Bogotá, con la identidad de quien publica verificada. Es el proyecto del curso *Proyecto de Innovación y Emprendimiento en TI* (Pontificia Universidad Javeriana).

- **App desplegada:** https://wallex-frontend.vercel.app
- **Landing:** https://wallex-frontend.vercel.app/inicio/
- **Versión:** `v0.3` (Release 3)
- **Estado:** prototipo. Las cuentas son reales y se guardan en Supabase; los inmuebles son de ejemplo y lo simulado está listado más abajo.

## Qué se puede hacer en esta versión

1. Crear una cuenta, que sirve desde cualquier dispositivo, diciendo si buscas arriendo o quieres publicar. Se piden el nombre, el correo y la contraseña; a quien publica, también si es propietario, inmobiliaria o arrendatario que cede el contrato, y su celular. La verificación de identidad no se pide al registrarse.
2. Ver la sesión en la barra de navegación (nombre y botón «Salir») y moverse con la barra y el pie de página, también en celular.
3. Filtrar los inmuebles por zona, por total del mes máximo (canon + administración + transporte), por verificación de quien publica y por requisitos, y elegir cómo te mueves para calcular el transporte.
4. Abrir la ficha estandarizada de un inmueble: canon, administración, total mensual, depósito y requisitos del arrendador.
5. Ver en la ficha el sello del certificado de tradición y libertad, que indica si está verificado o pendiente de cotejo.
6. Comparar hasta 3 inmuebles lado a lado con el costo total del mes, incluido el transporte.
7. Guardar los arriendos que te interesan, desde la tarjeta o desde la ficha, y verlos en «Guardados» con su total del mes. Pide cuenta: si no la tienes, la creas y el arriendo queda guardado.
8. Contactar a quien publica, lo que abre la verificación de identidad (KYC) antes de compartir el contacto. Con Didit encendido (ver más abajo) la verificación es de verdad: foto de la cédula por ambos lados y una selfie, una sola vez. En los arriendos publicados por personas reales, al final se ven su nombre y su celular, con botón de WhatsApp.
9. Publicar un arriendo con la ficha estándar (lo que se paga, lo que pides, cómo se llega y hasta 8 fotos) y verlo en el catálogo.
10. En «Mis publicaciones», pausar, volver a publicar o borrar tus arriendos, y verificar tu identidad para que salgan con el sello de identidad verificada.

## Qué está simulado

- **Cuentas sin Supabase:** si el proyecto no tiene las variables de Supabase (por ejemplo, en local sin `.env.local`), las cuentas se guardan solo en el `localStorage` del navegador, con el correo y un hash SHA-256 con sal, nunca la contraseña. Lo guardado también queda en ese navegador.
- **Verificación KYC:** es de verdad, con Didit, cuando el proyecto tiene `VITE_VERIFICACION=didit` y las funciones de Supabase desplegadas. Sin eso es una simulación en dos pasos (lo que se pediría y la autorización de datos, y luego la confirmación): no se toma ninguna foto y la pantalla lo dice. En el *sandbox* de Didit el resultado también es simulado, aunque se tomen las fotos.
- **Datos de contacto:** en los inmuebles de ejemplo, al terminar la verificación la pantalla explica que en la versión real ahí se vería el contacto. No se envía ningún correo.
- **Lo publicado por personas reales** sale «Sin verificar» hasta que quien publica se verifica con Didit. El certificado de tradición y libertad no se coteja: queda «pendiente de cotejo».
- **Números de folio:** los folios de matrícula que aparecen en las tarjetas son de ejemplo y van marcados como tales.
- **Inmuebles:** son datos de ejemplo y todos salen de `src/data/mockProperties.ts`. `src/data/properties.ts` solo define el formato que usa la ficha.
- **Alertas por correo:** el formulario existe (`AlertsSubscription.tsx`), pero todavía no se muestra en ninguna pantalla.

## Correrlo en local (menos de 15 minutos)

Necesitas [Git](https://git-scm.com/) y [Node.js](https://nodejs.org/) 22.12 o superior (también sirve la serie 20 desde 20.19). Puedes comprobar la versión con `node -v`.

```bash
git clone https://github.com/AnPedraza/wallex-frontend.git
cd wallex-frontend
npm install
npm run dev
```

Abre http://localhost:5173 en el navegador.

**Cuentas reales (opcional).** Para crear cuentas en Supabase desde tu computador, crea un archivo `.env.local` al lado de `package.json` con estas dos líneas (los valores te los pasa el equipo, o salen del botón «Connect» del proyecto en Supabase):

```
VITE_SUPABASE_URL=https://<proyecto>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

Sin ese archivo todo funciona igual, pero las cuentas quedan simuladas en tu navegador y no aparece «Publicar». Git ignora `.env.local`. En Vercel las mismas dos variables van en Settings → Environment Variables.

Las tablas y los permisos de la base de datos están en `supabase/esquema.sql`. En un proyecto nuevo de Supabase se corre una vez en SQL Editor; se puede volver a correr sin perder datos.

**Verificación de identidad con Didit (opcional).** Sin estos pasos la verificación se simula.

1. En [business.didit.me](https://business.didit.me) crea la cuenta. Para probar usa una aplicación de *sandbox*, que no gasta crédito; para personas reales, la de producción.
2. Crea un flujo (workflow) con documento, prueba de vida pasiva y comparación de rostro, y pon la retención de las fotos en un mes, que es lo que dice la política de datos.
3. Agrega un webhook con la dirección `https://<proyecto>.supabase.co/functions/v1/didit-webhook` y el evento `status.updated`.
   En «Redirect URLs» registra la raíz de cada dirección donde corre la app, con `/` al final (por ejemplo, `http://localhost:5173/`): Didit solo devuelve a la persona a direcciones registradas tal cual.
4. En Supabase, en Edge Functions, crea las funciones `verificacion` y `didit-webhook` con el código de `supabase/functions/`. A `didit-webhook` apágale la verificación de JWT, porque Didit no manda sesión: la función comprueba la firma del aviso.
5. En los secretos de las Edge Functions guarda `DIDIT_API_KEY`, `DIDIT_WORKFLOW_ID` y `DIDIT_WEBHOOK_SECRET`. Para probar en *sandbox* un resultado fijo, también `DIDIT_SANDBOX_SCENARIO` (por ejemplo, `approve`).
6. Vuelve a correr `supabase/esquema.sql` y agrega `VITE_VERIFICACION=didit` al `.env.local` (y en Vercel). Desde ahí el celular de quien publica solo lo ve quien verificó su identidad, así que la variable tiene que estar en todos los lugares donde corra la app.

Las llaves de Didit van solo en los secretos de Supabase: nunca en el código, en `.env.local` ni en Vercel.

Para probarlo desde un celular conectado a la misma red Wi-Fi, arráncalo con `npm run dev -- --host` y abre la dirección «Network» que imprime Vite. Con las variables de Supabase el registro funciona por esa dirección; sin ellas no, porque la cuenta simulada necesita https para calcular el hash de la contraseña.

Otros comandos:

| Comando | Qué hace |
|---|---|
| `npm run build` | Revisa los tipos con TypeScript y genera la versión de producción en `dist/` |
| `npm run preview` | Sirve esa versión de producción en http://localhost:4173 |
| `npm run lint` | Revisa el código con ESLint |

## Recorrido sugerido

1. Abre «Ingresar / Crear cuenta» y regístrate con un correo y una contraseña de al menos 8 caracteres.
2. En «Buscar vivienda», filtra por zona y mueve el control del total del mes.
3. Entra a «Ver ficha» de un inmueble y revisa lo que pagas cada mes y los requisitos.
4. Marca «Comparar» en dos o tres tarjetas y abre el «Comparador lado a lado». Empieza vacío: solo muestra lo que eliges.
5. Toca el marcador que está al lado de «Comparar» (o «Guardar» en la ficha) y abre «Guardados» en la barra.
6. Pulsa «Contactar» en la tarjeta (o «Contactar a quien publica» en la ficha o el comparador), marca la autorización y completa la verificación.

## Estructura

```
src/
  App.tsx                    navegación por hash (#buscar, #comparar, #guardados, #publicar, #mis-publicaciones, #privacidad), sesión y modales
  lib/                       Supabase: accounts.ts (si hay variables), supabase.ts (el cliente), listings.ts (publicaciones), photos.ts (fotos), favorites.ts (guardados) y verification.ts (Didit)
  landing/                   página de inicio en /inicio
  components/
    AuthForm.tsx             registro e inicio de sesión (con AuthScreen, su pantalla)
    PublishForm.tsx          publicar un arriendo con fotos
    MyListings.tsx           mis publicaciones
    PrivacyPolicy.tsx        política de tratamiento de datos (Ley 1581)
    Navbar.tsx, Footer.tsx   barra de navegación y pie de página
    PropertyPortal.tsx       catálogo con filtros
    PropertyCard.tsx         tarjeta de un inmueble (catálogo y Guardados)
    SavedProperties.tsx      guardados
    PropertyDetail.tsx       ficha estandarizada
    PropertyBadge.tsx        estado del certificado de tradición y libertad
    FolioSeal.tsx            roseta de verificación de cada inmueble
    ContactVerification.tsx  verificación de identidad al contactar (con Didit o simulada)
    IdentityConsent.tsx      lo que se pide y la autorización de datos sensibles
    PropertyComparer.tsx     comparador de costo total
    AlertsSubscription.tsx   formulario de alertas por correo (aún no se muestra)
  assets/                    logo de Wallex
  data/                      inmuebles de ejemplo y cálculo del costo total
  types/                     tipos de TypeScript
supabase/
  esquema.sql                tablas y permisos de la base de datos
  functions/                 verificacion (crea y consulta la sesión en Didit) y didit-webhook (recibe el resultado)
```

## Tecnologías

React 19, TypeScript, Vite y Tailwind CSS 4, con la tipografía Schibsted Grotesk servida desde el proyecto (licencia OFL en `src/assets/fonts/`). El sistema visual está documentado en `DESIGN.md` y el producto en `PRODUCT.md`. Cada push a `main` se despliega solo en Vercel. Las cuentas, las publicaciones, sus fotos y los guardados usan Supabase (PostgreSQL con permisos por fila). La verificación de identidad la hace Didit, con dos Edge Functions de Supabase; su plan gratis trae 10 USD de crédito al mes, unas 30 verificaciones.

## Equipo

| Integrante | Parte del Release 1 |
|---|---|
| David Pedraza | Búsqueda con filtros y modal KYC al contactar |
| Andrés Ospina | Ficha estandarizada del inmueble |
| Santiago Martínez | Sello de certificado de tradición y alertas por correo |
| Federico Mejía | Comparador lado a lado de costo total |
| Juan Diego Ariza | Registro e inicio de sesión, barra de navegación y pie de página |

Los datos personales se tratan conforme a la Ley 1581 de 2012. El correo de la cuenta se guarda en Supabase y la política de datos está en https://wallex-frontend.vercel.app/#privacidad.
