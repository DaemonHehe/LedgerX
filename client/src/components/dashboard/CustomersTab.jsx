import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { authFetch, parseApiError } from '../../lib/api.js';
import { useToast } from '../../context/ToastContext.jsx';
import { Mail, Phone, MapPin } from 'lucide-react';

export default function CustomersTab({ apiBaseUrl, theme }) {
  const { showError, showSuccess } = useToast();
  const gridRef = useRef(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const columns = useMemo(() => [
    {
      field: 'name',
      headerName: 'Name',
      width: 200,
      pinned: 'left',
    },
    {
      field: 'email',
      headerName: 'Email',
      width: 250,
      cellRenderer: (params) => {
        if (!params.value) return '';
        return (
          <div className="flex items-center h-full gap-2 text-[var(--ink-soft)]">
            <Mail size={12} />
            <span>{params.value}</span>
          </div>
        );
      }
    },
    {
      field: 'phone',
      headerName: 'Phone',
      width: 160,
      cellRenderer: (params) => {
        if (!params.value) return '';
        return (
          <div className="flex items-center h-full gap-2 text-[var(--ink-soft)]">
            <Phone size={12} />
            <span>{params.value}</span>
          </div>
        );
      }
    },
    {
      field: 'address',
      headerName: 'Address',
      width: 300,
      cellRenderer: (params) => {
        if (!params.value) return '';
        return (
          <div className="flex items-center h-full gap-2 text-[var(--ink-soft)]">
            <MapPin size={12} />
            <span className="truncate">{params.value}</span>
          </div>
        );
      }
    },
    {
      field: 'created_at',
      headerName: 'Added On',
      width: 140,
      valueFormatter: (params) => {
        if (!params.value) return '';
        return new Date(params.value).toLocaleDateString();
      },
    },
  ], []);

  const defaultColDef = useMemo(
    () => ({
      filter: false,
      resizable: true,
      sortable: true,
      cellStyle: {
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: '13px',
      },
    }),
    []
  );

  const datasource = useMemo(() => {
    return {
      getRows: async (params) => {
        try {
          const page = Math.floor(params.startRow / 50) + 1;
          const sortModel = params.sortModel[0];
          const sort_by = sortModel ? sortModel.colId : 'created_at';
          const sort_dir = sortModel ? sortModel.sort : 'desc';

          let url = `${apiBaseUrl}/api/customers?page=${page}&limit=50&sort_by=${sort_by}&sort_dir=${sort_dir}`;
          if (debouncedSearch) url += `&search=${encodeURIComponent(debouncedSearch)}`;

          const response = await authFetch(url);
          if (!response.ok) throw new Error('Failed to fetch customers');

          const count = parseInt(response.headers.get('X-Total-Count') || '0', 10);
          const rawData = await response.json();

          params.successCallback(rawData, count);
        } catch (err) {
          console.error(err);
          params.failCallback();
        }
      }
    };
  }, [apiBaseUrl, debouncedSearch]);

  const onGridReady = useCallback((params) => {
    params.api.setGridOption('datasource', datasource);
  }, [datasource]);

  useEffect(() => {
    if (gridRef.current?.api) {
      gridRef.current.api.setGridOption('datasource', datasource);
    }
  }, [datasource]);

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex flex-col md:flex-row gap-4 items-end bg-[var(--bg-secondary)] p-4 border border-[var(--line)]">
        <div className="flex flex-col gap-1 w-full md:w-auto flex-1">
          <label className="text-[10px] font-mono text-[var(--ink-soft)] uppercase tracking-wider">Search Directory</label>
          <input 
            type="text" 
            placeholder="Search by name, email, or phone..."
            className="bg-bg border border-[var(--line)] text-sm px-3 py-1.5 focus:border-text focus:outline-none w-full"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Grid */}
      <div className={`ag-theme-quartz${theme === 'dark' ? '-dark' : ''} ledgerx-grid w-full h-[65vh] min-w-[720px] border border-[var(--line)]`}>
        <AgGridReact
          ref={gridRef}
          theme="legacy"
          columnDefs={columns}
          defaultColDef={defaultColDef}
          rowModelType="infinite"
          cacheBlockSize={50}
          maxBlocksInCache={10}
          domLayout="normal"
          suppressCellFocus
          rowHeight={48}
          headerHeight={48}
          onGridReady={onGridReady}
        />
      </div>
    </div>
  );
}
