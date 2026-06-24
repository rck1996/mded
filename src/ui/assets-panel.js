import {
  buildImageMarkdown,
  countImageReferences,
  getImageAsset,
} from "../domain/assets.js";
import { escapeHtml } from "../domain/markdown.js";
import {
  getSortedImageEntries,
  getStoredAssetName,
  getStoredAssetValue,
} from "../app/storage.js";

export const renderAssetPreview = ({
  assetId,
  markdown,
  container,
  onInsert,
  onReplace,
}) => {
  container.replaceChildren();
  if (!assetId) return false;

  const asset = getImageAsset(assetId);
  if (!asset) return false;

  const name = getStoredAssetName(asset, "imagen");
  const src = getStoredAssetValue(asset);
  const uses = countImageReferences(markdown, assetId);

  const image = document.createElement("img");
  image.src = src;
  image.alt = name;

  const meta = document.createElement("div");
  meta.className = "asset-preview-meta";
  meta.innerHTML = `<strong>${escapeHtml(name)}</strong><span>${uses} ${uses === 1 ? "uso" : "usos"}</span>`;

  const actions = document.createElement("div");
  actions.className = "asset-preview-actions";

  const reuse = document.createElement("button");
  reuse.type = "button";
  reuse.className = "panel-toggle";
  reuse.textContent = "Insertar";
  reuse.addEventListener("click", () => onInsert(buildImageMarkdown(assetId, name)));

  const replace = document.createElement("button");
  replace.type = "button";
  replace.className = "panel-toggle";
  replace.textContent = "Reemplazar";
  replace.addEventListener("click", () => onReplace(assetId));

  actions.append(reuse, replace);
  container.append(image, meta, actions);
  return true;
};

export const renderAssetsPanel = ({
  markdown,
  container,
  onPreview,
  onInsert,
  onRename,
  onReplace,
  onMove,
  onRemove,
}) => {
  const entries = getSortedImageEntries();
  container.innerHTML = entries.length ? "" : '<p class="empty-state">Pega o arrastra imagenes para reutilizarlas desde aqui.</p>';

  entries.forEach(([id, asset]) => {
    const src = getStoredAssetValue(asset);
    const name = getStoredAssetName(asset, "imagen");
    const references = countImageReferences(markdown, id);
    const item = document.createElement("div");
    item.className = "asset-item";

    const thumbnail = document.createElement("img");
    thumbnail.alt = name;
    thumbnail.loading = "lazy";
    thumbnail.src = src;
    thumbnail.addEventListener("click", () => onPreview(id));
    thumbnail.addEventListener("error", () => {
      thumbnail.replaceWith(Object.assign(document.createElement("span"), { className: "asset-fallback", textContent: "IMG" }));
    });

    const meta = document.createElement("div");
    meta.className = "asset-meta";
    const label = document.createElement("span");
    label.className = "asset-name";
    label.textContent = name;
    const details = document.createElement("small");
    details.textContent = `${references} ${references === 1 ? "uso" : "usos"}`;
    meta.append(label, details);

    const actions = document.createElement("div");
    actions.className = "asset-actions";

    const reuse = document.createElement("button");
    reuse.type = "button";
    reuse.textContent = "Usar";
    reuse.disabled = !src;
    reuse.addEventListener("click", () => onInsert(buildImageMarkdown(id, name)));

    const rename = document.createElement("button");
    rename.type = "button";
    rename.textContent = "Renombrar";
    rename.addEventListener("click", () => onRename(id));

    const replace = document.createElement("button");
    replace.type = "button";
    replace.textContent = "Reemplazar";
    replace.addEventListener("click", () => onReplace(id));

    const up = document.createElement("button");
    up.type = "button";
    up.textContent = "↑";
    up.title = "Mover arriba";
    up.addEventListener("click", () => onMove(id, -1));

    const down = document.createElement("button");
    down.type = "button";
    down.textContent = "↓";
    down.title = "Mover abajo";
    down.addEventListener("click", () => onMove(id, 1));

    const remove = document.createElement("button");
    remove.type = "button";
    remove.textContent = "Quitar";
    remove.addEventListener("click", () => onRemove(id));

    actions.append(reuse, rename, replace, up, down, remove);
    item.append(thumbnail, meta, actions);
    container.appendChild(item);
  });
};
