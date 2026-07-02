// Coordinate helpers shared between the palette (drag-to-canvas drop) and the
// canvas. Converting pointer client coords into the slide's logical 1280×720
// space requires inverting the surface's current visual scale.

import { CANVAS_HEIGHT, CANVAS_WIDTH } from './deckModel.js';

/**
 * Given a clientX/clientY and the canvas surface DOM node, return the
 * corresponding logical [x, y] position (clamped to the surface bounds).
 * Returns null if the surface node is missing.
 */
export function clientToLogical(clientX, clientY, surfaceEl) {
  if (!surfaceEl) return null;
  const rect = surfaceEl.getBoundingClientRect();
  const scale = rect.width / CANVAS_WIDTH || 1;
  const x = (clientX - rect.left) / scale;
  const y = (clientY - rect.top) / scale;
  return {
    x: Math.max(0, Math.min(x, CANVAS_WIDTH)),
    y: Math.max(0, Math.min(y, CANVAS_HEIGHT)),
    scale,
  };
}

/**
 * Convenience: clamp a width/height box so a newly-dropped element stays
 * (mostly) inside the surface.
 */
export function clampToSurface(x, y, width, height) {
  return {
    x: Math.max(0, Math.min(x, CANVAS_WIDTH - width)),
    y: Math.max(0, Math.min(y, CANVAS_HEIGHT - height)),
  };
}
