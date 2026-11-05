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
7. Contactar a quien publica, lo que abre la verificación de identidad (KYC) antes de compartir el contacto. En los arriendos publicados por personas reales, al final se ven su nombre y su celular, con botón de WhatsApp, solo si tienes cuenta.
8. Publicar un arriendo con la ficha estándar (lo que se paga, lo que pides, cómo se llega y hasta 8 fotos) y verlo en el catálogo.
9. En «Mis publicaciones», pausar, volver a publicar o borrar tus arriendos.

## Qué está simulado

- **Cuentas sin Supabase:** si el proyecto no tiene las variables de Supabase (por ejemplo, en local sin `.env.local`), las cuentas se guardan solo en el `localStorage` del navegador, con el correo y un hash SHA-256 con sal, nunca la contraseña.
- **Verificación KYC:** es una simulación en dos pasos (lo que se pediría y la autorización de datos, y luego la confirmación). No se toma ninguna foto ni hay un proveedor de identidad detrás. La pantalla lo dice.
- **Datos de contacto:** en los inmuebles de ejemplo, al terminar la verificación la pantalla explica que en la versión real ahí se vería el contacto. No se envía ningún correo.
- **Lo publicado por personas reales** sale como «Sin verificar» mientras la verificación de identidad sea simulada.
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

Las tablas y los permisos de la base de datos están en `supabase/esquema.sql`. En un proyecto nuevo de Supabase se corre una vez en SQL Editor.

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
5. Pulsa «Contactar» en la tarjeta (o «Contactar a quien publica» en la ficha o el comparador), marca la autorización y completa la verificación.

## Estructura

```
src/
  App.tsx                    navegación por hash (#buscar, #comparar, #publicar, #mis-publicaciones, #privacidad), sesión y modales
  lib/                       Supabase: accounts.ts (si hay variables), supabase.ts (el cliente), listings.ts (publicaciones) y photos.ts (fotos)
  landing/                   página de inicio en /inicio
  components/
    AuthForm.tsx             registro e inicio de sesión (con AuthScreen, su pantalla)
    PublishForm.tsx          publicar un arriendo con fotos
    MyListings.tsx           mis publicaciones
    PrivacyPolicy.tsx        política de tratamiento de datos (Ley 1581)
    Navbar.tsx, Footer.tsx   barra de navegación y pie de página
    PropertyPortal.tsx       catálogo con filtros
    PropertyDetail.tsx       ficha estandarizada
    PropertyBadge.tsx        estado del certificado de tradición y libertad
    FolioSeal.tsx            roseta de verificación de cada inmueble
    ContactVerification.tsx  verificación de identidad al contactar (simulada)
    PropertyComparer.tsx     comparador de costo total
    AlertsSubscription.tsx   formulario de alertas por correo (aún no se muestra)
  assets/                    logo de Wallex
  data/                      inmuebles de ejemplo y cálculo del costo total
  types/                     tipos de TypeScript
```

## Tecnologías

React 19, TypeScript, Vite y Tailwind CSS 4, con la tipografía Schibsted Grotesk servida desde el proyecto (licencia OFL en `src/assets/fonts/`). El sistema visual está documentado en `DESIGN.md` y el producto en `PRODUCT.md`. Cada push a `main` se despliega solo en Vercel. Las cuentas, las publicaciones y sus fotos usan Supabase (PostgreSQL con permisos por fila). La verificación de identidad con un proveedor externo queda para después.

## Equipo

| Integrante | Parte del Release 1 |
|---|---|
| David Pedraza | Búsqueda con filtros y modal KYC al contactar |
| Andrés Ospina | Ficha estandarizada del inmueble |
| Santiago Martínez | Sello de certificado de tradición y alertas por correo |
| Federico Mejía | Comparador lado a lado de costo total |
| Juan Diego Ariza | Registro e inicio de sesión, barra de navegación y pie de página |

Los datos personales se tratan conforme a la Ley 1581 de 2012. El correo de la cuenta se guarda en Supabase y la política de datos está en https://wallex-frontend.vercel.app/#privacidad.
