// Single-canvas template editor: composes the element palette, the
// Moveable/Selecto canvas, and the properties inspector, all driven by useTemplate.
//
// Selection model:
//   • Click element → single-select (shift/meta toggles into multi).
//   • Click empty canvas → clear.
//   • Drag on empty canvas (Selecto marquee) → multi-select the hits.

import { useCallback, useEffect, useRef, useState } from 'react';
import { Download } from 'lucide-react';
import Selecto from 'react-selecto';
import useTemplate, { SAVE_STATUS } from '../../hooks/useTemplate.js';
import { createElement, FORM_FIELD_TYPES } from '../../lib/deckModel.js';
import { clientToLogical, clampToSurface } from '../../lib/canvasCoords.js';
import { exportSlidePng } from '../../lib/slideExport.js';
import CanvasSlide from '../canvas/CanvasSlide.jsx';
import ElementPalette from './ElementPalette.jsx';
import PropertiesPanel from './PropertiesPanel.jsx';
import SaveBadge from './SaveBadge.jsx';

export default function TemplateEditor({ apiBaseUrl, templateId }) {
  const {
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
  } = useTemplate({ apiBaseUrl, templateId });
  const stageRef = useRef(null);

  // --- selection ---

  const handleSelect = useCallback(
    (id, additive) => {
      if (id === null) {
        selectElements([]);
        return;
      }
      if (additive) {
        const set = new Set(selectedIds);
        if (set.has(id)) set.delete(id);
        else set.add(id);
        selectElements([...set]);
      } else {
        selectElements([id]);
      }
    },
    [selectedIds, selectElements],
  );

  // --- palette → canvas (click adds near top-left, drag places at pointer) ---

  const handlePaletteAdd = useCallback(
    (type) => {
      const element = addElement(type, { x: 120, y: 120 });
      return element;
    },
    [addElement],
  );

  const handleDropElement = useCallback(
    (type, clientX, clientY, surfaceEl) => {
      const logical = clientToLogical(clientX, clientY, surfaceEl);
      if (!logical) {
        addElement(type);
        return;
      }
      // Default size so the element isn't anchored by its corner only.
      const probe = createElement(type, {});
      const { x, y } = clampToSurface(
        logical.x - probe.width / 2,
        logical.y - probe.height / 2,
        probe.width,
        probe.height,
      );
      addElement(type, { x, y });
    },
    [addElement],
  );

  // --- toolbar actions ---

  const handleExport = useCallback(() => {
    const safeName = (template.title || 'template')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    exportSlidePng(
      { background: template.background, elements: template.elements },
      `${safeName || 'template'}.png`,
    );
  }, [template]);

  const isIdle = saveStatus === SAVE_STATUS.IDLE || saveStatus === SAVE_STATUS.SAVED;

  return (
    <div className="deck-editor">
      <div className="deck-toolbar">
        <div className="deck-toolbar-title">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#ff0000]">
            Template Studio
          </p>
          <h1 className="text-2xl font-semibold text-[#000000]">{template.title}</h1>
        </div>
        <div className="deck-toolbar-actions">
          <SaveBadge status={saveStatus} />
          <button type="button" className="editor-secondary" onClick={handleExport}>
            <Download size={16} />
            Export PNG
          </button>
        </div>
      </div>

      <div className="deck-grid">
        <aside className="deck-rail">
          <ElementPalette onAdd={handlePaletteAdd} />
        </aside>

        <section className="deck-canvas-wrap" ref={stageRef}>
          <CanvasSlide
            slide={{ background: template.background, elements: template.elements }}
            selectedIds={selectedIds}
            selectedElements={selectedElements}
            onSelect={handleSelect}
            onChange={updateElement}
            onDropElement={handleDropElement}
          />
        </section>

        <aside className="deck-inspector">
          <PropertiesPanel
            selectedElements={selectedElements}
            selectedIds={selectedIds}
            onReorderElement={reorderElement}
            onDeleteElements={deleteElements}
            onUpdateElement={updateElement}
            deckTitle={template.title}
            onDeckTitle={setTemplateTitle}
            slideBackground={template.background}
            onSlideBackground={setTemplateBackground}
            formFieldTypes={FORM_FIELD_TYPES}
          />
        </aside>
      </div>

      {/* Marquee multi-select, scoped to the canvas stage */}
      {stageRef.current && (
        <Selecto
          container={stageRef.current}
          dragContainer={stageRef.current}
          selectableTargets={['[data-element-id]']}
          selectByClick
          selectFromInside
          toggleContinueSelect={['shift']}
          hitRate={0}
          preventDragFromInside={false}
          onSelectEnd={(event) => {
            const ids = event.selected
              .map((el) => el.getAttribute('data-element-id'))
              .filter(Boolean);
            if (ids.length > 0) {
              event.isDragStartEnd === false && ids.length === 1
                ? selectElements([ids[0]])
                : selectElements(ids);
            }
          }}
        />
      )}
    </div>
  );
}
