export const bindWorkspaceEvents = ({
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
  openThemeButton,
  openFocusModeButton,
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
  closeGuideButton,
  closeHistoryButton,
  openSearchButton,
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
  onCreateFolder,
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
  onFoldAllSections,
  onUnfoldAllSections,
  isModKey,
  editCurrentSectionNote,
  slashMenuController,
}) => {
  clearButton.addEventListener("click", () => {
    setMarkdown("# Nuevo documento\n\nEmpieza a escribir aqui.");
    actionsMenu.open = false;
  });

  newDocumentButton.addEventListener("click", () => {
    setTemplatePickerVisible(true, getActiveFolderId());
  });

  newFolderButton.addEventListener("click", onCreateFolder);
  documentSearch.addEventListener("input", renderDocuments);

  explorerFilterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      setExplorerFilter(button.dataset.explorerFilter);
      renderDocuments();
    });
  });

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

  openPreferencesButton.addEventListener("click", () => {
    setPreferencesVisible(true);
  });

  openThemeButton?.addEventListener("click", () => {
    const next = workspace.dataset.theme === "dark" ? "light" : "dark";
    applyTheme(next);
    actionsMenu.open = false;
  });

  openFocusModeButton?.addEventListener("click", () => {
    setFocusMode(workspace.dataset.focus !== "true");
    actionsMenu.open = false;
  });

  closePreferencesButton.addEventListener("click", () => {
    setPreferencesVisible(false);
  });

  openTemplatesButton.addEventListener("click", () => {
    setTemplatePickerVisible(true, getActiveFolderId());
  });

  closeTemplatesButton.addEventListener("click", () => {
    setTemplatePickerVisible(false);
  });

  closeAssetPreviewButton.addEventListener("click", () => {
    setAssetPreviewVisible(null);
  });

  dismissNoticeButton.addEventListener("click", () => {
    setPersonalNoticeVisible(false);
  });

  togglePresentationButton.addEventListener("click", () => {
    setPresentationMode(workspace.dataset.presentation !== "true");
  });

  presentationExitButton.addEventListener("click", () => {
    setPresentationMode(false);
  });

  [preferenceWidthInput, preferenceDensityInput, preferenceTypographyInput, preferenceWrapInput].forEach((input) => {
    input.addEventListener("change", () => {
      applyPreferences({
        width: preferenceWidthInput.value,
        density: preferenceDensityInput.value,
        typography: preferenceTypographyInput.value,
        wrap: preferenceWrapInput.value,
      });
    });
  });

  preferenceThemeInput.addEventListener("change", () => {
    applyTheme(preferenceThemeInput.value);
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

  closeHistoryButton.addEventListener("click", () => {
    setHistoryVisible(null);
  });

  openSearchButton.addEventListener("click", () => {
    openSearchInterface();
  });

  foldAllSectionsButton.addEventListener("click", onFoldAllSections);
  unfoldAllSectionsButton.addEventListener("click", onUnfoldAllSections);

  actionsMenu.addEventListener("toggle", () => {
    if (!actionsMenu.open) return;
    const content = actionsMenu.querySelector(".actions-menu-content");
    if (content) {
      content.scrollTop = 0;
      requestAnimationFrame(() => {
        content.scrollTop = 0;
      });
    }
  });

  document.addEventListener("click", (event) => {
    if (!slashMenu.contains(event.target) && !editorHost.contains(event.target)) closeSlashMenu();
    if (!actionsMenu.contains(event.target)) actionsMenu.open = false;
    if (!helpOverlay.hidden && event.target === helpOverlay) setGuideVisible(false);
    if (!historyOverlay.hidden && event.target === historyOverlay) setHistoryVisible(null);
    if (!templateOverlay.hidden && event.target === templateOverlay) setTemplatePickerVisible(false);
    if (!preferencesOverlay.hidden && event.target === preferencesOverlay) setPreferencesVisible(false);
    if (!assetPreviewOverlay.hidden && event.target === assetPreviewOverlay) setAssetPreviewVisible(null);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      if (!historyOverlay.hidden) {
        setHistoryVisible(null);
        return;
      }
      if (!helpOverlay.hidden) {
        setGuideVisible(false);
        return;
      }
      if (!templateOverlay.hidden) {
        setTemplatePickerVisible(false);
        return;
      }
      if (!preferencesOverlay.hidden) {
        setPreferencesVisible(false);
        return;
      }
      if (!assetPreviewOverlay.hidden) {
        setAssetPreviewVisible(null);
        return;
      }
      if (slashMenuController()?.isActive()) {
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

    if (isModKey(event) && event.key === ",") {
      event.preventDefault();
      setPreferencesVisible(true);
      return;
    }

    if (isModKey(event) && event.altKey && event.key.toLowerCase() === "n") {
      event.preventDefault();
      editCurrentSectionNote();
      return;
    }

    if (isModKey(event) && event.key === ".") {
      event.preventDefault();
      setInspectorVisible(workspace.dataset.inspectorVisible !== "true");
    }
  });
};
