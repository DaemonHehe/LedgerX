// Right-hand inspector for the selected element(s).
// - No selection → deck-level controls (title, slide background).
// - Single element → type-specific editable fields.
// - Multi selection → shared fields applied to all, plus z-order + delete.
//
// Property writes go through `updateElement` / `updateElements` from useTemplate,
// which batch-update state and trigger the debounced auto-save.

import { ArrowDownToLine, ArrowUpToLine, BringToFront, SendToBack, Trash2 } from 'lucide-react';

const fieldClass = 'editor-field w-full border px-3 py-2.5 text-sm outline-none transition';
const labelClass = 'editor-label';

function Row({ label, children }) {
  return (
    <label className="block">
      <span className={labelClass}>{label}</span>
      {children}
    </label>
  );
}

function GeometryControls({ elements, onChange }) {
  const el = elements[0];
  const set = (patch) => onChange(el.id, patch);
  return (
    <div className="grid grid-cols-2 gap-3">
      <Row label="X">
        <input
          type="number"
          className={fieldClass}
          value={Math.round(el.x)}
          onChange={(e) => set({ x: Number(e.target.value) || 0 })}
        />
      </Row>
      <Row label="Y">
        <input
          type="number"
          className={fieldClass}
          value={Math.round(el.y)}
          onChange={(e) => set({ y: Number(e.target.value) || 0 })}
        />
      </Row>
      <Row label="Width">
        <input
          type="number"
          className={fieldClass}
          value={Math.round(el.width)}
          onChange={(e) => set({ width: Math.max(1, Number(e.target.value) || 1) })}
        />
      </Row>
      <Row label="Height">
        <input
          type="number"
          className={fieldClass}
          value={Math.round(el.height)}
          onChange={(e) => set({ height: Math.max(1, Number(e.target.value) || 1) })}
        />
      </Row>
      <Row label="Rotation°">
        <input
          type="number"
          className={fieldClass}
          value={Math.round(el.rotation || 0)}
          onChange={(e) => set({ rotation: Number(e.target.value) || 0 })}
        />
      </Row>
    </div>
  );
}

function ZOrderControls({ selectedIds, onReorder, onDelete, disabled }) {
  const id = selectedIds[0];
  const btn =
    'editor-secondary inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold';
  return (
    <div className="grid grid-cols-2 gap-2">
      <button type="button" className={btn} disabled={disabled} onClick={() => onReorder(id, 'front')}>
        <BringToFront size={14} /> Front
      </button>
      <button type="button" className={btn} disabled={disabled} onClick={() => onReorder(id, 'forward')}>
        <ArrowUpToLine size={14} /> Forward
      </button>
      <button type="button" className={btn} disabled={disabled} onClick={() => onReorder(id, 'backward')}>
        <ArrowDownToLine size={14} /> Backward
      </button>
      <button type="button" className={btn} disabled={disabled} onClick={() => onReorder(id, 'back')}>
        <SendToBack size={14} /> Back
      </button>
      <button
        type="button"
        className="editor-delete col-span-2 mt-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold"
        onClick={() => onDelete(selectedIds)}
      >
        <Trash2 size={14} /> Delete
        {selectedIds.length > 1 ? ` (${selectedIds.length})` : ''}
      </button>
    </div>
  );
}

function TextFields({ element, onChange, formFieldTypes = [] }) {
  const { props, isDynamic, formFieldType } = element;
  const set = (key, value) => onChange(element.id, (el) => ({ props: { ...el.props, [key]: value } }));
  const setDirect = (key, value) => onChange(element.id, { [key]: value });
  return (
    <>
      <Row label="Text">
        <textarea
          className={`${fieldClass} min-h-20 resize-y`}
          value={props.text}
          onChange={(e) => set('text', e.target.value)}
        />
      </Row>
      <div className="grid grid-cols-2 gap-3">
        <Row label="Font size">
          <input
            type="number"
            className={fieldClass}
            value={props.fontSize}
            onChange={(e) => set('fontSize', Number(e.target.value) || 0)}
          />
        </Row>
        <Row label="Weight">
          <select
            className={fieldClass}
            value={props.fontWeight}
            onChange={(e) => set('fontWeight', Number(e.target.value))}
          >
            <option value={300}>Light</option>
            <option value={400}>Regular</option>
            <option value={500}>Medium</option>
            <option value={600}>Semibold</option>
            <option value={700}>Bold</option>
          </select>
        </Row>
      </div>
      <Row label="Font family">
        <select
          className={fieldClass}
          value={props.fontFamily}
          onChange={(e) => set('fontFamily', e.target.value)}
        >
          <option value="Inter, sans-serif">Inter (sans-serif)</option>
          <option value="Georgia, serif">Georgia (serif)</option>
          <option value="JetBrains Mono, monospace">JetBrains Mono</option>
        </select>
      </Row>
      <div className="grid grid-cols-2 gap-3">
        <Row label="Color">
          <input
            type="color"
            className="editor-color"
            value={props.color}
            onChange={(e) => set('color', e.target.value)}
          />
        </Row>
        <Row label="Align">
          <select
            className={fieldClass}
            value={props.textAlign}
            onChange={(e) => set('textAlign', e.target.value)}
          >
            <option value="left">Left</option>
            <option value="center">Center</option>
            <option value="right">Right</option>
          </select>
        </Row>
      </div>
      <div className="editor-divider" />
      <Row label="Dynamic Field">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="isDynamic"
            checked={isDynamic}
            onChange={(e) => {
              setDirect('isDynamic', e.target.checked);
              if (!e.target.checked) {
                setDirect('formFieldType', null);
                setDirect('placeholderText', null);
              }
            }}
          />
          <label htmlFor="isDynamic" className="text-sm">
            This is a fillable form field
          </label>
        </div>
      </Row>
      {isDynamic && (
        <>
          <Row label="Field Type">
            <select
              className={fieldClass}
              value={formFieldType || ''}
              onChange={(e) => {
                const value = e.target.value || null;
                setDirect('formFieldType', value);
                setDirect('placeholderText', value ? `{{${value}}}` : null);
              }}
            >
              <option value="">Select field type...</option>
              {formFieldTypes.map((type) => (
                <option key={type} value={type}>
                  {type.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                </option>
              ))}
            </select>
          </Row>
          <Row label="Placeholder">
            <input
              className={fieldClass}
              value={element.placeholderText || ''}
              onChange={(e) => setDirect('placeholderText', e.target.value)}
              placeholder="{{field_name}}"
            />
          </Row>
        </>
      )}
    </>
  );
}

function ImageFields({ element, onChange }) {
  const { props } = element;
  const set = (key, value) => onChange(element.id, (el) => ({ props: { ...el.props, [key]: value } }));
  return (
    <>
      <Row label="Image URL">
        <input
          className={fieldClass}
          value={props.src}
          placeholder="https://…"
          onChange={(e) => set('src', e.target.value)}
        />
      </Row>
      <Row label="Upload">
        <input
          type="file"
          accept="image/*"
          className="editor-file"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = () => set('src', reader.result);
            reader.readAsDataURL(file);
          }}
        />
      </Row>
      <div className="grid grid-cols-2 gap-3">
        <Row label="Fit">
          <select
            className={fieldClass}
            value={props.fit}
            onChange={(e) => set('fit', e.target.value)}
          >
            <option value="cover">Cover</option>
            <option value="contain">Contain</option>
            <option value="fill">Fill</option>
          </select>
        </Row>
        <Row label="Corner radius">
          <input
            type="number"
            className={fieldClass}
            value={props.radius}
            onChange={(e) => set('radius', Number(e.target.value) || 0)}
          />
        </Row>
      </div>
    </>
  );
}

function ShapeFields({ element, onChange }) {
  const { props } = element;
  const set = (key, value) => onChange(element.id, (el) => ({ props: { ...el.props, [key]: value } }));
  return (
    <>
      <Row label="Shape">
        <select
          className={fieldClass}
          value={props.shape}
          onChange={(e) => set('shape', e.target.value)}
        >
          <option value="rect">Rectangle</option>
          <option value="circle">Circle</option>
          <option value="triangle">Triangle</option>
          <option value="line">Line</option>
        </select>
      </Row>
      <Row label="Fill">
        <input
          type="color"
          className="editor-color"
          value={props.fill === 'transparent' ? '#000000' : props.fill}
          onChange={(e) => set('fill', e.target.value)}
        />
      </Row>
      <div className="grid grid-cols-2 gap-3">
        <Row label="Stroke color">
          <input
            type="color"
            className="editor-color"
            value={props.stroke === 'transparent' ? '#000000' : props.stroke}
            onChange={(e) => set('stroke', e.target.value)}
          />
        </Row>
        <Row label="Stroke width">
          <input
            type="number"
            className={fieldClass}
            value={props.strokeWidth}
            onChange={(e) => set('strokeWidth', Number(e.target.value) || 0)}
          />
        </Row>
      </div>
      {props.shape === 'rect' && (
        <Row label="Corner radius">
          <input
            type="number"
            className={fieldClass}
            value={props.radius}
            onChange={(e) => set('radius', Number(e.target.value) || 0)}
          />
        </Row>
      )}
    </>
  );
}

function BarcodeFields({ element, onChange }) {
  const { props } = element;
  const set = (key, value) => onChange(element.id, (el) => ({ props: { ...el.props, [key]: value } }));
  return (
    <>
      <Row label="Value">
        <input
          className={fieldClass}
          value={props.value}
          onChange={(e) => set('value', e.target.value)}
        />
      </Row>
      <Row label="Color">
        <input
          type="color"
          className="editor-color"
          value={props.color}
          onChange={(e) => set('color', e.target.value)}
        />
      </Row>
    </>
  );
}

function LineFields({ element, onChange }) {
  const { props } = element;
  const set = (key, value) => onChange(element.id, (el) => ({ props: { ...el.props, [key]: value } }));
  return (
    <>
      <Row label="Stroke color">
        <input
          type="color"
          className="editor-color"
          value={props.stroke}
          onChange={(e) => set('stroke', e.target.value)}
        />
      </Row>
      <Row label="Stroke width">
        <input
          type="number"
          className={fieldClass}
          value={props.strokeWidth}
          onChange={(e) => set('strokeWidth', Number(e.target.value) || 0)}
        />
      </Row>
      <Row label="Style">
        <select
          className={fieldClass}
          value={props.strokeStyle}
          onChange={(e) => set('strokeStyle', e.target.value)}
        >
          <option value="solid">Solid</option>
          <option value="dashed">Dashed</option>
          <option value="dotted">Dotted</option>
        </select>
      </Row>
    </>
  );
}

function QRCodeFields({ element, onChange }) {
  const { props } = element;
  const set = (key, value) => onChange(element.id, (el) => ({ props: { ...el.props, [key]: value } }));
  return (
    <>
      <Row label="Value">
        <input
          className={fieldClass}
          value={props.value}
          placeholder="https://example.com"
          onChange={(e) => set('value', e.target.value)}
        />
      </Row>
      <div className="grid grid-cols-2 gap-3">
        <Row label="Color">
          <input
            type="color"
            className="editor-color"
            value={props.color}
            onChange={(e) => set('color', e.target.value)}
          />
        </Row>
        <Row label="Background">
          <input
            type="color"
            className="editor-color"
            value={props.backgroundColor}
            onChange={(e) => set('backgroundColor', e.target.value)}
          />
        </Row>
      </div>
    </>
  );
}

function TableFields({ element, onChange }) {
  const { props } = element;
  const set = (key, value) => onChange(element.id, (el) => ({ props: { ...el.props, [key]: value } }));
  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        <Row label="Rows">
          <input
            type="number"
            className={fieldClass}
            value={props.rows}
            onChange={(e) => set('rows', Math.max(1, Number(e.target.value) || 1))}
          />
        </Row>
        <Row label="Columns">
          <input
            type="number"
            className={fieldClass}
            value={props.columns}
            onChange={(e) => set('columns', Math.max(1, Number(e.target.value) || 1))}
          />
        </Row>
      </div>
      <Row label="Header text">
        <input
          className={fieldClass}
          value={props.headerText}
          onChange={(e) => set('headerText', e.target.value)}
        />
      </Row>
      <div className="grid grid-cols-2 gap-3">
        <Row label="Border color">
          <input
            type="color"
            className="editor-color"
            value={props.borderColor}
            onChange={(e) => set('borderColor', e.target.value)}
          />
        </Row>
        <Row label="Background">
          <input
            type="color"
            className="editor-color"
            value={props.backgroundColor}
            onChange={(e) => set('backgroundColor', e.target.value)}
          />
        </Row>
      </div>
    </>
  );
}

function PriceFields({ element, onChange }) {
  const { props } = element;
  const set = (key, value) => onChange(element.id, (el) => ({ props: { ...el.props, [key]: value } }));
  return (
    <>
      <Row label="Value">
        <input
          className={fieldClass}
          value={props.value}
          placeholder="0.00"
          onChange={(e) => set('value', e.target.value)}
        />
      </Row>
      <Row label="Currency">
        <input
          className={fieldClass}
          value={props.currency}
          onChange={(e) => set('currency', e.target.value)}
        />
      </Row>
      <div className="grid grid-cols-2 gap-3">
        <Row label="Font size">
          <input
            type="number"
            className={fieldClass}
            value={props.fontSize}
            onChange={(e) => set('fontSize', Number(e.target.value) || 0)}
          />
        </Row>
        <Row label="Weight">
          <select
            className={fieldClass}
            value={props.fontWeight}
            onChange={(e) => set('fontWeight', Number(e.target.value))}
          >
            <option value={400}>Regular</option>
            <option value={500}>Medium</option>
            <option value={600}>Semibold</option>
            <option value={700}>Bold</option>
          </select>
        </Row>
      </div>
      <Row label="Color">
        <input
          type="color"
          className="editor-color"
          value={props.color}
          onChange={(e) => set('color', e.target.value)}
        />
      </Row>
    </>
  );
}

function DateFields({ element, onChange }) {
  const { props } = element;
  const set = (key, value) => onChange(element.id, (el) => ({ props: { ...el.props, [key]: value } }));
  return (
    <>
      <Row label="Value">
        <input
          type="date"
          className={fieldClass}
          value={props.value}
          onChange={(e) => set('value', e.target.value)}
        />
      </Row>
      <Row label="Format">
        <select
          className={fieldClass}
          value={props.format}
          onChange={(e) => set('format', e.target.value)}
        >
          <option value="YYYY-MM-DD">YYYY-MM-DD</option>
          <option value="MM/DD/YYYY">MM/DD/YYYY</option>
          <option value="DD/MM/YYYY">DD/MM/YYYY</option>
        </select>
      </Row>
      <div className="grid grid-cols-2 gap-3">
        <Row label="Font size">
          <input
            type="number"
            className={fieldClass}
            value={props.fontSize}
            onChange={(e) => set('fontSize', Number(e.target.value) || 0)}
          />
        </Row>
        <Row label="Weight">
          <select
            className={fieldClass}
            value={props.fontWeight}
            onChange={(e) => set('fontWeight', Number(e.target.value))}
          >
            <option value={400}>Regular</option>
            <option value={500}>Medium</option>
            <option value={600}>Semibold</option>
            <option value={700}>Bold</option>
          </select>
        </Row>
      </div>
      <Row label="Color">
        <input
          type="color"
          className="editor-color"
          value={props.color}
          onChange={(e) => set('color', e.target.value)}
        />
      </Row>
    </>
  );
}

function LogoFields({ element, onChange }) {
  const { props } = element;
  const set = (key, value) => onChange(element.id, (el) => ({ props: { ...el.props, [key]: value } }));
  return (
    <>
      <Row label="Image URL">
        <input
          className={fieldClass}
          value={props.src}
          placeholder="https://…"
          onChange={(e) => set('src', e.target.value)}
        />
      </Row>
      <Row label="Upload">
        <input
          type="file"
          accept="image/*"
          className="editor-file"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = () => set('src', reader.result);
            reader.readAsDataURL(file);
          }}
        />
      </Row>
      <Row label="Fit">
        <select
          className={fieldClass}
          value={props.fit}
          onChange={(e) => set('fit', e.target.value)}
        >
          <option value="contain">Contain</option>
          <option value="cover">Cover</option>
          <option value="fill">Fill</option>
        </select>
      </Row>
    </>
  );
}

const FIELDS_BY_TYPE = {
  text: TextFields,
  image: ImageFields,
  shape: ShapeFields,
  barcode: BarcodeFields,
  line: LineFields,
  qr_code: QRCodeFields,
  table: TableFields,
  price: PriceFields,
  date: DateFields,
  logo: LogoFields,
};

export default function PropertiesPanel({
  selectedElements,
  selectedIds,
  onReorderElement,
  onDeleteElements,
  onUpdateElement,
  // deck-level (used when nothing is selected)
  deckTitle,
  onDeckTitle,
  slideBackground,
  onSlideBackground,
  formFieldTypes = [],
}) {
  const hasSelection = selectedElements.length > 0;
  const isMulti = selectedElements.length > 1;
  const single = selectedElements[0];

  return (
    <div className="properties-panel space-y-5">
      <div className="section-heading">
        <span className="editor-label">
          {hasSelection ? (isMulti ? `${selectedElements.length} selected` : `${single.type} properties`) : 'Deck'}
        </span>
      </div>

      {!hasSelection && (
        <>
          <Row label="Deck title">
            <input
              className={fieldClass}
              value={deckTitle}
              onChange={(e) => onDeckTitle(e.target.value)}
            />
          </Row>
          <Row label="Slide background">
            <input
              type="color"
              className="editor-color"
              value={slideBackground}
              onChange={(e) => onSlideBackground(e.target.value)}
            />
          </Row>
          <p className="text-xs text-[#9a8a6a]">
            Select an element on the canvas to edit its properties, or drag one
            from the Elements palette.
          </p>
        </>
      )}

      {hasSelection && (
        <>
          {isMulti ? (
            <p className="text-xs text-[#9a8a6a]">
              {selectedElements.length} elements selected. Shared actions below.
            </p>
          ) : (
            <>
              {(() => {
                const Fields = FIELDS_BY_TYPE[single.type];
                return Fields ? (
                  <Fields element={single} onChange={onUpdateElement} formFieldTypes={formFieldTypes} />
                ) : null;
              })()}
              <div className="editor-divider" />
              <GeometryControls elements={selectedElements} onChange={onUpdateElement} />
            </>
          )}
          <div className="editor-divider" />
          <ZOrderControls
            selectedIds={selectedIds}
            onReorder={onReorderElement}
            onDelete={onDeleteElements}
          />
        </>
      )}
    </div>
  );
}
