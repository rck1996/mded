export const renderOutlinePanel = ({
  markdown,
  container,
  preview,
  editorState,
  headings,
  noteKeys,
  notes,
  isHeadingFolded,
  slugify,
  onFocusHeading,
  onMoveHeading,
  onToggleHeadingFold,
  onEditSectionNote,
}) => {
  container.innerHTML = headings.length ? "" : '<p class="empty-state">Todavia no hay titulos. Agrega encabezados para navegar mejor el documento.</p>';

  headings.forEach((heading) => {
    const noteKey = noteKeys[heading.index];
    const note = notes[noteKey] || "";
    const lineFrom = editorState ? editorState.doc.lineAt(heading.start).from : heading.start;
    const row = document.createElement("div");
    row.className = editorState && isHeadingFolded(editorState, lineFrom) ? "outline-row is-folded" : "outline-row";
    if (note) row.classList.add("has-note");
    row.style.setProperty("--level", heading.level);

    const button = document.createElement("button");
    button.type = "button";
    button.className = "outline-item";
    button.textContent = heading.text;
    button.draggable = true;
    button.dataset.index = String(heading.index);
    button.addEventListener("click", () => {
      onFocusHeading(heading.start);
      preview.querySelector(`#${slugify(heading.text)}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    button.addEventListener("dragstart", (event) => {
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("application/json", JSON.stringify({ type: "outline", index: heading.index }));
    });

    row.addEventListener("dragover", (event) => {
      event.preventDefault();
      row.classList.add("is-drop-target");
    });
    row.addEventListener("dragleave", () => {
      row.classList.remove("is-drop-target");
    });
    row.addEventListener("drop", (event) => {
      event.preventDefault();
      row.classList.remove("is-drop-target");
      try {
        const payload = JSON.parse(event.dataTransfer.getData("application/json"));
        if (payload?.type === "outline") onMoveHeading(payload.index, heading.index);
      } catch {
        // Ignore malformed drag payloads.
      }
    });

    const toggleButton = document.createElement("button");
    toggleButton.type = "button";
    toggleButton.className = "outline-toggle";
    toggleButton.setAttribute("aria-label", `Plegar o abrir ${heading.text}`);
    toggleButton.textContent = row.classList.contains("is-folded") ? "+" : "−";
    toggleButton.addEventListener("click", (event) => {
      event.stopPropagation();
      onToggleHeadingFold(heading.start);
    });

    const noteButton = document.createElement("button");
    noteButton.type = "button";
    noteButton.className = "outline-note";
    noteButton.setAttribute("aria-label", note ? `Editar nota interna de ${heading.text}` : `Agregar nota interna a ${heading.text}`);
    noteButton.title = note ? "Editar nota interna" : "Agregar nota interna";
    noteButton.textContent = note ? "N" : "+";
    noteButton.addEventListener("click", (event) => {
      event.stopPropagation();
      onEditSectionNote({ section: heading, key: noteKey });
    });

    row.append(button, noteButton, toggleButton);
    container.appendChild(row);
  });
};
