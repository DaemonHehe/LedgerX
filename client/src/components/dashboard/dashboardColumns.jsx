import React from 'react';
import { MoreVertical } from 'lucide-react';

export const PRIORITY_COLUMNS = [
  'created_at',
  'status',
  'customer_name',
  'total_amount'
];

const StatusCellRenderer = (params) => {
  if (!params.value) return null;
  const status = params.value.toLowerCase();
  let colorClass = 'border-[var(--line)] text-text-soft';
  if (status === 'paid') colorClass = 'border-[#10b981] text-[#10b981]';
  if (status === 'sent') colorClass = 'border-[#3b82f6] text-[#3b82f6]';
  if (status === 'void') colorClass = 'border-[#ef4444] text-[#ef4444]';
  
  return (
    <div className="flex items-center h-full">
      <span className={`px-2 py-0.5 text-[10px] uppercase tracking-wider font-semibold border ${colorClass} rounded-full leading-none`}>
        {status}
      </span>
    </div>
  );
};

const ActionsCellRenderer = (params) => {
  const { onAction } = params.colDef.cellRendererParams || {};
  const actions = [
    { label: 'Re-open', action: 'reopen' },
    { label: 'Export PNG', action: 'export' },
    { label: 'Copy Share Link', action: 'share' },
    { label: 'Mark as Paid', action: 'status_paid' },
    { label: 'Mark as Void', action: 'status_void' },
    { label: 'Delete', action: 'delete' },
  ];

  return (
    <div className="flex items-center justify-center h-full relative group cursor-pointer">
      <button className="p-1 hover:bg-[var(--bg-secondary)] border border-transparent hover:border-[var(--line)] text-[var(--ink-muted)] hover:text-text">
        <MoreVertical size={16} />
      </button>
      
      <div className="absolute right-full mr-2 top-0 bg-[var(--bg-primary)] border border-[var(--line)] hidden group-hover:flex flex-col shadow-lg z-50 min-w-[120px]">
        {actions.map(act => (
          <button
            key={act.action}
            className={`px-3 py-1.5 text-xs font-mono text-left w-full hover:bg-[var(--bg-secondary)] ${act.action === 'delete' ? 'text-accent-red hover:text-accent-red' : 'text-text'}`}
            onClick={(e) => {
              e.stopPropagation();
              if (onAction) onAction(act.action, params.data);
            }}
          >
            {act.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export const getDashboardColumns = (dynamicKeys = [], onAction) => {
  const columns = [
    {
      field: 'created_at',
      headerName: 'Date',
      pinned: 'left',
      valueFormatter: (params) => {
        if (!params.value) return '';
        const d = new Date(params.value);
        return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      },
      width: 180,
    },

    {
      field: 'status',
      headerName: 'Status',
      pinned: 'left',
      width: 120,
      cellRenderer: StatusCellRenderer,
    },
    {
      field: 'customer_name',
      headerName: 'Customer Name',
      width: 200,
    },
    {
      field: 'total_amount',
      headerName: 'Total Amount',
      valueFormatter: (params) => {
        if (params.value == null || params.value === '') return '';
        const val = parseFloat(params.value);
        return isNaN(val) ? params.value : new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
      },
      width: 140,
    },
  ];

  const excludeKeys = new Set(PRIORITY_COLUMNS);

  dynamicKeys.forEach((key) => {
    if (!excludeKeys.has(key)) {
      columns.push({
        field: key,
        headerName: key.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
        width: 160,
      });
    }
  });

  // Action column
  columns.push({
    headerName: '',
    field: 'actions',
    pinned: 'right',
    width: 60,
    sortable: false,
    filter: false,
    cellRenderer: ActionsCellRenderer,
    cellRendererParams: { onAction },
  });

  return columns;
};
