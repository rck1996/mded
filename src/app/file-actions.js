const setButtonCopiedState = (button) => {
  const previous = button.textContent;
  button.textContent = "Copiado";
  setTimeout(() => {
    button.textContent = previous;
  }, 900);
};

export const copyTextWithFeedback = async ({ value, button, onComplete }) => {
  await navigator.clipboard.writeText(value);
  setButtonCopiedState(button);
  onComplete?.();
};

export const downloadFile = ({ filename, content, type, onComplete }) => {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
  onComplete?.();
};

export const exportAssetsArchive = async ({ entries, filename = "markeddown-assets.zip", onComplete }) => {
  const { default: JSZip } = await import("jszip");
  const zip = new JSZip();
  entries.forEach(({ id, dataUrl, name }) => {
    if (!dataUrl) return;
    const [, mime = "image/png", data = ""] = dataUrl.match(/^data:([^;]+);base64,(.+)$/) || [];
    const extension = mime.split("/")[1] || "png";
    zip.file(`${name || id}.${extension}`, data, { base64: true });
  });

  const blob = await zip.generateAsync({ type: "blob" });
  downloadFile({ filename, content: blob, type: "application/zip", onComplete });
};

export const bindFileActionButtons = ({
  copyMarkdownButton,
  copyHtmlButton,
  copyConfluenceButton,
  downloadMarkdownButton,
  exportHtmlButton,
  exportAssetsButton,
  getMarkdown,
  getPreviewHtml,
  getExportHtml,
  getAssetEntries,
  expandMarkdownTokens,
  slugify,
  onComplete,
}) => {
  copyMarkdownButton.addEventListener("click", () =>
    copyTextWithFeedback({
      value: expandMarkdownTokens(getMarkdown()),
      button: copyMarkdownButton,
      onComplete,
    }),
  );

  copyHtmlButton.addEventListener("click", () =>
    copyTextWithFeedback({
      value: getPreviewHtml(),
      button: copyHtmlButton,
      onComplete,
    }),
  );

  copyConfluenceButton.addEventListener("click", () =>
    copyTextWithFeedback({
      value: getPreviewHtml(),
      button: copyConfluenceButton,
      onComplete,
    }),
  );

  downloadMarkdownButton.addEventListener("click", () => {
    const title = slugify(getMarkdown().match(/^#\s+(.+)$/m)?.[1] || "documento") || "documento";
    downloadFile({
      filename: `${title}.md`,
      content: expandMarkdownTokens(getMarkdown()),
      type: "text/markdown;charset=utf-8",
      onComplete,
    });
  });

  exportHtmlButton.addEventListener("click", () => {
    const title = getMarkdown().match(/^#\s+(.+)$/m)?.[1] || "MarkEDdown";
    downloadFile({
      filename: `${slugify(title)}.html`,
      content: getExportHtml(title),
      type: "text/html;charset=utf-8",
      onComplete,
    });
  });

  exportAssetsButton.addEventListener("click", () =>
    exportAssetsArchive({
      entries: getAssetEntries(),
      onComplete,
    }),
  );
};
