import {
  activeFolderKey,
  collapsedFoldersKey,
  explorerFilterKey,
  foldersKey,
  getStoredMap,
  setStoredMap,
  storageGet,
  storageSet,
} from "../app/storage.js";
import { defaultFolderId } from "../app/config.js";

export const getDocumentFolderId = (doc) => doc.folderId || defaultFolderId;

export const compareByOrder = (a, b) => (a.order ?? 0) - (b.order ?? 0) || (a.createdAt ?? 0) - (b.createdAt ?? 0);

export const sortFolders = (folders) => [...folders].sort(compareByOrder);

export const normalizeFolder = (folder, index) => ({
  ...folder,
  id: folder.id,
  name: folder.name,
  createdAt: folder.createdAt ?? Date.now(),
  order: folder.order ?? index,
  deletedAt: folder.id === defaultFolderId ? null : folder.deletedAt ?? null,
});

export const getFolders = () => {
  const general = { id: defaultFolderId, name: "General", createdAt: 0, order: 0, deletedAt: null };
  const stored = storageGet(foldersKey);

  if (!stored) {
    storageSet(foldersKey, JSON.stringify([general]));
    return [general];
  }

  try {
    const parsed = JSON.parse(stored);
    const folders = Array.isArray(parsed) ? parsed.filter((folder) => folder?.id && folder?.name).map(normalizeFolder) : [];
    const hasGeneral = folders.some((folder) => folder.id === defaultFolderId);
    return sortFolders(hasGeneral ? folders : [general, ...folders]);
  } catch {
    storageSet(foldersKey, JSON.stringify([general]));
    return [general];
  }
};

export const setFolders = (folders) => {
  const general = { id: defaultFolderId, name: "General", createdAt: 0, order: 0, deletedAt: null };
  const nextFolders = folders.some((folder) => folder.id === defaultFolderId) ? folders : [general, ...folders];
  storageSet(
    foldersKey,
    JSON.stringify(sortFolders(nextFolders).map((folder, index) => normalizeFolder({ ...folder, order: folder.id === defaultFolderId ? 0 : index }, index))),
  );
};

export const getActiveFolderId = () => {
  const storedFolderId = storageGet(activeFolderKey);
  return getFolders().some((folder) => folder.id === storedFolderId && !folder.deletedAt) ? storedFolderId : defaultFolderId;
};

export const setActiveFolderId = (folderId) => {
  storageSet(activeFolderKey, folderId || defaultFolderId);
};

export const getCollapsedFolders = () => getStoredMap(collapsedFoldersKey);

export const setCollapsedFolders = (folders) => {
  setStoredMap(collapsedFoldersKey, folders);
};

export const getExplorerFilter = () => {
  const stored = storageGet(explorerFilterKey);
  return ["all", "favorites", "recent"].includes(stored) ? stored : "all";
};

export const persistExplorerFilter = (filter) => {
  const nextFilter = ["all", "favorites", "recent"].includes(filter) ? filter : "all";
  storageSet(explorerFilterKey, nextFilter);
  return nextFilter;
};

export const getVisibleFolders = () => getFolders().filter((folder) => !folder.deletedAt);

export const getDeletedFolders = () => getFolders().filter((folder) => folder.deletedAt);

export const setFolderField = (folderId, values) => {
  setFolders(getFolders().map((folder) => (folder.id === folderId ? { ...folder, ...values } : folder)));
};
