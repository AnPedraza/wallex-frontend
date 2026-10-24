# Wallex

Plataforma web para buscar, comparar y contactar vivienda en Bogotá, con la identidad de quien publica verificada. Es el proyecto del curso *Proyecto de Innovación y Emprendimiento en TI* (Pontificia Universidad Javeriana).

- **App desplegada:** https://wallex-frontend.vercel.app
- **Versión:** `v0.1` (Release 1)
- **Estado:** prototipo de frontend. No hay backend, base de datos ni correo real; lo simulado está listado más abajo.

## Qué se puede hacer en esta versión

1. Crear una cuenta con correo y contraseña. La verificación de identidad no se pide al registrarse, sino más adelante, cuando el usuario quiere escribirle a un propietario.
2. Ver la sesión en la barra de navegación (correo y botón «Salir») y moverse con la barra y el pie de página, también en celular.
3. Filtrar los inmuebles por zona, por total del mes máximo (canon + administración + transporte), por verificación de quien publica y por requisitos, y elegir cómo te mueves para calcular el transporte.
4. Abrir la ficha estandarizada de un inmueble: canon, administración, total mensual, depósito y requisitos del arrendador.
5. Ver en la ficha el sello del certificado de tradición y libertad, que indica si está verificado o pendiente de cotejo.
6. Comparar hasta 3 inmuebles lado a lado con el costo total del mes, incluido el transporte.
7. Contactar a quien publica, lo que abre la verificación de identidad (KYC) antes de compartir el contacto.

## Qué está simulado

- **Cuentas:** se guardan solo en el `localStorage` del navegador (correo y un hash SHA-256 con sal, nunca la contraseña). No hay servidor.
- **Verificación KYC:** es una simulación en dos pasos (lo que se pediría y la autorización de datos, y luego la confirmación). No se toma ninguna foto ni hay un proveedor de identidad detrás. La pantalla lo dice.
- **Datos de contacto:** al terminar la verificación la pantalla explica que en la versión real ahí se vería el contacto. No se envía ningún correo.
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

Para probarlo desde un celular conectado a la misma red Wi-Fi, arráncalo con `npm run dev -- --host` y abre la dirección «Network» que imprime Vite. Por esa dirección se ve todo, pero el registro no funciona: necesita https para calcular el hash de la contraseña. Para probar el registro en el celular, usa la app desplegada.

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
4. Abre el «Comparador lado a lado». Arranca con dos inmuebles ya elegidos (Chapinero Alto y Cedritos), que en el catálogo aparecen como «En comparador»; con «Comparar» en otra tarjeta sumas un tercero.
5. Pulsa «Contactar» en la tarjeta (o «Contactar a quien publica» en la ficha o el comparador), marca la autorización y completa la verificación.

## Estructura

```
src/
  App.tsx                    navegación por hash (#buscar, #comparar), sesión y modales
  components/
    AuthForm.tsx             registro e inicio de sesión
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

React 19, TypeScript, Vite y Tailwind CSS 4, con la tipografía Schibsted Grotesk servida desde el proyecto (licencia OFL en `src/assets/fonts/`). El sistema visual está documentado en `DESIGN.md` y el producto en `PRODUCT.md`. Cada push a `main` se despliega solo en Vercel. Los siguientes releases suman un backend con Node.js, Express y PostgreSQL, y un proveedor externo para la verificación de identidad.

## Equipo

| Integrante | Parte del Release 1 |
|---|---|
| David Pedraza | Búsqueda con filtros y modal KYC al contactar |
| Andrés Ospina | Ficha estandarizada del inmueble |
| Santiago Martínez | Sello de certificado de tradición y alertas por correo |
| Federico Mejía | Comparador lado a lado de costo total |
| Juan Diego Ariza | Registro e inicio de sesión, barra de navegación y pie de página |

Los datos personales se diseñan conforme a la Ley 1581 de 2012. En esta versión de prueba no salen del navegador.
