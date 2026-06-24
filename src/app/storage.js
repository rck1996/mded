export const storageKey = "mdv-simple.document";
export const documentsKey = "mded.documents";
export const activeDocumentKey = "mded.activeDocument";
export const foldersKey = "mded.folders";
export const activeFolderKey = "mded.activeFolder";
export const collapsedFoldersKey = "mded.collapsedFolders";
export const explorerFilterKey = "mded.explorerFilter";
export const insertPanelStorageKey = "mded.insertPanelVisible";
export const sidePanelStorageKey = "mded.sidePanel";
export const imageStoreKey = "mded.images";
export const linkStoreKey = "mded.links";
export const themeKey = "mded.theme";
export const focusKey = "mded.focus";
export const inspectorStorageKey = "mded.inspectorVisible";
export const preferencesStorageKey = "mded.preferences";
export const presentationKey = "mded.presentation";
export const previousViewKey = "mded.previousView";
export const blockNotesKey = "mded.blockNotes";
export const noticeStorageKey = "markeddown.noticeDismissed";

export const defaultPreferences = {
  width: "regular",
  density: "comfortable",
  typography: "system",
  wrap: "on",
};

export const storageGet = (key) => {
  try {
    return window.localStorage?.getItem(key) ?? null;
  } catch {
    return null;
  }
};

export const storageSet = (key, value) => {
  try {
    window.localStorage?.setItem(key, value);
  } catch {
    // In restricted browser contexts, persistence may be unavailable.
  }
};

export const getPreferences = () => {
  try {
    const parsed = JSON.parse(storageGet(preferencesStorageKey) || "{}");
    return {
      width: ["narrow", "regular", "wide"].includes(parsed.width) ? parsed.width : defaultPreferences.width,
      density: ["comfortable", "compact"].includes(parsed.density) ? parsed.density : defaultPreferences.density,
      typography: ["system", "serif", "mono"].includes(parsed.typography) ? parsed.typography : defaultPreferences.typography,
      wrap: ["on", "off"].includes(parsed.wrap) ? parsed.wrap : defaultPreferences.wrap,
    };
  } catch {
    return { ...defaultPreferences };
  }
};

export const setPreferences = (preferences) => {
  storageSet(preferencesStorageKey, JSON.stringify(preferences));
};

export const getStoredMap = (key) => {
  try {
    return JSON.parse(storageGet(key) || "{}");
  } catch {
    return {};
  }
};

export const setStoredMap = (key, value) => {
  storageSet(key, JSON.stringify(value));
};

export const getStoredValue = (key, id) => getStoredMap(key)[id];

export const storeValue = (key, value, meta = {}) => {
  const id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  const map = getStoredMap(key);
  map[id] = { value, ...meta };
  setStoredMap(key, map);
  return id;
};

export const readStoredValue = (key, id) => {
  const entry = getStoredValue(key, id);
  return typeof entry === "string" ? entry : entry?.value;
};

export const getStoredAssetValue = (asset) => (typeof asset === "string" ? asset : asset?.value || "");

export const getStoredAssetName = (asset, fallback = "imagen") =>
  (typeof asset === "string" ? fallback : asset?.name || fallback);

export const getStoredAssetOrder = (asset, fallback = 0) =>
  (typeof asset === "string" ? fallback : asset?.order ?? fallback);

export const getStoredAssetType = (asset, fallback = "image/png") =>
  (typeof asset === "string" ? fallback : asset?.type || fallback);

export const getBlockNotesMap = (documentId) => {
  const allNotes = getStoredMap(blockNotesKey);
  const notes = allNotes[documentId];
  return notes && typeof notes === "object" ? notes : {};
};

export const setBlockNotesMap = (documentId, notes) => {
  const allNotes = getStoredMap(blockNotesKey);
  if (notes && Object.keys(notes).length) allNotes[documentId] = notes;
  else delete allNotes[documentId];
  setStoredMap(blockNotesKey, allNotes);
};

export const clearBlockNotesForDocuments = (documentIds) => {
  const ids = new Set(documentIds);
  if (!ids.size) return;
  const allNotes = getStoredMap(blockNotesKey);
  let changed = false;
  ids.forEach((id) => {
    if (id in allNotes) {
      delete allNotes[id];
      changed = true;
    }
  });
  if (changed) setStoredMap(blockNotesKey, allNotes);
};

export const getSortedImageEntries = () =>
  Object.entries(getStoredMap(imageStoreKey))
    .map(([id, asset], index) => [id, asset, index])
    .sort(([, assetA, indexA], [, assetB, indexB]) => getStoredAssetOrder(assetA, indexA) - getStoredAssetOrder(assetB, indexB))
    .map(([id, asset]) => [id, asset]);
