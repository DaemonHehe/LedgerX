// Static, non-interactive thumbnail of a slide for the SlideList rail.
// Reuses CanvasElementView so the preview matches the canvas exactly, just
// rendered at a tiny fixed scale with pointer events disabled.

import {
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
} from '../../lib/deckModel.js';
import CanvasElementView from '../canvas/CanvasElementView.jsx';

export default function SlideThumbnail({ slide, width = 168 }) {
  const scale = width / CANVAS_WIDTH;
  const height = CANVAS_HEIGHT * scale;

  return (
    <div
      className="slide-thumb"
      style={{
        width: `${width}px`,
        height: `${height}px`,
        background: slide.background,
      }}
    >
      <div
        style={{
          width: `${CANVAS_WIDTH}px`,
          height: `${CANVAS_HEIGHT}px`,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          position: 'relative',
          pointerEvents: 'none',
        }}
      >
        {slide.elements.map((element) => (
          <div
            key={element.id}
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              width: `${element.width}px`,
              height: `${element.height}px`,
              transform: `translate(${element.x}px, ${element.y}px) rotate(${element.rotation || 0}deg)`,
            }}
          >
            <CanvasElementView element={element} />
          </div>
        ))}
      </div>
    </div>
  );
}
