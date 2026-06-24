import { marked } from "marked";

marked.use({ gfm: true, breaks: true });

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

export const expandStoredTokens = (markdown, readToken) =>
  markdown
    .replace(/mded-image:([a-z0-9-]+)/g, (_, id) => readToken("image", id) || "")
    .replace(/mded-link:([a-z0-9-]+)/g, (_, id) => readToken("link", id) || "#");

export const preprocessMarkdown = (markdown, readToken) =>
  expandStoredTokens(markdown, readToken).replace(/==([^=\n]+)==/g, "<mark>$1</mark>");

export const escapeHtml = (value) =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

export const sanitizeHtml = (html) => {
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

export const setSafeHtml = (element, html) => {
  element.innerHTML = sanitizeHtml(html);
};

export const renderMarkdownToHtml = (markdown, readToken) => marked.parse(preprocessMarkdown(markdown, readToken));

export const getExportHtmlDocument = ({ title, html, theme, preferences }) => `<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${escapeHtml(title)}</title>
    <style>
      :root {
        color-scheme: ${theme === "dark" ? "dark" : "light"};
        --bg: ${theme === "dark" ? "#111418" : "#f4f5f7"};
        --surface: ${theme === "dark" ? "#181c21" : "#ffffff"};
        --text: ${theme === "dark" ? "#eef2f6" : "#111827"};
        --muted: ${theme === "dark" ? "#b7c0ca" : "#5f6b7a"};
        --border: ${theme === "dark" ? "#343b45" : "#d8dde6"};
        --code-bg: ${theme === "dark" ? "#151f28" : "#16202a"};
        --code-text: #eef4f7;
        --width: ${preferences.width === "wide" ? "1040px" : preferences.width === "narrow" ? "720px" : "860px"};
        --font: ${preferences.typography === "serif" ? "\"Iowan Old Style\", \"Palatino Linotype\", Georgia, serif" : preferences.typography === "mono" ? "\"SFMono-Regular\", \"Cascadia Code\", Consolas, monospace" : "Inter, system-ui, -apple-system, BlinkMacSystemFont, \"Segoe UI\", sans-serif"};
        --line-height: ${preferences.density === "compact" ? "1.58" : "1.72"};
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        background: var(--bg);
        color: var(--text);
        font-family: var(--font);
      }
      main {
        max-width: var(--width);
        margin: 0 auto;
        padding: 56px 28px 80px;
      }
      article {
        padding: 48px 56px;
        border: 1px solid var(--border);
        border-radius: 24px;
        background: var(--surface);
        line-height: var(--line-height);
      }
      h1, h2, h3, h4, h5, h6 { color: var(--text); line-height: 1.12; }
      h1 { margin: 0 0 18px; font-size: 42px; }
      h2 { margin: 38px 0 14px; font-size: 28px; }
      h3 { margin: 30px 0 12px; font-size: 22px; }
      p, li, td, th, blockquote { color: var(--text); }
      ul, ol { padding-left: 22px; }
      blockquote {
        margin: 18px 0;
        padding: 14px 16px;
        border-left: 3px solid var(--border);
        border-radius: 0 12px 12px 0;
        background: ${theme === "dark" ? "#1f252c" : "#f7f8fa"};
      }
      code {
        padding: 0.18em 0.42em;
        border-radius: 8px;
        background: ${theme === "dark" ? "#232933" : "#eef2f7"};
      }
      pre {
        overflow: auto;
        padding: 16px 18px;
        border-radius: 14px;
        background: var(--code-bg);
        color: var(--code-text);
      }
      pre code { padding: 0; background: transparent; color: inherit; }
      table {
        width: 100%;
        border-collapse: collapse;
        overflow: hidden;
        border: 1px solid var(--border);
        border-radius: 12px;
        background: ${theme === "dark" ? "#171b20" : "#ffffff"};
      }
      th, td {
        padding: 10px 12px;
        text-align: left;
        border-bottom: 1px solid var(--border);
      }
      tbody tr:last-child td { border-bottom: 0; }
      th { background: ${theme === "dark" ? "#232933" : "#f4f6f9"}; }
      img {
        display: block;
        max-width: 100%;
        height: auto;
        margin: 18px 0;
        border-radius: 14px;
      }
      a { color: ${theme === "dark" ? "#9bd8c8" : "#0b63ce"}; }
      hr { border: 0; border-top: 1px solid var(--border); margin: 28px 0; }
      @media (max-width: 760px) {
        main { padding: 24px 14px 40px; }
        article { padding: 24px 18px; border-radius: 18px; }
        h1 { font-size: 34px; }
        h2 { font-size: 24px; }
      }
    </style>
  </head>
  <body>
    <main>
      <article>
        ${html}
      </article>
    </main>
  </body>
</html>`;
