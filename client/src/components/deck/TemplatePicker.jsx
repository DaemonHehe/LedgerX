import { X } from 'lucide-react';

export default function TemplatePicker({ open, templates, onApply, onClose }) {
  if (!open) return null;

  return (
    <div className="template-picker-backdrop" role="dialog" aria-modal="true">
      <div className="template-picker-panel">
        <div className="template-picker-header">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-[#ff0000]">New Deck</p>
            <h2 className="text-xl font-semibold text-[#000000]">Choose a receipt layout</h2>
          </div>
          <button type="button" className="template-picker-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <div className="template-picker-grid">
          {templates.map((template) => (
            <button
              key={template.id}
              type="button"
              className="template-picker-card"
              onClick={() => onApply(template)}
            >
              <div className="template-picker-thumbnail">
                <span>{template.thumbnail_placeholder}</span>
              </div>
              <div className="template-picker-info">
                <strong>{template.title}</strong>
                <p>Built with legacy receipt styling and fillable fields.</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
