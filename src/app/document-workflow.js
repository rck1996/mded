export const createDocumentWorkflow = ({
  documentTemplates,
  defaultMarkdown,
  defaultFolderId,
  activeDocumentKey,
  getActiveFolderId,
  setActiveFolderId,
  getActiveDocument,
  createBlankDocument,
  createDocumentFromTemplateEntity,
  getDocuments,
  setDocuments,
  getFolders,
  setFolders,
  getVisibleFolders,
  getDocumentFolderId,
  compareByOrder,
  clearBlockNotesForDocuments,
  storageSet,
  getHistoryState,
  setHistoryVisible,
  setMarkdown,
  renderDocuments,
  onActiveDocumentChange,
}) => {
  const getTemplateById = (templateId) => documentTemplates.find((template) => template.id === templateId) || documentTemplates[0];

  const createDocumentFromTemplate = (templateId, folderId = getActiveFolderId()) => {
    const template = getTemplateById(templateId);
    return createDocumentFromTemplateEntity(template, defaultMarkdown, folderId);
  };

  const promptTemplateSelection = () => {
    const message = documentTemplates.map((template, index) => `${index + 1}. ${template.label}`).join("\n");
    const answer = window.prompt(`Elige una plantilla:\n${message}`, "1")?.trim();
    if (!answer) return null;
    const numericIndex = Number(answer) - 1;
    if (Number.isInteger(numericIndex) && documentTemplates[numericIndex]) return documentTemplates[numericIndex];
    return documentTemplates.find((template) => template.id === answer.toLowerCase()) || null;
  };

  const openDocumentInEditor = (doc) => {
    onActiveDocumentChange(doc.id);
    storageSet(activeDocumentKey, doc.id);
    setActiveFolderId(getDocumentFolderId(doc));
    setMarkdown(doc.markdown);
    renderDocuments();
  };

  const ensureActiveDocument = () => {
    const active = getActiveDocument(defaultMarkdown);
    if (!active) {
      const fallback = createBlankDocument(defaultMarkdown, defaultFolderId);
      setDocuments([fallback, ...getDocuments(defaultMarkdown)]);
      onActiveDocumentChange(fallback.id);
      storageSet(activeDocumentKey, fallback.id);
      setMarkdown(fallback.markdown);
      setActiveFolderId(defaultFolderId);
      return fallback;
    }

    onActiveDocumentChange(active.id);
    storageSet(activeDocumentKey, active.id);
    return active;
  };

  const spawnDocumentFromTemplate = (folderId = getActiveFolderId(), templateId = null) => {
    const template = templateId ? getTemplateById(templateId) : promptTemplateSelection();
    if (!template) return null;
    const doc = createDocumentFromTemplate(template.id, folderId);
    setDocuments([...getDocuments(defaultMarkdown), doc]);
    openDocumentInEditor(doc);
    return doc;
  };

  const permanentlyDeleteDocument = (documentId) => {
    if (getHistoryState().documentId === documentId) setHistoryVisible(null);
    clearBlockNotesForDocuments([documentId]);
    const remaining = getDocuments(defaultMarkdown).filter((doc) => doc.id !== documentId);
    setDocuments(remaining.length ? remaining : [createBlankDocument(defaultMarkdown, defaultFolderId)]);
    if (getActiveDocument(defaultMarkdown)?.id === documentId) {
      const nextActive = ensureActiveDocument();
      setMarkdown(nextActive.markdown);
    }
  };

  const deleteDocument = (documentId) => {
    if (getHistoryState().documentId === documentId) setHistoryVisible(null);
    const timestamp = Date.now();
    setDocuments(
      getDocuments(defaultMarkdown).map((doc) =>
        doc.id === documentId
          ? {
              ...doc,
              deletedAt: timestamp,
            }
          : doc,
      ),
    );
    if (getActiveDocument(defaultMarkdown)?.id === documentId) {
      const nextActive = ensureActiveDocument();
      setMarkdown(nextActive.markdown);
    }
  };

  const restoreDocument = (documentId) => {
    setDocuments(
      getDocuments(defaultMarkdown).map((doc) =>
        doc.id === documentId
          ? {
              ...doc,
              deletedAt: null,
            }
          : doc,
      ),
    );
  };

  const archiveDocument = (documentId) => {
    setDocuments(
      getDocuments(defaultMarkdown).map((doc) =>
        doc.id === documentId
          ? {
              ...doc,
              archivedAt: Date.now(),
              updatedAt: Date.now(),
            }
          : doc,
      ),
    );
    if (getActiveDocument(defaultMarkdown)?.id === documentId) {
      const nextActive = ensureActiveDocument();
      if (nextActive) setMarkdown(nextActive.markdown);
    }
  };

  const restoreArchivedDocument = (documentId) => {
    setDocuments(
      getDocuments(defaultMarkdown).map((doc) =>
        doc.id === documentId
          ? {
              ...doc,
              archivedAt: null,
              updatedAt: Date.now(),
            }
          : doc,
      ),
    );
  };

  const permanentlyDeleteFolder = (folderId) => {
    if (folderId === defaultFolderId) return;
    if (
      getHistoryState().documentId &&
      getDocuments(defaultMarkdown).some((doc) => doc.id === getHistoryState().documentId && getDocumentFolderId(doc) === folderId)
    ) {
      setHistoryVisible(null);
    }
    clearBlockNotesForDocuments(
      getDocuments(defaultMarkdown)
        .filter((doc) => getDocumentFolderId(doc) === folderId)
        .map((doc) => doc.id),
    );
    setFolders(getFolders().filter((folder) => folder.id !== folderId));
    setDocuments(getDocuments(defaultMarkdown).filter((doc) => getDocumentFolderId(doc) !== folderId));
    ensureActiveDocument();
  };

  const deleteFolder = (folderId) => {
    if (folderId === defaultFolderId) return;
    if (
      getHistoryState().documentId &&
      getDocuments(defaultMarkdown).some((doc) => doc.id === getHistoryState().documentId && getDocumentFolderId(doc) === folderId)
    ) {
      setHistoryVisible(null);
    }
    const timestamp = Date.now();
    setFolders(
      getFolders().map((folder) =>
        folder.id === folderId
          ? {
              ...folder,
              deletedAt: timestamp,
            }
          : folder,
      ),
    );
    setDocuments(
      getDocuments(defaultMarkdown).map((doc) =>
        getDocumentFolderId(doc) === folderId
          ? {
              ...doc,
              deletedAt: timestamp,
            }
          : doc,
      ),
    );
    if (getActiveFolderId() === folderId) setActiveFolderId(defaultFolderId);
    ensureActiveDocument();
  };

  const restoreFolder = (folderId) => {
    setFolders(
      getFolders().map((folder) =>
        folder.id === folderId
          ? {
              ...folder,
              deletedAt: null,
            }
          : folder,
      ),
    );
    setDocuments(
      getDocuments(defaultMarkdown).map((doc) =>
        getDocumentFolderId(doc) === folderId
          ? {
              ...doc,
              deletedAt: null,
            }
          : doc,
      ),
    );
  };

  const moveDocumentToFolder = (documentId, folderId, targetOrder = null) => {
    const documents = getDocuments(defaultMarkdown);
    const visibleInFolder = documents.filter((doc) => !doc.deletedAt && getDocumentFolderId(doc) === folderId && doc.id !== documentId);
    const baseOrder = targetOrder ?? visibleInFolder.length;
    const moved = documents.map((doc) =>
      doc.id === documentId
        ? {
            ...doc,
            folderId,
            order: baseOrder,
            updatedAt: Date.now(),
          }
        : doc,
    );

    const normalized = moved.map((doc) => {
      if (doc.deletedAt) return doc;
      const siblings = moved
        .filter((item) => !item.deletedAt && getDocumentFolderId(item) === getDocumentFolderId(doc))
        .sort(compareByOrder);
      const nextOrder = siblings.findIndex((item) => item.id === doc.id);
      return { ...doc, order: nextOrder < 0 ? doc.order : nextOrder };
    });

    setDocuments(normalized);
  };

  const reorderFolders = (sourceId, targetId) => {
    if (sourceId === targetId || sourceId === defaultFolderId || targetId === defaultFolderId) return;
    const folders = getVisibleFolders();
    const sourceIndex = folders.findIndex((folder) => folder.id === sourceId);
    const targetIndex = folders.findIndex((folder) => folder.id === targetId);
    if (sourceIndex < 0 || targetIndex < 0) return;
    const next = [...folders];
    const [moved] = next.splice(sourceIndex, 1);
    next.splice(targetIndex, 0, moved);
    setFolders([getFolders().find((folder) => folder.id === defaultFolderId), ...next].filter(Boolean));
  };

  const reorderDocuments = (sourceId, targetId) => {
    if (sourceId === targetId) return;
    const documents = getDocuments(defaultMarkdown);
    const source = documents.find((doc) => doc.id === sourceId);
    const target = documents.find((doc) => doc.id === targetId);
    if (!source || !target || source.deletedAt || target.deletedAt) return;
    const sourceFolderId = getDocumentFolderId(source);
    const folderId = getDocumentFolderId(target);
    const siblings = documents.filter((doc) => !doc.deletedAt && getDocumentFolderId(doc) === folderId && doc.id !== sourceId).sort(compareByOrder);
    const targetIndex = siblings.findIndex((doc) => doc.id === targetId);
    siblings.splice(targetIndex < 0 ? siblings.length : targetIndex, 0, { ...source, folderId });
    const sourceSiblings = documents
      .filter((doc) => !doc.deletedAt && getDocumentFolderId(doc) === sourceFolderId && doc.id !== sourceId)
      .sort(compareByOrder);
    const updatedTargetIds = new Map(siblings.map((doc, index) => [doc.id, index]));
    const updatedSourceIds = new Map(sourceSiblings.map((doc, index) => [doc.id, index]));
    setDocuments(
      documents.map((doc) => {
        if (updatedTargetIds.has(doc.id)) {
          return {
            ...doc,
            folderId,
            order: updatedTargetIds.get(doc.id),
            updatedAt: doc.id === sourceId ? Date.now() : doc.updatedAt,
          };
        }
        if (updatedSourceIds.has(doc.id)) {
          return {
            ...doc,
            order: updatedSourceIds.get(doc.id),
          };
        }
        return doc;
      }),
    );
  };

  return {
    createDocumentFromTemplate,
    promptTemplateSelection,
    openDocumentInEditor,
    spawnDocumentFromTemplate,
    ensureActiveDocument,
    permanentlyDeleteDocument,
    deleteDocument,
    restoreDocument,
    archiveDocument,
    restoreArchivedDocument,
    permanentlyDeleteFolder,
    deleteFolder,
    restoreFolder,
    moveDocumentToFolder,
    reorderFolders,
    reorderDocuments,
  };
};
