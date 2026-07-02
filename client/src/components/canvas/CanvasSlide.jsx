// The interactive slide canvas: scales a fixed 1280×720 logical surface into
// the viewport and renders each element with react-moveable for drag/resize/
// rotate. Single-select here; multi-select + marquee lives one level up.
//
// Coordinate handling: Moveable reports `beforeTranslate` / `width` / `height`
// in the *target's* CSS pixels (i.e. already unscaled, since we set the target
// at logical px and let the parent wrapper handle visual scaling). We bind
// those directly to the element's logical x/y/width/height.

import { useEffect, useRef, useState } from 'react';
import Moveable from 'react-moveable';
import { Trash2 } from 'lucide-react';
import {
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  FORM_FIELD_TYPES,
} from '../../lib/deckModel.js';
import {
  isElementDragEvent,
  readElementDragType,
} from '../deck/ElementPalette.jsx';
import CanvasElementView from './CanvasElementView.jsx';

export default function CanvasSlide({
  slide,
  selectedIds,
  selectedElements,
  onSelect,
  onChange,
  onDeleteElements,
  onDropElement = null,
  editable = true,
}) {
  const surfaceRef = useRef(null);
  const targetRefs = useRef(new Map());
  const [scale, setScale] = useState(1);
  const [isFocused, setIsFocused] = useState(false);
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    if (!editable || !onDeleteElements) return undefined;

    const handleKeyDown = (event) => {
      if (!isFocused || editingId) return;
      if (event.key === 'Delete' || event.key === 'Backspace') {
        if (selectedIds.length === 0) return;
        event.preventDefault();
        onDeleteElements(selectedIds);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [editable, isFocused, editingId, onDeleteElements, selectedIds]);

  // Fit the logical surface into its container while preserving aspect ratio.
  // Recomputed on container resize via ResizeObserver.
  const containerRef = useRef(null);
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;

    const measure = () => {
      const { width, height } = container.getBoundingClientRect();
      if (!width || !height) return;
      const next = Math.min(width / CANVAS_WIDTH, height / CANVAS_HEIGHT);
      setScale(next > 0 ? next : 1);
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  const singleSelected = selectedElements.length === 1 ? selectedElements[0] : null;

  const handleElementPointerDown = (element, event) => {
    if (!editable) return;
    setEditingId(null);
    // Click toggling selection into multi-select is handled at the slide level
    // (shift/meta). Here we just commit a plain select.
    onSelect(element.id, event.shiftKey || event.metaKey || event.ctrlKey);
  };

  const handleEditStart = (element, event) => {
    if (!editable || element.type !== 'text') return;
    setEditingId(element.id);
    event.stopPropagation();
  };

  const handleTextSave = (elementId, text) => {
    setEditingId(null);
    onChange(elementId, (element) => ({
      props: {
        ...element.props,
        text,
      },
    }));
  };

  const handleFocus = () => setIsFocused(true);
  const handleBlur = (event) => {
    if (!containerRef.current?.contains(event.relatedTarget)) {
      setIsFocused(false);
    }
  };

  // --- Moveable callbacks (operate on the single selected element) ---

  const onDrag = ({ target, beforeTranslate }) => {
    if (!singleSelected) return;
    target.style.transform = `translate(${beforeTranslate[0]}px, ${beforeTranslate[1]}px)`;
  };

  const onDragEnd = ({ target, lastEvent }) => {
    if (!singleSelected || !lastEvent) return;
    const [x, y] = lastEvent.beforeTranslate;
    target.style.transform = '';
    onChange(singleSelected.id, { x, y });
  };

  const onResize = ({ target, width, height, drag }) => {
    if (!singleSelected) return;
    target.style.width = `${width}px`;
    target.style.height = `${height}px`;
    if (drag) {
      const [tx, ty] = drag.beforeTranslate;
      target.style.transform = `translate(${tx}px, ${ty}px)`;
    }
  };

  const onResizeEnd = ({ target, lastEvent }) => {
    if (!singleSelected || !lastEvent) return;
    const { width, height, drag } = lastEvent;
    target.style.width = '';
    target.style.height = '';
    target.style.transform = '';
    const patch = { width, height };
    if (drag) {
      patch.x = drag.beforeTranslate[0];
      patch.y = drag.beforeTranslate[1];
    }
    onChange(singleSelected.id, patch);
  };

  const onRotate = ({ target, rotation }) => {
    if (!singleSelected) return;
    // Keep any in-progress drag translate combined with rotation.
    const tx = singleSelected.x;
    const ty = singleSelected.y;
    target.style.transform = `translate(${tx}px, ${ty}px) rotate(${rotation}deg)`;
  };

  const onRotateEnd = ({ target, lastEvent }) => {
    if (!singleSelected || !lastEvent) return;
    target.style.transform = `translate(${singleSelected.x}px, ${singleSelected.y}px)`;
    onChange(singleSelected.id, { rotation: lastEvent.rotation });
  };

  const registerTarget = (id) => (node) => {
    if (node) targetRefs.current.set(id, node);
    else targetRefs.current.delete(id);
  };

  const moveableTarget = singleSelected
    ? targetRefs.current.get(singleSelected.id)
    : null;

  return (
    <div
      ref={containerRef}
      className="canvas-stage"
      tabIndex={0}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onPointerDown={(event) => {
        // Click on empty canvas clears selection.
        if (event.target === surfaceRef.current || event.target === containerRef.current) {
          if (editable) onSelect(null, false);
        }
      }}
      onDragOver={(event) => {
        if (!editable || !onDropElement) return;
        if (isElementDragEvent(event)) {
          event.preventDefault();
          event.dataTransfer.dropEffect = 'copy';
        }
      }}
      onDrop={(event) => {
        if (!editable || !onDropElement) return;
        const type = readElementDragType(event);
        if (!type) return;
        event.preventDefault();
        onDropElement(type, event.clientX, event.clientY, surfaceRef.current);
      }}
    >
      <div
        ref={surfaceRef}
        className="canvas-surface"
        data-canvas-surface
        style={{
          width: `${CANVAS_WIDTH}px`,
          height: `${CANVAS_HEIGHT}px`,
          backgroundColor: slide.background,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
        }}
      >
        {slide.elements.map((element) => {
          const isSelected = selectedIds.includes(element.id);
          const isEditing = editingId === element.id;
          return (
            <div
              key={element.id}
              ref={registerTarget(element.id)}
              data-element-id={element.id}
              className={`canvas-element ${isSelected ? 'is-selected' : ''}`}
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                width: `${element.width}px`,
                height: `${element.height}px`,
                transform: `translate(${element.x}px, ${element.y}px) rotate(${element.rotation || 0}deg)`,
                cursor: editable ? 'move' : 'default',
                outline: isSelected && editable ? '1px solid #b55432' : 'none',
                outlineOffset: '-1px',
              }}
              onPointerDown={(event) => handleElementPointerDown(element, event)}
              onDoubleClick={(event) => handleEditStart(element, event)}
            >
              <CanvasElementView
                element={element}
                isEditing={isEditing}
                onTextSave={handleTextSave}
              />
            </div>
          );
        })}

        {editable && selectedElements.length > 0 && (
          <div
            className="canvas-toolbar"
            style={{
              left: Math.min(
                Math.max(selectedElements[0].x, 8),
                CANVAS_WIDTH - 312,
              ),
              top: Math.max(selectedElements[0].y - 52, 8),
            }}
          >
            <label className="canvas-toolbar-toggle">
              <input
                type="checkbox"
                checked={selectedElements[0].isDynamic || false}
                onChange={() => {
                  const element = selectedElements[0];
                  onChange(element.id, {
                    isDynamic: !element.isDynamic,
                    formFieldType: element.isDynamic ? null : element.formFieldType || FORM_FIELD_TYPES[0],
                    placeholderText: element.isDynamic ? null : element.placeholderText || `{{${FORM_FIELD_TYPES[0]}}}`,
                  });
                }}
              />
              {selectedElements[0].isDynamic ? 'Form Field' : 'Static Label'}
            </label>

            {selectedElements[0].isDynamic && (
              <select
                className="canvas-toolbar-select"
                value={selectedElements[0].formFieldType || ''}
                onChange={(event) => {
                  const value = event.target.value || null;
                  const element = selectedElements[0];
                  onChange(element.id, {
                    formFieldType: value,
                    placeholderText: value ? `{{${value}}}` : null,
                  });
                }}
              >
                <option value="">Select field type</option>
                {FORM_FIELD_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                  </option>
                ))}
              </select>
            )}

            <button
              type="button"
              className="canvas-toolbar-delete"
              onClick={() => onDeleteElements([selectedElements[0].id])}
              title="Delete selected"
            >
              <Trash2 size={16} />
            </button>
          </div>
        )}
      </div>

      {editable && singleSelected && moveableTarget && (
        <Moveable
          target={moveableTarget}
          zoom={1 / scale}
          draggable
          resizable
          rotatable
          throttleDrag={0}
          throttleResize={0}
          throttleRotate={0}
          keepRatio={false}
          origin={false}
          snappable
          snapGridWidth={20}
          snapGridHeight={20}
          snapThreshold={10}
          renderDirections={[
            'nw',
            'n',
            'ne',
            'w',
            'e',
            'sw',
            's',
            'se',
          ]}
          onDrag={onDrag}
          onDragEnd={onDragEnd}
          onResize={onResize}
          onResizeEnd={onResizeEnd}
          onRotate={onRotate}
          onRotateEnd={onRotateEnd}
          onClickGroup={() => {}}
        />
      )}
    </div>
  );
}
