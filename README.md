# MDed

MDed is a local-first Markdown editor designed for focused writing, structured documents, and polished previews. It combines a CodeMirror editing surface, a live Markdown renderer, reusable document tools, and a lightweight inspector without sending document content to a backend.

## Highlights

- CodeMirror-based Markdown editor with keyboard-friendly writing.
- Live preview powered by `marked`.
- Slash command menu for inserting common Markdown blocks.
- Local document manager with create, search, rename, duplicate, and close actions.
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

## Roadmap Ideas

- Split large production chunks with dynamic imports.
- Add encrypted export/import bundles.
- Add document delete/archive history.
- Add keyboard shortcuts documentation.
- Add optional filesystem persistence through the File System Access API.
- Add automated visual regression checks for light/dark themes.

## License

Private project.
