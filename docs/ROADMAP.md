# MarkEDdown Roadmap

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
