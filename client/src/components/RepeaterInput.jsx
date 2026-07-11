import { Plus, Trash2 } from 'lucide-react';
import { createDefaultTableRow } from '../lib/templateSchema.js';

export default function RepeaterInput({
  fieldKey,
  label,
  columns,
  rows,
  onChange,
  onAddRow,
  onDeleteRow,
}) {
  const displayLabel = label || fieldKey.replace(/_/g, ' ');

  return (
    <div className="border border-line">
      <div className="px-3 py-2 border-b border-line bg-surface">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-text">
          {displayLabel}
        </p>
      </div>

      <div className="divide-y divide-line">
        {rows.map((row, rowIndex) => (
          <div key={rowIndex} className="p-3">
            <div
              className="flex flex-col lg:grid gap-3 mb-3"
              style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr)) auto` }}
            >
              {columns.map((col) => (
                <div key={col.key}>
                  <label className="block mb-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-text-soft">
                    {col.label}
                  </label>
                  <input
                    type="text"
                    value={row[col.key] ?? ''}
                    onChange={(e) => onChange(rowIndex, col.key, e.target.value)}
                    className="w-full px-3 py-2 min-h-[44px] text-sm border border-line bg-bg text-text outline-none focus:border-text transition-colors"
                    style={{ fontFamily: 'JetBrains Mono, monospace' }}
                  />
                </div>
              ))}
              <div className="flex items-end justify-end lg:justify-start mt-2 lg:mt-0">
                <button
                  type="button"
                  onClick={() => onDeleteRow(rowIndex)}
                  disabled={rows.length <= 1}
                  className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center border border-line text-text-soft hover:border-accent-red hover:text-accent-red transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:border-line disabled:hover:text-text-soft"
                  title="Delete row"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
            <p className="text-[10px] font-mono text-text-tertiary">Row {rowIndex + 1}</p>
          </div>
        ))}
      </div>

      <div className="p-3 border-t border-line">
        <button
          type="button"
          onClick={() => onAddRow(createDefaultTableRow(columns))}
          className="w-full px-3 py-2 min-h-[44px] text-xs font-semibold uppercase tracking-[0.12em] border border-line text-text hover:bg-text hover:text-bg transition-colors flex items-center justify-center gap-2"
        >
          <Plus size={14} />
          Add Item
        </button>
      </div>
    </div>
  );
}
