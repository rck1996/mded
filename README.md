# MDed

Editor Markdown local construido con Vite y CodeMirror.

## Scripts

```bash
npm run dev
npm run build
npm run preview
```

## Seguridad

- El HTML renderizado desde Markdown se sanitiza antes de mostrarse o exportarse.
- Los links y fuentes de imagen se limitan a protocolos seguros.
- Las imagenes pegadas se guardan localmente en `localStorage`.
- `npm audit` no reporta vulnerabilidades conocidas.
