import { useState, useCallback, useRef } from 'react';

/**
 * A custom hook to manage undo/redo state history.
 * Coalesces updates within an 800ms window to group consecutive edits (like typing in properties panel)
 * into a single history entry.
 */
export default function useHistory(initialPresent = []) {
  const [past, setPast] = useState([]);
  const [present, setPresent] = useState(initialPresent);
  const [future, setFuture] = useState([]);
  const lastPushTime = useRef(0);

  // Push a new state to the history stack
  const push = useCallback((newState, forceNewEntry = false) => {
    const now = Date.now();
    // Coalesce updates if they happen within 800ms of each other, unless forced (e.g. discrete actions like add/delete/reorder)
    const isCoalesced = !forceNewEntry && (now - lastPushTime.current < 800);

    setPast((prevPast) => {
      if (isCoalesced && prevPast.length > 0) {
        // Replace present without adding a new item to history
        return prevPast;
      }
      return [...prevPast, present];
    });

    setPresent(newState);
    setFuture([]); // Clear redo stack on new action
    lastPushTime.current = now;
  }, [present]);

  // Revert to the last state in the past stack
  const undo = useCallback(() => {
    if (past.length === 0) return present;

    const previous = past[past.length - 1];
    const newPast = past.slice(0, -1);

    setPast(newPast);
    setFuture((prevFuture) => [present, ...prevFuture]);
    setPresent(previous);
    return previous;
  }, [past, present]);

  // Reapply the next state in the future stack
  const redo = useCallback(() => {
    if (future.length === 0) return present;

    const next = future[0];
    const newFuture = future.slice(1);

    setPast((prevPast) => [...prevPast, present]);
    setFuture(newFuture);
    setPresent(next);
    return next;
  }, [future, present]);

  // Reset the history stack with a clean state (e.g. on new template load)
  const reset = useCallback((newState) => {
    setPresent(newState);
    setPast([]);
    setFuture([]);
    lastPushTime.current = 0;
  }, []);

  return {
    state: present,
    push,
    undo,
    redo,
    reset,
    canUndo: past.length > 0,
    canRedo: future.length > 0,
  };
}
