export const renderHistoryPanelView = ({
  target,
  activeSnapshotId,
  historyList,
  historyPreview,
  onSelectSnapshot,
  onSaveCurrentSnapshot,
  onRestoreSnapshot,
}) => {
  historyList.replaceChildren();
  historyPreview.replaceChildren();

  if (!target) {
    historyPreview.innerHTML = '<p class="empty-state">Todavia no hay versiones guardadas para este documento.</p>';
    return;
  }

  const snapshots = [...target.history].sort((a, b) => b.createdAt - a.createdAt);

  snapshots.forEach((snapshot) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = snapshot.id === activeSnapshotId ? "history-item is-selected" : "history-item";
    const title = document.createElement("strong");
    title.textContent = snapshot.title || target.title;
    const meta = document.createElement("span");
    meta.textContent = `${new Date(snapshot.createdAt).toLocaleString()} · ${snapshot.reason === "manual" ? "manual" : "auto"}`;
    button.append(title, meta);
    button.addEventListener("click", () => onSelectSnapshot(snapshot.id));
    historyList.appendChild(button);
  });

  const selected = snapshots.find((snapshot) => snapshot.id === activeSnapshotId);
  if (!selected) {
    historyPreview.innerHTML = '<p class="empty-state">Todavia no hay versiones guardadas para este documento.</p>';
    return;
  }

  const toolbar = document.createElement("div");
  toolbar.className = "history-preview-toolbar";
  const meta = document.createElement("span");
  meta.textContent = `${new Date(selected.createdAt).toLocaleString()} · ${selected.markdown.length} caracteres`;
  const actions = document.createElement("div");

  const saveSnapshotButton = document.createElement("button");
  saveSnapshotButton.type = "button";
  saveSnapshotButton.className = "panel-toggle";
  saveSnapshotButton.textContent = "Guardar version actual";
  saveSnapshotButton.addEventListener("click", onSaveCurrentSnapshot);

  const restoreButton = document.createElement("button");
  restoreButton.type = "button";
  restoreButton.className = "panel-toggle";
  restoreButton.textContent = "Restaurar";
  restoreButton.addEventListener("click", () => onRestoreSnapshot(selected));

  actions.append(saveSnapshotButton, restoreButton);
  toolbar.append(meta, actions);

  const previewContent = document.createElement("pre");
  previewContent.className = "history-preview-code";
  previewContent.textContent = selected.markdown;

  historyPreview.append(toolbar, previewContent);
};
