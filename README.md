# MarkEDdown

MarkEDdown is a local-first Markdown editor designed for focused writing, structured documents, and polished previews. It combines a CodeMirror editing surface, a live Markdown renderer, reusable document tools, and a lightweight inspector without sending document content to a backend.

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

MarkEDdown is local-first. Documents, preferences, pasted images, and stored link references are saved in browser `localStorage`.

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
  main.js              Thin entrypoint for styles and app bootstrap
  app/
    app-runtime.js     App runtime, editor wiring, rendering, and UI events
    bindings.js        Global UI event wiring
    document-workflow.js Document and folder use-cases
    editor-commands.js Editor formatting, note, and section commands
    preview-renderer.js Preview, outline, notes, assets, stats, and validation
    storage.js         localStorage keys and persistence helpers
    dom.js             Centralized DOM bindings
    config.js          Shared runtime constants
    file-actions.js    Copy, download, and asset export actions
    templates.js       Starter document templates
  styles/
    index.css          Single CSS entrypoint ordered with cascade layers
    legacy.css         Base desktop/app layer preserved during cleanup
    mobile.css         Responsive override layer for tablet and mobile
    tokens.css         Token extraction entrypoint
index.html     Application shell
docs/
  ARCHITECTURE.md  Current architecture, boundaries, and target evolution
  PROJECT-STRUCTURE.md  Root and src/ folder guide
```

## Architecture

MarkEDdown currently uses a local-first single-page architecture with:

- semantic application shell in `index.html`;
- a thin entrypoint in `src/main.js`;
- runtime orchestration in `src/app/app-runtime.js`;
- global UI bindings in `src/app/bindings.js`;
- document and folder workflow in `src/app/document-workflow.js`;
- editor commands in `src/app/editor-commands.js`;
- file actions in `src/app/file-actions.js`;
- preview rendering in `src/app/preview-renderer.js`;
- persistence helpers in `src/app/storage.js`;
- centralized selectors and config in `src/app/dom.js` and `src/app/config.js`;
- stylesheet composition in `src/styles/index.css` using ordered cascade layers for tokens, app styles, and responsive overrides;
- browser `localStorage` as the persistence layer.

The current implementation is intentionally framework-light. For this project, the preferred architecture is **modular vanilla JavaScript** with explicit boundaries around documents, folders, history, assets, markdown rendering, editor integration, and UI panels.

Detailed architectural documentation is available in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).
Project structure documentation is available in [docs/PROJECT-STRUCTURE.md](docs/PROJECT-STRUCTURE.md).

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

## Fase 2 And 3 Status

Current status:

- `Fase 2`: largely implemented in product behavior and now more cohesive in the UI.
- `Fase 3`: completed in this iteration.

Recent additions:

- Template picker overlay for creating new documents from templates.
- Explorer support for favorites, recents, archive, move, duplicate, inline rename, and drag-and-drop reordering.
- Asset preview overlay with direct insert and replace actions.
- Presentation mode focused on reading and clean review.
- Preferences for reading width, density, typography, theme, and editor line wrap.
- HTML export with a standalone styled document instead of a bare HTML shell.
- Internal notes per heading block, visible only inside MarkEDdown and excluded from exported/published output.

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

Estado: en progreso avanzado

- Plegado de secciones por encabezados.
- Reordenar bloques desde indice o comandos.
- Favoritos, recientes y filtros en el explorador.
- Plantillas de documentos.
- Duplicar, mover, archivar desde menu contextual real.
- Mejor gestion de assets: renombrar, reemplazar, ordenar y preview mas limpia.

### Fase 3

Estado: completada

- Exportacion HTML mas cuidada.
- Modo presentacion/publicacion para vista limpia.
- Comentarios o notas internas por bloque.
- Preferencias del editor: densidad, ancho de lectura, tipografia, tema y line wrap.

## License

Private project.

## Deploy To Cloudflare Pages

This project is ready for Cloudflare Pages as a static Vite site.

### Git integration

In Cloudflare Pages, connect the repository and use:

- Build command: `npm run build`
- Build output directory: dist
- Production branch: main (or your default branch)

Recommended setup:

- Connect the `markeddown` Pages project directly to the GitHub repository.
- Let Cloudflare Pages deploy production automatically on every push to `main`.
- Keep preview deployments enabled for branches and pull requests.

### Direct Upload with Wrangler

Build locally:

```bash
npm install
npm run build
```

Deploy the generated dist/ folder:

```bash
npx wrangler pages deploy dist
```

A preview deployment can be sent with:

```bash
npm run cf:deploy:preview
```

The local Wrangler config is in wrangler.toml and declares pages_build_output_dir = "dist".

### GitHub Actions CI/CD

The repository now includes `.github/workflows/cloudflare-pages.yml`.

Behavior:

- Every pull request runs `npm ci` and `npm run build`.
- Every push to `main` runs the same validation.

GitHub Actions is intentionally CI-only here. Production deploys should come from Cloudflare Pages Git integration, not from GitHub Actions via Wrangler.
