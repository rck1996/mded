import "./styles.css";
import { basicSetup, EditorView } from "codemirror";
import { defaultKeymap, history, historyKeymap, indentWithTab } from "@codemirror/commands";
import { markdown } from "@codemirror/lang-markdown";
import { syntaxHighlighting, defaultHighlightStyle } from "@codemirror/language";
import { openSearchPanel, search, searchKeymap } from "@codemirror/search";
import { Compartment, EditorState, Prec } from "@codemirror/state";
import { keymap } from "@codemirror/view";
import JSZip from "jszip";
import { marked } from "marked";

const workspace = document.querySelector(".workspace");
const hiddenInput = document.querySelector("#markdown-input");
const editorHost = document.querySelector("#editor-host");
const preview = document.querySelector("#markdown-preview");
const slashMenu = document.querySelector("#slash-menu");
const slashList = document.querySelector("#slash-list");
const slashPreview = document.querySelector("#slash-preview");
const toolbarButtons = document.querySelectorAll("[data-format]");
const viewButtons = document.querySelectorAll("[data-view]");
const sidePanelButtons = document.querySelectorAll("[data-side-panel]");
const actionsMenu = document.querySelector(".actions-menu");
const clearButton = document.querySelector("#clear-document");
const showInsertButton = document.querySelector("#show-insert");
const hideSidePanelButton = document.querySelector("#hide-side-panel");
const copyMarkdownButton = document.querySelector("#copy-markdown");
const copyHtmlButton = document.querySelector("#copy-html");
const exportHtmlButton = document.querySelector("#export-html");
const copyConfluenceButton = document.querySelector("#copy-confluence");
const exportAssetsButton = document.querySelector("#export-assets");
const downloadMarkdownButton = document.querySelector("#download-markdown");
const focusModeButton = document.querySelector("#focus-mode");
const focusExitButton = document.querySelector("#focus-exit");
const inspectorToggleButton = document.querySelector("#inspector-toggle");
const closeInspectorButton = document.querySelector("#close-inspector");
const themeToggleButton = document.querySelector("#theme-toggle");
const openGuideButton = document.querySelector("#open-guide");
const openSearchButton = document.querySelector("#open-search");
const helpOverlay = document.querySelector("#help-overlay");
const closeGuideButton = document.querySelector("#close-guide");
const newDocumentButton = document.querySelector("#new-document");
const newFolderButton = document.querySelector("#new-folder");
const documentSearch = document.querySelector("#document-search");
const documentList = document.querySelector("#document-list");
const outlineList = document.querySelector("#outline-list");
const assetList = document.querySelector("#asset-list");
const validationList = document.querySelector("#validation-list");
const stats = document.querySelector("#document-stats");
const saveStatus = document.querySelector("#save-status");

const storageKey = "mdv-simple.document";
const documentsKey = "mded.documents";
const activeDocumentKey = "mded.activeDocument";
const foldersKey = "mded.folders";
const activeFolderKey = "mded.activeFolder";
const collapsedFoldersKey = "mded.collapsedFolders";
const insertPanelStorageKey = "mded.insertPanelVisible";
const sidePanelStorageKey = "mded.sidePanel";
const imageStoreKey = "mded.images";
const linkStoreKey = "mded.links";
const themeKey = "mded.theme";
const focusKey = "mded.focus";
const inspectorStorageKey = "mded.inspectorVisible";
const defaultFolderId = "general";

let feedbackTimer;
let saveTimer;
let activeDocumentId;
let editor;
const themeCompartment = new Compartment();
let slashState = {
  active: false,
  start: 0,
  end: 0,
  selected: 0,
  query: "",
  items: [],
};

marked.use({ gfm: true, breaks: true });

const defaultMarkdown = hiddenInput.value;

const storageGet = (key) => {
  try {
    return window.localStorage?.getItem(key) ?? null;
  } catch {
    return null;
  }
};

const storageSet = (key, value) => {
  try {
    window.localStorage?.setItem(key, value);
  } catch {
    // In restricted browser contexts, persistence may be unavailable.
  }
};

const darkEditorTheme = EditorView.theme(
  {
    "&": { backgroundColor: "#14171b", color: "#e4e6ea" },
    ".cm-content": { caretColor: "#f2f4f6" },
    ".cm-gutters": { backgroundColor: "#14171b", color: "#737b84", borderRightColor: "#2a3036" },
    ".cm-activeLine": { backgroundColor: "#1a1f24" },
    ".cm-activeLineGutter": { backgroundColor: "#1a1f24" },
    ".cm-selectionBackground": { backgroundColor: "#34433f !important" },
  },
  { dark: true },
);

const getStoredMap = (key) => {
  try {
    return JSON.parse(storageGet(key) || "{}");
  } catch {
    return {};
  }
};

const setStoredMap = (key, value) => {
  storageSet(key, JSON.stringify(value));
};

const getStoredValue = (key, id) => getStoredMap(key)[id];

const storeValue = (key, value, meta = {}) => {
  const id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  const map = getStoredMap(key);
  map[id] = { value, ...meta };
  setStoredMap(key, map);
  return id;
};

const readStoredValue = (key, id) => {
  const entry = getStoredValue(key, id);
  return typeof entry === "string" ? entry : entry?.value;
};

const getStoredAssetValue = (asset) => (typeof asset === "string" ? asset : asset?.value || "");
const getStoredAssetName = (asset, fallback = "imagen") =>
  (typeof asset === "string" ? fallback : asset?.name || fallback);

const slugify = (value) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");

const expandStoredTokens = (markdown) =>
  markdown
    .replace(/mded-image:([a-z0-9-]+)/g, (_, id) => readStoredValue(imageStoreKey, id) || "")
    .replace(/mded-link:([a-z0-9-]+)/g, (_, id) => readStoredValue(linkStoreKey, id) || "#");

const preprocessMarkdown = (markdown) =>
  expandStoredTokens(markdown).replace(/==([^=\n]+)==/g, "<mark>$1</mark>");

const escapeHtml = (value) =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const allowedHtmlTags = new Set([
  "A",
  "BLOCKQUOTE",
  "BR",
  "CODE",
  "DEL",
  "EM",
  "H1",
  "H2",
  "H3",
  "H4",
  "H5",
  "H6",
  "HR",
  "IMG",
  "INPUT",
  "LI",
  "MARK",
  "OL",
  "P",
  "PRE",
  "STRONG",
  "TABLE",
  "TBODY",
  "TD",
  "TH",
  "THEAD",
  "TR",
  "UL",
]);
const globalHtmlAttributes = new Set(["id", "class"]);
const allowedAttributesByTag = {
  A: new Set(["href", "title"]),
  IMG: new Set(["src", "alt", "title"]),
  INPUT: new Set(["type", "checked", "disabled"]),
  TD: new Set(["align"]),
  TH: new Set(["align"]),
};
const safeUrlPattern = /^(https?:|mailto:|tel:|#|\/(?!\/)|data:image\/(?:png|jpeg|jpg|gif|webp);base64,)/i;

const sanitizeHtml = (html) => {
  const template = document.createElement("template");
  template.innerHTML = html;

  [...template.content.querySelectorAll("*")].forEach((node) => {
    if (!allowedHtmlTags.has(node.tagName)) {
      node.replaceWith(document.createTextNode(node.textContent || ""));
      return;
    }

    [...node.attributes].forEach((attribute) => {
      const name = attribute.name.toLowerCase();
      const tagAllowed = allowedAttributesByTag[node.tagName]?.has(name);
      const globalAllowed = globalHtmlAttributes.has(name);
      if (!tagAllowed && !globalAllowed) {
        node.removeAttribute(attribute.name);
        return;
      }

      if ((name === "href" || name === "src") && !safeUrlPattern.test(attribute.value.trim())) {
        node.removeAttribute(attribute.name);
      }
    });

    if (node.tagName === "A") node.setAttribute("rel", "noopener noreferrer");
    if (node.tagName === "INPUT") {
      node.setAttribute("disabled", "");
      if (node.getAttribute("type") !== "checkbox") node.remove();
    }
  });

  return template.innerHTML;
};

const setSafeHtml = (element, html) => {
  element.innerHTML = sanitizeHtml(html);
};

const getDocumentFolderId = (doc) => doc.folderId || defaultFolderId;

const getFolders = () => {
  const general = { id: defaultFolderId, name: "General", createdAt: 0 };
  const stored = storageGet(foldersKey);

  if (!stored) {
    storageSet(foldersKey, JSON.stringify([general]));
    return [general];
  }

  try {
    const parsed = JSON.parse(stored);
    const folders = Array.isArray(parsed) ? parsed.filter((folder) => folder?.id && folder?.name) : [];
    const hasGeneral = folders.some((folder) => folder.id === defaultFolderId);
    return hasGeneral ? folders : [general, ...folders];
  } catch {
    storageSet(foldersKey, JSON.stringify([general]));
    return [general];
  }
};

const setFolders = (folders) => {
  const general = { id: defaultFolderId, name: "General", createdAt: 0 };
  const nextFolders = folders.some((folder) => folder.id === defaultFolderId) ? folders : [general, ...folders];
  storageSet(foldersKey, JSON.stringify(nextFolders));
};

const getActiveFolderId = () => {
  const storedFolderId = storageGet(activeFolderKey);
  return getFolders().some((folder) => folder.id === storedFolderId) ? storedFolderId : defaultFolderId;
};

const setActiveFolderId = (folderId) => {
  storageSet(activeFolderKey, folderId || defaultFolderId);
};

const getCollapsedFolders = () => getStoredMap(collapsedFoldersKey);

const setCollapsedFolders = (folders) => {
  setStoredMap(collapsedFoldersKey, folders);
};

const getDocuments = () => {
  const createInitial = () => {
    const migrated = storageGet(storageKey) || defaultMarkdown;
    const initial = [
      {
        id: crypto.randomUUID(),
        title: "Documento de ejemplo",
        markdown: migrated,
        folderId: defaultFolderId,
        updatedAt: Date.now(),
      },
    ];
    storageSet(documentsKey, JSON.stringify(initial));
    storageSet(activeDocumentKey, initial[0].id);
    return initial;
  };

  const stored = storageGet(documentsKey);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (!Array.isArray(parsed) || !parsed.length) return createInitial();
      const migrated = parsed.map((doc) => ({ ...doc, folderId: getDocumentFolderId(doc) }));
      if (JSON.stringify(parsed) !== JSON.stringify(migrated)) setDocuments(migrated);
      return migrated;
    } catch {
      return createInitial();
    }
  }

  return createInitial();
};

const setDocuments = (documents) => {
  storageSet(documentsKey, JSON.stringify(documents));
};

const createBlankDocument = (folderId = getActiveFolderId()) => ({
  id: crypto.randomUUID(),
  title: "Nuevo documento",
  markdown: "# Nuevo documento\n\nEmpieza a escribir aqui.",
  titleManual: false,
  folderId,
  updatedAt: Date.now(),
});

const getActiveDocument = () => {
  const documents = getDocuments();
  const storedActive = storageGet(activeDocumentKey);
  return documents.find((doc) => doc.id === storedActive) || documents[0];
};

const getDocumentTitle = (markdown) => markdown.match(/^#\s+(.+)$/m)?.[1]?.trim() || "Sin titulo";

const updateActiveDocument = (markdown) => {
  const documents = getDocuments();
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

const renderDocuments = () => {
  documentList.replaceChildren();
  const query = documentSearch.value.trim().toLowerCase();
  const folders = getFolders();
  const collapsedFolders = getCollapsedFolders();
  const documents = getDocuments().sort((a, b) => b.updatedAt - a.updatedAt);
  const visibleDocuments = documents.filter((doc) => `${doc.title} ${doc.markdown}`.toLowerCase().includes(query));

  if (!visibleDocuments.length) {
    const empty = document.createElement("p");
    empty.className = "empty-state";
    empty.textContent = query ? "No hay documentos con esa busqueda." : "No hay documentos.";
    documentList.appendChild(empty);
    return;
  }

  const createDocumentRow = (doc) => {
    const row = document.createElement("div");
    row.className = doc.id === activeDocumentId ? "document-row is-active" : "document-row";

    const button = document.createElement("button");
    button.type = "button";
    button.className = "document-item";
    const icon = document.createElement("span");
    icon.className = "document-icon";
    icon.textContent = "MD";
    const meta = document.createElement("span");
    meta.className = "document-meta";
    const title = document.createElement("span");
    title.textContent = doc.title;
    const date = document.createElement("small");
    date.textContent = new Date(doc.updatedAt).toLocaleDateString();
    meta.append(title, date);
    button.append(icon, meta);
    button.addEventListener("click", () => {
      activeDocumentId = doc.id;
      storageSet(activeDocumentKey, doc.id);
      setActiveFolderId(getDocumentFolderId(doc));
      setMarkdown(doc.markdown);
      renderDocuments();
    });

    const actions = document.createElement("details");
    actions.className = "document-actions-inline document-menu";
    const actionsSummary = document.createElement("summary");
    actionsSummary.setAttribute("aria-label", `Acciones de ${doc.title}`);
    actionsSummary.textContent = "...";
    const actionsContent = document.createElement("div");
    actionsContent.className = "document-menu-content";

    const rename = document.createElement("button");
    rename.type = "button";
    rename.textContent = "Renombrar";
    rename.addEventListener("click", () => {
      const title = window.prompt("Nombre del documento", doc.title)?.trim();
      if (!title) return;
      setDocuments(getDocuments().map((item) => (item.id === doc.id ? { ...item, title, titleManual: true } : item)));
      renderDocuments();
    });

    const duplicate = document.createElement("button");
    duplicate.type = "button";
    duplicate.textContent = "Duplicar";
    duplicate.addEventListener("click", () => {
      const copy = {
        ...doc,
        id: crypto.randomUUID(),
        title: `${doc.title} copia`,
        titleManual: true,
        folderId: getDocumentFolderId(doc),
        updatedAt: Date.now(),
      };
      setDocuments([copy, ...getDocuments()]);
      activeDocumentId = copy.id;
      storageSet(activeDocumentKey, copy.id);
      setActiveFolderId(getDocumentFolderId(copy));
      setMarkdown(copy.markdown);
      renderDocuments();
    });

    const move = document.createElement("button");
    move.type = "button";
    move.textContent = "Mover";
    move.addEventListener("click", () => {
      const currentFolder = folders.find((folder) => folder.id === getDocumentFolderId(doc));
      const folderList = folders.map((folder) => `- ${folder.name}`).join("\n");
      const targetName = window
        .prompt(`Mover a carpeta:\n${folderList}`, currentFolder?.name || "General")
        ?.trim();
      if (!targetName) return;

      const targetFolder = folders.find((folder) => folder.name.toLowerCase() === targetName.toLowerCase());
      if (!targetFolder) {
        window.alert("No encontre esa carpeta.");
        return;
      }

      setDocuments(
        getDocuments().map((item) =>
          item.id === doc.id ? { ...item, folderId: targetFolder.id, updatedAt: Date.now() } : item,
        ),
      );
      if (doc.id === activeDocumentId) setActiveFolderId(targetFolder.id);
      renderDocuments();
    });

    const close = document.createElement("button");
    close.type = "button";
    close.textContent = "Cerrar";
    close.addEventListener("click", () => {
      const allDocuments = getDocuments();
      const isUntouchedNewDocument =
        doc.title === "Nuevo documento" && doc.markdown.trim() === "# Nuevo documento\n\nEmpieza a escribir aqui.";
      if (!isUntouchedNewDocument && !window.confirm(`Cerrar "${doc.title}"?`)) return;

      const nextDocuments = allDocuments.filter((item) => item.id !== doc.id);
      const fallbackDocuments = nextDocuments.length ? nextDocuments : [createBlankDocument(getDocumentFolderId(doc))];
      const nextActive = doc.id === activeDocumentId ? fallbackDocuments[0] : getActiveDocument();

      setDocuments(fallbackDocuments);
      activeDocumentId = nextActive.id;
      storageSet(activeDocumentKey, activeDocumentId);
      setActiveFolderId(getDocumentFolderId(nextActive));
      setMarkdown(nextActive.markdown);
      renderDocuments();
    });

    actionsContent.append(rename, move, duplicate, close);
    actions.append(actionsSummary, actionsContent);
    row.append(button, actions);
    return row;
  };

  folders.forEach((folder) => {
    const folderDocuments = visibleDocuments.filter((doc) => getDocumentFolderId(doc) === folder.id);
    const hasDocuments = folderDocuments.length > 0;
    if (query && !hasDocuments) return;

    const group = document.createElement("section");
    group.className = "folder-group";
    if (folder.id === getActiveFolderId()) group.classList.add("is-active-folder");

    const header = document.createElement("div");
    header.className = "folder-row";

    const isCollapsed = !query && collapsedFolders[folder.id];
    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "folder-toggle";
    toggle.setAttribute("aria-expanded", String(!isCollapsed));
    toggle.textContent = isCollapsed ? ">" : "v";
    toggle.addEventListener("click", () => {
      collapsedFolders[folder.id] = !collapsedFolders[folder.id];
      setCollapsedFolders(collapsedFolders);
      setActiveFolderId(folder.id);
      renderDocuments();
    });

    const label = document.createElement("button");
    label.type = "button";
    label.className = "folder-label";
    label.addEventListener("click", () => {
      collapsedFolders[folder.id] = !collapsedFolders[folder.id];
      setCollapsedFolders(collapsedFolders);
      setActiveFolderId(folder.id);
      renderDocuments();
    });

    const folderIcon = document.createElement("span");
    folderIcon.className = "folder-icon";
    folderIcon.textContent = isCollapsed ? "DIR" : "DIR";
    const name = document.createElement("span");
    name.textContent = folder.name;
    const count = document.createElement("small");
    count.textContent = `${folderDocuments.length} ${folderDocuments.length === 1 ? "documento" : "documentos"}`;
    const folderMeta = document.createElement("span");
    folderMeta.className = "folder-meta";
    folderMeta.append(name, count);
    label.append(folderIcon, folderMeta);

    const folderActions = document.createElement("details");
    folderActions.className = "folder-actions folder-menu";
    const folderSummary = document.createElement("summary");
    folderSummary.setAttribute("aria-label", `Acciones de carpeta ${folder.name}`);
    folderSummary.textContent = "...";
    const folderMenuContent = document.createElement("div");
    folderMenuContent.className = "folder-menu-content";

    const addDocument = document.createElement("button");
    addDocument.type = "button";
    addDocument.textContent = "Nuevo documento";
    addDocument.title = "Nuevo documento en esta carpeta";
    addDocument.addEventListener("click", () => {
      const doc = createBlankDocument(folder.id);
      setDocuments([doc, ...getDocuments()]);
      activeDocumentId = doc.id;
      storageSet(activeDocumentKey, doc.id);
      setActiveFolderId(folder.id);
      setMarkdown(doc.markdown);
      renderDocuments();
    });

    const renameFolder = document.createElement("button");
    renameFolder.type = "button";
    renameFolder.textContent = "Renombrar";
    renameFolder.disabled = folder.id === defaultFolderId;
    renameFolder.addEventListener("click", () => {
      const nextName = window.prompt("Nombre de la carpeta", folder.name)?.trim();
      if (!nextName) return;
      setFolders(folders.map((item) => (item.id === folder.id ? { ...item, name: nextName } : item)));
      renderDocuments();
    });

    folderMenuContent.append(addDocument, renameFolder);
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
        empty.textContent = "Carpeta vacia.";
        folderBody.appendChild(empty);
      }
      group.appendChild(folderBody);
    }

    documentList.appendChild(group);
  });
};

const applyHeadingAnchors = () => {
  const used = new Map();
  preview.querySelectorAll("h1, h2, h3, h4, h5, h6").forEach((heading) => {
    const base = slugify(heading.textContent || "seccion") || "seccion";
    const count = used.get(base) || 0;
    used.set(base, count + 1);
    heading.id = count ? `${base}-${count + 1}` : base;
  });
};

const renderFootnotes = (markdown) => {
  const notes = [...markdown.matchAll(/^\[\^([^\]]+)\]:\s+(.+)$/gm)];
  if (!notes.length) return;

  const list = document.createElement("ol");
  list.className = "footnotes-list";
  notes.forEach((match) => {
    const item = document.createElement("li");
    item.id = `fn-${slugify(match[1])}`;
    setSafeHtml(item, marked.parseInline(match[2]));
    list.appendChild(item);
  });

  const section = document.createElement("section");
  section.className = "footnotes";
  const title = document.createElement("h2");
  title.textContent = "Notas";
  section.appendChild(title);
  section.appendChild(list);
  preview.appendChild(section);
};

const renderOutline = (markdown) => {
  const headings = [...markdown.matchAll(/^(#{1,6})\s+(.+)$/gm)].map((match) => ({
    level: match[1].length,
    text: match[2].trim(),
  }));

  outlineList.innerHTML = headings.length ? "" : '<p class="empty-state">Sin titulos todavia.</p>';
  headings.forEach((heading) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "outline-item";
    button.style.setProperty("--level", heading.level);
    button.textContent = heading.text;
    button.addEventListener("click", () => {
      preview.querySelector(`#${slugify(heading.text)}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    outlineList.appendChild(button);
  });
};

const renderAssets = () => {
  const images = getStoredMap(imageStoreKey);
  const entries = Object.entries(images);
  assetList.innerHTML = entries.length ? "" : '<p class="empty-state">Pega o arrastra imagenes.</p>';

  entries.forEach(([id, asset]) => {
    const src = getStoredAssetValue(asset);
    const name = getStoredAssetName(asset, "imagen");
    const item = document.createElement("div");
    item.className = "asset-item";

    const thumbnail = document.createElement("img");
    thumbnail.alt = name;
    thumbnail.loading = "lazy";
    thumbnail.src = src;
    thumbnail.addEventListener("error", () => {
      thumbnail.replaceWith(Object.assign(document.createElement("span"), { className: "asset-fallback", textContent: "IMG" }));
    });

    const label = document.createElement("span");
    label.textContent = name;

    const reuse = document.createElement("button");
    reuse.type = "button";
    reuse.textContent = "Usar";
    reuse.disabled = !src;
    reuse.addEventListener("click", () => insertAtCursor(`![${name}](mded-image:${id})`));
    item.append(thumbnail, label, reuse);
    assetList.appendChild(item);
  });
};

const validateMarkdown = (markdown) => {
  const issues = [];
  const headings = [...markdown.matchAll(/^(#{1,6})\s+(.+)$/gm)].map((match) => match[1].length);

  headings.forEach((level, index) => {
    if (index > 0 && level > headings[index - 1] + 1) {
      issues.push("Hay un salto brusco de jerarquia en los titulos.");
    }
  });

  if (/\[[^\]]*]\(\s*\)/.test(markdown)) issues.push("Hay enlaces sin URL.");
  if (/!\[\s*]\([^)]+\)/.test(markdown)) issues.push("Hay imagenes sin texto alternativo.");
  if (/^\|.+\|$/m.test(markdown) && !/^\|\s*-+/.test(markdown)) issues.push("Puede haber una tabla sin fila separadora.");

  inspectorToggleButton.textContent = issues.length ? `${issues.length} alertas` : "Sin alertas";
  inspectorToggleButton.classList.toggle("has-issues", issues.length > 0);
  validationList.innerHTML = issues.length ? "" : '<p class="empty-state success">Sin alertas.</p>';
  issues.forEach((issue) => {
    const item = document.createElement("p");
    item.className = "validation-item";
    item.textContent = issue;
    validationList.appendChild(item);
  });
};

const updateStats = (markdown) => {
  const words = markdown.trim().split(/\s+/).filter(Boolean).length;
  const chars = markdown.length;
  const readingMinutes = Math.max(1, Math.ceil(words / 220));
  stats.textContent = `${words} palabras - ${chars} caracteres - ${readingMinutes} min`;
};

const renderMarkdown = (markdown) => {
  setSafeHtml(preview, marked.parse(preprocessMarkdown(markdown)));
  applyHeadingAnchors();
  renderFootnotes(markdown);
  renderOutline(markdown);
  renderAssets();
  validateMarkdown(markdown);
  updateStats(markdown);
};

const setSaveStatus = (value) => {
  saveStatus.textContent = value;
  saveStatus.dataset.state = value === "Guardando" ? "saving" : "saved";
};

const saveDocument = () => {
  const markdown = getMarkdown();
  updateActiveDocument(markdown);
  storageSet(storageKey, markdown);
  renderDocuments();
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

const insertAtCursor = (value) => {
  const selection = editor.state.selection.main;
  const prefix = selection.from > 0 && editor.state.doc.sliceString(selection.from - 1, selection.from) !== "\n" ? "\n" : "";
  const suffix = editor.state.doc.sliceString(selection.to, selection.to + 1) && editor.state.doc.sliceString(selection.to, selection.to + 1) !== "\n" ? "\n" : "";
  const insert = `${prefix}${value}${suffix}`;

  editor.dispatch({
    changes: { from: selection.from, to: selection.to, insert },
    selection: { anchor: selection.from + insert.length },
  });
  editor.focus();
};

const wrapSelection = (before, after = "", fallback = "texto") => {
  const selection = editor.state.selection.main;
  const selected = editor.state.doc.sliceString(selection.from, selection.to) || fallback;
  editor.dispatch({
    changes: { from: selection.from, to: selection.to, insert: `${before}${selected}${after}` },
    selection: { anchor: selection.from + before.length, head: selection.from + before.length + selected.length },
  });
  editor.focus();
};

const showButtonFeedback = (button) => {
  if (!button) return;
  clearTimeout(feedbackTimer);
  button.classList.add("is-active");
  feedbackTimer = setTimeout(() => button.classList.remove("is-active"), 180);
};

const getFormatButton = (format) => document.querySelector(`[data-format="${format}"]`);

const isModKey = (event) => event.metaKey || event.ctrlKey;

const getThemeExtension = (theme) => (theme === "dark" ? darkEditorTheme : []);

const applyTheme = (theme, { persist = true } = {}) => {
  workspace.dataset.theme = theme;
  themeToggleButton.textContent = theme === "dark" ? "Claro" : "Oscuro";
  if (persist) storageSet(themeKey, theme);
  if (editor) {
    editor.dispatch({
      effects: themeCompartment.reconfigure(getThemeExtension(theme)),
    });
  }
};

const setGuideVisible = (visible) => {
  helpOverlay.hidden = !visible;
  workspace.dataset.guideVisible = String(visible);
  if (visible) {
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
};

const openSearchInterface = () => {
  actionsMenu.open = false;
  setGuideVisible(false);
  if (!editor) return;
  openSearchPanel(editor);
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

const slashCommands = [
  ["h1", "Titulo 1", "Encabezado principal", "# Titulo principal", "titulo heading h1 principal"],
  ["h2", "Titulo 2", "Seccion del documento", "## Subtitulo", "titulo heading h2 subtitulo seccion"],
  ["h3", "Titulo 3", "Subseccion", "### Seccion", "titulo heading h3 seccion"],
  ["h4", "Titulo 4", "Apartado menor", "#### Apartado", "titulo heading h4 apartado"],
  ["h5", "Titulo 5", "Detalle", "##### Detalle", "titulo heading h5 detalle"],
  ["h6", "Titulo 6", "Nota menor", "###### Nota menor", "titulo heading h6 nota menor"],
  ["hr", "Separador", "Linea horizontal", "---", "separador linea horizontal divisor"],
  ["toc", "Indice", "Links a secciones", "## Indice\n\n- [Introduccion](#introduccion)", "indice toc contenido"],
  ["bold", "Negrita", "Texto importante", "**texto importante**", "negrita bold fuerte"],
  ["italic", "Cursiva", "Enfasis suave", "*texto en cursiva*", "cursiva italic enfasis"],
  ["strike", "Tachado", "Texto eliminado", "~~texto tachado~~", "tachado strike"],
  ["inlineCode", "Codigo inline", "Codigo en linea", "`codigo`", "codigo inline code"],
  ["highlight", "Marcado", "Texto resaltado", "==texto resaltado==", "marcado resaltado"],
  ["ul", "Lista con vinetas", "Puntos simples", "- Primer punto\n- Segundo punto", "lista vinetas puntos"],
  ["ol", "Lista numerada", "Pasos ordenados", "1. Primer paso\n2. Segundo paso", "lista numerada pasos"],
  ["task", "Lista de tareas", "Checklist con pendientes", "- [x] Tarea completada\n- [ ] Tarea pendiente", "tareas checklist"],
  ["nested", "Sublista", "Lista anidada", "- Tema principal\n  - Detalle relacionado", "sublista anidada"],
  ["quote", "Cita", "Bloque destacado", "> Cita o nota destacada", "cita quote"],
  ["callout", "Nota", "Aclaracion importante", "> **Nota:** escribe aqui una aclaracion importante.", "nota callout aviso"],
  ["link", "Enlace", "Texto con URL", "[Texto del enlace](https://ejemplo.com)", "link enlace url"],
  ["image", "Imagen", "Markdown de imagen", "![Descripcion](https://...)", "imagen foto media"],
  ["table", "Tabla", "Filas y columnas", "| Elemento | Estado |\n| --- | --- |\n| Editor | Listo |", "tabla columnas filas"],
  ["codeBlock", "Bloque de codigo", "Codigo con lenguaje", "```js\nconsole.log(\"Hola\")\n```", "codigo bloque"],
  ["details", "Desplegable", "Contenido colapsable", "<details>\n<summary>Ver mas</summary>\n\nContenido oculto\n\n</details>", "desplegable detalles"],
  ["footnote", "Nota al pie", "Referencia con explicacion", "Texto con nota[^1]\n\n[^1]: Explicacion", "nota pie footnote"],
  ["definition", "Definicion", "Termino y descripcion", "Termino\n: Definicion breve", "definicion termino"],
  ["mermaid", "Diagrama", "Bloque Mermaid", "```mermaid\ngraph TD\nA --> B\n```", "diagrama mermaid flujo"],
].map(([id, title, hint, previewText, keywords]) => ({ id, title, hint, preview: previewText, keywords }));

const getSlashMatch = () => {
  const cursor = editor.state.selection.main.head;
  const line = editor.state.doc.lineAt(cursor);
  const before = editor.state.doc.sliceString(line.from, cursor);
  const match = before.match(/^\/([a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s-]*)$/);
  if (!match) return null;
  return { start: line.from, end: cursor, query: match[1].trim().toLowerCase() };
};

const getCommandMatches = (query) =>
  query
    ? slashCommands.filter((command) => `${command.title} ${command.hint} ${command.keywords}`.toLowerCase().includes(query))
    : slashCommands;

const renderSlashPreview = () => {
  const activeCommand = slashState.items[slashState.selected];
  slashPreview.replaceChildren();
  const title = document.createElement("strong");
  title.textContent = activeCommand ? activeCommand.title : "Sin resultados";
  slashPreview.appendChild(title);

  if (!activeCommand) {
    const body = document.createElement("p");
    body.textContent = "Prueba con otro termino.";
    slashPreview.appendChild(body);
    return;
  }

  const rendered = document.createElement("div");
  rendered.className = "slash-preview-rendered";
  setSafeHtml(rendered, marked.parse(preprocessMarkdown(activeCommand.preview)));

  const snippetLabel = document.createElement("span");
  snippetLabel.className = "slash-preview-label";
  snippetLabel.textContent = "Markdown";

  const snippet = document.createElement("pre");
  snippet.className = "slash-preview-code";
  snippet.textContent = activeCommand.preview;
  slashPreview.append(rendered, snippetLabel, snippet);
};

const updateSlashSelection = (index) => {
  slashState.selected = index;
  [...slashList.children].forEach((item, itemIndex) => {
    item.classList.toggle("is-selected", itemIndex === slashState.selected);
  });
  renderSlashPreview();
};

const renderSlashMenu = () => {
  slashList.replaceChildren();

  slashState.items.forEach((command, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = index === slashState.selected ? "slash-item is-selected" : "slash-item";
    const title = document.createElement("span");
    title.textContent = command.title;
    const hint = document.createElement("small");
    hint.textContent = command.hint;
    button.append(title, hint);
    button.addEventListener("mouseenter", () => updateSlashSelection(index));
    button.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      updateSlashSelection(index);
      executeSlashCommand(command);
    });
    slashList.appendChild(button);
  });

  renderSlashPreview();
};

const positionSlashMenu = () => {
  const cursor = editor.state.selection.main.head;
  const coords = editor.coordsAtPos(cursor);
  const panel = document.querySelector(".editor-panel").getBoundingClientRect();
  if (!coords) return;
  slashMenu.style.left = `${Math.max(14, Math.min(coords.left - panel.left, panel.width - 454))}px`;
  slashMenu.style.top = `${Math.max(52, Math.min(coords.bottom - panel.top + 8, panel.height - 310))}px`;
};

const openSlashMenu = (match) => {
  slashState = {
    active: true,
    start: match.start,
    end: match.end,
    selected: 0,
    query: match.query,
    items: getCommandMatches(match.query),
  };
  slashMenu.hidden = false;
  positionSlashMenu();
  renderSlashMenu();
};

const closeSlashMenu = () => {
  slashState.active = false;
  slashMenu.hidden = true;
};

const updateSlashMenu = () => {
  const match = getSlashMatch();
  if (!match) {
    closeSlashMenu();
    return;
  }
  openSlashMenu(match);
};

const executeSlashCommand = (selectedCommand) => {
  const command = selectedCommand || slashState.items[slashState.selected];
  if (!command) return;
  editor.dispatch({
    changes: { from: slashState.start, to: slashState.end, insert: command.preview },
    selection: { anchor: slashState.start + command.preview.length },
  });
  closeSlashMenu();
  editor.focus();
};

const insertPastedImage = (file) => {
  const reader = new FileReader();
  reader.addEventListener("load", () => {
    const name = file.name ? file.name.replace(/\.[^.]+$/, "") : "imagen pegada";
    const id = storeValue(imageStoreKey, reader.result, { name, type: file.type });
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

const editorTheme = EditorView.theme({
  "&": { height: "100%", fontSize: "15px" },
  ".cm-scroller": { fontFamily: '"Cascadia Code", Consolas, monospace', lineHeight: "1.65" },
  ".cm-content": { padding: "20px", minHeight: "100%" },
  ".cm-gutters": { borderRight: "1px solid var(--border)" },
});

const editorListeners = EditorView.domEventHandlers({
  keydown(event) {
    if (isModKey(event) && !event.altKey) {
      const key = event.key.toLowerCase();
      if (key === "b") {
        event.preventDefault();
        runFormatShortcut("bold");
        return true;
      }
      if (key === "i") {
        event.preventDefault();
        runFormatShortcut("italic");
        return true;
      }
      if (key === "k") {
        event.preventDefault();
        runFormatShortcut("link");
        return true;
      }
    }

    if (slashState.active) {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        updateSlashSelection(Math.min(slashState.selected + 1, slashState.items.length - 1));
        return true;
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        updateSlashSelection(Math.max(slashState.selected - 1, 0));
        return true;
      }
      if (event.key === "Enter") {
        event.preventDefault();
        executeSlashCommand();
        return true;
      }
      if (event.key === "Escape") {
        event.preventDefault();
        closeSlashMenu();
        return true;
      }
    }
    return false;
  },
  keyup(event) {
    if (!["ArrowDown", "ArrowUp", "Enter", "Escape"].includes(event.key)) updateSlashMenu();
  },
  paste(event) {
    const image = [...event.clipboardData.files].find((file) => file.type.startsWith("image/"));
    if (image) {
      event.preventDefault();
      insertPastedImage(image);
      return true;
    }
    const text = event.clipboardData.getData("text/plain").trim();
    if (/^https?:\/\/\S+$/i.test(text)) {
      event.preventDefault();
      insertPastedLink(text);
      return true;
    }
    return false;
  },
  drop(event) {
    const image = [...event.dataTransfer.files].find((file) => file.type.startsWith("image/"));
    if (!image) return false;
    event.preventDefault();
    const coords = editor.posAtCoords({ x: event.clientX, y: event.clientY });
    if (coords !== null) editor.dispatch({ selection: { anchor: coords } });
    insertPastedImage(image);
    return true;
  },
  scroll() {
    if (slashState.active) positionSlashMenu();
    syncChromeDensity();
  },
});

const createEditor = (markdownText) => {
  editor = new EditorView({
    parent: editorHost,
    state: EditorState.create({
      doc: markdownText,
      extensions: [
        basicSetup,
        history(),
        markdown(),
        search({ top: true }),
        syntaxHighlighting(defaultHighlightStyle),
        editorTheme,
        themeCompartment.of(getThemeExtension(storageGet(themeKey) === "dark" ? "dark" : "light")),
        editorListeners,
        Prec.highest(keymap.of([indentWithTab, ...searchKeymap, ...defaultKeymap, ...historyKeymap])),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) syncDocument();
        }),
      ],
    }),
  });
};

const copyText = async (value, button) => {
  if (navigator.clipboard) {
    await navigator.clipboard.writeText(value);
  } else {
    await navigator.clipboard.writeText(value);
  }
  const previous = button.textContent;
  button.textContent = "Copiado";
  setTimeout(() => {
    button.textContent = previous;
  }, 900);
  actionsMenu.open = false;
};

const downloadFile = (filename, content, type) => {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
  actionsMenu.open = false;
};

toolbarButtons.forEach((button) => {
  button.addEventListener("click", () => {
    applyFormat(button.dataset.format);
    showButtonFeedback(button);
  });
});

viewButtons.forEach((button) => {
  button.addEventListener("click", () => {
    viewButtons.forEach((item) => item.classList.remove("is-selected"));
    button.classList.add("is-selected");
    workspace.dataset.view = button.dataset.view;
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

const refreshEditorLayout = () => {
  requestAnimationFrame(() => {
    editor?.requestMeasure();
    editor?.focus();
  });
};

const setFocusMode = (enabled) => {
  workspace.dataset.focus = String(enabled);
  focusModeButton.textContent = enabled ? "Salir foco" : "Foco";
  storageSet(focusKey, String(enabled));
  closeSlashMenu();
  if (enabled) setGuideVisible(false);
  refreshEditorLayout();
};

const setInspectorVisible = (visible) => {
  workspace.dataset.inspectorVisible = String(visible);
  storageSet(inspectorStorageKey, String(visible));
};

copyMarkdownButton.addEventListener("click", () => copyText(expandStoredTokens(getMarkdown()), copyMarkdownButton));
copyHtmlButton.addEventListener("click", () => copyText(preview.innerHTML, copyHtmlButton));
copyConfluenceButton.addEventListener("click", () => copyText(preview.innerHTML, copyConfluenceButton));

downloadMarkdownButton.addEventListener("click", () => {
  const title = slugify(getMarkdown().match(/^#\s+(.+)$/m)?.[1] || "documento") || "documento";
  downloadFile(`${title}.md`, expandStoredTokens(getMarkdown()), "text/markdown;charset=utf-8");
});

exportHtmlButton.addEventListener("click", () => {
  const title = getMarkdown().match(/^#\s+(.+)$/m)?.[1] || "MDed";
  const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>${escapeHtml(title)}</title></head><body>${preview.innerHTML}</body></html>`;
  downloadFile(`${slugify(title)}.html`, html, "text/html;charset=utf-8");
});

exportAssetsButton.addEventListener("click", async () => {
  const zip = new JSZip();
  Object.entries(getStoredMap(imageStoreKey)).forEach(([id, asset]) => {
    const dataUrl = getStoredAssetValue(asset);
    if (!dataUrl) return;
    const [, mime = "image/png", data = ""] = dataUrl.match(/^data:([^;]+);base64,(.+)$/) || [];
    const extension = mime.split("/")[1] || "png";
    zip.file(`${getStoredAssetName(asset, id)}.${extension}`, data, { base64: true });
  });
  const blob = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "mded-assets.zip";
  link.click();
  URL.revokeObjectURL(url);
  actionsMenu.open = false;
});

clearButton.addEventListener("click", () => {
  setMarkdown("# Nuevo documento\n\nEmpieza a escribir aqui.");
  actionsMenu.open = false;
});

newDocumentButton.addEventListener("click", () => {
  const documents = getDocuments();
  const doc = createBlankDocument(getActiveFolderId());
  setDocuments([doc, ...documents]);
  activeDocumentId = doc.id;
  storageSet(activeDocumentKey, doc.id);
  setActiveFolderId(getDocumentFolderId(doc));
  setMarkdown(doc.markdown);
  renderDocuments();
});

newFolderButton.addEventListener("click", () => {
  const name = window.prompt("Nombre de la carpeta", "Nueva carpeta")?.trim();
  if (!name) return;

  const folder = {
    id: crypto.randomUUID(),
    name,
    createdAt: Date.now(),
  };
  setFolders([...getFolders(), folder]);
  setActiveFolderId(folder.id);
  renderDocuments();
});

documentSearch.addEventListener("input", renderDocuments);

focusModeButton.addEventListener("click", () => {
  setFocusMode(workspace.dataset.focus !== "true");
});

focusExitButton.addEventListener("click", () => {
  setFocusMode(false);
});

inspectorToggleButton.addEventListener("click", () => {
  setInspectorVisible(workspace.dataset.inspectorVisible !== "true");
});

closeInspectorButton.addEventListener("click", () => {
  setInspectorVisible(false);
});

themeToggleButton.addEventListener("click", () => {
  const next = workspace.dataset.theme === "dark" ? "light" : "dark";
  applyTheme(next);
});

preview.addEventListener("scroll", () => {
  closeSlashMenu();
  syncChromeDensity();
});

openGuideButton.addEventListener("click", () => {
  setGuideVisible(true);
});

closeGuideButton.addEventListener("click", () => {
  setGuideVisible(false);
});

openSearchButton.addEventListener("click", () => {
  openSearchInterface();
});

document.addEventListener("click", (event) => {
  if (!slashMenu.contains(event.target) && !editorHost.contains(event.target)) closeSlashMenu();
  if (!actionsMenu.contains(event.target)) actionsMenu.open = false;
  if (!helpOverlay.hidden && event.target === helpOverlay) setGuideVisible(false);
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    if (!helpOverlay.hidden) {
      setGuideVisible(false);
      return;
    }
    if (slashState.active) {
      closeSlashMenu();
      return;
    }
    if (actionsMenu.open) {
      actionsMenu.open = false;
      return;
    }
  }

  if (event.key === "Escape" && workspace.dataset.focus === "true") {
    setFocusMode(false);
    return;
  }

  if (event.key === "F1") {
    event.preventDefault();
    setGuideVisible(true);
    return;
  }

  if (isModKey(event) && event.shiftKey && event.key.toLowerCase() === "h") {
    event.preventDefault();
    openSearchInterface();
    return;
  }

  if (isModKey(event) && event.shiftKey && event.key.toLowerCase() === "f") {
    event.preventDefault();
    setFocusMode(workspace.dataset.focus !== "true");
    return;
  }

  if (isModKey(event) && event.key === ".") {
    event.preventDefault();
    setInspectorVisible(workspace.dataset.inspectorVisible !== "true");
    return;
  }
});

const activeDocument = getActiveDocument();
activeDocumentId = activeDocument.id;
createEditor(activeDocument.markdown);
workspace.dataset.chrome = "resting";
setSidePanel(storageGet(sidePanelStorageKey) || "documents");
setInsertPanelVisible(storageGet(insertPanelStorageKey) !== "false");
setInspectorVisible(storageGet(inspectorStorageKey) === "true");
setFocusMode(storageGet(focusKey) === "true");
applyTheme(storageGet(themeKey) || "light", { persist: false });
renderDocuments();
renderMarkdown(getMarkdown());
saveDocument();
syncChromeDensity();
