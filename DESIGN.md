---
name: Wallex
description: Arriendos en Bogotá con ficha estandarizada y quien publica verificado.
colors:
  paper: "#f4f6f3"
  surface: "#ffffff"
  ink: "#12223f"
  ink-hover: "#1e3560"
  ink-soft: "#4a5873"
  ink-faint: "#5e6b82"
  rule: "#dce2dd"
  control: "#7a869b"
  verified: "#087a57"
  pending: "#8f6316"
  unverified: "#b3453a"
  night-text: "#c9d4de"
  night-faint: "#a9b6c6"
  selection: "#cfe7dd"
typography:
  display:
    fontFamily: "Schibsted Grotesk, ui-sans-serif, system-ui, sans-serif"
    fontSize: "2.375rem"
    fontWeight: 800
    lineHeight: 1.08
    letterSpacing: "-0.03em"
  display-phone:
    fontFamily: "Schibsted Grotesk, ui-sans-serif, system-ui, sans-serif"
    fontSize: "2rem"
    fontWeight: 800
    lineHeight: 1.08
    letterSpacing: "-0.03em"
  landing-hero:
    fontFamily: "Schibsted Grotesk, ui-sans-serif, system-ui, sans-serif"
    fontSize: "4.5rem"
    fontWeight: 800
    lineHeight: 1.05
    letterSpacing: "-0.035em"
  landing-hero-phone:
    fontFamily: "Schibsted Grotesk, ui-sans-serif, system-ui, sans-serif"
    fontSize: "2.75rem"
    fontWeight: 800
    lineHeight: 1.08
    letterSpacing: "-0.035em"
  landing-section:
    fontFamily: "Schibsted Grotesk, ui-sans-serif, system-ui, sans-serif"
    fontSize: "3.25rem"
    fontWeight: 800
    lineHeight: 1.08
    letterSpacing: "-0.03em"
  wordmark:
    fontFamily: "Schibsted Grotesk, ui-sans-serif, system-ui, sans-serif"
    fontSize: "21px"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "-0.02em"
  figure:
    fontFamily: "Schibsted Grotesk, ui-sans-serif, system-ui, sans-serif"
    fontSize: "28px"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Schibsted Grotesk, ui-sans-serif, system-ui, sans-serif"
    fontSize: "17px"
    fontWeight: 700
    lineHeight: 1.375
    letterSpacing: "-0.01em"
  body:
    fontFamily: "Schibsted Grotesk, ui-sans-serif, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Schibsted Grotesk, ui-sans-serif, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 600
    lineHeight: 1.4
  fine:
    fontFamily: "Schibsted Grotesk, ui-sans-serif, system-ui, sans-serif"
    fontSize: "12.5px"
    fontWeight: 400
    lineHeight: 1.375
  microprint:
    fontFamily: "Schibsted Grotesk, ui-sans-serif, system-ui, sans-serif"
    fontSize: "7px"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "0.08em"
rounded:
  track: "2px"
  check: "3px"
  control: "8px"
  surface: "10px"
  pill: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "20px"
  xl: "28px"
  gutter-phone: "16px"
  gutter-desktop: "40px"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.surface}"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    padding: "10px 18px"
  button-primary-hover:
    backgroundColor: "{colors.ink-hover}"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    padding: "8px 16px"
  button-secondary-hover:
    backgroundColor: "{colors.paper}"
  input-field:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    padding: "10px 12px"
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.surface}"
  filter-panel:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.surface}"
    padding: "20px"
  compare-toggle:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "6px 10px"
  compare-toggle-active:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.surface}"
  count-badge:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.surface}"
    rounded: "{rounded.pill}"
    height: "20px"
  footer:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.night-text}"
---

# Design System: Wallex

## Overview

**Creative North Star: "Papel de seguridad"**

Wallex se ve como una app actual con el detalle de un documento difícil de falsificar. La claridad la ponen la grilla, las fotos grandes y una sola tinta azul. La confianza la pone el papel de seguridad: cada inmueble lleva un folio y una roseta de guilloche que solo aparece cuando hay algo verificado. El sistema no promete seguridad con palabras ni con chips de colores. La muestra con un sello que dice qué se revisó.

La densidad es de herramienta de trabajo: filtros siempre a la vista en escritorio, tarjetas compactas y el total del mes como cifra principal. La expresión se gasta en un solo lugar, la roseta. Todo lo demás es preciso y sereno: bordes de un píxel, radios pequeños, sin sombras y sin vidrio esmerilado.

El sistema rechaza el "look" crema con terracota, las etiquetas en mayúsculas con espaciado, las tarjetas dentro de tarjetas y los emojis como íconos.

**Key Characteristics:**
- Fondo gris verdoso muy claro y superficies blancas, nunca crema.
- Una sola tinta (azul de seguridad) para texto, botones y todo estado vivo.
- Verde, ámbar y rojo solo para el estado de verificación.
- Schibsted Grotesk en todo, con pesos fuertes en cifras y títulos.
- La roseta de guilloche como único elemento expresivo, distinta para cada inmueble.

## Colors

Neutros fríos tomados del papel de seguridad, una tinta azul y tres colores de estado que solo hablan de verificación.

### Primary
- **Tinta de seguridad** (ink): texto principal, botones primarios, selección en el comparador, contador de la barra de navegación, control deslizante y pie de página. Es el único color de estado vivo.
- **Tinta de seguridad, presionada** (ink-hover): hover de botones primarios.

### Neutral
- **Papel de seguridad** (paper): fondo general de la app.
- **Hoja** (surface): tarjetas, panel de filtros, barra superior, campos.
- **Tinta suave** (ink-soft): texto secundario, metadatos, etiquetas de campo. 7,2:1 sobre blanco.
- **Letra de folio** (ink-faint): letra pequeña: números de folio, rangos del control deslizante, ayudas. 5,4:1 sobre blanco.
- **Filete** (rule): bordes de superficies y divisiones internas.
- **Borde de control** (control): bordes de campos, casillas e interruptor apagado. 3,7:1 sobre blanco, para cumplir el contraste mínimo de controles.
- **Texto nocturno** (night-text) y **texto nocturno tenue** (night-faint): texto sobre el pie de página en tinta.
- **Selección** (selection): fondo del texto seleccionado.

### Tertiary
- **Verde verificado** (verified): sello y texto de "Verificado", enlace "Limpiar", subrayado de la pestaña activa.
- **Ámbar pendiente** (pending): "Tradición pendiente de cotejo".
- **Rojo sello** (unverified): "Sin verificar" y errores de formulario.

### Named Rules
**The One Ink Rule.** Todo estado vivo (activo, seleccionado, en comparador, foco) se marca con la tinta azul y con nada más. Si algo se ilumina en otro color, no es un estado de interfaz.

**The Status-Only Color Rule.** Verde, ámbar y rojo existen solo para hablar de verificación o de errores. Nunca decoran, nunca son acento de marca.

## Typography

**Display Font:** Schibsted Grotesk (con ui-sans-serif, system-ui)
**Body Font:** Schibsted Grotesk (con ui-sans-serif, system-ui)

**Character:** Una grotesca contemporánea de origen editorial, con pesos altos que hacen que las cifras de dinero se lean como el dato principal. Se sirve desde el proyecto (`src/assets/fonts/`, licencia OFL); no se pide a servidores externos.

### Hierarchy
- **Display** (800, 2.375rem en escritorio y 2rem en celular, interlineado 1, -0.03em): el título de cada pantalla.
- **Wordmark** (800, 21px, -0.02em): "Wallex" como texto junto al logo, en la barra y en el pie.
- **Figure** (800, 28px, -0.02em): el total del mes de cada inmueble. Es la cifra que manda en la tarjeta.
- **Title** (700, 17px, -0.01em): nombre del inmueble.
- **Body** (400, 14–15px): resúmenes, requisitos, textos de filtros.
- **Label** (600, 13px): etiquetas de campos, botones.
- **Fine** (400, 12.5px): desglose del total, folios, sello.

### Named Rules
**The Proportional Figures Rule.** Las cifras van proporcionales y de altura uniforme (`lining-nums proportional-nums`): las tabulares de esta fuente separan los puntos de miles. Usa cifras tabulares solo en columnas que tienen que alinear, como en el comparador.

**The Sentence Case Rule.** Títulos, botones y etiquetas van con mayúscula solo al inicio, como se escribe en español ("Comparador lado a lado"). Nada en mayúsculas sostenidas.

## Layout

En escritorio (desde 1024 px) la pantalla de búsqueda es una columna fija de filtros de 288 px, pegada arriba al hacer scroll, y una grilla de tarjetas a su derecha con 28 px de separación. La grilla va a 3 columnas desde 1280 px, 2 desde 768 px y 1 en celular, con 20 px entre tarjetas. El ancho máximo es 1440 px y los márgenes laterales son de 16 px en celular, 24 px en tableta y 40 px en escritorio.

En celular los filtros se pliegan detrás de un botón "Filtros (n)" encima de la lista; no son un modal. La barra superior pasa a menú de hamburguesa por debajo de 1024 px.

Ritmo: múltiplos de 4 px. 16 px de relleno en tarjetas, 20 px en el panel de filtros y 16 px entre secciones del panel, cada una con un filete arriba.

## Elevation & Depth

Sistema plano. Ninguna superficie lleva sombra: la profundidad viene del contraste entre el papel de fondo, la hoja blanca y el filete de 1 px. La única capa que flota es la barra del comparador, fija abajo, que se separa por color (tinta sobre la página) y un anillo blanco al 15 %.

### Named Rules
**The Flat Paper Rule.** Las superficies son hojas sobre papel: borde fino, sin sombra, sin blur. Si algo necesita "levantarse", cambia de tinta, no de sombra.

## Shapes

Formas de documento: rectángulos con esquinas apenas redondeadas. 10 px en tarjetas y paneles, 8 px en botones, campos y el botón "Comparar", 3 px en casillas, 2 px en rieles y barras de datos (control deslizante, histograma y desglose del comparador), y redondo solo en el contador de la barra y en el interruptor. Las fotos llenan el ancho de la tarjeta en proporción 16:10, recortadas por la esquina de la tarjeta.

## Components

### Buttons
- **Shape:** esquinas suaves de documento (8 px).
- **Primary:** fondo tinta y texto blanco, 600 a 14 px. Es la acción principal: "Contactar", "Ingresar / Crear cuenta", "Abrir comparador" (aquí en blanco sobre la barra en tinta).
- **Hover / Focus:** el fondo pasa a tinta presionada; el foco es un contorno de 2 px en tinta, separado 2 px.
- **Secondary:** fondo blanco, borde de 1 px en tinta y texto tinta ("Ver ficha"). En hover toma el fondo papel.

### Cards / Containers
- **Corner Style:** 10 px.
- **Background:** hoja blanca sobre papel.
- **Shadow Strategy:** ninguna (ver Elevation & Depth).
- **Border:** filete de 1 px.
- **Internal Padding:** 16 px. Orden fijo en todos los inmuebles: foto, título, metadatos, total del mes, desglose, requisitos, sello y acciones.

### Inputs / Fields
- **Style:** fondo blanco, borde de 1 px en "borde de control", 8 px de radio y 10 × 12 px de relleno.
- **Focus:** contorno de 2 px en tinta.
- **Error:** borde y mensaje en rojo sello; el mensaje dice cómo corregir.

### Navigation
- Barra blanca de 68 px, fija arriba, con un filete abajo. El logo va de 40 px con "Wallex" en 800. Las pestañas van a 15 px: la activa en tinta y 600 con subrayado verde de 2 px, las demás en tinta suave. El contador de elementos en el comparador es una píldora en tinta. Por debajo de 1024 px pasa a menú de hamburguesa.

### Control deslizante del total del mes (signature)
Un `input range` nativo con riel de 4 px (tinta hasta el valor, filete después) y perilla blanca de 26 px con borde en tinta y una mini roseta verde adentro. Encima lleva un histograma de barras en tinta con cuántos inmuebles hay en cada tramo de $ 250.000; las barras por encima del tope se apagan. Al arrastrar, la perilla gira un poco.

### Sello de folio (signature)
La roseta de guilloche (`FolioSeal`) siempre tiene la misma estructura: tres bandas onduladas entrelazadas, un anillo interior de dos curvas y un punto central. Lo que cambia según el id del inmueble es poco: el número de ondas (10 a 13 afuera y 6 a 8 adentro) y el giro. Así cada inmueble tiene la suya y todas se ven de la misma familia.
- **Verificado:** bandas en verde y anillo en tinta.
- **Pendiente:** el mismo dibujo, punteado y en ámbar.
- **Sin verificar:** círculo punteado en rojo con una equis.

**Animación:** cada estado tiene su propia entrada, pero las tres son de la misma familia. Todas parten de una marca de agua del sello al 18 %, ocurren una sola vez al entrar en pantalla y no ocurren con `prefers-reduced-motion`.
- **Verificado:** la tinta se imprime curva por curva, escalonadas cada 110 ms. Cada curva se anima según su longitud real, así que todas terminan igual de suaves.
- **Pendiente:** el sello punteado se revela con un barrido circular, en el sentido del reloj, como una revisión que avanza.
- **Sin verificar:** el círculo se revela en barrido, después se trazan las dos líneas de la equis y el sello se asienta como un timbre de "anulado".

**Tamaños:** 48 px en tarjetas (catálogo y comparador), 64 px en la ficha, 40 px en el modal de verificación y 76 px en su confirmación. En tarjetas va siempre dentro del bloque `VerificationStamp`: sello, estado ("Verificado · identidad y tradición") y folio "(ejemplo)", con el mismo texto en todas partes.

### Ficha del inmueble
Capa sobre el catálogo con fondo en tinta al 55 %, sin blur.
- **En escritorio:** dos columnas, con la foto a la izquierda (56 %) y el folio a la derecha con scroll propio.
- **En celular:** una sola hoja de alto completo en la que la foto sube con el contenido.

El orden de la columna del folio es fijo: lugar, título (28 px, 800), metadatos, bloque de verificación entre filetes (sello de 64 px, identidad, certificado y folio), "Lo que pagas cada mes" como lista de valores alineados a la derecha, requisitos en filas separadas por filetes y descripción.
- **Total del mes:** va a 2rem, sobre un filete en tinta. Es el mismo total de la tarjeta, con el mismo perfil de transporte.
- **Requisitos:** dicen "Te lo piden" en tinta o "No te lo piden" en verde, sin píldoras.
- **Contacto:** el pie con el total y "Contactar a quien publica" siempre queda a la vista, con una línea que avisa que antes se verifica la identidad.

### Comparador lado a lado
- **Encabezado:** "Volver al catálogo", título, conteo "n de 3 inmuebles", "Agregar inmueble" e "Imprimir o guardar PDF". En escritorio queda fijo bajo la barra; en celular se apila y no es fijo.
- **Cómo te mueves:** panel con dos pestañas ("Perfiles" y "Ajuste manual"). Los perfiles son botones de radio y el ajuste manual usa el mismo control deslizante del catálogo. El perfil es el mismo que en el catálogo y la ficha (estado compartido en `App.tsx`), así que los totales coinciden en todas partes.
- **Opciones:** una tarjeta por inmueble con su total del mes (28 px) y la diferencia frente a la más barata. Debajo va la **barra de desglose a la misma escala** que el total más alto: canon en tinta, administración en tinta suave y transporte en borde de control, y una sola leyenda arriba. Después vienen el sello, el estado de verificación y "Contactar a quien publica". La más barata se marca con borde en tinta, no en verde.
- **Tabla punto por punto:** primera columna fija, filas en orden fijo y secciones (Dinero, Confianza, Requisitos, El inmueble) separadas por un filete en tinta. El menor valor se marca con la palabra "Menor" subrayada en tinta. Solo el estado de verificación usa verde, ámbar o rojo.

### Verificación al contactar
Modal de dos pasos (`ContactVerification`), con fondo en tinta al 55 %:
1. **Explicación y autorización.** Dice qué se pedirá (cédula por ambos lados y una selfie, con íconos de trazo) y el estado de quien publica con su sello. Si quien publica no está verificado, advierte que no se consigne dinero antes de ver el inmueble. Lleva la casilla de autorización de la Ley 1581, y el botón "Verificar mi identidad" queda deshabilitado (45 % de opacidad) hasta marcarla.
2. **Confirmación.** Muestra el sello verificado a 76 px y dice que es una simulación y que no se envía ningún correo.

La regla que manda: la pantalla nunca afirma algo que el prototipo no hace.

### Comparar (toggle)
Botón sobre la foto, arriba a la derecha. Lleva una casilla dibujada y el texto "Comparar". Activo, pasa a fondo tinta con "En comparador" y usa `aria-pressed`.

### Landing (/inicio)
Página aparte de la app, con su propia entrada en Vite (`inicio/index.html`, código en `src/landing/`). Usa la misma ficha, los mismos datos de ejemplo y los mismos tokens; no inventa cifras.

- **Titulares de display:** 4.5rem en escritorio y 2.75rem en celular para el titular principal; 3.25rem y 2rem para los de sección. Siempre 800 y tracking negativo, con interlineado de 1.05 a 1.08: con menos, las colas de la g y la p chocan con las tildes de la línea de abajo.
- **Rótulos de plano:** cada número (1, 2, 3) va unido a su parte de la ficha por una línea de 1 px que se traza desde su origen (`.lead-grow`). En celular el número queda dentro de la ficha y la leyenda va debajo.
- **Escenas fijas (desde 1024 px):** la ficha queda fija y el scroll avanza total, requisitos y sello; la parte activa queda en tinta y el resto al 30 %. El comparador llega apilado, se abre en fila y luego crecen las barras a la misma escala.
- **En celular o con movimiento reducido** no hay escenas fijas: cada parte va sola y se revela al entrar (con movimiento reducido, ya completa y quieta).
- **Entrada coreografiada al cargar:** el titular principal sube palabra por palabra, seguido por el buscador y la ficha de muestra, la cual se arma sumando su total del mes y trazando sus rótulos directos 1-2-3 una sola vez. Con movimiento reducido aparece completa y estática.
- **Barra de navegación adaptativa:** cambia de tono suavemente según la sección que cruza por debajo: fondo papel con texto tinta sobre la mayoría de secciones, y fondo oscuro tinta de noche con texto blanco sobre la escena del desorden y sobre el video abierto de Bogotá.
- **Recorridos en video de la app real:** tanto en la maqueta de portátil como en la de celular, videos ligeros en H.264 (con póster en WebP) muestran la app real buscando, abriendo la ficha y comparando. Corren en bucle sin sonido solo al estar visibles, con botón propio para pausar.
- **Del desorden a la ficha:** escena en tinta de noche. Mensajes de una búsqueda real de arriendo (basados en las entrevistas) flotan y, con el scroll, cada uno vuela a la parte de la ficha que lo responde; esa parte se enciende y el sello se imprime al final. En celular quedan como un chat revuelto y la ficha se enciende al entrar.
- **Bogotá en video:** escena con video aéreo del centro y los cerros orientales al atardecer (Julián Armando Santos en Pexels, con licencia libre y crédito): toma horizontal en escritorio y vertical en celular. En escritorio inicia como tarjeta a la derecha y se expande a pantalla completa con el texto sobre un velo de tinta desde abajo; el bucle tiene una transición cruzada matemática para reproducirse de forma continua y sin cortes visibles.
- **Inercia:** las escenas fijas siguen al scroll con un poco de inercia (`followScroll`, 16 % por cuadro) y los recorridos largos usan entrada y salida suaves, para que nada salte con cada giro de la rueda.
- **Microtexto:** franjas de 7 px con palabras del producto, como la letra pequeña de un billete. Se deslizan con el scroll y son decorativas (`aria-hidden`). Máximo tres por página.

## Do's and Don'ts

### Do:
- **Do** usar los tokens (`bg-paper`, `text-ink`, `border-rule`…) y no hex sueltos.
- **Do** mostrar el total del mes (canon + administración + transporte) como la cifra principal, con su desglose debajo.
- **Do** acompañar cada estado de verificación con su roseta y con el texto de qué se revisó.
- **Do** marcar como "(ejemplo)" todo dato de demostración que pueda confundirse con uno real.
- **Do** mantener el mismo orden de datos en todas las tarjetas y fichas.

### Don't:
- **Don't** usar fondo crema, acento terracota ni dorado: es el estilo que el profesor identificó como "hecho con IA".
- **Don't** poner etiquetas en mayúsculas con espaciado, emojis como íconos ni flechas "→" pegadas a botones.
- **Don't** usar sombras, `backdrop-blur` ni tarjetas dentro de tarjetas.
- **Don't** usar el verde esmeralda de Tailwind para "bueno" o "mejor opción"; el verde existe solo para verificación.
- **Don't** agrandar la expresión fuera de la roseta: si hace falta personalidad, va en el sello, no en más color.
