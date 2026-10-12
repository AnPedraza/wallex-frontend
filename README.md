# Wallex

Plataforma web para buscar, comparar y contactar vivienda en Bogotá, con la identidad de quien publica verificada. Es el proyecto del curso *Proyecto de Innovación y Emprendimiento en TI* (Pontificia Universidad Javeriana).

- **App desplegada:** https://wallex-frontend.vercel.app
- **Versión:** `v0.1` (Release 1)
- **Estado:** prototipo de frontend. No hay backend, base de datos ni correo real; lo simulado está listado más abajo.

## Qué se puede hacer en esta versión

1. Crear una cuenta con correo y contraseña. La verificación de identidad no se pide al registrarse, sino más adelante, cuando el usuario quiere escribirle a un propietario.
2. Ver la sesión en la barra de navegación (correo y botón «Salir») y moverse con la barra y el pie de página, también en celular.
3. Filtrar los inmuebles por zona y por presupuesto máximo.
4. Abrir la ficha estandarizada de un inmueble: canon, administración, total mensual, depósito y requisitos del arrendador.
5. Ver en la ficha el sello del certificado de tradición y libertad, que indica si está verificado o pendiente de cotejo.
6. Comparar hasta 3 inmuebles lado a lado con el costo total del mes, incluido el transporte.
7. Contactar al propietario, lo que abre la verificación KYC antes de compartir sus datos.

## Qué está simulado

- **Cuentas:** se guardan solo en el `localStorage` del navegador (correo y un hash SHA-256 con sal, nunca la contraseña). No hay servidor.
- **Verificación KYC:** es una pantalla de confirmación; todavía no hay proveedor de identidad detrás.
- **Datos de contacto:** al completar el KYC aparece un aviso que dice que los datos del propietario se enviaron a tu correo, pero no se envía ninguno.
- **Inmuebles:** son datos de ejemplo. El catálogo y el comparador usan `src/data/mockProperties.ts`, y la ficha usa `src/data/properties.ts`.
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
2. En «Buscar vivienda», filtra por zona y presupuesto.
3. Entra a «Ver Ficha Estandarizada» de un inmueble y revisa el costo del mes y los requisitos.
4. Abre el «Comparador Lado a Lado». Arranca con dos inmuebles ya elegidos (Chapinero Alto y Cedritos), que en el catálogo aparecen como «En Comparador»; con «Comparar» en otra tarjeta sumas un tercero.
5. Pulsa «Contactar Propietario» (o «Contactar al propietario» en la ficha) y completa la verificación KYC.

## Estructura

```
src/
  App.tsx                    navegación por hash (#buscar, #comparar), sesión y modales
  components/
    AuthForm.tsx             registro e inicio de sesión
    Navbar.tsx, Footer.tsx   barra de navegación y pie de página
    PropertyPortal.tsx       catálogo con filtros
    PropertyDetail.tsx       ficha estandarizada
    PropertyBadge.tsx        sello de certificado de tradición y libertad
    PropertyComparer.tsx     comparador de costo total
    AlertsSubscription.tsx   formulario de alertas por correo (aún no se muestra)
  assets/                    logo de Wallex
  data/                      inmuebles de ejemplo y cálculo del costo total
  types/                     tipos de TypeScript
```

## Tecnologías

React 19, TypeScript, Vite y Tailwind CSS 4. Cada push a `main` se despliega solo en Vercel. Los siguientes releases suman un backend con Node.js, Express y PostgreSQL, y un proveedor externo para la verificación de identidad.

## Equipo

| Integrante | Parte del Release 1 |
|---|---|
| David Pedraza | Búsqueda con filtros y modal KYC al contactar |
| Andrés Ospina | Ficha estandarizada del inmueble |
| Santiago Martínez | Sello de certificado de tradición y alertas por correo |
| Federico Mejía | Comparador lado a lado de costo total |
| Juan Diego Ariza | Registro e inicio de sesión, barra de navegación y pie de página |

Los datos personales se diseñan conforme a la Ley 1581 de 2012. En esta versión de prueba no salen del navegador.
