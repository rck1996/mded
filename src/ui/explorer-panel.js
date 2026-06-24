import { escapeHtml } from "../domain/markdown.js";

export const renderExplorerPanel = ({
  container,
  query,
  explorerFilter,
  folders,
  foldersById,
  deletedFolders,
  collapsedFolders,
  documents,
  archivedDocuments,
  deletedDocuments,
  visibleDocuments,
  recentDocuments,
  activeDocumentId,
  activeFolderId,
  defaultFolderId,
  explorerEditState,
  compareByOrder,
  formatRelativeDocumentTime,
  getDocumentFolderId,
  onSetExplorerEditState,
  onRender,
  onOpenDocument,
  onReorderDocuments,
  onRenameDocument,
  onSaveSnapshot,
  onOpenHistory,
  onDuplicateDocument,
  onApplyTemplateToDocument,
  onToggleFavoriteDocument,
  onArchiveDocument,
  onDeleteDocument,
  onMoveDocumentToFolder,
  onReorderFolders,
  onToggleFolderCollapsed,
  onRenameFolder,
  onCreateDocumentInFolder,
  onCreateTemplateDocumentInFolder,
  onDeleteFolder,
  onRestoreFolder,
  onPurgeFolder,
  onRestoreDocument,
  onPurgeDocument,
  onRestoreArchivedDocument,
  onOpenArchivedDocument,
}) => {
  container.replaceChildren();

  const parsePayload = (event) => {
    try {
      return JSON.parse(event.dataTransfer.getData("application/json"));
    } catch {
      return null;
    }
  };

  const attachDropState = (element) => {
    element.addEventListener("dragover", (event) => {
      event.preventDefault();
      element.classList.add("is-drop-target");
    });
    element.addEventListener("dragleave", () => {
      element.classList.remove("is-drop-target");
    });
    element.addEventListener("drop", () => {
      element.classList.remove("is-drop-target");
    });
  };

  const createInlineRename = ({ value, submitText, onSubmit, onCancel }) => {
    const form = document.createElement("form");
    form.className = "inline-rename";
    const input = document.createElement("input");
    input.type = "text";
    input.value = value;
    input.setAttribute("aria-label", "Renombrar");
    const save = document.createElement("button");
    save.type = "submit";
    save.textContent = submitText;
    const cancel = document.createElement("button");
    cancel.type = "button";
    cancel.textContent = "Cancelar";
    cancel.addEventListener("click", () => {
      onSetExplorerEditState(null);
      onCancel?.();
      onRender();
    });
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const nextValue = input.value.trim();
      if (!nextValue) return;
      onSetExplorerEditState(null);
      onSubmit(nextValue);
      onRender();
    });
    form.append(input, save, cancel);
    queueMicrotask(() => input.focus());
    return form;
  };

  const createDocumentRow = (doc) => {
    const row = document.createElement("div");
    row.className = doc.id === activeDocumentId ? "document-row is-active" : "document-row";
    row.draggable = true;
    row.dataset.documentId = doc.id;
    row.addEventListener("dragstart", (event) => {
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("application/json", JSON.stringify({ type: "document", id: doc.id }));
    });
    attachDropState(row);
    row.addEventListener("drop", (event) => {
      event.preventDefault();
      const payload = parsePayload(event);
      if (payload?.type === "document") {
        onReorderDocuments(payload.id, doc.id);
        onRender();
      }
    });

    if (explorerEditState?.type === "document" && explorerEditState.id === doc.id) {
      row.appendChild(
        createInlineRename({
          value: doc.title,
          submitText: "Guardar",
          onSubmit: (title) => onRenameDocument(doc.id, title),
        }),
      );
    } else {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "document-item";
      const icon = document.createElement("span");
      icon.className = "document-icon";
      icon.textContent = "MD";
      const meta = document.createElement("span");
      meta.className = "document-meta";
      const titleRow = document.createElement("span");
      titleRow.className = "document-title-row";
      const title = document.createElement("span");
      title.className = "document-title";
      title.textContent = doc.title;
      titleRow.appendChild(title);
      if (doc.favorite) {
        const favoriteTag = document.createElement("span");
        favoriteTag.className = "document-favorite";
        favoriteTag.textContent = "★";
        favoriteTag.setAttribute("aria-label", "Favorito");
        titleRow.appendChild(favoriteTag);
      }
      const date = document.createElement("small");
      date.textContent = `${foldersById.get(getDocumentFolderId(doc))?.name || "General"} · ${formatRelativeDocumentTime(doc.updatedAt)}`;
      meta.append(titleRow, date);
      button.append(icon, meta);
      button.addEventListener("click", () => onOpenDocument(doc));
      row.appendChild(button);
    }

    const actions = document.createElement("details");
    actions.className = "document-actions-inline document-menu";
    const actionsSummary = document.createElement("summary");
    actionsSummary.setAttribute("aria-label", `Acciones de ${doc.title}`);
    actionsSummary.textContent = "⋯";
    const actionsContent = document.createElement("div");
    actionsContent.className = "document-menu-content";

    const rename = document.createElement("button");
    rename.type = "button";
    rename.textContent = "Renombrar";
    rename.addEventListener("click", () => {
      actions.open = false;
      onSetExplorerEditState({ type: "document", id: doc.id });
      onRender();
    });

    const saveSnapshot = document.createElement("button");
    saveSnapshot.type = "button";
    saveSnapshot.textContent = "Guardar version";
    saveSnapshot.addEventListener("click", () => {
      actions.open = false;
      onSaveSnapshot(doc);
      onRender();
    });

    const history = document.createElement("button");
    history.type = "button";
    history.textContent = "Historial";
    history.addEventListener("click", () => {
      actions.open = false;
      onOpenHistory(doc.id);
    });

    const duplicate = document.createElement("button");
    duplicate.type = "button";
    duplicate.textContent = "Duplicar";
    duplicate.addEventListener("click", () => onDuplicateDocument(doc));

    const templateAction = document.createElement("button");
    templateAction.type = "button";
    templateAction.textContent = "Aplicar plantilla";
    templateAction.addEventListener("click", () => {
      actions.open = false;
      onApplyTemplateToDocument(doc);
    });

    const favorite = document.createElement("button");
    favorite.type = "button";
    favorite.textContent = doc.favorite ? "Quitar de favoritos" : "Marcar favorito";
    favorite.addEventListener("click", () => {
      actions.open = false;
      onToggleFavoriteDocument(doc);
      onRender();
    });

    const archive = document.createElement("button");
    archive.type = "button";
    archive.textContent = "Archivar";
    archive.addEventListener("click", () => {
      actions.open = false;
      onArchiveDocument(doc.id);
      onRender();
    });

    const remove = document.createElement("button");
    remove.type = "button";
    remove.textContent = "Eliminar";
    remove.addEventListener("click", () => {
      actions.open = false;
      onDeleteDocument(doc.id);
      onRender();
    });

    const moveHeading = document.createElement("span");
    moveHeading.textContent = "Mover a";
    const moveTargets = folders.filter((folder) => folder.id !== getDocumentFolderId(doc));
    const moveButtons = moveTargets.map((folder) => {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = folder.name;
      button.addEventListener("click", () => {
        actions.open = false;
        onMoveDocumentToFolder(doc, folder.id);
        onRender();
      });
      return button;
    });

    actionsContent.append(rename, saveSnapshot, history, duplicate, templateAction, favorite, archive, moveHeading, ...moveButtons, remove);
    actions.append(actionsSummary, actionsContent);
    row.append(actions);
    return row;
  };

  if (!query && explorerFilter === "all" && recentDocuments.length) {
    const recentGroup = document.createElement("section");
    recentGroup.className = "explorer-section explorer-recent";
    const header = document.createElement("div");
    header.className = "explorer-section-header";
    header.innerHTML = "<strong>Recientes</strong><span>Actividad reciente</span>";
    recentGroup.appendChild(header);
    recentDocuments.slice(0, 4).forEach((doc) => recentGroup.appendChild(createDocumentRow(doc)));
    container.appendChild(recentGroup);
  }

  folders.forEach((folder) => {
    const folderDocuments = visibleDocuments
      .filter((doc) => getDocumentFolderId(doc) === folder.id)
      .sort(explorerFilter === "recent" ? (a, b) => (b.updatedAt || 0) - (a.updatedAt || 0) : compareByOrder);
    const hasDocuments = folderDocuments.length > 0;
    if (query && !hasDocuments) return;
    if (explorerFilter === "favorites" && !hasDocuments) return;
    if (explorerFilter === "recent" && !hasDocuments) return;

    const group = document.createElement("section");
    group.className = "folder-group";
    if (folder.id === activeFolderId) group.classList.add("is-active-folder");

    const header = document.createElement("div");
    header.className = "folder-row";
    header.draggable = folder.id !== defaultFolderId;
    header.dataset.folderId = folder.id;
    if (folder.id !== defaultFolderId) {
      header.addEventListener("dragstart", (event) => {
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("application/json", JSON.stringify({ type: "folder", id: folder.id }));
      });
    }
    attachDropState(header);
    header.addEventListener("drop", (event) => {
      event.preventDefault();
      const payload = parsePayload(event);
      if (payload?.type === "document") {
        onMoveDocumentToFolder({ id: payload.id }, folder.id);
        onRender();
      }
      if (payload?.type === "folder") {
        onReorderFolders(payload.id, folder.id);
        onRender();
      }
    });

    const isCollapsed = !query && collapsedFolders[folder.id];
    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "folder-toggle";
    toggle.setAttribute("aria-expanded", String(!isCollapsed));
    toggle.textContent = isCollapsed ? ">" : "v";
    toggle.addEventListener("click", () => onToggleFolderCollapsed(folder.id, collapsedFolders));

    const editingFolder = explorerEditState?.type === "folder" && explorerEditState.id === folder.id;
    const label = document.createElement(editingFolder ? "div" : "button");
    if (!editingFolder) label.type = "button";
    label.className = "folder-label";
    if (!editingFolder) label.addEventListener("click", () => onToggleFolderCollapsed(folder.id, collapsedFolders));

    const folderIcon = document.createElement("span");
    folderIcon.className = "folder-icon";
    folderIcon.textContent = "DIR";
    if (editingFolder) {
      const folderMeta = document.createElement("span");
      folderMeta.className = "folder-meta";
      folderMeta.appendChild(
        createInlineRename({
          value: folder.name,
          submitText: "Guardar",
          onSubmit: (name) => onRenameFolder(folder.id, name),
        }),
      );
      label.append(folderIcon, folderMeta);
    } else {
      const name = document.createElement("span");
      name.textContent = folder.name;
      const count = document.createElement("small");
      count.textContent = `${folderDocuments.length} ${folderDocuments.length === 1 ? "documento" : "documentos"}`;
      const folderMeta = document.createElement("span");
      folderMeta.className = "folder-meta";
      folderMeta.append(name, count);
      label.append(folderIcon, folderMeta);
    }

    const folderActions = document.createElement("details");
    folderActions.className = "folder-actions folder-menu";
    const folderSummary = document.createElement("summary");
    folderSummary.setAttribute("aria-label", `Acciones de carpeta ${folder.name}`);
    folderSummary.textContent = "⋯";
    const folderMenuContent = document.createElement("div");
    folderMenuContent.className = "folder-menu-content";

    const addDocument = document.createElement("button");
    addDocument.type = "button";
    addDocument.textContent = "Nuevo documento";
    addDocument.title = "Nuevo documento en esta carpeta";
    addDocument.addEventListener("click", () => onCreateDocumentInFolder(folder.id));

    const addTemplateDocument = document.createElement("button");
    addTemplateDocument.type = "button";
    addTemplateDocument.textContent = "Nuevo desde plantilla";
    addTemplateDocument.addEventListener("click", () => {
      folderActions.open = false;
      onCreateTemplateDocumentInFolder(folder.id);
    });

    const renameFolder = document.createElement("button");
    renameFolder.type = "button";
    renameFolder.textContent = "Renombrar";
    renameFolder.disabled = folder.id === defaultFolderId;
    renameFolder.addEventListener("click", () => {
      folderActions.open = false;
      onSetExplorerEditState({ type: "folder", id: folder.id });
      onRender();
    });

    const deleteFolderButton = document.createElement("button");
    deleteFolderButton.type = "button";
    deleteFolderButton.textContent = "Eliminar carpeta";
    deleteFolderButton.disabled = folder.id === defaultFolderId;
    deleteFolderButton.addEventListener("click", () => {
      folderActions.open = false;
      onDeleteFolder(folder.id);
      onRender();
    });

    folderMenuContent.append(addDocument, addTemplateDocument, renameFolder, deleteFolderButton);
    folderActions.append(folderSummary, folderMenuContent);
    header.append(toggle, label, folderActions);
    group.appendChild(header);

    if (!isCollapsed) {
      const folderBody = document.createElement("div");
      folderBody.className = "folder-documents";
      if (hasDocuments) {
        folderDocuments.forEach((doc) => folderBody.appendChild(createDocumentRow(doc)));
      } else {
        const empty = document.createElement("p");
        empty.className = "folder-empty";
        empty.textContent = "Esta carpeta esta vacia por ahora.";
        folderBody.appendChild(empty);
      }
      group.appendChild(folderBody);
    }

    container.appendChild(group);
  });

  if (!visibleDocuments.length && !folders.length) {
    const empty = document.createElement("p");
    empty.className = "empty-state";
    empty.textContent = query
      ? "No encontre documentos con esa busqueda. Prueba otro nombre o cambia el filtro."
      : "Todavia no tienes documentos. Crea uno nuevo o usa una plantilla para empezar.";
    container.appendChild(empty);
  } else if (!visibleDocuments.length) {
    const empty = document.createElement("p");
    empty.className = "empty-state";
    empty.textContent =
      explorerFilter === "favorites"
        ? "Todavia no has marcado favoritos."
        : explorerFilter === "recent"
          ? "No hay actividad reciente por aqui."
          : "No encontre documentos con esa busqueda.";
    container.appendChild(empty);
  }

  if (deletedDocuments.length || deletedFolders.length) {
    const trash = document.createElement("section");
    trash.className = "trash-group";
    const heading = document.createElement("div");
    heading.className = "trash-header";
    const title = document.createElement("strong");
    title.textContent = "Papelera";
    const meta = document.createElement("span");
    meta.textContent = `${deletedDocuments.length + deletedFolders.length} elementos`;
    heading.append(title, meta);
    trash.appendChild(heading);

    deletedFolders.forEach((folder) => {
      const row = document.createElement("div");
      row.className = "trash-row";
      const label = document.createElement("div");
      label.className = "trash-meta";
      label.innerHTML = `<strong>${escapeHtml(folder.name)}</strong><span>Carpeta eliminada</span>`;
      const actions = document.createElement("div");
      actions.className = "trash-actions";
      const restore = document.createElement("button");
      restore.type = "button";
      restore.textContent = "Restaurar";
      restore.addEventListener("click", () => {
        onRestoreFolder(folder.id);
        onRender();
      });
      const purge = document.createElement("button");
      purge.type = "button";
      purge.textContent = "Borrar";
      purge.addEventListener("click", () => {
        onPurgeFolder(folder.id);
        onRender();
      });
      actions.append(restore, purge);
      row.append(label, actions);
      trash.appendChild(row);
    });

    deletedDocuments.forEach((doc) => {
      const row = document.createElement("div");
      row.className = "trash-row";
      const label = document.createElement("div");
      label.className = "trash-meta";
      label.innerHTML = `<strong>${escapeHtml(doc.title)}</strong><span>${new Date(doc.deletedAt).toLocaleString()}</span>`;
      const actions = document.createElement("div");
      actions.className = "trash-actions";
      const restore = document.createElement("button");
      restore.type = "button";
      restore.textContent = "Restaurar";
      restore.addEventListener("click", () => {
        onRestoreDocument(doc.id);
        onRender();
      });
      const purge = document.createElement("button");
      purge.type = "button";
      purge.textContent = "Borrar";
      purge.addEventListener("click", () => {
        onPurgeDocument(doc.id);
        onRender();
      });
      actions.append(restore, purge);
      row.append(label, actions);
      trash.appendChild(row);
    });

    container.appendChild(trash);
  }

  if (archivedDocuments.length) {
    const archiveGroup = document.createElement("section");
    archiveGroup.className = "trash-group archive-group";
    const heading = document.createElement("div");
    heading.className = "trash-header";
    const title = document.createElement("strong");
    title.textContent = "Archivados";
    const meta = document.createElement("span");
    meta.textContent = `${archivedDocuments.length} documentos`;
    heading.append(title, meta);
    archiveGroup.appendChild(heading);

    archivedDocuments.forEach((doc) => {
      const row = document.createElement("div");
      row.className = "trash-row";
      const label = document.createElement("div");
      label.className = "trash-meta";
      label.innerHTML = `<strong>${escapeHtml(doc.title)}</strong><span>${foldersById.get(getDocumentFolderId(doc))?.name || "General"} · ${formatRelativeDocumentTime(doc.archivedAt || doc.updatedAt)}</span>`;
      const actions = document.createElement("div");
      actions.className = "trash-actions";
      const restore = document.createElement("button");
      restore.type = "button";
      restore.textContent = "Restaurar";
      restore.addEventListener("click", () => {
        onRestoreArchivedDocument(doc.id);
        onRender();
      });
      const open = document.createElement("button");
      open.type = "button";
      open.textContent = "Abrir";
      open.addEventListener("click", () => {
        onOpenArchivedDocument(doc.id);
        onRender();
      });
      actions.append(restore, open);
      row.append(label, actions);
      archiveGroup.appendChild(row);
    });

    container.appendChild(archiveGroup);
  }
};
