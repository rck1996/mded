# MDed

MDed is a local-first Markdown editor designed for focused writing, structured documents, and polished previews. It combines a CodeMirror editing surface, a live Markdown renderer, reusable document tools, and a lightweight inspector without sending document content to a backend.

## Highlights

- CodeMirror-based Markdown editor with keyboard-friendly writing.
- Built-in find and replace inside the editor.
- Live preview powered by `marked`.
- Slash command menu with categories, previews, and visible shortcuts.
- Local document manager with create, search, inline rename, drag and drop, trash, restore, and version history.
- Insert panel for headings, text styles, lists, links, images, tables, code blocks, footnotes, definitions, and diagrams.
- Paste or drag images into the editor and reuse them from Assets.
- Abbreviated internal image/link tokens to keep the editor readable.
- Inspector drawer with outline, assets, and validation warnings.
- Light and dark themes tuned for readability.
- Focus mode for distraction-free writing.
- Copy Markdown, copy HTML, export HTML, download `.md`, and export image assets as ZIP.

## Security And Privacy

MDed is local-first. Documents, preferences, pasted images, and stored link references are saved in browser `localStorage`.

Security measures included:

- Rendered Markdown HTML is sanitized before display and export.
- Unsafe protocols are stripped from links and image sources.
- User-controlled document names are rendered with DOM text nodes instead of raw HTML.
- Exported HTML escapes document titles.
- `npm audit` currently reports no known vulnerabilities.

> Note: `localStorage` is convenient for a local editor, but it is not encrypted storage. Do not treat it as a vault for highly sensitive secrets.

## Tech Stack

- Vite
- CodeMirror 6
- Marked
- JSZip
- Vanilla JavaScript
- CSS custom properties

## Getting Started

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

## Project Structure

```text
src/
  main.js      App logic, editor setup, rendering, storage, commands
  styles.css   Layout, themes, panels, editor and preview styling
index.html     Application shell
```

## Current Design Principles

- Readability first: high-contrast text, restrained colors, stable spacing.
- Local-first workflow: fast editing without accounts or remote sync.
- Progressive complexity: writing stays central; inspector and actions stay out of the way until needed.
- Predictable controls: tabs switch lateral tools, actions are grouped, focus mode has a persistent exit.

## Fase 1 Implemented

- `Ctrl/Cmd + F` opens editor search, and `Ctrl/Cmd + Shift + H` opens replace.
- Each document keeps a local version history with automatic snapshots and manual saves.
- Documents and folders can be renamed inline from the explorer.
- Explorer drag and drop moves documents across folders and reorders folders/documents.
- Outline drag and drop reorders heading sections in the Markdown source.
- Documents and folders now use a trash flow with restore and permanent delete actions.
- Visible shortcuts are available from `Acciones > Atajos y ayuda`.
- The `/` palette now shows richer previews, categories, and quick command hints.

## Fase 1 Usage

- Open a document menu in the explorer to rename, save a version, view history, duplicate, move, or delete.
- Open `Historial` to inspect saved versions and restore any snapshot.
- Drag a document onto another document to reorder it, or onto a folder to move it.
- Drag a folder onto another folder to reorder the explorer.
- Drag headings inside `Indice` to reorder document sections.
- Restore deleted items from `Papelera` at the bottom of the explorer.

## Roadmap

### Fase 1

Estado: completada

- Buscar y reemplazar dentro del editor.
- Snapshots / historial de versiones por documento.
- Renombrado inline en el explorador.
- Drag and drop en explorador e indice.
- Eliminar / restaurar documentos y carpetas.
- Atajos visibles y mejor command palette con `/`.

### Fase 2

Estado: pendiente

- Plegado de secciones por encabezados.
- Reordenar bloques desde indice o comandos.
- Favoritos, recientes y filtros en el explorador.
- Plantillas de documentos.
- Duplicar, mover, archivar desde menu contextual real.
- Mejor gestion de assets: renombrar, reemplazar, ordenar y preview mas limpia.

### Fase 3

Estado: pendiente

- Exportacion HTML mas cuidada.
- Modo presentacion/publicacion para vista limpia.
- Comentarios o notas internas por bloque.
- Preferencias del editor: densidad, ancho de lectura, tipografia, tema y line wrap.

## License

Private project.
