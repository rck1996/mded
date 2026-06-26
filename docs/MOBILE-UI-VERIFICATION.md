# Mobile UI verification

Use this check after changing the main workspace, side panel, or responsive CSS.

## How to view it locally

1. Run the app:

```powershell
npm.cmd run dev -- --host 127.0.0.1 --port 5174
```

2. Open `http://127.0.0.1:5174/` in Chrome.
3. Open DevTools.
4. Toggle the device toolbar.
5. Use a custom viewport of `390 x 844`.
6. Reload the page while the mobile viewport is active.

## Required viewport

- Width: `390px`
- Height: `844px`
- Mobile emulation: enabled

## Critical checks

- `.side-tabs` must be a bottom navigation bar, not a full-screen layer.
- `.side-tabs` height must match `--mobile-nav-height` (`62px` by default).
- `.editor-panel` must be visible on first load when `data-view="editor"`.
- `.preview-panel` must be visible after tapping `Vista previa`.
- `.documents-panel`, `.toolbox`, and `.outline-panel` must open as bottom sheets above the bottom navigation.
- The bottom navigation must not cover the editor content except for the reserved bottom padding.
- Switching between `Editor` and `Vista previa` on mobile must close any open side sheet.

## Regression that caused a blank mobile screen

Desktop styles set `.side-tabs` to `height: 100%` so the activity rail fills the left column. Mobile must explicitly override that with:

```css
.side-tabs {
  height: var(--mobile-nav-height);
  max-height: var(--mobile-nav-height);
}
```

If this override is missing, the mobile bottom navigation can expand to the full viewport height and visually cover the app.
