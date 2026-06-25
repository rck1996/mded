# Arquitectura

## Objetivo

MarkEDdown es una SPA local-first para escribir, organizar y exportar Markdown sin backend.
El objetivo de la arquitectura es mantener tres cosas bajo control:

- flujo de edicion rapido;
- preview seguro y consistente;
- modularizacion incremental sin reescribir la app.

## Resumen

La aplicacion corre completamente en el navegador.
Vite solo resuelve el build y el entorno de desarrollo.
La persistencia se apoya en `localStorage`.
No existe API remota ni servidor de aplicacion.

La estructura actual se divide en capas claras:

- `index.html`: shell semantico del workspace.
- `src/main.js`: entrypoint minimo.
- `src/app/`: runtime, wiring y coordinacion.
- `src/domain/`: reglas de negocio y transformaciones del documento.
- `src/editor/`: integracion con CodeMirror.
- `src/ui/`: render de paneles y piezas visuales complejas.
- `src/styles/`: sistema CSS por capas.

## Capas del sistema

### Shell

`index.html` define regiones estables para:

- topbar;
- navegacion lateral;
- paneles de documentos, insert y outline;
- editor;
- preview;
- overlays.

La logica no deberia vivir aqui.

### App runtime

`src/app/app-runtime.js` sigue siendo el orquestador principal.
Coordina:

- documento activo;
- preferencias;
- sincronizacion editor/preview;
- assets;
- historial;
- overlays;
- estados visuales del workspace.

El runtime ya no concentra toda la UI como antes, pero sigue siendo el mayor punto de composicion.

### Domain

`src/domain/` encapsula logica reusable y menos dependiente del DOM:

- `documents.js`: documentos, snapshots e historial.
- `folders.js`: carpetas, orden, filtro y colapso.
- `markdown.js`: expansion de tokens, sanitizacion y export HTML.
- `assets.js`: assets embebidos y referencias.
- `outline.js`: headings, fold range y movimiento de secciones.

Esta capa es la frontera correcta para seguir reduciendo complejidad del runtime.

### Editor

`src/editor/codemirror.js` concentra la configuracion de CodeMirror:

- extensiones;
- keymaps;
- folding;
- widgets;
- integracion con slash menu y estado del documento.

La idea es que el resto de la app trate al editor como una dependencia bien definida, no como una serie de detalles repartidos.

### UI

`src/ui/` contiene renderizadores de paneles y componentes dinamicos:

- `explorer-panel.js`
- `outline-panel.js`
- `assets-panel.js`
- `history-panel.js`
- `notes-panel.js`
- `slash-menu.js`

Esto evita seguir mezclando markup imperativo grande dentro del runtime.

### Persistencia

`src/app/storage.js` concentra claves y helpers de `localStorage`.
La regla es simple: el resto del sistema no deberia acceder a `localStorage` directamente cuando ya existe un helper.

## CSS

El sistema de estilos ahora entra por `src/styles/index.css` y usa capas ordenadas.

Orden actual:

- `tokens.css`: punto de entrada para variables y tokens compartidos.
- `legacy.css`: base visual actual de la app.
- `workspace-layout.css`: matriz de layout principal.
- `panel-states.css`: visibilidad y comportamiento de paneles laterales.
- `controls.css`: estados de controles y variantes dark.
- `overlays.css`: overlays y dialogs.
- `reading-modes.css`: presentation mode y preferencias de lectura.
- `mobile.css`: overrides responsive finales.

Esto resuelve un problema real del proyecto: antes el responsive, el layout y los estados de panel competian dentro de un unico archivo gigante.

## Flujo principal

1. `main.js` carga estilos y arranca el runtime.
2. El runtime lee documentos, carpetas y preferencias desde `storage.js` y `domain/`.
3. `editor/codemirror.js` monta el editor.
4. `preview-renderer.js` transforma Markdown a HTML seguro y actualiza preview, outline, notas, assets y validacion.
5. `bindings.js` conecta shortcuts, overlays y acciones globales.
6. `ui/` renderiza paneles especializados.

## Estado actual

La arquitectura ya no esta en el punto inicial de `bootstrap.js` monolitico.
Hoy existe separacion real entre runtime, dominio, editor, UI y estilos.

Lo que aun queda por seguir reduciendo:

- extraer mas casos de uso desde `app-runtime.js`;
- seguir adelgazando `legacy.css` moviendo componentes finales a archivos dedicados;
- mantener la regla de una sola fuente por responsabilidad.

## Direccion recomendada

La mejor evolucion para este proyecto sigue siendo modular vanilla JavaScript.
No hace falta cambiar de framework para resolver el mantenimiento.
El trabajo correcto es seguir sacando responsabilidad del runtime y del CSS base hacia modulos pequenos, probables y faciles de ubicar.
