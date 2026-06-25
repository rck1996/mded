# Arquitectura

## Objetivo

MarkEDdown es una aplicacion web local-first para escribir, organizar y exportar documentos Markdown sin depender de backend. El producto prioriza:

- edicion rapida;
- preview confiable;
- estructura documental;
- persistencia local;
- despliegue simple como sitio estatico.

Este documento explica la arquitectura actual del proyecto, sus limites, las decisiones tecnicas que la sostienen y la direccion recomendada para seguir modularizando el codigo sin reescribir la app.

## Resumen Ejecutivo

La arquitectura actual es una SPA construida con Vite y JavaScript vanilla. No hay servidor de aplicacion ni API remota. Toda la logica vive en el cliente y la persistencia principal usa `localStorage`.

En terminos practicos:

- `index.html` define la estructura base del workspace.
- `src/main.js` es el punto de entrada minimo.
- `src/app/app-runtime.js` ejecuta la aplicacion y concentra la mayor parte de la orquestacion.
- `src/app/bindings.js` registra eventos globales, overlays y atajos.
- `src/app/document-workflow.js` agrupa casos de uso de documentos y carpetas.
- `src/app/editor-commands.js` concentra comandos del editor y notas de secciones.
- `src/app/file-actions.js` encapsula copiado, descargas y exportacion de assets.
- `src/app/preview-renderer.js` compone preview, outline, notas, assets y validacion.
- `src/app/storage.js` encapsula claves y helpers de persistencia.
- `src/app/dom.js` centraliza referencias al DOM.
- `src/app/config.js` agrupa configuraciones compartidas.
- `src/app/templates.js` concentra plantillas iniciales de documentos.
- `src/styles/index.css` compone los estilos con capas ordenadas; `src/styles/legacy.css` mantiene la base visual, `src/styles/panel-states.css` concentra estados de paneles y `src/styles/mobile.css` contiene overrides responsive.

La arquitectura es valida para el alcance actual, pero todavia existe una concentracion importante de comportamiento en `app-runtime.js`. El trabajo arquitectonico correcto no es una migracion de framework, sino separar responsabilidades de forma incremental.

## Principios De Diseño

### 1. Local-first

El producto debe funcionar sin infraestructura de servidor. Eso reduce complejidad operativa, acelera el tiempo de carga y facilita despliegue en Cloudflare Pages.

### 2. Una sola fuente de verdad por responsabilidad

Los datos persistentes deben derivarse de helpers de almacenamiento y no del DOM. El DOM representa estado renderizado, no estado de negocio.

### 3. Pipeline explicito para Markdown

El flujo `preprocess -> render -> sanitize -> mount` no debe romperse. Es una frontera critica tanto de seguridad como de consistencia visual.

### 4. Modularizacion incremental

La app puede seguir evolucionando sin reescritura si cada nueva mejora saca una responsabilidad clara fuera de `app-runtime.js`.

### 5. Framework-light por decision

El problema actual no es falta de framework. El problema es separacion de responsabilidades. Por eso la direccion recomendada sigue siendo modular vanilla JS.

## Estructura Actual

```text
index.html
src/
  main.js
  app/
    app-runtime.js
    bindings.js
    document-workflow.js
    editor-commands.js
    file-actions.js
    preview-renderer.js
    storage.js
    dom.js
    config.js
    templates.js
  styles/
    index.css
    legacy.css
    mobile.css
    tokens.css
public/
  assets/
    logo/
docs/
  ARCHITECTURE.md
  ROADMAP.md
```

## Responsabilidad Por Archivo

### `index.html`

Define el shell semantico de la app:

- barra superior;
- panel lateral;
- area del editor;
- preview;
- inspector;
- overlays;
- menus de acciones.

No debe contener logica de negocio. Su funcion es estructural.

### `src/main.js`

Actua como entrypoint minimo:

- carga estilos globales;
- arranca `app-runtime.js`.

Su valor arquitectonico es desacoplar el arranque del resto de la implementacion.

### `src/app/app-runtime.js`

Es el runtime principal. Hoy concentra:

- inicializacion del editor;
- sincronizacion de documento activo;
- render del preview;
- acciones del explorador;
- templates;
- historial;
- overlays;
- assets;
- preferencias;
- foco, presentacion e inspector;
- wiring de eventos del DOM;
- integracion con CodeMirror, `marked` y `JSZip`.

Este archivo sigue siendo el mayor cuello de mantenimiento.

### `src/app/bindings.js`

Centraliza el wiring de eventos de la UI:

- clicks de toolbar y overlays;
- atajos globales de teclado;
- toggles de paneles, foco y presentacion;
- sincronizacion de preferencias desde inputs.

Mover este bloque fuera del runtime reduce ruido operativo y hace mas visible la logica de negocio restante.

### `src/app/file-actions.js`

Encapsula acciones de salida del editor:

- copiar Markdown y HTML;
- descargar `.md` y `.html`;
- exportar assets como `.zip`.

Esta frontera evita mezclar operaciones de navegador y descarga con el ciclo principal del documento.

### `src/app/document-workflow.js`

Agrupa el comportamiento de documentos y carpetas:

- documento activo;
- crear desde plantilla;
- borrar, restaurar y archivar;
- mover y reordenar.

Esto reduce la mezcla entre estado editorial y wiring visual.

### `src/app/editor-commands.js`

Concentra acciones de edición:

- inserciones en cursor;
- atajos de formato;
- movimiento de secciones;
- notas internas por heading.

La ventaja principal es que el runtime deja de cargar detalles operativos del editor.

### `src/app/preview-renderer.js`

Agrupa la salida visual del documento:

- render del preview HTML;
- outline;
- panel de notas;
- panel y preview de assets;
- stats y validación.

Esta separación convierte el preview en un subsistema explícito en lugar de una serie de efectos laterales dentro del runtime.

### `src/app/storage.js`

Centraliza persistencia y utilidades alrededor de `localStorage`:

- claves de almacenamiento;
- preferencias por defecto;
- lectura y escritura segura;
- mapas persistidos;
- tokens de links e imagenes;
- notas por bloque;
- ordenamiento de assets.

Este modulo ya establece una frontera importante: el resto de la app no deberia acceder a `localStorage` directamente.

### `src/app/dom.js`

Centraliza consultas al DOM y evita que los selectores queden repartidos por todo el runtime. Esto reduce acoplamiento accidental y simplifica futuros cambios de markup.

### `src/app/config.js`

Agrupa constantes operativas:

- breakpoint mobile;
- carpeta por defecto;
- limite de snapshots;
- intervalo de snapshots automaticos.

### `src/app/templates.js`

Contiene plantillas de inicio para nuevos documentos. Esta separacion evita mezclar contenido editorial con logica de ejecucion.

### `src/styles/index.css`

Concentra:

- tokens visuales;
- layout;
- temas;
- responsive;
- estilos de paneles, overlays y editor host.

## Capas Del Sistema

La app puede entenderse en cinco capas.

### 1. Shell

La capa shell es la estructura HTML base y sus regiones principales. Su responsabilidad es exponer zonas estables para que la aplicacion pinte UI encima.

### 2. Estado

La capa de estado contiene datos persistentes y transitorios.

Persistentes:

- documentos;
- carpetas;
- documento activo;
- carpeta activa;
- filtros del explorador;
- estado de paneles;
- tema y preferencias;
- links e imagenes almacenadas;
- notas por bloque;
- historial por documento.

Transitorios:

- slash menu abierto;
- seleccion activa dentro de overlays;
- timers de feedback/autoguardado;
- documento actualmente montado en editor;
- flags visuales del workspace.

### 3. Dominio

Aunque aun no vive en modulos separados, el dominio ya existe conceptualmente:

- documentos;
- carpetas;
- snapshots e historial;
- assets y links;
- markdown y sanitizacion;
- outline;
- preferencias y modos de visualizacion.

### 4. Integracion

Esta capa adapta librerias externas:

- CodeMirror 6 para edicion, keymaps, search y folding;
- `marked` para pasar de Markdown a HTML;
- `JSZip` para export de assets;
- APIs nativas del navegador como `localStorage`, `FileReader`, `Blob`, `crypto.randomUUID` y Clipboard.

### 5. Presentacion

La capa de presentacion genera UI derivada del estado:

- filas del explorador;
- outline;
- preview renderizado;
- inspector;
- overlays;
- menus contextuales;
- estados vacios y feedback.

La estrategia es imperativa y basada en DOM. Es aceptable mientras la app siga siendo local, acotada y de un solo usuario.

## Modelo De Datos

### Documento

Campos relevantes observados en runtime:

- `id`
- `title`
- `titleManual`
- `markdown`
- `folderId`
- `createdAt`
- `updatedAt`
- `order`
- `deletedAt`
- `archivedAt`
- `favorite`
- `history`
- `lastSnapshotAt`

Responsabilidad:

- representar una unidad editable;
- mantener historial local;
- participar en filtros, orden y acciones del explorador.

### Folder

Campos relevantes:

- `id`
- `name`
- `createdAt`
- `order`
- `deletedAt`

Responsabilidad:

- agrupar documentos;
- soportar ordenamiento y papelera;
- proveer contexto al explorador.

### Snapshot

Cada snapshot conserva:

- `id`
- `title`
- `markdown`
- `createdAt`
- `reason`

Responsabilidad:

- versionar el documento sin depender de infraestructura remota.

### Asset

Se almacena con:

- `id`
- `name`
- `type`
- `order`
- `value`

`value` normalmente es un data URL. Es simple, portable y consistente con el enfoque local-first, aunque no es eficiente para grandes volumenes.

### Link Token

Los links internos usan una referencia persistida para no llenar el editor con URLs largas. En el preview y export se expanden al valor real.

### Block Notes

Las notas internas viven fuera del Markdown visible/exportable. Eso permite separar contenido publicable de comentarios internos.

## Flujo De Ejecucion

### Arranque

1. `src/main.js` carga estilos y bootstrap.
2. `app-runtime.js` compone workflow, comandos, preview y callbacks del runtime.
3. Se recupera estado desde `localStorage`.
4. Se determina el documento activo.
5. Se crea CodeMirror con extensiones y listeners.
6. Se hidrata el workspace visual.
7. Se renderiza preview, explorador, inspector y estados derivados.

### Edicion

1. El usuario escribe en CodeMirror.
2. Un listener detecta cambios.
3. Se sincroniza el Markdown con el documento activo.
4. Se programa o actualiza snapshot si corresponde.
5. Se re-renderiza preview.
6. Se recalculan outline, stats, validaciones y assets relacionados.

### Creacion De Documento

1. El usuario crea un documento en blanco o desde template.
2. Se genera la entidad con metadata inicial.
3. Se adjunta snapshot inicial.
4. Se persiste en `documentsKey`.
5. Se abre en editor y se actualiza la UI.

### Exportacion

1. Se toma el estado actual del documento.
2. Se expande Markdown interno si hay tokens.
3. Se produce HTML seguro.
4. Se arma un documento standalone estilizado o un archivo `.md`.
5. Si aplica, los assets se empaquetan con `JSZip`.

## Pipeline De Markdown

Esta es una de las zonas mas criticas del producto.

### Paso 1. Expansion de tokens

Referencias como `mded-image:*` y `mded-link:*` se reemplazan por sus valores persistidos.

### Paso 2. Preprocesamiento

Se aplican transformaciones internas del producto, por ejemplo `==highlight==`.

### Paso 3. Render HTML

`marked` genera HTML a partir del Markdown.

### Paso 4. Sanitizacion

Se filtran tags, atributos y protocolos inseguros antes de inyectar en DOM.

### Paso 5. Montaje

El HTML seguro se inserta en preview o export.

Regla arquitectonica: ninguna nueva funcionalidad debe bypassar este pipeline.

## Persistencia

La estrategia actual usa `localStorage` como base de datos ligera del navegador.

### Ventajas

- cero infraestructura;
- deploy trivial;
- modo offline natural;
- latencia nula para lectura/escritura local.

### Limitaciones

- limite de capacidad del navegador;
- no hay sync entre dispositivos;
- no hay control de concurrencia;
- data URLs de imagenes aumentan rapidamente el peso persistido;
- no existe versionado externo ni backup automatico.

### Decision actual

Para el alcance presente, sigue siendo la opcion correcta. La fase siguiente no deberia reemplazarla, sino endurecerla con import/export de workspace y validaciones defensivas.

## Seguridad

La app no expone una superficie de backend, pero si procesa contenido generado por usuario. Por eso la seguridad relevante esta en render y export.

Controles actuales:

- HTML sanitizado antes de renderizar;
- allowlist explicita de tags y atributos;
- bloqueo de protocolos inseguros;
- nodos de texto para contenido controlado por usuario donde corresponde;
- escape de titulos en export HTML.

Riesgo principal futuro:

- introducir importadores, embeds o plugins que salten el pipeline seguro.

## Responsive Y UI State

La app ya incorpora comportamiento responsive mediante:

- `mobileViewMedia` en configuracion;
- estados de vista en `workspace.dataset`;
- panel lateral mostrable/ocultable;
- modos editor, split y preview;
- overlays para acciones secundarias.

La siguiente fase de UX deberia reducir complejidad mobile en navegacion y jerarquia visual, pero sobre una base estructural ya mas clara.

## Problemas Arquitectonicos Actuales

### 1. `app-runtime.js` sigue siendo demasiado grande

Aunque ya se separaron storage, config, DOM y templates, el runtime principal mezcla demasiadas responsabilidades.

### 2. Dominio y presentacion siguen acoplados

Muchos cambios de datos viven cerca de rendering y listeners del DOM. Esto aumenta el costo de cambio.

### 3. Falta una capa de dominio explicita

Documentos, folders, markdown, assets y outline ya existen como conceptos, pero aun no como modulos aislados.

### 4. CSS aun esta consolidado en un solo archivo

No es urgente, pero eventualmente convendra dividir tokens, layout, components y themes.

## Direccion Recomendada

La arquitectura objetivo no es React, Vue ni una reescritura SPA distinta. La direccion correcta es esta:

```text
src/
  app/
    app-runtime.js
    state.js
    events.js
    storage.js
    dom.js
    config.js
  domain/
    documents.js
    folders.js
    history.js
    markdown.js
    assets.js
    outline.js
  editor/
    codemirror.js
    commands.js
    search.js
    folding.js
    tokens.js
  ui/
    explorer.js
    preview.js
    inspector.js
    overlays.js
    preferences.js
  styles/
    tokens.css
    layout.css
    components.css
    themes.css
```

## Plan De Modularizacion

### Fase 4. Modularizacion base

Ya iniciado:

- entrypoint separado;
- storage separado;
- DOM separado;
- config separada;
- templates separados.

Siguiente paso real:

- extraer dominio de Markdown;
- extraer dominio de documentos e historial;
- extraer dominio de carpetas;
- separar wiring de eventos UI.

### Fase 5. Hardening local-first y experiencia mobile

- import/export de workspace;
- restauracion defensiva ante estado corrupto;
- mejor manejo de limites de almacenamiento;
- simplificacion de interaccion mobile.

### Fase 6. Escalabilidad interna

- tests sobre dominio extraido;
- auditoria de dead code;
- modularizacion de estilos;
- reduccion final del tamaño de `app-runtime.js`.

## Reglas Para Cambios Futuros

1. No leer ni escribir `localStorage` fuera de helpers compartidos.
2. No usar el DOM como fuente de verdad del dominio.
3. Toda salida HTML debe pasar por sanitizacion.
4. Toda nueva feature debe pertenecer a un modulo o frontera concreta.
5. Si una mejora toca datos, UI y librerias a la vez, primero separar la responsabilidad.
6. No crecer `app-runtime.js` si el cambio crea una responsabilidad reutilizable.
7. Mantener `npm run build` pasando despues de cada extraccion.

## Criterio De Exito Arquitectonico

Una mejora de arquitectura esta bien hecha si:

- es mas facil encontrar responsabilidades;
- disminuye el tamaño mental de los cambios;
- no duplica estado;
- no rompe el flujo local-first;
- mantiene o mejora la experiencia del usuario;
- deja el proyecto mas facil de extender que antes.

## Conclusión

MarkEDdown ya tiene una direccion de producto clara y una arquitectura funcional para su etapa actual. El problema principal no es de tecnologia base sino de concentracion de responsabilidades. La estrategia correcta es modularizar por dominio, preservar el enfoque local-first y seguir endureciendo el pipeline de contenido y persistencia mientras el producto crece.
