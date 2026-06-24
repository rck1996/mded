import { EditorView } from "codemirror";
import { foldAll, foldedRanges, toggleFold, unfoldAll } from "@codemirror/language";
import { openSearchPanel, search, searchKeymap } from "@codemirror/search";
import { Compartment } from "@codemirror/state";
import { marked } from "marked";
import {
  activeDocumentKey,
  activeFolderKey,
  clearBlockNotesForDocuments,
  collapsedFoldersKey,
  documentsKey,
  explorerFilterKey,
  focusKey,
  foldersKey,
  getBlockNotesMap,
  getPreferences,
  getSortedImageEntries,
  getStoredAssetName,
  getStoredAssetOrder,
  getStoredAssetType,
  getStoredAssetValue,
  getStoredMap,
  getStoredValue,
  imageStoreKey,
  inspectorStorageKey,
  insertPanelStorageKey,
  linkStoreKey,
  noticeStorageKey,
  presentationKey,
  previousViewKey,
  readStoredValue,
  setBlockNotesMap,
  setPreferences,
  setStoredMap,
  sidePanelStorageKey,
  storageGet,
  storageKey,
  storageSet,
  storeValue,
  themeKey,
} from "./storage.js";
import { bindFileActionButtons } from "./file-actions.js";
import {
  buildImageMarkdown,
  countImageReferences,
  getImageAsset,
  getImageAssetCurrent,
  getImageAssetExportEntries,
  removeImageAsset as removeImageAssetEntity,
  renameImageAsset as renameImageAssetEntity,
  reorderImageAsset,
  setImageAssetField,
} from "../domain/assets.js";
import {
  findHeadingSectionByLine,
  getHeadingFoldRange,
  getHeadingSectionKeys,
  getHeadingSections,
  moveHeadingSectionMarkdown,
} from "../domain/outline.js";
import { renderAssetPreview, renderAssetsPanel } from "../ui/assets-panel.js";
import { renderExplorerPanel } from "../ui/explorer-panel.js";
import { renderHistoryPanelView } from "../ui/history-panel.js";
import { renderNotesPanel } from "../ui/notes-panel.js";
import { renderOutlinePanel } from "../ui/outline-panel.js";
import { createSlashMenuController } from "../ui/slash-menu.js";
import { createCodeMirrorEditor } from "../editor/codemirror.js";
import {
  expandStoredTokens,
  getExportHtmlDocument,
  preprocessMarkdown,
  setSafeHtml,
} from "../domain/markdown.js";
import {
  captureSnapshot,
  createBlankDocument,
  createDocumentFromTemplate as createDocumentFromTemplateEntity,
  getActiveDocument,
  getArchivedDocuments,
  getDeletedDocuments,
  getDocumentTitle,
  getDocuments,
  getVisibleDocuments,
  maybeCaptureSnapshot,
  setDocumentField,
  setDocuments,
} from "../domain/documents.js";
import {
  compareByOrder,
  getActiveFolderId,
  getCollapsedFolders,
  getDeletedFolders,
  getDocumentFolderId,
  getExplorerFilter,
  getFolders,
  getVisibleFolders,
  persistExplorerFilter,
  setActiveFolderId,
  setCollapsedFolders,
  setFolderField,
  setFolders,
} from "../domain/folders.js";
import {
  actionsMenu,
  assetList,
  assetPreviewBody,
  assetPreviewOverlay,
  clearButton,
  closeAssetPreviewButton,
  closeGuideButton,
  closeHistoryButton,
  closeInspectorButton,
  closePreferencesButton,
  closeTemplatesButton,
  copyConfluenceButton,
  copyHtmlButton,
  copyMarkdownButton,
  dismissNoticeButton,
  documentList,
  documentSearch,
  downloadMarkdownButton,
  editorHost,
  explorerFilterButtons,
  exportAssetsButton,
  exportHtmlButton,
  focusExitButton,
  focusModeButton,
  foldAllSectionsButton,
  helpOverlay,
  hiddenInput,
  hideSidePanelButton,
  historyList,
  historyOverlay,
  historyPreview,
  inspectorToggleButton,
  newDocumentButton,
  newFolderButton,
  notesList,
  openGuideButton,
  openFocusModeButton,
  openPreferencesButton,
  openSearchButton,
  openThemeButton,
  openTemplatesButton,
  outlineList,
  personalNotice,
  preferenceDensityInput,
  preferenceThemeInput,
  preferenceTypographyInput,
  preferenceWidthInput,
  preferenceWrapInput,
  preferencesOverlay,
  presentationExitButton,
  preview,
  saveStatus,
  showInsertButton,
  sidePanelButtons,
  slashList,
  slashMenu,
  slashPreview,
  stats,
  templateGrid,
  templateOverlay,
  themeToggleButton,
  togglePresentationButton,
  toolbarButtons,
  unfoldAllSectionsButton,
  validationList,
  viewButtons,
  workspace,
} from "./dom.js";
import { defaultFolderId, maxDocumentHistory, mobileViewMedia, snapshotIntervalMs } from "./config.js";
import { bindWorkspaceEvents } from "./bindings.js";
import { createDocumentWorkflow } from "./document-workflow.js";
import { createEditorCommands } from "./editor-commands.js";
import { documentTemplates } from "./templates.js";
import { createPreviewRenderer } from "./preview-renderer.js";

let feedbackTimer;
let saveTimer;
let activeDocumentId;
let editor;
let previewRenderer;
let documentWorkflow;
let editorCommands;
let explorerEditState = null;
let historyState = { documentId: null, snapshotId: null };
const themeCompartment = new Compartment();
const wrapCompartment = new Compartment();
let slashState = {
  active: false,
  start: 0,
  end: 0,
  selected: 0,
  query: "",
  items: [],
};
let templatePickerTargetFolderId = defaultFolderId;
let slashMenuController;
const topbar = document.querySelector(".topbar");
const sideTabs = document.querySelector(".side-tabs");
const documentsPanel = document.querySelector(".documents-panel");
const insertPanel = document.querySelector(".toolbox");
const outlinePanel = document.querySelector(".outline-panel");
const visualViewport = window.visualViewport;

const defaultMarkdown = hiddenInput.value;

const setPersonalNoticeVisible = (visible) => {
  personalNotice.hidden = !visible;
  workspace.dataset.noticeVisible = String(visible);
  storageSet(noticeStorageKey, visible ? "false" : "true");
};

const updateStickyOffsets = () => {
  if (!topbar || !sideTabs) return;

  if (mobileViewMedia.matches) {
    workspace.style.setProperty("--side-tabs-top", "auto");
    workspace.style.setProperty("--side-panel-top", "auto");
    return;
  }

  const topbarBottom = Math.max(0, Math.round(topbar.getBoundingClientRect().bottom));
  const sideTabsHeight = Math.round(sideTabs.getBoundingClientRect().height);

  workspace.style.setProperty("--side-tabs-top", `${topbarBottom + 8}px`);
  workspace.style.setProperty("--side-panel-top", `${topbarBottom + sideTabsHeight + 16}px`);
};

const updateMobileViewportMetrics = () => {
  if (!mobileViewMedia.matches) {
    workspace.style.setProperty("--mobile-keyboard-offset", "0px");
    workspace.style.setProperty("--mobile-viewport-height", `${window.innerHeight}px`);
    return;
  }

  if (!visualViewport) {
    workspace.style.setProperty("--mobile-keyboard-offset", "0px");
    workspace.style.setProperty("--mobile-viewport-height", `${window.innerHeight}px`);
    return;
  }

  const keyboardOffset = Math.max(
    0,
    Math.round(window.innerHeight - (visualViewport.height + visualViewport.offsetTop)),
  );

  workspace.style.setProperty("--mobile-keyboard-offset", `${keyboardOffset}px`);
  workspace.style.setProperty("--mobile-viewport-height", `${Math.round(visualViewport.height)}px`);
};

const closeMobileSidePanel = () => {
  if (!mobileViewMedia.matches) return;
  setSidePanelVisible(false);
};

const syncResponsiveWorkspace = ({ preserveView = true } = {}) => {
  if (mobileViewMedia.matches) {
    workspace.dataset.view = workspace.dataset.view === "preview" && preserveView ? "preview" : "editor";
    if (workspace.dataset.view === "editor" && workspace.dataset.sidePanel === "outline") {
      setSidePanel("documents");
    }
    if (!storageGet(insertPanelStorageKey)) {
      setSidePanelVisible(false);
    }
  }

  updateStickyOffsets();
  updateMobileViewportMetrics();
  syncViewButtons();
};

const darkEditorTheme = EditorView.theme(
  {
    "&": { backgroundColor: "#181c21", color: "#f1f3f6" },
    ".cm-content": { caretColor: "#ffffff" },
    ".cm-gutters": { backgroundColor: "#181c21", color: "#9da7b3", borderRightColor: "#313843" },
    ".cm-activeLine": { backgroundColor: "#20252c" },
    ".cm-activeLineGutter": { backgroundColor: "#20252c", color: "#c7d0da" },
    ".cm-selectionBackground": { backgroundColor: "#385247 !important" },
  },
  { dark: true },
);


const replaceImageAsset = (assetId, file) => {
  const reader = new FileReader();
  reader.addEventListener("load", () => {
    const current = getImageAssetCurrent(assetId);
    setImageAssetField(assetId, {
      value: reader.result,
      name: file.name ? file.name.replace(/\.[^.]+$/, "") : getStoredAssetName(current, "imagen"),
      type: file.type || getStoredAssetType(current),
    });
    renderAssets();
    renderMarkdown(getMarkdown());
  });
  reader.readAsDataURL(file);
};

const replaceImageAssetFromPicker = (assetId) => {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "image/*";
  input.addEventListener("change", () => {
    const [file] = input.files || [];
    if (file) replaceImageAsset(assetId, file);
  });
  input.click();
};

const renameImageAsset = (assetId) => {
  const current = getImageAssetCurrent(assetId);
  const nextName = window.prompt("Nuevo nombre del asset", getStoredAssetName(current, "imagen"))?.trim();
  if (!nextName) return;
  renameImageAssetEntity(assetId, nextName);
  renderAssets();
  renderMarkdown(getMarkdown());
};

const removeImageAsset = (assetId) => {
  removeImageAssetEntity(assetId);
  renderAssets();
};

const slugify = (value) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");

const readMarkdownToken = (kind, id) =>
  readStoredValue(kind === "image" ? imageStoreKey : linkStoreKey, id);

const setExplorerFilter = (filter) => {
  const nextFilter = persistExplorerFilter(filter);
  workspace.dataset.explorerFilter = nextFilter;
  explorerFilterButtons.forEach((button) => {
    const selected = button.dataset.explorerFilter === nextFilter;
    button.classList.toggle("is-selected", selected);
    button.setAttribute("aria-pressed", String(selected));
  });
};

const formatRelativeDocumentTime = (timestamp) => {
  const deltaMs = Math.max(0, Date.now() - timestamp);
  const minutes = Math.floor(deltaMs / 60000);
  if (minutes < 1) return "Ahora";
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} d`;
  return new Date(timestamp).toLocaleDateString();
};

const getDocumentSearchText = (doc, foldersById) => {
  const folderName = foldersById.get(getDocumentFolderId(doc))?.name || "";
  return `${doc.title} ${folderName} ${doc.markdown}`.toLowerCase();
};

const createDocumentFromTemplate = (...args) => documentWorkflow.createDocumentFromTemplate(...args);
const promptTemplateSelection = (...args) => documentWorkflow.promptTemplateSelection(...args);

const renderTemplatePicker = () => {
  templateGrid.replaceChildren();
  documentTemplates.forEach((template) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "template-card";

    const title = document.createElement("strong");
    title.textContent = template.label;
    const hint = document.createElement("span");
    hint.textContent = template.title;
    const previewText = document.createElement("pre");
    previewText.textContent = template.markdown;

    button.append(title, hint, previewText);
    button.addEventListener("click", () => {
      templateOverlay.hidden = true;
      spawnDocumentFromTemplate(templatePickerTargetFolderId, template.id);
      requestAnimationFrame(() => editor?.focus());
    });

    templateGrid.appendChild(button);
  });
};

const setTemplatePickerVisible = (visible, folderId = getActiveFolderId()) => {
  templatePickerTargetFolderId = folderId;
  templateOverlay.hidden = !visible;
  workspace.dataset.templateVisible = String(visible);
  if (visible) {
    renderTemplatePicker();
    actionsMenu.open = false;
    setGuideVisible(false);
    setHistoryVisible(null);
    setPreferencesVisible(false);
    setAssetPreviewVisible(null);
    closeSlashMenu();
    return;
  }
  requestAnimationFrame(() => editor?.focus());
};

const openDocumentInEditor = (...args) => documentWorkflow.openDocumentInEditor(...args);
const spawnDocumentFromTemplate = (...args) => documentWorkflow.spawnDocumentFromTemplate(...args);
const ensureActiveDocument = (...args) => documentWorkflow.ensureActiveDocument(...args);
const permanentlyDeleteDocument = (...args) => documentWorkflow.permanentlyDeleteDocument(...args);
const deleteDocument = (...args) => documentWorkflow.deleteDocument(...args);
const restoreDocument = (...args) => documentWorkflow.restoreDocument(...args);
const archiveDocument = (...args) => documentWorkflow.archiveDocument(...args);
const restoreArchivedDocument = (...args) => documentWorkflow.restoreArchivedDocument(...args);
const permanentlyDeleteFolder = (...args) => documentWorkflow.permanentlyDeleteFolder(...args);
const deleteFolder = (...args) => documentWorkflow.deleteFolder(...args);
const restoreFolder = (...args) => documentWorkflow.restoreFolder(...args);
const moveDocumentToFolder = (...args) => documentWorkflow.moveDocumentToFolder(...args);
const reorderFolders = (...args) => documentWorkflow.reorderFolders(...args);
const reorderDocuments = (...args) => documentWorkflow.reorderDocuments(...args);

const updateActiveDocument = (markdown) => {
  const documents = getDocuments(defaultMarkdown);
  const nextDocuments = documents.map((doc) =>
    doc.id === activeDocumentId
      ? {
          ...doc,
          title: doc.titleManual ? doc.title : getDocumentTitle(markdown),
          markdown,
          updatedAt: Date.now(),
        }
      : doc,
  );
  setDocuments(nextDocuments);
};

const getMarkdown = () => editor.state.doc.toString();

const setMarkdown = (markdown) => {
  editor.dispatch({
    changes: { from: 0, to: editor.state.doc.length, insert: markdown },
  });
};

const setHistoryVisible = (documentId = null, snapshotId = null) => {
  historyState = { documentId, snapshotId };
  historyOverlay.hidden = !documentId;
  workspace.dataset.historyVisible = String(Boolean(documentId));
  if (!documentId) {
    historyList.replaceChildren();
    historyPreview.innerHTML = '<p class="empty-state">Selecciona una version para ver su contenido.</p>';
    requestAnimationFrame(() => editor?.focus());
    return;
  }
  actionsMenu.open = false;
  setGuideVisible(false);
  setTemplatePickerVisible(false);
  setPreferencesVisible(false);
  setAssetPreviewVisible(null);
  closeSlashMenu();
  renderHistoryPanel();
};

const renderHistoryPanel = () => {
  const documentId = historyState.documentId;
  const target = getDocuments(defaultMarkdown).find((doc) => doc.id === documentId);

  if (!target) {
    setHistoryVisible(null);
    return;
  }

  const snapshots = [...target.history].sort((a, b) => b.createdAt - a.createdAt);
  const activeSnapshotId = historyState.snapshotId || snapshots[0]?.id || null;
  historyState.snapshotId = activeSnapshotId;
  renderHistoryPanelView({
    target,
    activeSnapshotId,
    historyList,
    historyPreview,
    onSelectSnapshot: (snapshotId) => {
      historyState.snapshotId = snapshotId;
      renderHistoryPanel();
    },
    onSaveCurrentSnapshot: () => {
      captureSnapshot(target.id, getMarkdown(), defaultMarkdown, "manual");
      renderHistoryPanel();
      renderDocuments();
    },
    onRestoreSnapshot: (selected) => {
      captureSnapshot(target.id, getMarkdown(), defaultMarkdown, "manual");
      setDocumentField(target.id, {
        markdown: selected.markdown,
        title: target.titleManual ? target.title : getDocumentTitle(selected.markdown),
        updatedAt: Date.now(),
      }, defaultMarkdown);
      if (target.id === activeDocumentId) setMarkdown(selected.markdown);
      renderMarkdown(selected.markdown);
      renderDocuments();
      renderHistoryPanel();
    },
  });
};

const renderDocuments = () => {
  const query = documentSearch.value.trim().toLowerCase();
  const explorerFilter = getExplorerFilter();
  const folders = getVisibleFolders();
  const foldersById = new Map(folders.map((folder) => [folder.id, folder]));
  const deletedFolders = getDeletedFolders();
  const collapsedFolders = getCollapsedFolders();
  const documents = getVisibleDocuments(defaultMarkdown).sort(compareByOrder);
  const archivedDocuments = getArchivedDocuments(defaultMarkdown).sort((a, b) => (b.archivedAt || 0) - (a.archivedAt || 0));
  const deletedDocuments = getDeletedDocuments(defaultMarkdown).sort((a, b) => (b.deletedAt || 0) - (a.deletedAt || 0));
  const baseDocuments = documents.filter((doc) => getDocumentSearchText(doc, foldersById).includes(query));
  const recentDocuments = [...baseDocuments].sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
  const visibleDocuments =
    explorerFilter === "favorites" ? baseDocuments.filter((doc) => doc.favorite) : explorerFilter === "recent" ? recentDocuments : baseDocuments;

  renderExplorerPanel({
    container: documentList,
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
    activeFolderId: getActiveFolderId(),
    defaultFolderId,
    explorerEditState,
    compareByOrder,
    formatRelativeDocumentTime,
    getDocumentFolderId,
    onSetExplorerEditState: (next) => {
      explorerEditState = next;
    },
    onRender: renderDocuments,
    onOpenDocument: openDocumentInEditor,
    onReorderDocuments: reorderDocuments,
    onRenameDocument: (documentId, title) => {
      setDocumentField(documentId, { title, titleManual: true, updatedAt: Date.now() }, defaultMarkdown);
    },
    onSaveSnapshot: (doc) => {
      captureSnapshot(doc.id, doc.id === activeDocumentId ? getMarkdown() : doc.markdown, defaultMarkdown, "manual");
    },
    onOpenHistory: setHistoryVisible,
    onDuplicateDocument: (doc) => {
      const copy = {
        ...doc,
        id: crypto.randomUUID(),
        title: `${doc.title} copia`,
        titleManual: true,
        folderId: getDocumentFolderId(doc),
        createdAt: Date.now(),
        updatedAt: Date.now(),
        order: documents.filter((item) => getDocumentFolderId(item) === getDocumentFolderId(doc)).length,
        deletedAt: null,
        history: [...doc.history],
        lastSnapshotAt: doc.lastSnapshotAt,
      };
      setDocuments([...getDocuments(defaultMarkdown), copy]);
      openDocumentInEditor(copy);
    },
    onApplyTemplateToDocument: (doc) => {
      const template = promptTemplateSelection();
      if (!template) return;
      captureSnapshot(doc.id, doc.id === activeDocumentId ? getMarkdown() : doc.markdown, defaultMarkdown, "manual");
      setDocumentField(doc.id, {
        title: template.title,
        markdown: template.markdown,
        titleManual: false,
        updatedAt: Date.now(),
      }, defaultMarkdown);
      if (doc.id === activeDocumentId) setMarkdown(template.markdown);
      renderDocuments();
      renderMarkdown(doc.id === activeDocumentId ? template.markdown : getMarkdown());
    },
    onToggleFavoriteDocument: (doc) => {
      setDocumentField(doc.id, { favorite: !doc.favorite, updatedAt: Date.now() }, defaultMarkdown);
    },
    onArchiveDocument: archiveDocument,
    onDeleteDocument: deleteDocument,
    onMoveDocumentToFolder: (docOrRef, folderId) => {
      moveDocumentToFolder(docOrRef.id, folderId);
      if (docOrRef.id === activeDocumentId) setActiveFolderId(folderId);
    },
    onReorderFolders: reorderFolders,
    onToggleFolderCollapsed: (folderId, nextCollapsed) => {
      nextCollapsed[folderId] = !nextCollapsed[folderId];
      setCollapsedFolders(nextCollapsed);
      setActiveFolderId(folderId);
      renderDocuments();
    },
    onRenameFolder: (folderId, name) => {
      setFolderField(folderId, { name });
    },
    onCreateDocumentInFolder: (folderId) => {
      const doc = createBlankDocument(defaultMarkdown, folderId);
      setDocuments([doc, ...getDocuments(defaultMarkdown)]);
      openDocumentInEditor(doc);
    },
    onCreateTemplateDocumentInFolder: (folderId) => {
      setTemplatePickerVisible(true, folderId);
    },
    onDeleteFolder: deleteFolder,
    onRestoreFolder: restoreFolder,
    onPurgeFolder: permanentlyDeleteFolder,
    onRestoreDocument: restoreDocument,
    onPurgeDocument: permanentlyDeleteDocument,
    onRestoreArchivedDocument: restoreArchivedDocument,
    onOpenArchivedDocument: (documentId) => {
      restoreArchivedDocument(documentId);
      const restored = getDocuments(defaultMarkdown).find((item) => item.id === documentId);
      if (restored) openDocumentInEditor({ ...restored, archivedAt: null });
    },
  });
};

const isHeadingFolded = (state, lineStart) => {
  const range = getHeadingFoldRange(state, lineStart);
  if (!range) return false;

  let folded = false;
  foldedRanges(state).between(range.from, range.from + 1, (from, to) => {
    if (from === range.from && to === range.to) folded = true;
  });
  return folded;
};

const focusHeadingInEditor = (position) => {
  editor.dispatch({ selection: { anchor: position }, scrollIntoView: true });
  editor.focus();
};

const toggleHeadingFold = (position) => {
  focusHeadingInEditor(position);
  toggleFold(editor);
  renderOutline(getMarkdown());
};

const moveHeadingSection = (sourceIndex, targetIndex) => {
  const nextMarkdown = moveHeadingSectionMarkdown(getMarkdown(), sourceIndex, targetIndex);
  setMarkdown(nextMarkdown);
};

const renderOutline = (...args) => previewRenderer.renderOutline(...args);
const setAssetPreviewVisible = (...args) => previewRenderer.setAssetPreviewVisible(...args);
const renderAssets = (...args) => previewRenderer.renderAssets(...args);
const renderMarkdown = (markdown) => previewRenderer.renderMarkdown({ markdown, editorState: editor?.state || null });

const setSaveStatus = (value) => {
  saveStatus.textContent = value;
  saveStatus.dataset.state = value === "Guardando" ? "saving" : "saved";
};

const saveDocument = () => {
  const markdown = getMarkdown();
  maybeCaptureSnapshot(activeDocumentId, markdown, defaultMarkdown, snapshotIntervalMs);
  updateActiveDocument(markdown);
  storageSet(storageKey, markdown);
  renderDocuments();
  if (!historyOverlay.hidden && historyState.documentId === activeDocumentId) renderHistoryPanel();
  setSaveStatus("Guardado");
};

const scheduleSave = () => {
  setSaveStatus("Guardando");
  clearTimeout(saveTimer);
  saveTimer = setTimeout(saveDocument, 250);
};

const syncDocument = () => {
  const markdown = getMarkdown();
  hiddenInput.value = markdown;
  renderMarkdown(markdown);
  scheduleSave();
};

const insertAtCursor = (...args) => editorCommands.insertAtCursor(...args);
const wrapSelection = (...args) => editorCommands.wrapSelection(...args);

const showButtonFeedback = (button) => {
  if (!button) return;
  clearTimeout(feedbackTimer);
  button.classList.add("is-active");
  feedbackTimer = setTimeout(() => button.classList.remove("is-active"), 180);
};

const getFormatButton = (format) => document.querySelector(`[data-format="${format}"]`);

const isModKey = (event) => event.metaKey || event.ctrlKey;

const getThemeExtension = (theme) => (theme === "dark" ? darkEditorTheme : []);
const getWrapExtension = (wrap) => (wrap === "off" ? [] : EditorView.lineWrapping);

const syncPreferenceInputs = (preferences = getPreferences()) => {
  preferenceWidthInput.value = preferences.width;
  preferenceDensityInput.value = preferences.density;
  preferenceTypographyInput.value = preferences.typography;
  preferenceWrapInput.value = preferences.wrap;
  preferenceThemeInput.value = workspace.dataset.theme || storageGet(themeKey) || "light";
};

const applyPreferences = (preferences, { persist = true } = {}) => {
  workspace.dataset.readingWidth = preferences.width;
  workspace.dataset.density = preferences.density;
  workspace.dataset.typography = preferences.typography;
  workspace.dataset.wrap = preferences.wrap;
  if (persist) setPreferences(preferences);
  if (editor) {
    editor.dispatch({
      effects: wrapCompartment.reconfigure(getWrapExtension(preferences.wrap)),
    });
  }
  syncPreferenceInputs(preferences);
  refreshEditorLayout();
};

const setPreferencesVisible = (visible) => {
  preferencesOverlay.hidden = !visible;
  workspace.dataset.preferencesVisible = String(visible);
  if (visible) {
    syncPreferenceInputs();
    actionsMenu.open = false;
    if (mobileViewMedia.matches) {
      setSidePanelVisible(false);
    }
    setGuideVisible(false);
    setHistoryVisible(null);
    setTemplatePickerVisible(false);
    setAssetPreviewVisible(null);
    closeSlashMenu();
    return;
  }
  requestAnimationFrame(() => editor?.focus());
};

const applyTheme = (theme, { persist = true } = {}) => {
  workspace.dataset.theme = theme;
  themeToggleButton.textContent = theme === "dark" ? "Claro" : "Oscuro";
  if (openThemeButton) {
    openThemeButton.textContent = theme === "dark" ? "Cambiar a claro" : "Cambiar a oscuro";
  }
  if (persist) storageSet(themeKey, theme);
  if (editor) {
    editor.dispatch({
      effects: themeCompartment.reconfigure(getThemeExtension(theme)),
    });
  }
  syncPreferenceInputs();
};

const setPresentationMode = (enabled) => {
  workspace.dataset.presentation = String(enabled);
  togglePresentationButton.textContent = enabled ? "Salir de presentacion" : "Presentacion";
  storageSet(presentationKey, String(enabled));

  if (enabled) {
    storageSet(previousViewKey, workspace.dataset.view || "split");
    workspace.dataset.view = "preview";
    actionsMenu.open = false;
    setGuideVisible(false);
    setHistoryVisible(null);
    setTemplatePickerVisible(false);
    setPreferencesVisible(false);
    setAssetPreviewVisible(null);
    closeSlashMenu();
  } else {
    workspace.dataset.view = storageGet(previousViewKey) || "split";
  }

  viewButtons.forEach((button) => button.classList.toggle("is-selected", button.dataset.view === workspace.dataset.view));
  refreshEditorLayout();
};

const setGuideVisible = (visible) => {
  helpOverlay.hidden = !visible;
  workspace.dataset.guideVisible = String(visible);
  if (visible) {
    historyOverlay.hidden = true;
    workspace.dataset.historyVisible = "false";
    templateOverlay.hidden = true;
    workspace.dataset.templateVisible = "false";
    preferencesOverlay.hidden = true;
    workspace.dataset.preferencesVisible = "false";
    assetPreviewOverlay.hidden = true;
    workspace.dataset.assetPreviewVisible = "false";
    actionsMenu.open = false;
    closeSlashMenu();
    return;
  }
  requestAnimationFrame(() => editor?.focus());
};

const syncChromeDensity = () => {
  const editorOffset = editor?.scrollDOM?.scrollTop || 0;
  const previewOffset = preview.scrollTop || 0;
  const compact = Math.max(editorOffset, previewOffset) > 28;
  workspace.dataset.chrome = compact ? "compact" : "resting";
  updateStickyOffsets();
};

const openSearchInterface = () => {
  actionsMenu.open = false;
  setGuideVisible(false);
  setHistoryVisible(null);
  if (!editor) return;
  openSearchPanel(editor);
};

const applyFormat = (...args) => editorCommands.applyFormat(...args);
const runFormatShortcut = (...args) => editorCommands.runFormatShortcut(...args);
const moveCurrentHeadingSection = (...args) => editorCommands.moveCurrentHeadingSection(...args);
const editSectionNote = (...args) => editorCommands.editSectionNote(...args);
const editCurrentSectionNote = (...args) => editorCommands.editCurrentSectionNote(...args);
const renderNotes = (...args) => previewRenderer.renderNotes(...args);

const archiveActiveDocument = () => {
  if (!activeDocumentId) return;
  archiveDocument(activeDocumentId);
  renderDocuments();
};

const toggleActiveFavorite = () => {
  const active = getDocuments(defaultMarkdown).find((doc) => doc.id === activeDocumentId);
  if (!active) return;
  setDocumentField(active.id, { favorite: !active.favorite, updatedAt: Date.now() }, defaultMarkdown);
  renderDocuments();
};

const createInsertSlashCommand = ([id, title, hint, previewText, keywords, category, shortcut]) => ({
  id,
  title,
  hint,
  preview: previewText,
  keywords,
  category,
  shortcut,
  mode: "insert",
});

const createActionSlashCommand = ({ id, title, hint, preview, keywords, category, shortcut, action }) => ({
  id,
  title,
  hint,
  preview,
  keywords,
  category,
  shortcut,
  mode: "action",
  action,
});

const slashCommands = [
  ...[
    ["h1", "Titulo 1", "Encabezado principal", "# Titulo principal", "titulo heading h1 principal", "Estructura", "#"],
    ["h2", "Titulo 2", "Seccion del documento", "## Subtitulo", "titulo heading h2 subtitulo seccion", "Estructura", "##"],
    ["h3", "Titulo 3", "Subseccion", "### Seccion", "titulo heading h3 seccion", "Estructura", "###"],
    ["h4", "Titulo 4", "Apartado menor", "#### Apartado", "titulo heading h4 apartado", "Estructura", "####"],
    ["h5", "Titulo 5", "Detalle", "##### Detalle", "titulo heading h5 detalle", "Estructura", "#####"],
    ["h6", "Titulo 6", "Nota menor", "###### Nota menor", "titulo heading h6 nota menor", "Estructura", "######"],
    ["hr", "Separador", "Linea horizontal", "---", "separador linea horizontal divisor", "Estructura", "---"],
    ["toc", "Indice", "Links a secciones", "## Indice\n\n- [Introduccion](#introduccion)", "indice toc contenido", "Estructura", "[]"],
    ["bold", "Negrita", "Texto importante", "**texto importante**", "negrita bold fuerte", "Texto", "Ctrl/Cmd+B"],
    ["italic", "Cursiva", "Enfasis suave", "*texto en cursiva*", "cursiva italic enfasis", "Texto", "Ctrl/Cmd+I"],
    ["strike", "Tachado", "Texto eliminado", "~~texto tachado~~", "tachado strike", "Texto", "~~"],
    ["inlineCode", "Codigo inline", "Codigo en linea", "`codigo`", "codigo inline code", "Texto", "`"],
    ["highlight", "Marcado", "Texto resaltado", "==texto resaltado==", "marcado resaltado", "Texto", "=="],
    ["ul", "Lista con vinetas", "Puntos simples", "- Primer punto\n- Segundo punto", "lista vinetas puntos", "Listas", "-"],
    ["ol", "Lista numerada", "Pasos ordenados", "1. Primer paso\n2. Segundo paso", "lista numerada pasos", "Listas", "1."],
    ["task", "Lista de tareas", "Checklist con pendientes", "- [x] Tarea completada\n- [ ] Tarea pendiente", "tareas checklist", "Listas", "[ ]"],
    ["nested", "Sublista", "Lista anidada", "- Tema principal\n  - Detalle relacionado", "sublista anidada", "Listas", "--"],
    ["quote", "Cita", "Bloque destacado", "> Cita o nota destacada", "cita quote", "Contenido", ">"],
    ["callout", "Nota", "Aclaracion importante", "> **Nota:** escribe aqui una aclaracion importante.", "nota callout aviso", "Contenido", "!"],
    ["link", "Enlace", "Texto con URL", "[Texto del enlace](https://ejemplo.com)", "link enlace url", "Contenido", "Ctrl/Cmd+K"],
    ["image", "Imagen", "Markdown de imagen", "![Descripcion](https://...)", "imagen foto media", "Contenido", "img"],
    ["table", "Tabla", "Filas y columnas", "| Elemento | Estado |\n| --- | --- |\n| Editor | Listo |", "tabla columnas filas", "Contenido", "| |"],
    ["codeBlock", "Bloque de codigo", "Codigo con lenguaje", "```js\nconsole.log(\"Hola\")\n```", "codigo bloque", "Contenido", "{}"],
    ["details", "Desplegable", "Contenido colapsable", "<details>\n<summary>Ver mas</summary>\n\nContenido oculto\n\n</details>", "desplegable detalles", "Contenido", "..."],
    ["footnote", "Nota al pie", "Referencia con explicacion", "Texto con nota[^1]\n\n[^1]: Explicacion", "nota pie footnote", "Contenido", "[^]"],
    ["definition", "Definicion", "Termino y descripcion", "Termino\n: Definicion breve", "definicion termino", "Contenido", ":"],
    ["mermaid", "Diagrama", "Bloque Mermaid", "```mermaid\ngraph TD\nA --> B\n```", "diagrama mermaid flujo", "Contenido", "mer"],
  ].map(createInsertSlashCommand),
  createActionSlashCommand({
    id: "move-section-up",
    title: "Mover seccion arriba",
    hint: "Reordena el bloque actual antes del anterior",
    preview: "## Seccion actual\n\nEl bloque sube una posicion en el documento.",
    keywords: "mover seccion arriba bloque reorder",
    category: "Acciones",
    shortcut: "Alt+↑",
    action: () => moveCurrentHeadingSection(-1),
  }),
  createActionSlashCommand({
    id: "move-section-down",
    title: "Mover seccion abajo",
    hint: "Reordena el bloque actual despues del siguiente",
    preview: "## Seccion actual\n\nEl bloque baja una posicion en el documento.",
    keywords: "mover seccion abajo bloque reorder",
    category: "Acciones",
    shortcut: "Alt+↓",
    action: () => moveCurrentHeadingSection(1),
  }),
  createActionSlashCommand({
    id: "toggle-section-fold",
    title: "Plegar u abrir seccion",
    hint: "Alterna el plegado del encabezado actual",
    preview: "## Seccion actual\n\nEl contenido puede ocultarse para concentrarte en la estructura.",
    keywords: "plegar abrir fold seccion heading",
    category: "Acciones",
    shortcut: "Cmd/Ctrl+Alt+[",
    action: () => toggleHeadingFold(editor.state.selection.main.head),
  }),
  createActionSlashCommand({
    id: "new-template-meeting",
    title: "Nueva plantilla de reunion",
    hint: "Crea un documento nuevo de notas de reunion",
    preview: "# Notas de reunion\n\n## Contexto\n\n## Puntos clave\n\n## Tareas",
    keywords: "plantilla reunion notas documento nuevo",
    category: "Plantillas",
    shortcut: "Tpl",
    action: () => spawnDocumentFromTemplate(getActiveFolderId(), "meeting"),
  }),
  createActionSlashCommand({
    id: "new-template-brief",
    title: "Nuevo brief",
    hint: "Crea un documento nuevo para definir alcance y objetivos",
    preview: "# Brief de proyecto\n\n## Problema\n\n## Objetivo\n\n## Alcance",
    keywords: "plantilla brief alcance objetivos documento nuevo",
    category: "Plantillas",
    shortcut: "Tpl",
    action: () => spawnDocumentFromTemplate(getActiveFolderId(), "brief"),
  }),
  createActionSlashCommand({
    id: "new-template-spec",
    title: "Nueva especificacion",
    hint: "Crea una base tecnica con requisitos y casos borde",
    preview: "# Especificacion tecnica\n\n## Resumen\n\n## Requisitos\n\n## Casos borde",
    keywords: "plantilla especificacion tecnica requisitos documento nuevo",
    category: "Plantillas",
    shortcut: "Tpl",
    action: () => spawnDocumentFromTemplate(getActiveFolderId(), "spec"),
  }),
  createActionSlashCommand({
    id: "new-template-prd",
    title: "Nuevo PRD",
    hint: "Crea un documento de requerimientos de producto",
    preview: "# Product requirements\n\n## Contexto\n\n## Usuarios objetivo\n\n## Objetivo del producto",
    keywords: "plantilla prd producto requirements alcance kpi",
    category: "Plantillas",
    shortcut: "Tpl",
    action: () => spawnDocumentFromTemplate(getActiveFolderId(), "prd"),
  }),
  createActionSlashCommand({
    id: "new-template-incident",
    title: "Nuevo incidente",
    hint: "Crea un reporte con timeline, impacto y acciones",
    preview: "# Reporte de incidente\n\n## Impacto\n\n## Timeline\n\n## Causa raiz",
    keywords: "plantilla incidente postmortem reporte causa raiz timeline",
    category: "Plantillas",
    shortcut: "Tpl",
    action: () => spawnDocumentFromTemplate(getActiveFolderId(), "incident"),
  }),
  createActionSlashCommand({
    id: "new-template-runbook",
    title: "Nuevo runbook",
    hint: "Crea un procedimiento operativo repetible",
    preview: "# Runbook operativo\n\n## Checklist previa\n\n## Pasos\n\n## Rollback",
    keywords: "plantilla runbook operativo procedimiento rollback",
    category: "Plantillas",
    shortcut: "Tpl",
    action: () => spawnDocumentFromTemplate(getActiveFolderId(), "runbook"),
  }),
  createActionSlashCommand({
    id: "new-template-retro",
    title: "Nueva retro",
    hint: "Crea una retrospectiva para equipo o proyecto",
    preview: "# Retrospectiva\n\n## Que salio bien\n\n## Que salio mal\n\n## Acciones",
    keywords: "plantilla retro retrospectiva sprint equipo",
    category: "Plantillas",
    shortcut: "Tpl",
    action: () => spawnDocumentFromTemplate(getActiveFolderId(), "retro"),
  }),
  createActionSlashCommand({
    id: "new-template-proposal",
    title: "Nueva propuesta",
    hint: "Crea una propuesta comercial o interna",
    preview: "# Propuesta\n\n## Resumen ejecutivo\n\n## Propuesta\n\n## Proximos pasos",
    keywords: "plantilla propuesta comercial interna alcance inversion",
    category: "Plantillas",
    shortcut: "Tpl",
    action: () => spawnDocumentFromTemplate(getActiveFolderId(), "proposal"),
  }),
  createActionSlashCommand({
    id: "toggle-favorite",
    title: "Marcar o quitar favorito",
    hint: "Alterna el estado favorito del documento activo",
    preview: "El documento actual cambia su prioridad dentro del explorador.",
    keywords: "favorito starred documento",
    category: "Documento",
    shortcut: "Fav",
    action: toggleActiveFavorite,
  }),
  createActionSlashCommand({
    id: "archive-document",
    title: "Archivar documento",
    hint: "Saca el documento activo de la vista principal sin borrarlo",
    preview: "El documento queda guardado en Archivados y puede restaurarse despues.",
    keywords: "archivar documento explorer",
    category: "Documento",
    shortcut: "Arc",
    action: archiveActiveDocument,
  }),
  createActionSlashCommand({
    id: "section-note",
    title: "Nota interna de seccion",
    hint: "Guarda una nota privada ligada al bloque actual",
    preview: "Nota interna\n- Visible solo dentro de MarkEDdown\n- No aparece en vista previa publicada ni exportaciones",
    keywords: "nota interna comentario bloque seccion privado",
    category: "Comentario",
    shortcut: "Note",
    action: editCurrentSectionNote,
  }),
  createActionSlashCommand({
    id: "open-preferences",
    title: "Abrir preferencias",
    hint: "Ajusta ancho, densidad, tipografia, wrap y tema",
    preview: "Preferencias\n- Ancho de lectura\n- Densidad\n- Tipografia\n- Line wrap\n- Tema",
    keywords: "preferencias ajustes settings wrap tipografia ancho tema",
    category: "Vista",
    shortcut: "Cmd/Ctrl+,",
    action: () => setPreferencesVisible(true),
  }),
  createActionSlashCommand({
    id: "toggle-presentation",
    title: "Modo presentacion",
    hint: "Muestra una vista limpia centrada en la lectura",
    preview: "# Documento\n\nEl modo presentacion oculta controles y deja el contenido como protagonista.",
    keywords: "presentacion publicacion lectura limpia preview",
    category: "Vista",
    shortcut: "Pres",
    action: () => setPresentationMode(workspace.dataset.presentation !== "true"),
  }),
];

const closeSlashMenu = () => {
  slashMenuController?.close();
  slashState = { ...slashState, active: false };
};

const updateSlashMenu = () => {
  slashMenuController?.update();
  slashState = slashMenuController?.getState() || slashState;
};

const executeSlashCommand = (selectedCommand) => {
  slashMenuController?.executeCommand(selectedCommand);
  slashState = slashMenuController?.getState() || slashState;
};

const insertPastedImage = (file) => {
  const reader = new FileReader();
  reader.addEventListener("load", () => {
    const name = file.name ? file.name.replace(/\.[^.]+$/, "") : "imagen pegada";
    const id = storeValue(imageStoreKey, reader.result, { name, type: file.type, order: getSortedImageEntries().length });
    insertAtCursor(`![${name}](mded-image:${id})`);
    renderAssets();
  });
  reader.readAsDataURL(file);
};

const insertPastedLink = (url) => {
  const selection = editor.state.selection.main;
  const selected = editor.state.doc.sliceString(selection.from, selection.to).trim() || "Texto del enlace";
  const id = storeValue(linkStoreKey, url);
  editor.dispatch({
    changes: { from: selection.from, to: selection.to, insert: `[${selected}](mded-link:${id})` },
  });
};

const compactInlineText = (value, max = 44) => {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  if (!text) return "";
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
};

const getCompactImageTokenLabel = (altText, source) => {
  if (source.startsWith("mded-image:")) {
    const asset = getStoredValue(imageStoreKey, source.replace("mded-image:", ""));
    const name = getStoredAssetName(asset, altText || "imagen");
    return `Imagen: ${compactInlineText(name, 30)}`;
  }
  if (source.startsWith("data:image/")) return `Imagen embebida: ${compactInlineText(altText || "pegada", 24)}`;
  return `Imagen: ${compactInlineText(altText || "referencia", 24)}`;
};

const getCompactLinkTokenLabel = (text, href) => {
  if (href.startsWith("mded-link:")) {
    const storedHref = readStoredValue(linkStoreKey, href.replace("mded-link:", "")) || href;
    return `Enlace: ${compactInlineText(text || storedHref, 34)}`;
  }
  return `Enlace: ${compactInlineText(text || href, 34)}`;
};

const createEditor = (markdownText) => {
  slashMenuController = createSlashMenuController({
    menu: slashMenu,
    list: slashList,
    preview: slashPreview,
    getEditor: () => editor,
    getCommands: () => slashCommands,
    renderPreviewHtml: (element, markdown) => {
      setSafeHtml(element, marked.parse(preprocessMarkdown(markdown, readMarkdownToken)));
    },
    onActionCommand: ({ command, start, end }) => {
      editor.dispatch({
        changes: { from: start, to: end, insert: "" },
        selection: { anchor: start },
      });
      command.action?.();
      editor.focus();
    },
    onInsertCommand: ({ command, start, end }) => {
      editor.dispatch({
        changes: { from: start, to: end, insert: command.preview },
        selection: { anchor: start + command.preview.length },
      });
      editor.focus();
    },
  });
  editor = createCodeMirrorEditor({
    markdownText,
    parent: editorHost,
    themeCompartment,
    wrapCompartment,
    initialThemeExtension: getThemeExtension(storageGet(themeKey) === "dark" ? "dark" : "light"),
    initialWrapExtension: getWrapExtension(getPreferences().wrap),
    getHeadingFoldRange,
    getImageTokenLabel: getCompactImageTokenLabel,
    getLinkTokenLabel: getCompactLinkTokenLabel,
    isModKey,
    runFormatShortcut,
    isSlashActive: () => slashMenuController?.isActive() || false,
    getSlashSelection: () => slashMenuController?.getState() || slashState,
    updateSlashSelection: (index) => {
      slashMenuController?.updateSelection(index);
      slashState = slashMenuController?.getState() || slashState;
    },
    executeSlashCommand,
    closeSlashMenu,
    updateSlashMenu,
    insertPastedImage,
    insertPastedLink,
    onEditorScroll: () => {
      if (slashMenuController?.isActive()) slashMenuController.position();
      syncChromeDensity();
    },
    onDocChange: syncDocument,
    onOutlineChange: renderOutline,
    getEditorInstance: () => editor,
  });
};

toolbarButtons.forEach((button) => {
  button.addEventListener("click", () => {
    applyFormat(button.dataset.format);
    showButtonFeedback(button);
  });
});

viewButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const requestedView = button.dataset.view;
    workspace.dataset.view = mobileViewMedia.matches && requestedView === "split" ? "editor" : requestedView;
    if (mobileViewMedia.matches) {
      if (workspace.dataset.view === "editor" && workspace.dataset.sidePanel === "outline") {
        setSidePanel("documents");
      }
      if (requestedView === "preview" && workspace.dataset.sidePanel === "insert") {
        setSidePanel("documents");
      }
    }
    syncViewButtons();
  });
});

const setSidePanel = (panel) => {
  const availablePanels = [...sidePanelButtons].map((button) => button.dataset.sidePanel);
  const nextPanel = availablePanels.includes(panel) ? panel : "documents";
  workspace.dataset.sidePanel = nextPanel;
  storageSet(sidePanelStorageKey, nextPanel);
  sidePanelButtons.forEach((button) => {
    const selected = button.dataset.sidePanel === nextPanel;
    button.classList.toggle("is-selected", selected);
    button.setAttribute("aria-selected", String(selected));
    button.tabIndex = selected ? 0 : -1;
  });
};

const setSidePanelVisible = (visible) => {
  workspace.dataset.sideVisible = String(visible);
  workspace.dataset.insertVisible = String(visible);
  storageSet(insertPanelStorageKey, String(visible));
};

sidePanelButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const isCurrentPanel = workspace.dataset.sidePanel === button.dataset.sidePanel;
    const isVisible = workspace.dataset.sideVisible === "true";

    if (mobileViewMedia.matches && isCurrentPanel && isVisible) {
      setSidePanelVisible(false);
      return;
    }

    setSidePanel(button.dataset.sidePanel);
    setSidePanelVisible(true);
  });

  button.addEventListener("keydown", (event) => {
    const keys = ["ArrowLeft", "ArrowRight", "Home", "End"];
    if (!keys.includes(event.key)) return;

    event.preventDefault();
    const currentIndex = [...sidePanelButtons].indexOf(button);
    const lastIndex = sidePanelButtons.length - 1;
    const nextIndex =
      event.key === "Home"
        ? 0
        : event.key === "End"
          ? lastIndex
          : event.key === "ArrowRight"
            ? (currentIndex + 1) % sidePanelButtons.length
            : (currentIndex - 1 + sidePanelButtons.length) % sidePanelButtons.length;
    const nextButton = sidePanelButtons[nextIndex];

    setSidePanel(nextButton.dataset.sidePanel);
    setSidePanelVisible(true);
    nextButton.focus();
  });
});

hideSidePanelButton.addEventListener("click", () => {
  setSidePanelVisible(false);
});

showInsertButton.addEventListener("click", () => {
  setSidePanelVisible(true);
});

const setInsertPanelVisible = (visible) => {
  setSidePanelVisible(visible);
};

insertPanel?.addEventListener("click", (event) => {
  if (event.target.closest("[data-format]")) {
    closeMobileSidePanel();
  }
});

const refreshEditorLayout = () => {
  requestAnimationFrame(() => {
    editor?.requestMeasure();
    editor?.focus();
  });
};
const syncViewButtons = () => {
  viewButtons.forEach((button) => button.classList.toggle("is-selected", button.dataset.view === workspace.dataset.view));
};
const getDefaultWorkspaceView = () => (mobileViewMedia.matches ? "editor" : "split");

const setFocusMode = (enabled) => {
  workspace.dataset.focus = String(enabled);
  focusModeButton.textContent = enabled ? "Salir foco" : "Foco";
  if (openFocusModeButton) {
    openFocusModeButton.textContent = enabled ? "Salir de foco" : "Modo foco";
  }
  storageSet(focusKey, String(enabled));
  closeSlashMenu();
  if (enabled) {
    setGuideVisible(false);
    setHistoryVisible(null);
  }
  refreshEditorLayout();
};

const setInspectorVisible = (visible) => {
  workspace.dataset.inspectorVisible = String(visible);
  storageSet(inspectorStorageKey, String(visible));
};

bindFileActionButtons({
  copyMarkdownButton,
  copyHtmlButton,
  copyConfluenceButton,
  downloadMarkdownButton,
  exportHtmlButton,
  exportAssetsButton,
  getMarkdown,
  getPreviewHtml: () => preview.innerHTML,
  getExportHtml: (title) =>
    getExportHtmlDocument({
      title,
      html: preview.innerHTML,
      theme: workspace.dataset.theme || "light",
      preferences: getPreferences(),
    }),
  getAssetEntries: getImageAssetExportEntries,
  expandMarkdownTokens: (markdown) => expandStoredTokens(markdown, readMarkdownToken),
  slugify,
  onComplete: () => {
    actionsMenu.open = false;
  },
});

const handleCreateFolder = () => {
  const name = window.prompt("Nombre de la carpeta", "Nueva carpeta")?.trim();
  if (!name) return;

  const folder = {
    id: crypto.randomUUID(),
    name,
    createdAt: Date.now(),
    order: getVisibleFolders().length,
    deletedAt: null,
  };
  setFolders([...getFolders(), folder]);
  setActiveFolderId(folder.id);
  renderDocuments();
};

bindWorkspaceEvents({
  clearButton,
  newDocumentButton,
  newFolderButton,
  documentSearch,
  explorerFilterButtons,
  focusModeButton,
  focusExitButton,
  inspectorToggleButton,
  closeInspectorButton,
  themeToggleButton,
  openPreferencesButton,
  closePreferencesButton,
  openTemplatesButton,
  closeTemplatesButton,
  closeAssetPreviewButton,
  dismissNoticeButton,
  togglePresentationButton,
  presentationExitButton,
  preferenceWidthInput,
  preferenceDensityInput,
  preferenceTypographyInput,
  preferenceWrapInput,
  preferenceThemeInput,
  preview,
  openGuideButton,
  openFocusModeButton,
  closeGuideButton,
  closeHistoryButton,
  openSearchButton,
  openThemeButton,
  foldAllSectionsButton,
  unfoldAllSectionsButton,
  slashMenu,
  editorHost,
  actionsMenu,
  helpOverlay,
  historyOverlay,
  templateOverlay,
  preferencesOverlay,
  assetPreviewOverlay,
  workspace,
  closeSlashMenu,
  setMarkdown,
  setTemplatePickerVisible,
  getActiveFolderId,
  onCreateFolder: handleCreateFolder,
  renderDocuments,
  setExplorerFilter,
  setFocusMode,
  setInspectorVisible,
  applyTheme,
  setPreferencesVisible,
  setAssetPreviewVisible,
  setPersonalNoticeVisible,
  setPresentationMode,
  applyPreferences,
  syncChromeDensity,
  setGuideVisible,
  setHistoryVisible,
  openSearchInterface,
  onFoldAllSections: () => {
    foldAll(editor);
    renderOutline(getMarkdown());
    editor.focus();
  },
  onUnfoldAllSections: () => {
    unfoldAll(editor);
    renderOutline(getMarkdown());
    editor.focus();
  },
  isModKey,
  editCurrentSectionNote,
  slashMenuController: () => slashMenuController,
});

documentWorkflow = createDocumentWorkflow({
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
  getHistoryState: () => historyState,
  setHistoryVisible,
  setMarkdown,
  renderDocuments: () => renderDocuments(),
  onActiveDocumentChange: (documentId) => {
    activeDocumentId = documentId;
  },
});

editorCommands = createEditorCommands({
  getEditor: () => editor,
  getMarkdown,
  getActiveDocumentId: () => activeDocumentId,
  slugify,
  getBlockNotesMap,
  setBlockNotesMap,
  focusHeadingInEditor,
  moveHeadingSection,
  renderNotes: (...args) => previewRenderer.renderNotes(...args),
  renderOutline: (...args) => previewRenderer.renderOutline(...args),
  showButtonFeedback,
  getFormatButton,
});

previewRenderer = createPreviewRenderer({
  preview,
  outlineList,
  notesList,
  assetList,
  assetPreviewOverlay,
  assetPreviewBody,
  validationList,
  inspectorToggleButton,
  workspace,
  requestEditorFocus: () => editor?.focus(),
  setTemplatePickerVisible,
  setPreferencesVisible,
  getMarkdown,
  preprocessMarkdown,
  readMarkdownToken,
  slugify,
  getActiveDocumentId: () => activeDocumentId,
  getBlockNotesMap,
  setBlockNotesMap,
  getHeadingSectionsForEditor: getHeadingSections,
  renderAssetsOrderChange: () => previewRenderer.renderAssets(),
  isHeadingFolded,
  focusHeadingInEditor,
  moveHeadingSection,
  toggleHeadingFold,
  editSectionNote: (...args) => editorCommands.editSectionNote(...args),
  insertAtCursor: (...args) => editorCommands.insertAtCursor(...args),
  replaceImageAssetFromPicker,
  renameImageAsset,
  reorderImageAsset,
  removeImageAsset,
  stats,
});

const activeDocument = ensureActiveDocument();
activeDocumentId = activeDocument.id;
createEditor(activeDocument.markdown);
workspace.dataset.chrome = "resting";
workspace.dataset.view = getDefaultWorkspaceView();
syncViewButtons();
setPersonalNoticeVisible(storageGet(noticeStorageKey) !== "true");
setSidePanel(storageGet(sidePanelStorageKey) || "documents");
setInsertPanelVisible(storageGet(insertPanelStorageKey) ? storageGet(insertPanelStorageKey) !== "false" : !mobileViewMedia.matches);
setExplorerFilter(getExplorerFilter());
setInspectorVisible(storageGet(inspectorStorageKey) === "true");
applyPreferences(getPreferences(), { persist: false });
setFocusMode(storageGet(focusKey) === "true");
applyTheme(storageGet(themeKey) || "light", { persist: false });
setPresentationMode(storageGet(presentationKey) === "true");
renderDocuments();
renderMarkdown(getMarkdown());
saveDocument();
syncChromeDensity();
syncResponsiveWorkspace({ preserveView: true });

if (typeof ResizeObserver !== "undefined") {
  const stickyOffsetObserver = new ResizeObserver(() => updateStickyOffsets());
  if (topbar) stickyOffsetObserver.observe(topbar);
  if (sideTabs) stickyOffsetObserver.observe(sideTabs);
}

if (typeof mobileViewMedia.addEventListener === "function") {
  mobileViewMedia.addEventListener("change", () => syncResponsiveWorkspace({ preserveView: false }));
} else if (typeof mobileViewMedia.addListener === "function") {
  mobileViewMedia.addListener(() => syncResponsiveWorkspace({ preserveView: false }));
}

if (visualViewport) {
  visualViewport.addEventListener("resize", updateMobileViewportMetrics);
  visualViewport.addEventListener("scroll", updateMobileViewportMetrics);
}

window.addEventListener("resize", () => {
  updateStickyOffsets();
  updateMobileViewportMetrics();
});
