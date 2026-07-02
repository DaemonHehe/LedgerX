import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  createElement,
  createDeck,
  createSlide,
  normalizeDeck,
} from '../lib/deckModel.js';
import { authFetch } from '../lib/api.js';

const STORAGE_KEY = 'deck-editor-state';
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
    return raw ? normalizeDeck(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
};

const writeLocal = (deck) => {
  try {
    if (deck) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(deck));
    }
  } catch {
    // Quota / serialization issues are non-fatal — the API is the source of truth.
  }
};

const newDeck = () => createDeck({ title: 'Untitled deck' });

/**
 * Loads a deck from the API by id (when the route provides one) and merges it
 * with the locally cached copy. The newer of the two wins so that the most
 * recent edit survives a reload across devices.
 */
async function loadFromApi(apiBaseUrl, deckId) {
  if (!deckId) return null;
  try {
    const response = await authFetch(`${apiBaseUrl}/api/decks/${deckId}`);
    if (!response.ok) return null;
    return normalizeDeck(await response.json());
  } catch {
    return null;
  }
}

/**
 * useDeck — owns all deck/slide/element state for the canvas editor.
 *
 * Persistence is two-tier:
 *   1. localStorage is written synchronously on every change (instant, offline-safe).
 *   2. The API is written on a debounce once edits settle, tracked via saveStatus.
 *
 * Selection is kept here too because palette/properties/canvas all read & mutate it.
 */
export default function useDeck({ apiBaseUrl, deckId } = {}) {
  const [deck, setDeck] = useState(() => readLocal() || newDeck());
  const [activeSlideId, setActiveSlideId] = useState(() => deck.slides[0]?.id);
  const [selectedIds, setSelectedIds] = useState([]);
  const [saveStatus, setSaveStatus] = useState(SAVE_STATUS.IDLE);

  const isFirstRender = useRef(true);
  const saveTimer = useRef(null);

  // --- initial reconcile: local cache vs. server copy ---
  useEffect(() => {
    let cancelled = false;

    const reconcile = async () => {
      const local = readLocal();
      const remote = await loadFromApi(apiBaseUrl, deckId);
      if (cancelled || !remote) return;

      const remoteUpdatedAt = remote.updated_at
        ? new Date(remote.updated_at).getTime()
        : 0;
      const localUpdatedAt = local?.updated_at
        ? new Date(local.updated_at).getTime()
        : 0;

      setDeck(localUpdatedAt >= remoteUpdatedAt ? local : remote);
    };

    if (deckId) reconcile();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deckId]);

  // Keep `activeSlideId` valid when slides change (delete / reorder).
  useEffect(() => {
    if (!deck.slides.some((slide) => slide.id === activeSlideId)) {
      setActiveSlideId(deck.slides[0]?.id);
    }
  }, [deck.slides, activeSlideId]);

  const activeSlide = useMemo(
    () => deck.slides.find((slide) => slide.id === activeSlideId) || deck.slides[0],
    [deck.slides, activeSlideId],
  );

  // --- slide mutations ---

  const updateSlide = useCallback((slideId, updater) => {
    setDeck((current) => ({
      ...current,
      updated_at: new Date().toISOString(),
      slides: current.slides.map((slide) =>
        slide.id === slideId
          ? { ...slide, ...(typeof updater === 'function' ? updater(slide) : updater) }
          : slide,
      ),
    }));
  }, []);

  const addSlide = useCallback(() => {
    setDeck((current) => {
      const slide = createSlide();
      return {
        ...current,
        updated_at: new Date().toISOString(),
        slides: [...current.slides, slide],
      };
    });
  }, []);

  const duplicateSlide = useCallback((slideId) => {
    setDeck((current) => {
      const index = current.slides.findIndex((slide) => slide.id === slideId);
      if (index === -1) return current;
      const source = current.slides[index];
      const copy = createSlide({
        background: source.background,
        elements: source.elements.map((element) =>
          createElement(element.type, {
            ...element,
            id: undefined,
            x: element.x + 24,
            y: element.y + 24,
            props: element.props,
          }),
        ),
      });
      const slides = [...current.slides];
      slides.splice(index + 1, 0, copy);
      return {
        ...current,
        updated_at: new Date().toISOString(),
        slides,
      };
    });
  }, []);

  const deleteSlide = useCallback((slideId) => {
    setDeck((current) => {
      if (current.slides.length <= 1) return current;
      const slides = current.slides.filter((slide) => slide.id !== slideId);
      return {
        ...current,
        updated_at: new Date().toISOString(),
        slides,
      };
    });
    setSelectedIds([]);
  }, []);

  const reorderSlides = useCallback((fromIndex, toIndex) => {
    setDeck((current) => {
      if (
        fromIndex === toIndex ||
        fromIndex < 0 ||
        fromIndex >= current.slides.length
      ) {
        return current;
      }
      const slides = [...current.slides];
      const [moved] = slides.splice(fromIndex, 1);
      slides.splice(toIndex, 0, moved);
      return {
        ...current,
        updated_at: new Date().toISOString(),
        slides,
      };
    });
  }, []);

  // --- element mutations (operate on the active slide) ---

  const addElement = useCallback(
    (type, partial = {}) => {
      if (!activeSlide) return null;
      const element = createElement(type, partial);
      updateSlide(activeSlide.id, (slide) => ({
        elements: [...slide.elements, element],
      }));
      setSelectedIds([element.id]);
      return element;
    },
    [activeSlide, updateSlide],
  );

  const updateElement = useCallback(
    (elementId, updater) => {
      if (!activeSlide) return;
      updateSlide(activeSlide.id, (slide) => ({
        elements: slide.elements.map((element) =>
          element.id === elementId
            ? {
                ...element,
                ...(typeof updater === 'function' ? updater(element) : updater),
              }
            : element,
        ),
      }));
    },
    [activeSlide, updateSlide],
  );

  const updateElements = useCallback(
    (ids, updater) => {
      if (!activeSlide || ids.length === 0) return;
      const idSet = new Set(ids);
      updateSlide(activeSlide.id, (slide) => ({
        elements: slide.elements.map((element) =>
          idSet.has(element.id)
            ? {
                ...element,
                ...(typeof updater === 'function' ? updater(element) : updater),
              }
            : element,
        ),
      }));
    },
    [activeSlide, updateSlide],
  );

  const deleteElements = useCallback(
    (ids) => {
      if (!activeSlide || ids.length === 0) return;
      const idSet = new Set(ids);
      updateSlide(activeSlide.id, (slide) => ({
        elements: slide.elements.filter((element) => !idSet.has(element.id)),
      }));
      setSelectedIds([]);
    },
    [activeSlide, updateSlide],
  );

  // Bring forward / send backward by swapping within the elements array (z-order
  // is determined by array order; render in array order with later = on top).
  const reorderElement = useCallback(
    (elementId, direction) => {
      if (!activeSlide) return;
      updateSlide(activeSlide.id, (slide) => {
        const index = slide.elements.findIndex((element) => element.id === elementId);
        if (index === -1) return {};
        const target =
          direction === 'front'
            ? slide.elements.length - 1
            : direction === 'back'
              ? 0
              : direction === 'forward'
                ? Math.min(index + 1, slide.elements.length - 1)
                : Math.max(index - 1, 0);
        if (target === index) return {};
        const elements = [...slide.elements];
        const [moved] = elements.splice(index, 1);
        elements.splice(target, 0, moved);
        return { elements };
      });
    },
    [activeSlide, updateSlide],
  );

  const setDeckTitle = useCallback((title) => {
    setDeck((current) => ({
      ...current,
      title,
      updated_at: new Date().toISOString(),
    }));
  }, []);

  const selectElements = useCallback((ids) => {
    setSelectedIds(Array.isArray(ids) ? ids : [ids]);
  }, []);

  // --- persistence: localStorage (sync) + API (debounced) ---

  const persist = useCallback(
    async (deckToSave) => {
      setSaveStatus(SAVE_STATUS.SAVING);
      try {
        const payload = {
          title: deckToSave.title,
          slides: deckToSave.slides,
        };

        let savedDeck;
        if (deckToSave.id) {
          const response = await authFetch(`${apiBaseUrl}/api/decks/${deckToSave.id}`, {
            method: 'PUT',
            body: JSON.stringify(payload),
          });
          if (!response.ok) throw new Error('Save failed');
          savedDeck = await response.json();
        } else {
          const response = await authFetch(`${apiBaseUrl}/api/decks`, {
            method: 'POST',
            body: JSON.stringify(payload),
          });
          if (!response.ok) throw new Error('Create failed');
          savedDeck = await response.json();
          // Persist the newly assigned id so subsequent saves update instead of
          // creating duplicates.
          setDeck((current) => ({ ...current, id: savedDeck.id }));
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

    writeLocal(deck);
    setSaveStatus(SAVE_STATUS.PENDING);

    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      persist(deck);
    }, SAVE_DEBOUNCE_MS);

    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [deck, persist]);

  const selectedElements = useMemo(() => {
    if (!activeSlide) return [];
    const idSet = new Set(selectedIds);
    return activeSlide.elements.filter((element) => idSet.has(element.id));
  }, [activeSlide, selectedIds]);

  return {
    deck,
    activeSlide,
    activeSlideId,
    selectedIds,
    selectedElements,
    saveStatus,
    setActiveSlideId,
    setDeckTitle,
    addSlide,
    duplicateSlide,
    deleteSlide,
    reorderSlides,
    updateSlide,
    addElement,
    updateElement,
    updateElements,
    deleteElements,
    reorderElement,
    selectElements,
  };
}
