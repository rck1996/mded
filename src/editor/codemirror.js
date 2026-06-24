import { basicSetup, EditorView } from "codemirror";
import { defaultKeymap, history, historyKeymap, indentWithTab } from "@codemirror/commands";
import { markdown } from "@codemirror/lang-markdown";
import { codeFolding, defaultHighlightStyle, foldGutter, foldKeymap, foldService, syntaxHighlighting } from "@codemirror/language";
import { search, searchKeymap } from "@codemirror/search";
import { EditorState, Prec } from "@codemirror/state";
import { Decoration, ViewPlugin, WidgetType, keymap } from "@codemirror/view";

class InlineTokenWidget extends WidgetType {
  constructor(kind, label) {
    super();
    this.kind = kind;
    this.label = label;
  }

  eq(other) {
    return other.kind === this.kind && other.label === this.label;
  }

  toDOM() {
    const span = document.createElement("span");
    span.className = `cm-inline-token cm-inline-token-${this.kind}`;
    span.textContent = this.label;
    span.title = this.label;
    return span;
  }

  ignoreEvent() {
    return false;
  }
}

const createInlineTokenDecorations = ({ getImageTokenLabel, getLinkTokenLabel }) =>
  ViewPlugin.fromClass(
    class {
      constructor(view) {
        this.decorations = this.buildDecorations(view);
      }

      update(update) {
        if (update.docChanged || update.viewportChanged) this.decorations = this.buildDecorations(update.view);
      }

      buildDecorations(view) {
        const decorations = [];
        const imagePattern = /!\[([^\]]*)\]\((mded-image:[^)]+|data:image\/[^)]+)\)/g;
        const linkPattern = /\[([^\]]+)\]\((mded-link:[^)]+|https?:\/\/[^)\s]+)\)/g;
        const fullText = view.state.doc.toString();

        for (const match of fullText.matchAll(imagePattern)) {
          const start = match.index;
          const end = start + match[0].length;
          decorations.push(
            Decoration.replace({
              widget: new InlineTokenWidget("image", getImageTokenLabel(match[1], match[2])),
              inclusive: false,
            }).range(start, end),
          );
        }

        for (const match of fullText.matchAll(linkPattern)) {
          const start = match.index;
          const end = start + match[0].length;
          decorations.push(
            Decoration.replace({
              widget: new InlineTokenWidget("link", getLinkTokenLabel(match[1], match[2])),
              inclusive: false,
            }).range(start, end),
          );
        }

        return Decoration.set(decorations, true);
      }
    },
    {
      decorations: (value) => value.decorations,
    },
  );

const markdownHeadingFoldService = (getHeadingFoldRange) =>
  foldService.of((state, lineStart, lineEnd) => {
    const line = state.doc.lineAt(lineStart);
    if (line.from !== lineStart || line.to !== lineEnd) return null;
    return getHeadingFoldRange(state, lineStart);
  });

const editorTheme = EditorView.theme({
  "&": { height: "100%", fontSize: "15px" },
  ".cm-scroller": { fontFamily: '"Cascadia Code", Consolas, monospace', lineHeight: "1.65" },
  ".cm-content": { padding: "20px", minHeight: "100%" },
  ".cm-gutters": { borderRight: "1px solid var(--border)" },
  ".cm-foldGutter .cm-gutterElement": {
    color: "var(--muted)",
    fontSize: "11px",
  },
  ".cm-inline-token": {
    display: "inline-flex",
    alignItems: "center",
    maxWidth: "100%",
    minHeight: "24px",
    margin: "0 2px",
    padding: "0 10px",
    border: "1px solid var(--border)",
    borderRadius: "999px",
    backgroundColor: "var(--surface-muted)",
    color: "var(--text)",
    fontFamily: "Inter, system-ui, sans-serif",
    fontSize: "12px",
    fontWeight: "600",
    lineHeight: "1.2",
    verticalAlign: "middle",
  },
  ".cm-inline-token-image": {
    borderColor: "color-mix(in srgb, var(--accent) 28%, var(--border))",
    backgroundColor: "color-mix(in srgb, var(--accent) 10%, var(--surface))",
  },
  ".cm-inline-token-link": {
    borderColor: "color-mix(in srgb, #4f8cff 24%, var(--border))",
    backgroundColor: "color-mix(in srgb, #4f8cff 8%, var(--surface))",
  },
});

const createEditorListeners = ({
  isModKey,
  runFormatShortcut,
  isSlashActive,
  getSlashSelection,
  updateSlashSelection,
  executeSlashCommand,
  closeSlashMenu,
  updateSlashMenu,
  insertPastedImage,
  insertPastedLink,
  onEditorScroll,
  getEditorInstance,
}) =>
  EditorView.domEventHandlers({
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

      if (isSlashActive()) {
        const slash = getSlashSelection();
        if (event.key === "ArrowDown") {
          event.preventDefault();
          updateSlashSelection(Math.min(slash.selected + 1, slash.items.length - 1));
          return true;
        }
        if (event.key === "ArrowUp") {
          event.preventDefault();
          updateSlashSelection(Math.max(slash.selected - 1, 0));
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
      const editor = getEditorInstance();
      const coords = editor.posAtCoords({ x: event.clientX, y: event.clientY });
      if (coords !== null) editor.dispatch({ selection: { anchor: coords } });
      insertPastedImage(image);
      return true;
    },
    scroll() {
      onEditorScroll();
    },
  });

export const createCodeMirrorEditor = ({
  markdownText,
  parent,
  themeCompartment,
  wrapCompartment,
  initialThemeExtension,
  initialWrapExtension,
  getHeadingFoldRange,
  getImageTokenLabel,
  getLinkTokenLabel,
  isModKey,
  runFormatShortcut,
  isSlashActive,
  getSlashSelection,
  updateSlashSelection,
  executeSlashCommand,
  closeSlashMenu,
  updateSlashMenu,
  insertPastedImage,
  insertPastedLink,
  onEditorScroll,
  onDocChange,
  onOutlineChange,
  getEditorInstance,
}) =>
  new EditorView({
    parent,
    state: EditorState.create({
      doc: markdownText,
      extensions: [
        basicSetup,
        history(),
        markdown(),
        search({ top: true }),
        syntaxHighlighting(defaultHighlightStyle),
        codeFolding({ placeholderText: "…" }),
        foldGutter({
          openText: "−",
          closedText: "+",
        }),
        editorTheme,
        createInlineTokenDecorations({ getImageTokenLabel, getLinkTokenLabel }),
        markdownHeadingFoldService(getHeadingFoldRange),
        themeCompartment.of(initialThemeExtension),
        wrapCompartment.of(initialWrapExtension),
        createEditorListeners({
          isModKey,
          runFormatShortcut,
          isSlashActive,
          getSlashSelection,
          updateSlashSelection,
          executeSlashCommand,
          closeSlashMenu,
          updateSlashMenu,
          insertPastedImage,
          insertPastedLink,
          onEditorScroll,
          getEditorInstance,
        }),
        Prec.highest(keymap.of([indentWithTab, ...searchKeymap, ...foldKeymap, ...defaultKeymap, ...historyKeymap])),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) onDocChange();
          if (update.docChanged || update.selectionSet || update.viewportChanged) onOutlineChange(update.state.doc.toString());
        }),
      ],
    }),
  });
