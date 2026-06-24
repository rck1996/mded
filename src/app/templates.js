export const documentTemplates = [
  {
    id: "blank",
    label: "En blanco",
    title: "Nuevo documento",
    markdown: "# Nuevo documento\n\nEmpieza a escribir aqui.",
  },
  {
    id: "meeting",
    label: "Reunion",
    title: "Notas de reunion",
    markdown:
      "# Notas de reunion\n\n## Contexto\n\n- Objetivo principal\n- Participantes\n\n## Puntos clave\n\n- Decision 1\n- Decision 2\n\n## Tareas\n\n- [ ] Responsable - siguiente paso\n\n## Riesgos\n\n- Riesgo a vigilar\n",
  },
  {
    id: "brief",
    label: "Brief",
    title: "Brief de proyecto",
    markdown:
      "# Brief de proyecto\n\n## Problema\n\nDescribe el problema que se quiere resolver.\n\n## Objetivo\n\n- Resultado esperado\n- KPI principal\n\n## Alcance\n\n- Incluye\n- No incluye\n\n## Entregables\n\n1. Entregable principal\n2. Validacion\n\n## Notas\n\nObservaciones adicionales.\n",
  },
  {
    id: "spec",
    label: "Especificacion",
    title: "Especificacion tecnica",
    markdown:
      "# Especificacion tecnica\n\n## Resumen\n\nExplica la solucion en una frase.\n\n## Requisitos\n\n- Requisito funcional\n- Requisito no funcional\n\n## Flujo\n\n1. Entrada\n2. Proceso\n3. Salida\n\n## Casos borde\n\n- Caso borde 1\n- Caso borde 2\n\n## Pendientes\n\n- [ ] Validacion final\n",
  },
  {
    id: "prd",
    label: "PRD",
    title: "Product requirements",
    markdown:
      "# Product requirements\n\n## Contexto\n\nDescribe el problema, la oportunidad o la necesidad del negocio.\n\n## Usuarios objetivo\n\n- Usuario primario\n- Usuario secundario\n\n## Objetivo del producto\n\n- Resultado esperado\n- Indicador principal\n\n## Alcance funcional\n\n- Incluye\n- No incluye\n\n## Criterios de exito\n\n- KPI 1\n- KPI 2\n\n## Riesgos y dependencias\n\n- Riesgo\n- Dependencia\n",
  },
  {
    id: "proposal",
    label: "Propuesta",
    title: "Propuesta comercial o interna",
    markdown:
      "# Propuesta\n\n## Resumen ejecutivo\n\nExplica la propuesta en pocas lineas.\n\n## Situacion actual\n\n- Hallazgo 1\n- Hallazgo 2\n\n## Propuesta\n\n1. Iniciativa principal\n2. Entregable esperado\n3. Tiempo estimado\n\n## Inversion\n\n- Costo estimado\n- Supuestos\n\n## Proximos pasos\n\n- [ ] Validacion\n- [ ] Aprobacion\n",
  },
  {
    id: "decision-log",
    label: "Decision",
    title: "Registro de decisiones",
    markdown:
      "# Decision record\n\n## Decision\n\nResume la decision tomada.\n\n## Contexto\n\nExplica por que habia que decidir.\n\n## Alternativas evaluadas\n\n- Alternativa A\n- Alternativa B\n- Alternativa C\n\n## Consecuencias\n\n- Impacto positivo\n- Tradeoff\n\n## Seguimiento\n\n- [ ] Revisar en 30 dias\n",
  },
  {
    id: "incident",
    label: "Incidente",
    title: "Reporte de incidente",
    markdown:
      "# Reporte de incidente\n\n## Resumen\n\nQue ocurrio y a quien impacto.\n\n## Impacto\n\n- Servicios afectados\n- Usuarios afectados\n- Duracion\n\n## Timeline\n\n1. Deteccion\n2. Mitigacion\n3. Resolucion\n\n## Causa raiz\n\nDescribe la causa principal.\n\n## Acciones posteriores\n\n- [ ] Corregir causa raiz\n- [ ] Agregar monitoreo\n- [ ] Compartir aprendizaje\n",
  },
  {
    id: "runbook",
    label: "Runbook",
    title: "Procedimiento operativo",
    markdown:
      "# Runbook operativo\n\n## Objetivo\n\nQue resuelve este procedimiento.\n\n## Checklist previa\n\n- [ ] Accesos necesarios\n- [ ] Contexto del entorno\n- [ ] Riesgos conocidos\n\n## Pasos\n\n1. Paso uno\n2. Paso dos\n3. Validacion final\n\n## Rollback\n\nDescribe como revertir.\n\n## Escalamiento\n\n- Responsable\n- Canal\n",
  },
  {
    id: "retro",
    label: "Retro",
    title: "Retrospectiva",
    markdown:
      "# Retrospectiva\n\n## Que salio bien\n\n- Punto positivo\n\n## Que salio mal\n\n- Friccion o problema\n\n## Aprendizajes\n\n- Insight clave\n\n## Acciones\n\n- [ ] Accion 1\n- [ ] Accion 2\n",
  },
  {
    id: "one-on-one",
    label: "1:1",
    title: "One on one",
    markdown:
      "# One on one\n\n## Estado general\n\nComo viene la semana.\n\n## Logros\n\n- Logro 1\n- Logro 2\n\n## Bloqueos\n\n- Bloqueo 1\n\n## Feedback\n\n- Feedback para compartir\n\n## Acciones\n\n- [ ] Accion acordada\n",
  },
  {
    id: "sprint-plan",
    label: "Sprint",
    title: "Plan de sprint",
    markdown:
      "# Plan de sprint\n\n## Objetivo del sprint\n\nDescribe el resultado principal.\n\n## Capacidad\n\n- Equipo\n- Supuestos\n\n## Backlog comprometido\n\n1. Historia 1\n2. Historia 2\n3. Historia 3\n\n## Riesgos\n\n- Riesgo 1\n\n## Seguimiento\n\n- [ ] Confirmar dependencias\n- [ ] Validar alcance\n",
  },
  {
    id: "research",
    label: "Research",
    title: "Sintesis de research",
    markdown:
      "# Sintesis de research\n\n## Pregunta de investigacion\n\nQue queriamos entender.\n\n## Metodologia\n\n- Entrevistas\n- Analitica\n- Benchmark\n\n## Hallazgos\n\n- Hallazgo 1\n- Hallazgo 2\n- Hallazgo 3\n\n## Insights\n\n- Insight principal\n\n## Recomendaciones\n\n1. Recomendacion 1\n2. Recomendacion 2\n",
  },
  {
    id: "blog-post",
    label: "Articulo",
    title: "Articulo o post",
    markdown:
      "# Titulo del articulo\n\n## Gancho inicial\n\nAbre con el contexto o tension principal.\n\n## Idea central\n\nDesarrolla el argumento.\n\n## Puntos clave\n\n- Punto 1\n- Punto 2\n- Punto 3\n\n## Cierre\n\nResume la idea y deja una conclusion clara.\n",
  },
];
