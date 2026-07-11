import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  createElement,
  createTemplate,
  normalizeTemplate,
} from '../lib/deckModel.js';
import { authFetch } from '../lib/api.js';
import { convertToStandardSchema, convertFromStandardSchema } from '../lib/templateSchema.js';
import useHistory from './useHistory.js';

const STORAGE_KEY = 'template-editor-state';
const SAVE_DEBOUNCE_MS = 1000;

export const SAVE_STATUS = {
  IDLE: 'idle',
  PENDING: 'pending',
  SAVING: 'saving',
  SAVED: 'saved',
  ERROR: 'error',
};

// --- localStorage cache (instant read/write so edits never block) ---

const readLocal = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? normalizeTemplate(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
};

const writeLocal = (template) => {
  try {
    if (template) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(template));
    }
  } catch {
    // Quota / serialization issues are non-fatal — the API is the source of truth.
  }
};

const newTemplate = () => createTemplate({ title: 'Untitled template' });

/**
 * Loads a template from the API by id (when the route provides one) and merges it
 * with the locally cached copy. The newer of the two wins so that the most
 * recent edit survives a reload across devices.
 */
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function loadFromApi(apiBaseUrl, templateId) {
  if (!templateId || !UUID_REGEX.test(templateId)) return null;
  try {
    const response = await authFetch(`${apiBaseUrl}/api/templates/${templateId}`);
    if (!response.ok) return null;
    const dbTemplate = await response.json();
    if (!dbTemplate || !dbTemplate.schema_json) return null;
    const legacyTemplate = convertFromStandardSchema(dbTemplate.schema_json);
    if (legacyTemplate) {
      legacyTemplate.id = templateId;
      legacyTemplate.title = dbTemplate.name || 'Untitled Template';
      legacyTemplate.updated_at = dbTemplate.updated_at || new Date().toISOString();
    }
    return normalizeTemplate(legacyTemplate);
  } catch (error) {
    console.error('Failed to load template from API:', error);
    return null;
  }
}

/**
 * useTemplate — owns all template/element state for the canvas editor.
 * Wraps elements state in useHistory to support undo/redo capabilities.
 */
export default function useTemplate({ apiBaseUrl, templateId } = {}) {
  const [template, setTemplate] = useState(() => readLocal() || newTemplate());
  const [selectedIds, setSelectedIds] = useState([]);
  const [saveStatus, setSaveStatus] = useState(SAVE_STATUS.IDLE);

  const isFirstRender = useRef(true);
  const saveTimer = useRef(null);
  const clipboardRef = useRef(null);

  // Initialize generic history hook with elements from current template
  const {
    state: elements,
    push: pushElements,
    undo: undoElements,
    redo: redoElements,
    reset: resetElements,
    canUndo,
    canRedo,
  } = useHistory(template.elements || []);

  // --- initial reconcile: local cache vs. server copy ---
  useEffect(() => {
    let cancelled = false;

    const reconcile = async () => {
      const local = readLocal();
      const remote = await loadFromApi(apiBaseUrl, templateId);
      if (cancelled || !remote) return;

      const remoteUpdatedAt = remote.updated_at
        ? new Date(remote.updated_at).getTime()
        : 0;
      const localUpdatedAt = local?.updated_at
        ? new Date(local.updated_at).getTime()
        : 0;

      const chosen = (local && local.id === templateId && localUpdatedAt >= remoteUpdatedAt) ? local : remote;
      setTemplate(chosen);
      resetElements(chosen.elements || []);
    };

    if (templateId) reconcile();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templateId]);

  // --- element mutations ---

  const addElement = useCallback(
    (type, partial = {}) => {
      const element = createElement(type, partial);
      const newElements = [...elements, element];
      pushElements(newElements, true); // force new history entry
      setSelectedIds([element.id]);
      return element;
    },
    [elements, pushElements],
  );

  const updateElement = useCallback(
    (elementId, updater) => {
      const newElements = elements.map((element) =>
        element.id === elementId
          ? {
              ...element,
              ...(typeof updater === 'function' ? updater(element) : updater),
            }
          : element,
      );
      pushElements(newElements, false); // coalesce continuous changes like resizing/typing
    },
    [elements, pushElements],
  );

  const updateElements = useCallback(
    (ids, updater) => {
      if (ids.length === 0) return;
      const idSet = new Set(ids);
      const newElements = elements.map((element) =>
        idSet.has(element.id)
          ? {
              ...element,
              ...(typeof updater === 'function' ? updater(element) : updater),
            }
          : element,
      );
      pushElements(newElements, false);
    },
    [elements, pushElements],
  );

  const deleteElements = useCallback(
    (ids) => {
      if (ids.length === 0) return;
      const idSet = new Set(ids);
      const newElements = elements.filter((element) => !idSet.has(element.id));
      pushElements(newElements, true); // force new history entry
      setSelectedIds([]);
    },
    [elements, pushElements],
  );

  // Bring forward / send backward by swapping within the elements array (z-order
  // is determined by array order; render in array order with later = on top).
  const reorderElement = useCallback(
    (elementId, direction) => {
      const index = elements.findIndex((element) => element.id === elementId);
      if (index === -1) return;
      
      const target =
        direction === 'front'
          ? elements.length - 1
          : direction === 'back'
            ? 0
            : direction === 'forward'
              ? Math.min(index + 1, elements.length - 1)
              : Math.max(index - 1, 0);
              
      if (target === index) return;
      
      const newElements = [...elements];
      const [moved] = newElements.splice(index, 1);
      newElements.splice(target, 0, moved);
      pushElements(newElements, true); // force new history entry
    },
    [elements, pushElements],
  );

  const setTemplateTitle = useCallback((title) => {
    setTemplate((current) => ({
      ...current,
      title,
      updated_at: new Date().toISOString(),
    }));
  }, []);

  const setTemplateDimensions = useCallback((width, height) => {
    setTemplate((current) => ({
      ...current,
      width,
      height,
      updated_at: new Date().toISOString(),
    }));
  }, []);

  const setTemplateBackground = useCallback((background) => {
    setTemplate((current) => ({
      ...current,
      background,
      updated_at: new Date().toISOString(),
    }));
  }, []);

  const selectElements = useCallback((ids) => {
    setSelectedIds(Array.isArray(ids) ? ids : [ids]);
  }, []);

  // --- Clipboard logic ---

  const copyElement = useCallback((element) => {
    if (!element) return;
    clipboardRef.current = JSON.parse(JSON.stringify(element));
  }, []);

  const pasteElement = useCallback(() => {
    if (!clipboardRef.current) return null;
    const copy = JSON.parse(JSON.stringify(clipboardRef.current));
    
    // Generate fresh id & offset coordinates to cascadingly prevent exact overlap
    copy.id = 'el_' + Math.random().toString(36).substr(2, 9);
    copy.x = (copy.x || 0) + 10;
    copy.y = (copy.y || 0) + 10;

    // Save pasted version as the next reference in clipboard so consecutive pastes cascade +10px
    clipboardRef.current = copy;

    const newElements = [...elements, copy];
    pushElements(newElements, true);
    setSelectedIds([copy.id]);
    return copy;
  }, [elements, pushElements]);

  const duplicateElement = useCallback((element) => {
    if (!element) return null;
    const copy = JSON.parse(JSON.stringify(element));

    copy.id = 'el_' + Math.random().toString(36).substr(2, 9);
    copy.x = (copy.x || 0) + 10;
    copy.y = (copy.y || 0) + 10;

    const newElements = [...elements, copy];
    pushElements(newElements, true);
    setSelectedIds([copy.id]);
    return copy;
  }, [elements, pushElements]);

  // --- persistence: localStorage (sync) + API (debounced) ---

  const persist = useCallback(
    async (templateToSave) => {
      setSaveStatus(SAVE_STATUS.SAVING);
      try {
        const standardSchema = convertToStandardSchema(templateToSave);
        const payload = {
          name: templateToSave.title || 'Untitled Template',
          schema_json: standardSchema,
        };

        let savedTemplate;
        if (templateToSave.id && UUID_REGEX.test(templateToSave.id)) {
          const response = await authFetch(`${apiBaseUrl}/api/templates/${templateToSave.id}`, {
            method: 'PUT',
            body: JSON.stringify(payload),
          });
          if (!response.ok) throw new Error('Save failed');
          savedTemplate = await response.json();
        } else {
          const response = await authFetch(`${apiBaseUrl}/api/templates`, {
            method: 'POST',
            body: JSON.stringify(payload),
          });
          if (!response.ok) throw new Error('Create failed');
          savedTemplate = await response.json();
          // Persist the newly assigned id so subsequent saves update instead of
          // creating duplicates.
          setTemplate((current) => ({ ...current, id: savedTemplate.id }));
        }

        setSaveStatus(SAVE_STATUS.SAVED);
      } catch (error) {
        console.error('Failed to persist template:', error);
        setSaveStatus(SAVE_STATUS.ERROR);
      }
    },
    [apiBaseUrl],
  );

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const currentTemplate = { ...template, elements };
    writeLocal(currentTemplate);
    setSaveStatus(SAVE_STATUS.PENDING);

    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      persist(currentTemplate);
    }, SAVE_DEBOUNCE_MS);

    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [template, elements, persist]);

  const selectedElements = useMemo(() => {
    const idSet = new Set(selectedIds);
    return elements.filter((element) => idSet.has(element.id));
  }, [elements, selectedIds]);

  const applyTemplate = useCallback((templateData) => {
    setTemplate((current) => ({
      ...current,
      ...templateData,
      updated_at: new Date().toISOString(),
    }));
    resetElements(templateData.elements || []);
    if (Array.isArray(templateData.elements) && templateData.elements.length > 0) {
      setSelectedIds([templateData.elements[0].id]);
    } else {
      setSelectedIds([]);
    }
  }, [resetElements]);

  // --- export to standard schema ---

  const exportToStandardSchema = useCallback(() => {
    return convertToStandardSchema({ ...template, elements });
  }, [template, elements]);

  const templateWithElements = useMemo(() => ({
    ...template,
    elements
  }), [template, elements]);

  return {
    template: templateWithElements,
    selectedIds,
    selectedElements,
    saveStatus,
    setTemplateTitle,
    setTemplateBackground,
    setTemplateDimensions,
    addElement,
    updateElement,
    updateElements,
    deleteElements,
    reorderElement,
    selectElements,
    applyTemplate,
    exportToStandardSchema,
    undo: undoElements,
    redo: redoElements,
    canUndo,
    canRedo,
    copyElement,
    pasteElement,
    duplicateElement,
  };
}
