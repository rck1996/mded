export const renderNotesPanel = ({
  container,
  entries,
  onFocusHeading,
  onEditNote,
  onRemoveNote,
}) => {
  container.innerHTML = entries.length ? "" : '<p class="empty-state">Aun no hay notas internas en este documento.</p>';

  entries.forEach(({ section, key, note }) => {
    const item = document.createElement("div");
    item.className = "note-item";

    const content = document.createElement("button");
    content.type = "button";
    content.className = "note-content";
    content.addEventListener("click", () => onFocusHeading(section.start));

    const title = document.createElement("strong");
    title.textContent = section.text;
    const body = document.createElement("span");
    body.textContent = note;
    content.append(title, body);

    const actions = document.createElement("div");
    actions.className = "note-actions";

    const edit = document.createElement("button");
    edit.type = "button";
    edit.className = "panel-toggle";
    edit.textContent = "Editar";
    edit.addEventListener("click", () => onEditNote({ section, key }));

    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "panel-toggle";
    remove.textContent = "Quitar";
    remove.addEventListener("click", () => onRemoveNote(key));

    actions.append(edit, remove);
    item.append(content, actions);
    container.appendChild(item);
  });
};
