export const createSlashMenuController = ({
  menu,
  list,
  preview,
  getEditor,
  getCommands,
  renderPreviewHtml,
  onActionCommand,
  onInsertCommand,
}) => {
  let state = {
    active: false,
    start: 0,
    end: 0,
    selected: 0,
    query: "",
    items: [],
  };

  const getState = () => state;
  const isActive = () => state.active;

  const getSlashMatch = () => {
    const editor = getEditor();
    const cursor = editor.state.selection.main.head;
    const line = editor.state.doc.lineAt(cursor);
    const before = editor.state.doc.sliceString(line.from, cursor);
    const match = before.match(/^\/([a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s-]*)$/);
    if (!match) return null;
    return { start: line.from, end: cursor, query: match[1].trim().toLowerCase() };
  };

  const getCommandMatches = (query) => {
    const commands = getCommands();
    return query
      ? commands.filter((command) => `${command.title} ${command.hint} ${command.keywords}`.toLowerCase().includes(query))
      : commands;
  };

  const renderPreview = () => {
    const activeCommand = state.items[state.selected];
    preview.replaceChildren();
    const title = document.createElement("strong");
    title.textContent = activeCommand ? activeCommand.title : "Sin resultados";
    preview.appendChild(title);

    if (!activeCommand) {
      const body = document.createElement("p");
      body.textContent = "Prueba con otro termino.";
      preview.appendChild(body);
      return;
    }

    const meta = document.createElement("div");
    meta.className = "slash-preview-meta";
    meta.innerHTML = `<span>${activeCommand.category}</span><kbd>${activeCommand.shortcut}</kbd>`;

    const rendered = document.createElement("div");
    rendered.className = "slash-preview-rendered";
    renderPreviewHtml(rendered, activeCommand.preview);

    const snippetLabel = document.createElement("span");
    snippetLabel.className = "slash-preview-label";
    snippetLabel.textContent = "Markdown";

    const snippet = document.createElement("pre");
    snippet.className = "slash-preview-code";
    snippet.textContent = activeCommand.preview;
    preview.append(meta, rendered, snippetLabel, snippet);
  };

  const updateSelection = (index) => {
    state.selected = index;
    [...list.children].forEach((item, itemIndex) => {
      item.classList.toggle("is-selected", itemIndex === state.selected);
      if (itemIndex === state.selected && typeof item.scrollIntoView === "function") {
        item.scrollIntoView({ block: "nearest" });
      }
    });
    renderPreview();
  };

  const executeCommand = (selectedCommand) => {
    const command = selectedCommand || state.items[state.selected];
    if (!command) return;
    if (command.mode === "action") {
      onActionCommand({ command, start: state.start, end: state.end });
      close();
      return;
    }
    onInsertCommand({ command, start: state.start, end: state.end });
    close();
  };

  const renderMenu = () => {
    list.replaceChildren();

    state.items.forEach((command, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = index === state.selected ? "slash-item is-selected" : "slash-item";
      const header = document.createElement("span");
      header.className = "slash-item-header";
      const title = document.createElement("span");
      title.textContent = command.title;
      const category = document.createElement("em");
      category.textContent = command.category;
      header.append(title, category);
      const hint = document.createElement("small");
      hint.textContent = command.hint;
      const shortcut = document.createElement("kbd");
      shortcut.textContent = command.shortcut;
      shortcut.className = "slash-item-shortcut";
      button.append(header, hint, shortcut);
      button.addEventListener("mouseenter", () => updateSelection(index));
      button.addEventListener("pointerdown", (event) => {
        if (event.pointerType === "mouse") {
          event.preventDefault();
        }
        updateSelection(index);
      });
      button.addEventListener("click", (event) => {
        event.preventDefault();
        updateSelection(index);
        executeCommand(command);
      });
      list.appendChild(button);
    });

    const footer = document.createElement("div");
    footer.className = "slash-footer";
    footer.innerHTML = "<span>Enter para insertar</span><span>↑ ↓ para navegar</span><span>Esc para cerrar</span>";
    list.appendChild(footer);

    renderPreview();
  };

  const position = () => {
    const editor = getEditor();
    const cursor = editor.state.selection.main.head;
    const coords = editor.coordsAtPos(cursor);
    const panel = document.querySelector(".editor-panel").getBoundingClientRect();
    if (!coords) return;
    menu.style.left = `${Math.max(14, Math.min(coords.left - panel.left, panel.width - 454))}px`;
    menu.style.top = `${Math.max(52, Math.min(coords.bottom - panel.top + 8, panel.height - 310))}px`;
  };

  const open = (match) => {
    state = {
      active: true,
      start: match.start,
      end: match.end,
      selected: 0,
      query: match.query,
      items: getCommandMatches(match.query),
    };
    menu.hidden = false;
    position();
    renderMenu();
  };

  const close = () => {
    state.active = false;
    menu.hidden = true;
  };

  const update = () => {
    const match = getSlashMatch();
    if (!match) {
      close();
      return;
    }
    open(match);
  };

  return {
    getState,
    isActive,
    updateSelection,
    executeCommand,
    position,
    close,
    update,
  };
};
