# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Estudiantes y jóvenes profesionales de 20 a 32 años en Bogotá que buscan **arriendo**: se independizan, cambian de vivienda o arriendan por primera vez. Nativos digitales, con poco tiempo, y sensibles al costo total del mes (canon + administración + transporte), no solo al canon.

Su job: encontrar un arriendo confiable, comparar opciones por lo que de verdad van a pagar cada mes y escribirle a quien publica sin caer en estafas.

Fuera de alcance por ahora (sin decidir): la compra de vivienda y quien publica (propietarios, inmobiliarias, arrendatarios que ceden contrato) como usuarios con vistas propias. El equipo de moderación es una interfaz aparte y no está construida.

## Product Purpose

Wallex junta en un solo lugar inmuebles en arriendo en Bogotá, con la información de cada uno en un formato estandarizado y comparable, y con la identidad de quien publica verificada.

Éxito: un usuario nuevo se registra, busca por zona y presupuesto, abre la ficha de un inmueble, entiende el costo del mes completo y los requisitos, compara dos o tres opciones y llega al contacto con el propietario, todo sin ayuda.

## Positioning

Fincaraíz, Metrocuadrado, Facebook Marketplace y los grupos de WhatsApp listan inmuebles sin estandarizar los datos ni garantizar quién publica. Wallex hace dos cosas que esos canales no hacen:

1. Una ficha igual para todos los inmuebles, con canon, administración, total mensual, depósito y requisitos del arrendador (codeudor, ingresos).
2. Costo total del mes que incluye el transporte estimado, para comparar lado a lado.

La verificación de identidad de quien publica y el certificado de tradición y libertad del inmueble son la base de la confianza.

## Operating Context

- Hoy la búsqueda está dispersa entre portales, Marketplace y WhatsApp. La información llega incompleta y los requisitos se conocen tarde.
- La estafa típica es "consigne para separar" antes de ver el inmueble.
- Documentos propios del dominio: el certificado de tradición y libertad, la cédula de quien publica, el contrato de arriendo, el codeudor.
- El transporte en Bogotá (TransMilenio y SITP, con tarifa de $3.550) es parte del costo real.
- Se usa mucho desde el celular. La demo y la validación se hacen sobre la URL pública desde dispositivos que no son del equipo.

## Capabilities and Constraints

Lo que existe en la versión `v0.1`:
- Registro e inicio de sesión con solo correo y contraseña.
- Búsqueda por zona y presupuesto máximo.
- Ficha estandarizada del inmueble.
- Sello del certificado de tradición y libertad (verificado o pendiente de cotejo).
- Comparador de hasta 3 inmuebles con costo total del mes, incluido el transporte.
- Contacto con el propietario, que pide verificación de identidad (KYC).
- Formulario de alertas por correo, construido pero no visible en ninguna pantalla.

Restricciones:
- **La verificación de identidad no va en el registro.** Se pide cuando el usuario quiere escribirle a un propietario. Pedirla desde la entrada generaba rechazo (hallazgo H3). Esta decisión está cerrada.
- Prototipo solo de frontend. No hay backend, base de datos ni correo real.
  - Las cuentas se guardan en el `localStorage` del navegador: correo y hash SHA-256 con sal, nunca la contraseña.
  - El KYC es una pantalla de confirmación simulada.
  - Los inmuebles son datos de ejemplo (`src/data/`).
  - Todo lo simulado se declara en los reportes.
- Stack: React 19, TypeScript, Vite 8 y Tailwind CSS 4. Navegación por hash (`#buscar`, `#comparar`), sin router. Se despliega en Vercel desde `main`; cada rama tiene su vista previa.
- Equipo de cinco personas y cada una es dueña de sus componentes. No se agregan dependencias sin avisar al equipo.
- Idioma: español de Colombia, con tuteo y trato cercano.
- Datos personales: el diseño contempla la Ley 1581 de 2012.

## Brand Commitments

- Nombre: **Wallex**.
- Logo: una casa sobre raíces dentro de un círculo (`src/assets/wallex-logo.png`, PNG transparente de 512 px). Es fijo y se muestra con "Wallex" al lado como texto real.
- Colores, tipografía y estilo **no** son fijos y pueden cambiar en el rediseño.
- Contexto: proyecto académico del curso *Proyecto de Innovación y Emprendimiento en TI*, Pontificia Universidad Javeriana. La página lo aclara en el pie: "Prototipo académico, Pontificia Universidad Javeriana".

## Evidence on Hand

- Tres entrevistas cualitativas (Product One-Pager) y el documento de validación de supuestos con las hipótesis H1 a H3. Las cifras de ese documento (página de humo y 12 entrevistas) son **datos simulados** del ejercicio académico.
- Los inmuebles, precios y fotos son de ejemplo. Las fotos son de Unsplash.
- **Todavía no hay resultados de la validación con usuarios reales** (12 al 25 de octubre). No hay testimonios, métricas de uso, clientes ni prensa. No se deben inventar.

## Product Principles

1. **El costo real primero.** Lo que el usuario paga cada mes (con administración y transporte) pesa más que el canon solo.
2. **La confianza se muestra con documentos, no con adjetivos.** Un sello vale si dice qué se verificó y con qué documento.
3. **Pedir lo mínimo y en el momento justo.** Entrar no cuesta nada; la verificación llega cuando el usuario va a contactar.
4. **Comparable por diseño.** Todos los inmuebles muestran los mismos datos en el mismo orden.
5. **Honestidad del prototipo.** Lo simulado se dice; no se aparentan servicios que no existen.

## Accessibility & Inclusion

- Usable en celular a 390 px y en escritorio a 1440 px, con el recorrido completo posible desde un teléfono.
- Se maneja con teclado, con foco visible y labels asociados.
- Los errores de formulario dicen cómo corregir, no solo "campo inválido".
