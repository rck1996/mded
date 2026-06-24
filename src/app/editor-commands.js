import { getHeadingSectionKeys, getHeadingSections } from "../domain/outline.js";

export const createEditorCommands = ({
  getEditor,
  getMarkdown,
  getActiveDocumentId,
  slugify,
  getBlockNotesMap,
  setBlockNotesMap,
  focusHeadingInEditor,
  moveHeadingSection,
  renderNotes,
  renderOutline,
  showButtonFeedback,
  getFormatButton,
}) => {
  const insertAtCursor = (value) => {
    const editor = getEditor();
    const selection = editor.state.selection.main;
    const prefix = selection.from > 0 && editor.state.doc.sliceString(selection.from - 1, selection.from) !== "\n" ? "\n" : "";
    const suffix =
      editor.state.doc.sliceString(selection.to, selection.to + 1) &&
      editor.state.doc.sliceString(selection.to, selection.to + 1) !== "\n"
        ? "\n"
        : "";
    const insert = `${prefix}${value}${suffix}`;

    editor.dispatch({
      changes: { from: selection.from, to: selection.to, insert },
      selection: { anchor: selection.from + insert.length },
    });
    editor.focus();
  };

  const wrapSelection = (before, after = "", fallback = "texto") => {
    const editor = getEditor();
    const selection = editor.state.selection.main;
    const selected = editor.state.doc.sliceString(selection.from, selection.to) || fallback;
    editor.dispatch({
      changes: { from: selection.from, to: selection.to, insert: `${before}${selected}${after}` },
      selection: { anchor: selection.from + before.length, head: selection.from + before.length + selected.length },
    });
    editor.focus();
  };

  const applyFormat = (format) => {
    const actions = {
      h1: () => insertAtCursor("# Titulo principal"),
      h2: () => insertAtCursor("## Subtitulo"),
      h3: () => insertAtCursor("### Seccion"),
      h4: () => insertAtCursor("#### Apartado"),
      h5: () => insertAtCursor("##### Detalle"),
      h6: () => insertAtCursor("###### Nota menor"),
      hr: () => insertAtCursor("---"),
      toc: () => insertAtCursor("## Indice\n\n- [Introduccion](#introduccion)\n- [Desarrollo](#desarrollo)\n- [Cierre](#cierre)"),
      bold: () => wrapSelection("**", "**", "texto importante"),
      italic: () => wrapSelection("*", "*", "texto en cursiva"),
      strike: () => wrapSelection("~~", "~~", "texto tachado"),
      inlineCode: () => wrapSelection("`", "`", "codigo"),
      highlight: () => wrapSelection("==", "==", "texto resaltado"),
      quote: () => insertAtCursor("> Cita o nota destacada"),
      callout: () => insertAtCursor("> **Nota:** escribe aqui una aclaracion importante."),
      ul: () => insertAtCursor("- Primer punto\n- Segundo punto\n- Tercer punto"),
      ol: () => insertAtCursor("1. Primer paso\n2. Segundo paso\n3. Tercer paso"),
      task: () => insertAtCursor("- [x] Tarea completada\n- [ ] Tarea pendiente\n- [ ] Otra tarea"),
      nested: () => insertAtCursor("- Tema principal\n  - Detalle relacionado\n  - Otro detalle\n- Segundo tema"),
      link: () => wrapSelection("[", "](https://ejemplo.com)", "Texto del enlace"),
      image: () => insertAtCursor("![Descripcion de la imagen](https://via.placeholder.com/900x420.png?text=Imagen)"),
      table: () => insertAtCursor("| Columna 1 | Columna 2 | Columna 3 |\n| --- | --- | --- |\n| Dato | Dato | Dato |\n| Dato | Dato | Dato |"),
      codeBlock: () => insertAtCursor("```js\nconst mensaje = \"Hola Markdown\";\nconsole.log(mensaje);\n```"),
      details: () => insertAtCursor("<details>\n<summary>Ver mas informacion</summary>\n\nContenido oculto que el lector puede abrir.\n\n</details>"),
      footnote: () => insertAtCursor("Texto con nota al pie[^1].\n\n[^1]: Esta es la explicacion de la nota."),
      definition: () => insertAtCursor("Termino\n: Definicion breve del termino."),
      mermaid: () => insertAtCursor("```mermaid\ngraph TD\n  A[Idea] --> B[Documento]\n  B --> C[Markdown]\n```"),
    };
    actions[format]?.();
  };

  const runFormatShortcut = (format) => {
    applyFormat(format);
    showButtonFeedback(getFormatButton(format));
  };

  const getCurrentHeadingSectionIndex = () => {
    const editor = getEditor();
    const cursor = editor.state.selection.main.head;
    const sections = getHeadingSections(getMarkdown());
    const index = sections.findIndex((section) => cursor >= section.start && cursor <= section.end);
    return { sections, index };
  };

  const getCurrentSectionNoteContext = () => {
    const { sections, index } = getCurrentHeadingSectionIndex();
    if (index < 0 || !sections[index]) return null;
    const keys = getHeadingSectionKeys(sections, slugify);
    const key = keys[index];
    const notes = getBlockNotesMap(getActiveDocumentId());
    return {
      section: sections[index],
      index,
      key,
      note: notes[key] || "",
    };
  };

  const moveCurrentHeadingSection = (direction) => {
    const { sections, index } = getCurrentHeadingSectionIndex();
    if (index < 0) return;
    const targetIndex = index + direction;
    if (!sections[targetIndex]) return;
    moveHeadingSection(index, targetIndex);
    const nextSections = getHeadingSections(getMarkdown());
    const nextSection = nextSections[targetIndex];
    if (nextSection) focusHeadingInEditor(nextSection.start);
  };

  const editSectionNote = ({ section, key }) => {
    const notes = getBlockNotesMap(getActiveDocumentId());
    const current = notes[key] || "";
    const answer = window.prompt(`Nota interna para "${section.text}"`, current);
    if (answer === null) return;
    const next = answer.trim();
    if (next) notes[key] = next;
    else delete notes[key];
    setBlockNotesMap(getActiveDocumentId(), notes);
    renderNotes(getMarkdown());
    renderOutline(getMarkdown(), getEditor().state);
  };

  const editCurrentSectionNote = () => {
    const context = getCurrentSectionNoteContext();
    if (!context) {
      window.alert("Agrega un titulo y coloca el cursor dentro de esa seccion para guardar una nota interna.");
      return;
    }
    editSectionNote(context);
  };

  return {
    insertAtCursor,
    wrapSelection,
    applyFormat,
    runFormatShortcut,
    moveCurrentHeadingSection,
    editSectionNote,
    editCurrentSectionNote,
  };
};
