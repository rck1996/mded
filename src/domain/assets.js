import {
  getSortedImageEntries,
  getStoredAssetName,
  getStoredAssetOrder,
  getStoredAssetType,
  getStoredAssetValue,
  getStoredMap,
  getStoredValue,
  imageStoreKey,
  setStoredMap,
} from "../app/storage.js";

export const setImageAssetField = (assetId, values) => {
  const images = getStoredMap(imageStoreKey);
  const current = images[assetId];
  if (!current) return;
  images[assetId] = {
    value: getStoredAssetValue(current),
    name: getStoredAssetName(current),
    type: getStoredAssetType(current),
    order: getStoredAssetOrder(current),
    ...values,
  };
  setStoredMap(imageStoreKey, images);
};

export const reorderImageAsset = (assetId, direction) => {
  const entries = getSortedImageEntries();
  const currentIndex = entries.findIndex(([id]) => id === assetId);
  const targetIndex = currentIndex + direction;
  if (currentIndex < 0 || targetIndex < 0 || targetIndex >= entries.length) return false;
  const next = [...entries];
  const [moved] = next.splice(currentIndex, 1);
  next.splice(targetIndex, 0, moved);
  setStoredMap(
    imageStoreKey,
    Object.fromEntries(
      next.map(([id, asset], index) => [
        id,
        {
          value: getStoredAssetValue(asset),
          name: getStoredAssetName(asset),
          type: getStoredAssetType(asset),
          order: index,
        },
      ]),
    ),
  );
  return true;
};

export const renameImageAsset = (assetId, nextName) => {
  if (!nextName) return false;
  setImageAssetField(assetId, { name: nextName });
  return true;
};

export const removeImageAsset = (assetId) => {
  const images = getStoredMap(imageStoreKey);
  if (!(assetId in images)) return false;
  delete images[assetId];
  setStoredMap(imageStoreKey, images);
  return true;
};

export const countImageReferences = (markdown, assetId) => {
  const escapedId = assetId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`mded-image:${escapedId}`, "g");
  return (markdown.match(pattern) || []).length;
};

export const getImageAsset = (assetId) => getStoredMap(imageStoreKey)[assetId] || null;

export const getImageAssetCurrent = (assetId) => getStoredValue(imageStoreKey, assetId);

export const buildImageMarkdown = (assetId, name) => `![${name}](mded-image:${assetId})`;

export const getImageAssetExportEntries = () =>
  Object.entries(getStoredMap(imageStoreKey)).map(([id, asset]) => ({
    id,
    dataUrl: getStoredAssetValue(asset),
    name: getStoredAssetName(asset, id),
  }));
