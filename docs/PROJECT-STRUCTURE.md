# Estructura Del Proyecto

## Vista rapida

```text
mdv-simple/
  index.html
  package.json
  package-lock.json
  vite.config.js
  wrangler.toml
  README.md
  docs/
  public/
  src/
```

## Raiz

### `index.html`

Shell base de la aplicacion.
Define las regiones del workspace y los overlays.

### `package.json`

Dependencias y scripts principales.

### `vite.config.js`

Configuracion del bundler y servidor local.

### `wrangler.toml`

Configuracion de despliegue para Cloudflare Pages.

### `docs/`

Documentacion del proyecto.

- `ARCHITECTURE.md`: limites tecnicos y capas.
- `PROJECT-STRUCTURE.md`: esta guia.
- `ROADMAP.md`: fases siguientes.

### `public/`

Assets estaticos servidos tal cual.

- `assets/logo/`: icono, favicon y variantes SVG.

## `src/`

```text
src/
  main.js
  app/
  domain/
  editor/
  styles/
  ui/
```

### `src/main.js`

Entry point minimo.
Solo conecta estilos y runtime.

### `src/app/`

Orquestacion y wiring de la app.

- `app-runtime.js`: coordinacion principal.
- `bindings.js`: eventos globales y shortcuts.
- `config.js`: constantes compartidas.
- `document-workflow.js`: casos de uso de documentos y carpetas.
- `dom.js`: referencias centralizadas al DOM.
- `editor-commands.js`: comandos editoriales y notas.
- `file-actions.js`: copiar, descargar y exportar.
- `preview-renderer.js`: render de preview, outline, notas, assets y validacion.
- `storage.js`: claves y helpers de persistencia.
- `templates.js`: plantillas base.

### `src/domain/`

Reglas de negocio y transformaciones puras o semi-puras.

- `documents.js`
- `folders.js`
- `markdown.js`
- `assets.js`
- `outline.js`

### `src/editor/`

Integracion dedicada con CodeMirror.

- `codemirror.js`

### `src/ui/`

Renderizadores de paneles y piezas complejas de interfaz.

- `assets-panel.js`
- `explorer-panel.js`
- `history-panel.js`
- `notes-panel.js`
- `outline-panel.js`
- `slash-menu.js`

### `src/styles/`

Sistema CSS por capas.

- `index.css`: entrypoint unico.
- `tokens.css`: tokens y variables compartidas.
- `legacy.css`: base visual actual de la app.
- `workspace-layout.css`: layout principal.
- `panel-states.css`: estados de paneles.
- `controls.css`: estados de controles.
- `overlays.css`: overlays y dialogs.
- `reading-modes.css`: presentation mode y preferencias de lectura.
- `mobile.css`: responsive final.

## Como leer el proyecto

1. La raiz contiene configuracion y entrada.
2. `src/app/` coordina la aplicacion.
3. `src/domain/` define reglas reutilizables.
4. `src/editor/` encapsula CodeMirror.
5. `src/ui/` renderiza paneles.
6. `src/styles/` organiza la cascada visual.

## Estado actual

La estructura ya no esta concentrada en un unico bootstrap.
Todavia existe un `legacy.css` grande y un `app-runtime.js` amplio, pero ambos ya estan rodeados por modulos mas claros y con responsabilidades mejor ubicadas.

La regla para seguir avanzando es simple: cuando aparezca una nueva pieza importante, debe entrar en la carpeta que ya representa su responsabilidad, no volver al runtime o al CSS base por defecto.
