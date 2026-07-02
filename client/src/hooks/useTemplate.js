import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  createElement,
  createTemplate,
  normalizeTemplate,
} from '../lib/deckModel.js';
import { authFetch } from '../lib/api.js';
import { convertToStandardSchema } from '../lib/templateSchema.js';

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
async function loadFromApi(apiBaseUrl, templateId) {
  if (!templateId) return null;
  try {
    const response = await authFetch(`${apiBaseUrl}/api/decks/${templateId}`);
    if (!response.ok) return null;
    return normalizeTemplate(await response.json());
  } catch {
    return null;
  }
}

/**
 * useTemplate — owns all template/element state for the canvas editor.
 *
 * Persistence is two-tier:
 *   1. localStorage is written synchronously on every change (instant, offline-safe).
 *   2. The API is written on a debounce once edits settle, tracked via saveStatus.
 *
 * Selection is kept here too because palette/properties/canvas all read & mutate it.
 */
export default function useTemplate({ apiBaseUrl, templateId } = {}) {
  const [template, setTemplate] = useState(() => readLocal() || newTemplate());
  const [selectedIds, setSelectedIds] = useState([]);
  const [saveStatus, setSaveStatus] = useState(SAVE_STATUS.IDLE);

  const isFirstRender = useRef(true);
  const saveTimer = useRef(null);

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

      setTemplate(localUpdatedAt >= remoteUpdatedAt ? local : remote);
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
      setTemplate((current) => ({
        ...current,
        updated_at: new Date().toISOString(),
        elements: [...current.elements, element],
      }));
      setSelectedIds([element.id]);
      return element;
    },
    [],
  );

  const updateElement = useCallback(
    (elementId, updater) => {
      setTemplate((current) => ({
        ...current,
        updated_at: new Date().toISOString(),
        elements: current.elements.map((element) =>
          element.id === elementId
            ? {
                ...element,
                ...(typeof updater === 'function' ? updater(element) : updater),
              }
            : element,
        ),
      }));
    },
    [],
  );

  const updateElements = useCallback(
    (ids, updater) => {
      if (ids.length === 0) return;
      const idSet = new Set(ids);
      setTemplate((current) => ({
        ...current,
        updated_at: new Date().toISOString(),
        elements: current.elements.map((element) =>
          idSet.has(element.id)
            ? {
                ...element,
                ...(typeof updater === 'function' ? updater(element) : updater),
              }
            : element,
        ),
      }));
    },
    [],
  );

  const deleteElements = useCallback(
    (ids) => {
      if (ids.length === 0) return;
      const idSet = new Set(ids);
      setTemplate((current) => ({
        ...current,
        updated_at: new Date().toISOString(),
        elements: current.elements.filter((element) => !idSet.has(element.id)),
      }));
      setSelectedIds([]);
    },
    [],
  );

  // Bring forward / send backward by swapping within the elements array (z-order
  // is determined by array order; render in array order with later = on top).
  const reorderElement = useCallback(
    (elementId, direction) => {
      setTemplate((current) => {
        const index = current.elements.findIndex((element) => element.id === elementId);
        if (index === -1) return current;
        const target =
          direction === 'front'
            ? current.elements.length - 1
            : direction === 'back'
              ? 0
              : direction === 'forward'
                ? Math.min(index + 1, current.elements.length - 1)
                : Math.max(index - 1, 0);
        if (target === index) return current;
        const elements = [...current.elements];
        const [moved] = elements.splice(index, 1);
        elements.splice(target, 0, moved);
        return { ...current, updated_at: new Date().toISOString(), elements };
      });
    },
    [],
  );

  const setTemplateTitle = useCallback((title) => {
    setTemplate((current) => ({
      ...current,
      title,
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

  // --- persistence: localStorage (sync) + API (debounced) ---

  const persist = useCallback(
    async (templateToSave) => {
      setSaveStatus(SAVE_STATUS.SAVING);
      try {
        const payload = {
          title: templateToSave.title,
          background: templateToSave.background,
          elements: templateToSave.elements,
        };

        let savedTemplate;
        if (templateToSave.id) {
          const response = await authFetch(`${apiBaseUrl}/api/decks/${templateToSave.id}`, {
            method: 'PUT',
            body: JSON.stringify(payload),
          });
          if (!response.ok) throw new Error('Save failed');
          savedTemplate = await response.json();
        } else {
          const response = await authFetch(`${apiBaseUrl}/api/decks`, {
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
      } catch {
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

    writeLocal(template);
    setSaveStatus(SAVE_STATUS.PENDING);

    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      persist(template);
    }, SAVE_DEBOUNCE_MS);

    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [template, persist]);

  const selectedElements = useMemo(() => {
    const idSet = new Set(selectedIds);
    return template.elements.filter((element) => idSet.has(element.id));
  }, [template.elements, selectedIds]);

  const applyTemplate = useCallback((templateData) => {
    setTemplate((current) => ({
      ...current,
      ...templateData,
      updated_at: new Date().toISOString(),
      elements: templateData.elements || [],
    }));
    if (Array.isArray(templateData.elements) && templateData.elements.length > 0) {
      setSelectedIds([templateData.elements[0].id]);
    } else {
      setSelectedIds([]);
    }
  }, []);

  // --- export to standard schema ---

  const exportToStandardSchema = useCallback(() => {
    return convertToStandardSchema(template);
  }, [template]);

  return {
    template,
    selectedIds,
    selectedElements,
    saveStatus,
    setTemplateTitle,
    setTemplateBackground,
    addElement,
    updateElement,
    updateElements,
    deleteElements,
    reorderElement,
    selectElements,
    applyTemplate,
    exportToStandardSchema,
  };
}
