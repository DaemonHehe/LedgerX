// Palette of the 4 element types. Two ways to add:
//   • Click → drops a new element near the top-left of the canvas.
//   • Drag → HTML5 DnD; on drop over the canvas surface the element is placed
//     at the pointer's logical position (handled by the canvas drop target).
//
// The drag payload carries only the element type; positioning is resolved at
// drop time so the palette doesn't need to know the canvas scale.

import { ELEMENT_TYPES } from '../../lib/deckModel.js';
import { Type, Image, Square, Barcode, Minus, QrCode, Table2, DollarSign, Calendar, Tag } from 'lucide-react';

const META = {
  text: { label: 'Text', icon: Type, hint: 'Headline or paragraph' },
  image: { label: 'Image', icon: Image, hint: 'Photo or logo' },
  shape: { label: 'Shape', icon: Square, hint: 'Rect / circle / line' },
  barcode: { label: 'Barcode', icon: Barcode, hint: 'CODE128 strip' },
  line: { label: 'Line', icon: Minus, hint: 'Horizontal separator' },
  qr_code: { label: 'QR Code', icon: QrCode, hint: 'Scannable code' },
  table: { label: 'Table', icon: Table2, hint: 'Data grid' },
  price: { label: 'Price', icon: DollarSign, hint: 'Currency display' },
  date: { label: 'Date', icon: Calendar, hint: 'Date display' },
  logo: { label: 'Logo', icon: Tag, hint: 'Brand logo' },
};

const DND_MIME = 'application/x-deck-element';

export const isElementDragEvent = (event) =>
  Array.from(event.dataTransfer?.types || []).includes(DND_MIME);

export const readElementDragType = (event) =>
  event.dataTransfer?.getData(DND_MIME) || null;

export default function ElementPalette({ onAdd }) {
  const handleDragStart = (event, type) => {
    event.dataTransfer.setData(DND_MIME, type);
    event.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <div className="element-palette">
      <div className="section-heading">
        <span className="editor-label">Elements</span>
        <p className="palette-hint">Drag onto the canvas or click to add</p>
      </div>
      <div className="palette-grid">
        {ELEMENT_TYPES.map((type) => {
          const { label, icon: Icon, hint } = META[type];
          return (
            <button
              key={type}
              type="button"
              className="palette-item"
              draggable
              onDragStart={(event) => handleDragStart(event, type)}
              onClick={() => onAdd(type)}
              title={`Add ${label}`}
            >
              <Icon size={20} />
              <span className="palette-item-label">{label}</span>
              <span className="palette-item-hint">{hint}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
