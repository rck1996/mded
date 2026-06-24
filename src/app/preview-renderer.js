import { marked } from "marked";
import { renderAssetPreview, renderAssetsPanel } from "../ui/assets-panel.js";
import { renderNotesPanel } from "../ui/notes-panel.js";
import { renderOutlinePanel } from "../ui/outline-panel.js";
import { getHeadingSectionKeys, getHeadingSections } from "../domain/outline.js";
import { setSafeHtml } from "../domain/markdown.js";

const applyHeadingAnchors = ({ preview, slugify }) => {
  const used = new Map();
  preview.querySelectorAll("h1, h2, h3, h4, h5, h6").forEach((heading) => {
    const base = slugify(heading.textContent || "seccion") || "seccion";
    const count = used.get(base) || 0;
    used.set(base, count + 1);
    heading.id = count ? `${base}-${count + 1}` : base;
  });
};

const renderFootnotes = ({ markdown, preview, slugify }) => {
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

const getReadableMarkdownText = (markdown) =>
  markdown
    .replace(/!\[([^\]]*)]\((?:mded-image:[^)]+|data:image\/[^)]+|https?:\/\/[^)\s]+)\)/gi, (_, alt) => ` ${alt?.trim() || "imagen"} `)
    .replace(/\[([^\]]+)]\((?:mded-link:[^)]+|https?:\/\/[^)\s]+|mailto:[^)]+|tel:[^)]+|#[^)]+)\)/gi, (_, text) => ` ${text.trim()} `)
    .replace(/```[\s\S]*?```/g, (block) => block.replace(/```[^\n]*\n?/g, " ").replace(/```/g, " "))
    .replace(/`([^`]+)`/g, " $1 ")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^>\s?/gm, "")
    .replace(/^\s*[-*+]\s+/gm, "")
    .replace(/^\s*\d+\.\s+/gm, "")
    .replace(/\[(?:x| )\]/gi, " ")
    .replace(/\|/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/[*_~]/g, "")
    .replace(/\s+/g, " ")
    .trim();

export const createPreviewRenderer = ({
  preview,
  outlineList,
  notesList,
  assetList,
  assetPreviewOverlay,
  assetPreviewBody,
  validationList,
  inspectorToggleButton,
  workspace,
  requestEditorFocus,
  setTemplatePickerVisible,
  setPreferencesVisible,
  getMarkdown,
  preprocessMarkdown,
  readMarkdownToken,
  slugify,
  getActiveDocumentId,
  getBlockNotesMap,
  setBlockNotesMap,
  getHeadingSectionsForEditor,
  renderAssetsOrderChange,
  isHeadingFolded,
  focusHeadingInEditor,
  moveHeadingSection,
  toggleHeadingFold,
  editSectionNote,
  insertAtCursor,
  replaceImageAssetFromPicker,
  renameImageAsset,
  reorderImageAsset,
  removeImageAsset,
  stats,
}) => {
  const renderOutline = (markdown, editorState) => {
    const headings = getHeadingSectionsForEditor(markdown);
    const noteKeys = getHeadingSectionKeys(headings, slugify);
    const notes = getBlockNotesMap(getActiveDocumentId());
    renderOutlinePanel({
      markdown,
      container: outlineList,
      preview,
      editorState,
      headings,
      noteKeys,
      notes,
      isHeadingFolded,
      slugify,
      onFocusHeading: focusHeadingInEditor,
      onMoveHeading: moveHeadingSection,
      onToggleHeadingFold: toggleHeadingFold,
      onEditSectionNote: editSectionNote,
    });
  };

  const renderNotes = (markdown) => {
    const sections = getHeadingSections(markdown);
    const keys = getHeadingSectionKeys(sections, slugify);
    const notes = getBlockNotesMap(getActiveDocumentId());
    const entries = sections
      .map((section, index) => ({ section, key: keys[index], note: notes[keys[index]] || "" }))
      .filter((entry) => entry.note);

    renderNotesPanel({
      container: notesList,
      entries,
      onFocusHeading: focusHeadingInEditor,
      onEditNote: editSectionNote,
      onRemoveNote: (key) => {
        const nextNotes = getBlockNotesMap(getActiveDocumentId());
        delete nextNotes[key];
        setBlockNotesMap(getActiveDocumentId(), nextNotes);
        renderNotes(getMarkdown());
        renderOutline(getMarkdown(), null);
      },
    });
  };

  const renderAssets = () => {
    renderAssetsPanel({
      markdown: getMarkdown(),
      container: assetList,
      onPreview: setAssetPreviewVisible,
      onInsert: insertAtCursor,
      onRename: renameImageAsset,
      onReplace: replaceImageAssetFromPicker,
      onMove: (id, direction) => {
        reorderImageAsset(id, direction);
        renderAssetsOrderChange();
      },
      onRemove: removeImageAsset,
    });
  };

  const setAssetPreviewVisible = (assetId = null) => {
    const visible = Boolean(assetId);
    assetPreviewOverlay.hidden = !visible;
    workspace.dataset.assetPreviewVisible = String(visible);
    assetPreviewBody.replaceChildren();

    if (!visible) {
      requestAnimationFrame(requestEditorFocus);
      return;
    }

    setTemplatePickerVisible(false);
    setPreferencesVisible(false);

    const rendered = renderAssetPreview({
      assetId,
      markdown: getMarkdown(),
      container: assetPreviewBody,
      onInsert: (value) => {
        insertAtCursor(value);
        setAssetPreviewVisible(null);
      },
      onReplace: replaceImageAssetFromPicker,
    });
    if (!rendered) setAssetPreviewVisible(null);
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
    const visibleText = getReadableMarkdownText(markdown);
    const words = visibleText ? visibleText.split(/\s+/).filter(Boolean).length : 0;
    const chars = visibleText.length;
    const readingMinutes = Math.max(1, Math.ceil(words / 220));
    stats.textContent = `${words} palabras - ${chars} caracteres - ${readingMinutes} min`;
  };

  const renderMarkdown = ({ markdown, editorState }) => {
    setSafeHtml(preview, marked.parse(preprocessMarkdown(markdown, readMarkdownToken)));
    applyHeadingAnchors({ preview, slugify });
    renderFootnotes({ markdown, preview, slugify });
    renderOutline(markdown, editorState);
    renderNotes(markdown);
    renderAssets();
    validateMarkdown(markdown);
    updateStats(markdown);
  };

  return {
    renderMarkdown,
    renderOutline,
    renderNotes,
    renderAssets,
    setAssetPreviewVisible,
  };
};
