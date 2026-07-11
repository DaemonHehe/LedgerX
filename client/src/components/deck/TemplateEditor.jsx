// Single-canvas template editor: composes the element palette, the
// Moveable/Selecto canvas, the layers panel, and the properties inspector.
//
// Selection model:
//   • Click element → single-select (shift/meta toggles into multi).
//   • Click empty canvas → clear.
//   • Drag on empty canvas (Selecto marquee) → multi-select the hits.

import { useCallback, useEffect, useRef, useState } from 'react';
import { Download, Save, Undo2, Redo2, ArrowUp, ArrowDown, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Selecto from 'react-selecto';
import useTemplate, { SAVE_STATUS } from '../../hooks/useTemplate.js';
import { createElement, FORM_FIELD_TYPES } from '../../lib/deckModel.js';
import { clientToLogical, clampToSurface } from '../../lib/canvasCoords.js';
import { exportSlidePng } from '../../lib/slideExport.js';
import { authFetch, parseApiError } from '../../lib/api.js';
import { convertToStandardSchema } from '../../lib/templateSchema.js';
import { useToast } from '../../context/ToastContext.jsx';
import CanvasSlide from '../canvas/CanvasSlide.jsx';
import ElementPalette from './ElementPalette.jsx';
import PropertiesPanel from './PropertiesPanel.jsx';
import SaveBadge from './SaveBadge.jsx';
import ImportImageButton from '../ImportImageButton.jsx';
import { SlidersHorizontal, X } from 'lucide-react';

export default function TemplateEditor({ apiBaseUrl, templateId }) {
  const { showError, showSuccess } = useToast();
  const navigate = useNavigate();
  const {
    template,
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
    exportToStandardSchema,
    applyTemplate,
    undo,
    redo,
    canUndo,
    canRedo,
    copyElement,
    pasteElement,
    duplicateElement,
  } = useTemplate({ apiBaseUrl, templateId });
  const stageRef = useRef(null);
  const [showInspector, setShowInspector] = useState(false);
  const [draftBanner, setDraftBanner] = useState(null);

  useEffect(() => {
    const draftKey = `ledgerx_draft_${templateId || 'new'}`;
    const draftStr = localStorage.getItem(draftKey);
    if (draftStr) {
      try {
        const draft = JSON.parse(draftStr);
        setDraftBanner({ draftKey, draft });
      } catch(e) {}
    }
  }, [templateId]);

  useEffect(() => {
    const draftKey = `ledgerx_draft_${templateId || 'new'}`;
    const handler = setTimeout(() => {
      if (template.elements && template.elements.length > 0) {
        localStorage.setItem(draftKey, JSON.stringify(template));
      }
    }, 2000);
    return () => clearTimeout(handler);
  }, [template, templateId]);

  const handleRestoreDraft = useCallback(() => {
    if (draftBanner?.draft) {
      applyTemplate(draftBanner.draft);
      setDraftBanner(null);
    }
  }, [draftBanner, applyTemplate]);

  const handleDiscardDraft = useCallback(() => {
    if (draftBanner?.draftKey) {
      localStorage.removeItem(draftBanner.draftKey);
    }
    setDraftBanner(null);
  }, [draftBanner]);

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

  const handleLayerClick = useCallback(
    (id, event) => {
      const additive = event.shiftKey || event.metaKey || event.ctrlKey;
      handleSelect(id, additive);
    },
    [handleSelect],
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
      const logical = clientToLogical(clientX, clientY, surfaceEl, template.width || 1280, template.height || 720);
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
        template.width || 1280,
        template.height || 720
      );
      addElement(type, { x, y });
    },
    [addElement, template.width, template.height],
  );

  // --- toolbar actions ---

  const handleExport = useCallback(() => {
    const safeName = (template.title || 'template')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    exportSlidePng(
      { background: template.background, elements: template.elements, width: template.width, height: template.height },
      `${safeName || 'template'}.png`,
    );
  }, [template]);

  const handleSaveTemplate = useCallback(async () => {
    try {
      // Convert to standard schema
      const standardSchema = convertToStandardSchema(template);

      const payload = {
        name: template.title || 'Untitled Template',
        schema_json: standardSchema,
      };

      let response;
      if (template.id) {
        // Update existing template
        response = await authFetch(`${apiBaseUrl}/api/templates/${template.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
      } else {
        // Create new template
        response = await authFetch(`${apiBaseUrl}/api/templates`, {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }

      if (!response.ok) {
        const message = await parseApiError(response, 'Failed to save template.');
        throw new Error(message);
      }

      const savedTemplate = await response.json();

      if (!template.id && savedTemplate.id) {
        applyTemplate({
          ...template,
          id: savedTemplate.id,
        });
      }

      localStorage.removeItem(`ledgerx_draft_${templateId || 'new'}`);
      if (template.id) localStorage.removeItem(`ledgerx_draft_${template.id}`);
      setDraftBanner(null);

      showSuccess('Template saved successfully.');
    } catch (error) {
      console.error('Failed to save template:', error);
      showError(error.message || 'Failed to save template.');
    }
  }, [template, apiBaseUrl, applyTemplate, showError, showSuccess]);
  
  const handleDeleteTemplate = useCallback(async () => {
    if (!template.id) return;
    if (
      !window.confirm(
        'Are you sure you want to delete this template? This action cannot be undone.'
      )
    ) {
      return;
    }
    try {
      const response = await authFetch(`${apiBaseUrl}/api/templates/${template.id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const message = await parseApiError(response, 'Failed to delete template.');
        throw new Error(message);
      }
      showSuccess('Template deleted successfully.');
      navigate('/deck');
    } catch (error) {
      console.error('Failed to delete template:', error);
      showError(error.message || 'Failed to delete template.');
    }
  }, [template.id, apiBaseUrl, navigate, showError, showSuccess]);

  const handleAnalysisComplete = useCallback((templateData) => {
    // Inject the AI-generated template into the current state
    applyTemplate(templateData);
  }, [applyTemplate]);

  // --- Keyboard Shortcuts Listener ---
  useEffect(() => {
    const handleKeyDown = (event) => {
      const activeTag = document.activeElement?.tagName?.toLowerCase();
      if (
        activeTag === 'input' ||
        activeTag === 'textarea' ||
        activeTag === 'select' ||
        document.activeElement?.isContentEditable
      ) {
        // Do not intercept hotkeys while user is typing in form fields
        return;
      }

      const isMod = event.ctrlKey || event.metaKey;

      if (isMod && event.key === 'z') {
        event.preventDefault();
        if (event.shiftKey) {
          redo();
        } else {
          undo();
        }
      } else if (isMod && event.key === 'y') {
        event.preventDefault();
        redo();
      } else if (isMod && event.key === 'c') {
        if (selectedElements.length === 1) {
          event.preventDefault();
          copyElement(selectedElements[0]);
        }
      } else if (isMod && event.key === 'v') {
        event.preventDefault();
        pasteElement();
      } else if (isMod && event.key === 'd') {
        if (selectedElements.length === 1) {
          event.preventDefault();
          duplicateElement(selectedElements[0]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedElements, undo, redo, copyElement, pasteElement, duplicateElement]);

  return (
    <div className="deck-editor pb-[80px] lg:pb-0 relative">
      {draftBanner && (
        <div className="absolute top-0 left-0 right-0 z-50 bg-accent-red text-white px-4 py-2 flex items-center justify-between font-mono text-sm shadow-md">
          <span>Unsaved draft found — restore?</span>
          <div className="flex gap-2">
            <button type="button" onClick={handleRestoreDraft} className="px-3 py-1 bg-white text-black font-semibold border border-black hover:bg-gray-200">Restore</button>
            <button type="button" onClick={handleDiscardDraft} className="px-3 py-1 border border-white hover:bg-white/20">Discard</button>
          </div>
        </div>
      )}
      <div className="deck-toolbar flex-col items-start lg:flex-row lg:items-end">
        <div className="deck-toolbar-title w-full flex justify-between items-center lg:w-auto">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent-red">
              Template Studio
            </p>
            <h1 className="text-xl lg:text-2xl font-semibold text-text truncate max-w-[200px] lg:max-w-full">{template.title}</h1>
          </div>
          <div className="lg:hidden">
            <SaveBadge status={saveStatus} />
          </div>
        </div>
        
        {/* Mobile Toolbar Strip (Fixed Bottom) & Desktop Toolbar */}
        <div className="fixed bottom-0 left-0 right-0 bg-bg border-t border-line p-2 pl-20 flex items-center justify-around z-20 lg:static lg:bg-transparent lg:border-none lg:p-0 lg:justify-end lg:gap-3 lg:flex-wrap pb-[max(0.5rem,env(safe-area-inset-bottom))] lg:pb-0">
          <div className="hidden lg:block">
            <SaveBadge status={saveStatus} />
          </div>

          {/* Undo/Redo Buttons */}
          <div className="flex items-center gap-1 border-r border-[var(--line)] pr-3 mr-1">
            <button
              type="button"
              className="p-1.5 hover:bg-[var(--bg-secondary)] border border-[var(--line)] disabled:opacity-40 disabled:hover:bg-transparent"
              disabled={!canUndo}
              onClick={undo}
              title="Undo (Ctrl+Z)"
            >
              <Undo2 size={14} className="text-[var(--ink)]" />
            </button>
            <button
              type="button"
              className="p-1.5 hover:bg-[var(--bg-secondary)] border border-[var(--line)] disabled:opacity-40 disabled:hover:bg-transparent"
              disabled={!canRedo}
              onClick={redo}
              title="Redo (Ctrl+Shift+Z)"
            >
              <Redo2 size={14} className="text-[var(--ink)]" />
            </button>
          </div>

          <ImportImageButton
            onAnalysisComplete={handleAnalysisComplete}
            apiBaseUrl={apiBaseUrl}
          />
          <button type="button" className="editor-secondary hidden lg:flex" onClick={handleSaveTemplate}>
            Save Template JSON
          </button>
          {template.id && (
            <button
              type="button"
              className="editor-secondary hidden lg:flex items-center gap-1.5"
              style={{ color: '#FF3355', borderColor: '#FF3355' }}
              onClick={handleDeleteTemplate}
            >
              <Trash2 size={14} />
              <span className="hidden lg:inline">Delete</span>
            </button>
          )}
          <button type="button" className="editor-secondary" onClick={handleExport}>
            <Download size={16} />
            <span className="hidden lg:inline">Export PNG</span>
          </button>
          
          {/* Mobile Inspector Toggle */}
          <button 
            type="button" 
            className="editor-secondary lg:hidden flex flex-col items-center gap-1 min-h-[44px] min-w-[44px]"
            onClick={() => setShowInspector(true)}
          >
            <SlidersHorizontal size={16} />
          </button>
        </div>
      </div>

      <div className="deck-grid flex-col lg:flex-row">
        {/* Left rail / Palette */}
        <aside className="deck-rail w-full lg:w-auto overflow-x-auto lg:overflow-visible">
          <ElementPalette onAdd={handlePaletteAdd} />
        </aside>

        <section className="deck-canvas-wrap" ref={stageRef}>
          <CanvasSlide
            slide={template}
            selectedIds={selectedIds}
            selectedElements={selectedElements}
            onSelect={handleSelect}
            onChange={updateElement}
            onUpdateElements={updateElements}
            onDeleteElements={deleteElements}
            onDropElement={handleDropElement}
          />
        </section>

        {/* Right Sidebar split into Layers list and Properties inspector */}
        {/* On mobile: Bottom sheet overlay. On desktop: Right sidebar */}
        <div className={`
          fixed inset-x-0 bottom-0 z-[51] bg-[var(--bg-primary)] border-t border-[var(--line)] shadow-2xl transition-transform duration-300 ease-in-out
          ${showInspector ? 'translate-y-0' : 'translate-y-full'}
          h-[80vh] flex flex-col
          lg:static lg:translate-y-0 lg:h-auto lg:z-auto lg:shadow-none lg:border-t-0 lg:bg-transparent
          lg:flex lg:flex-col lg:gap-4 lg:w-[320px] lg:max-h-[calc(100vh-10rem)] lg:min-h-0
        `}>
          {/* Mobile Handle / Close */}
          <div className="flex items-center justify-between p-3 border-b border-[var(--line)] lg:hidden bg-[var(--bg-secondary)]">
            <span className="text-xs font-semibold uppercase tracking-wider">Inspector</span>
            <button onClick={() => setShowInspector(false)} className="p-2 -mr-2">
              <X size={20} />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto flex flex-col lg:overflow-hidden lg:gap-4 lg:bg-transparent bg-[var(--bg-primary)]">
            {/* Layers Panel */}
            <aside className="deck-inspector flex-1 min-h-[220px] max-h-none lg:max-h-[40%] overflow-y-auto flex flex-col p-4 bg-[var(--bg-primary)] lg:bg-transparent">
            <div className="flex items-center justify-between border-b border-[var(--line)] pb-2 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-[var(--ink-soft)]">
                Layers
              </span>
              {selectedIds.length === 1 && (
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => reorderElement(selectedIds[0], 'forward')}
                    className="p-1 hover:bg-[var(--bg-secondary)] border border-[var(--line)]"
                    title="Move Up"
                  >
                    <ArrowUp size={12} className="text-[var(--ink)]" />
                  </button>
                  <button
                    type="button"
                    onClick={() => reorderElement(selectedIds[0], 'backward')}
                    className="p-1 hover:bg-[var(--bg-secondary)] border border-[var(--line)]"
                    title="Move Down"
                  >
                    <ArrowDown size={12} className="text-[var(--ink)]" />
                  </button>
                </div>
              )}
            </div>
            <div className="flex-1 overflow-y-auto space-y-1 pr-1">
              {[...template.elements].reverse().length === 0 ? (
                <p className="text-xs font-mono text-[var(--ink-muted)] py-4 text-center">
                  No elements on canvas
                </p>
              ) : (
                [...template.elements].reverse().map((element) => {
                  const isSelected = selectedIds.includes(element.id);
                  return (
                    <div
                      key={element.id}
                      className={`flex items-center justify-between px-2 py-1.5 border border-[var(--line)] cursor-pointer text-xs font-mono transition-colors ${isSelected
                          ? 'bg-text text-bg border-text font-semibold'
                          : 'bg-[var(--bg-primary)] text-[var(--ink)] hover:bg-[var(--bg-secondary)]'
                        }`}
                      onClick={(e) => handleLayerClick(element.id, e)}
                    >
                      <span className="truncate pr-2">
                        [{element.type}] {element.id}
                      </span>
                      {isSelected && (
                        <div className="flex gap-0.5" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => reorderElement(element.id, 'forward')}
                            className="p-0.5 border border-bg hover:bg-bg hover:text-text text-bg"
                            title="Move Up"
                          >
                            <ArrowUp size={10} />
                          </button>
                          <button
                            type="button"
                            onClick={() => reorderElement(element.id, 'backward')}
                            className="p-0.5 border border-bg hover:bg-bg hover:text-text text-bg"
                            title="Move Down"
                          >
                            <ArrowDown size={10} />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </aside>

          {/* Properties Panel */}
            <aside className="deck-inspector flex-1 max-h-none lg:max-h-[60%] overflow-y-auto flex flex-col p-4 bg-[var(--bg-primary)] lg:bg-transparent border-t lg:border-t-0 border-[var(--line)]">
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
                templateWidth={template.width}
                templateHeight={template.height}
                onTemplateDimensions={setTemplateDimensions}
                formFieldTypes={FORM_FIELD_TYPES}
              />
            </aside>
          </div>
        </div>
      </div>

      {/* Mobile Overlay Backdrop */}
      {showInspector && (
        <div 
          className="fixed inset-0 bg-black/50 z-50 lg:hidden"
          onClick={() => setShowInspector(false)}
        />
      )}

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
