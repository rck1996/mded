# MarkEDdown Roadmap

## Siguiente Semana

Objetivo: cerrar estabilidad operativa y dejar la experiencia consistente en desktop y mobile.

### Prioridades

1. Validar el deploy automatico en Cloudflare Pages con `main` y confirmar que build, estilos y assets cargan sin pasos manuales.
2. Terminar el pulido responsive de `Editor`, `Vista previa`, `Insertar`, `Explorador` y `Mas` para que no haya estados ocultos, overlays rotos ni cortes raros.
3. Revisar accesibilidad e interaccion base: foco visible, cierre repetido de paneles, scroll interno, navegacion por teclado y targets tactiles consistentes.
4. Limpiar la superficie del producto: documentacion final, nombres consistentes, CI estable y artefactos locales fuera del repo.

### Entregables de la semana

1. Dejar Cloudflare Pages completamente estable con deploy por push a `main`, sin desalineacion entre HTML fuente y `dist/`.
2. Cerrar la auditoria mobile/tablet con una matriz simple de vistas:
   - `Editor`
   - `Preview`
   - `Split`
   - `Insertar`
   - `Explorador`
   - `Indice`
   - `Mas`
3. Normalizar el comportamiento de paneles:
   - mismo boton abre y cierra
   - no abrir paneles automaticamente al cambiar de vista
   - mantener scroll y posicion de forma predecible
4. Ajustar desktop al colapsar paneles laterales para que `Editor` y `Vista previa` aprovechen todo el ancho disponible.
5. Revisar accesibilidad basica:
   - orden de foco
   - `Escape` consistente
   - contraste aceptable
   - controles usables en touch
6. Hacer una pasada de calidad sobre slash menu e insertar:
   - scroll correcto en mobile
   - preview clara de comandos
   - evitar activaciones accidentales al tocar
7. Consolidar documentacion tecnica:
   - roadmap actualizado
   - arquitectura alineada con el estado real
   - deploy y CI explicados sin pasos viejos
8. Cerrar la semana con una verificacion operativa:
   - `npm run build`
   - smoke check visual
   - deploy final estable en Pages

### Riesgos a vigilar

- Reglas legacy de CSS que sigan peleando con `mobile.css`.
- Estados de `data-view`, `data-side-visible` y `data-side-panel` que se contradigan entre desktop y mobile.
- Cambios visuales correctos en local pero mal servidos por Cloudflare si la configuracion del proyecto no queda fija.
## Fase 4

Objetivo: reducir el costo de cambio del producto sin reescritura de framework.

### 4.1 Modularizacion base

Estado: en progreso

- Extraer persistencia y claves de `localStorage` a `src/app/storage.js`.
- Extraer configuracion y runtime principal a `src/app/app-runtime.js`.
- Extraer bindings del DOM a `src/app/dom.js` y templates a `src/app/templates.js`.
- Separar servicios de dominio en modulos dedicados:
  - `src/domain/documents.js`
  - `src/domain/folders.js`
  - `src/domain/assets.js`
  - `src/domain/markdown.js`
  - `src/domain/outline.js`
- Mantener `src/main.js` como entrypoint minimo mientras `app-runtime.js` se sigue descomponiendo.

### 4.2 Hardening local-first

Estado: pendiente

- Export e import de workspace completo.
- Backup JSON/ZIP de documentos, folders, assets y preferencias.
- Validaciones defensivas al restaurar estado corrupto o incompleto.
- Mejor manejo de limites y errores de `localStorage`.

### 4.3 Editor core

Estado: pendiente

- Mejorar slash menu y comandos frecuentes.
- Pulir fold/unfold por headings y outline interactions.
- Afinar sincronizacion editor/preview y accesos rapidos.
- Revisar ergonomia de notas internas y assets inline.

## Fase 5

Objetivo: subir calidad de uso real en desktop y mobile.

### 5.1 Mobile-first interaction pass

- Jerarquia mas clara entre editor, preview y panel lateral.
- Navegacion y acciones mas ligeras en telefonos.
- Estados de vista mas previsibles en mobile.

### 5.2 Public workspace polish

- Landing publica minima en el dominio.
- Mejor presentacion de branding, screenshots y propuesta de valor.
- Pulido visual del modo presentacion/publicacion.

## Fase 6

Objetivo: confianza operativa y extensibilidad.

- Importadores/exportadores mas robustos.
- Tests para servicios de dominio extraidos.
- Auditoria de dead code y consolidacion de estilos.
- Preparacion para futuras features sin crecer otro `app-runtime.js` gigante.

## Criterio de prioridad

Orden recomendado:

1. Modularizacion base.
2. Hardening local-first.
3. Editor core.
4. Mobile-first interaction pass.
5. Landing publica.
