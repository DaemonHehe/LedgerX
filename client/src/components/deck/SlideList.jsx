// Vertical rail of slide thumbnails with add / duplicate / delete / reorder.
// Reorder uses explicit up/down buttons (works everywhere, no DnD lib), and the
// whole thumb is clickable to set the active slide.

import { ChevronUp, ChevronDown, Copy, Plus, Trash2 } from 'lucide-react';
import SlideThumbnail from './SlideThumbnail.jsx';

export default function SlideList({
  slides,
  activeSlideId,
  onSelect,
  onAdd,
  onDuplicate,
  onDelete,
  onReorder,
}) {
  const activeIndex = slides.findIndex((slide) => slide.id === activeSlideId);
  const canDelete = slides.length > 1;

  return (
    <div className="slide-list">
      <div className="section-heading section-heading-action">
        <span className="editor-label">Slides</span>
        <button type="button" className="editor-add" onClick={onAdd} title="Add slide">
          <Plus size={15} />
        </button>
      </div>

      <div className="slide-list-items">
        {slides.map((slide, index) => {
          const isActive = slide.id === activeSlideId;
          return (
            <div
              key={slide.id}
              className={`slide-list-item ${isActive ? 'is-active' : ''}`}
            >
              <button
                type="button"
                className="slide-list-select"
                onClick={() => onSelect(slide.id)}
              >
                <span className="slide-list-index">{String(index + 1).padStart(2, '0')}</span>
                <SlideThumbnail slide={slide} />
              </button>

              <div className="slide-list-actions">
                <button
                  type="button"
                  className="slide-list-action"
                  title="Move up"
                  disabled={index === 0}
                  onClick={() => onReorder(index, index - 1)}
                >
                  <ChevronUp size={14} />
                </button>
                <button
                  type="button"
                  className="slide-list-action"
                  title="Move down"
                  disabled={index === slides.length - 1}
                  onClick={() => onReorder(index, index + 1)}
                >
                  <ChevronDown size={14} />
                </button>
                <button
                  type="button"
                  className="slide-list-action"
                  title="Duplicate"
                  onClick={() => onDuplicate(slide.id)}
                >
                  <Copy size={13} />
                </button>
                <button
                  type="button"
                  className="slide-list-action slide-list-delete"
                  title="Delete"
                  disabled={!canDelete}
                  onClick={() => onDelete(slide.id)}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <button type="button" className="editor-secondary w-full" onClick={onAdd}>
        <Plus size={15} /> New slide
      </button>
    </div>
  );
}
