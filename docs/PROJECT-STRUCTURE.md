# Estructura Del Proyecto

## Vista rápida

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

## Qué va en la raíz

### `index.html`

Shell base de la aplicación. Define el markup principal sobre el que se monta MarkEDdown.

### `package.json`

Dependencias, scripts y metadata del proyecto.

### `package-lock.json`

Lockfile de npm. Mantiene instalaciones reproducibles.

### `vite.config.js`

Configuración del bundler y servidor de desarrollo.

### `wrangler.toml`

Configuración de despliegue para Cloudflare.

### `README.md`

Resumen del proyecto, setup y guía rápida.

## Carpetas

### `docs/`

Documentación del proyecto.

- `ARCHITECTURE.md`: arquitectura técnica.
- `ROADMAP.md`: plan de evolución.
- `PROJECT-STRUCTURE.md`: esta guía.

### `public/`

Assets estáticos servidos tal cual.

- `assets/logo/`: logos, favicon y variantes SVG.

### `src/`

Código fuente real de la aplicación.

```text
src/
  main.js
  app/
  domain/
  ui/
  styles/
```

## Cómo leer `src/`

### `src/main.js`

Entry point mínimo. Solo carga estilos y arranca el runtime.

### `src/app/`

Capa de arranque y wiring.

- `app-runtime.js`: inicialización, coordinación y composición de módulos.
- `bindings.js`: wiring de eventos globales y atajos de la interfaz.
- `document-workflow.js`: casos de uso de documentos y carpetas.
- `editor-commands.js`: comandos de edición, formato y notas de secciones.
- `file-actions.js`: acciones de copiar, descargar y exportar archivos.
- `preview-renderer.js`: preview, outline, notas, assets, stats y validación.
- `storage.js`: persistencia y claves de `localStorage`.
- `dom.js`: referencias al DOM.
- `config.js`: constantes compartidas.
- `templates.js`: plantillas de documentos.

### `src/styles/`

- `index.css`: punto de entrada de estilos.
- `legacy.css`: cascada visual actual preservada en el mismo orden.
- `tokens.css`: punto de extracción futura para variables y tokens.
- `mobile.css`: punto de extracción futura para responsive.

### `src/domain/`

Reglas de negocio puras o semi-puras.

- `documents.js`: documentos, snapshots e historial persistido.
- `folders.js`: carpetas, orden y filtros persistidos.
- `markdown.js`: preprocess, sanitización y export HTML.
- `assets.js`: operaciones de assets y referencias.
- `outline.js`: headings, folding y movimiento de secciones.

### `src/ui/`

Render de paneles y comportamiento visual encapsulado.

- `assets-panel.js`
- `outline-panel.js`

Esta carpeta debería seguir creciendo con:

- `history-panel.js`
- `notes-panel.js`
- `explorer-panel.js`

### `src/styles/`

Estilos de la app. Hoy todavía vive en `index.css`, pero después debería dividirse por tokens, layout, componentes y themes.

## Estado actual

La raíz no está “rota”, pero sí venía poco explicada. El orden real hoy es:

1. raíz para configuración y entry files;
2. `docs/` para documentación;
3. `public/` para assets estáticos;
4. `src/` para código;
5. dentro de `src/`, separación por responsabilidad: `app`, `domain`, `ui`, `styles`.

## Próxima mejora visible

Para que el árbol se entienda todavía mejor, las siguientes extracciones recomendadas son:

1. `src/ui/history-panel.js`
2. `src/ui/notes-panel.js`
3. `src/ui/explorer-panel.js`
4. `src/editor/` para toda la integración con CodeMirror
