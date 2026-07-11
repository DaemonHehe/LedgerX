import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AgGridReact } from 'ag-grid-react';
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';
import { authFetch, parseApiError } from '../lib/api.js';
import { Logo } from './Logo.jsx';
import { useToast } from '../context/ToastContext.jsx';
import StatBar from './dashboard/StatBar.jsx';
import WeeklyChart from './dashboard/WeeklyChart.jsx';
import MonthlyChart from './dashboard/MonthlyChart.jsx';
import TemplateChart from './dashboard/TemplateChart.jsx';
import DailySalesChart from './dashboard/DailySalesChart.jsx';
import TopCustomersChart from './dashboard/TopCustomersChart.jsx';
import CustomersTab from './dashboard/CustomersTab.jsx';
import { getDashboardColumns, PRIORITY_COLUMNS } from './dashboard/dashboardColumns.jsx';

ModuleRegistry.registerModules([AllCommunityModule]);

export default function Dashboard({ apiBaseUrl }) {
  const navigate = useNavigate();
  const { showError, showSuccess } = useToast();
  const gridRef = useRef(null);

  const [activeTab, setActiveTab] = useState('analytics'); // 'analytics', 'ledger', or 'customers'
  const [theme, setTheme] = useState(
    typeof window !== 'undefined' ? document.documentElement.dataset.theme || 'dark' : 'dark'
  );

  // Filters
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [dynamicKeys, setDynamicKeys] = useState([]);

  useEffect(() => {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'data-theme') {
          setTheme(document.documentElement.dataset.theme || 'dark');
        }
      });
    });
    observer.observe(document.documentElement, { attributes: true });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Handle actions from action column
  const handleAction = useCallback(async (action, data) => {
    if (!data) return;
    if (action === 'reopen') {
      navigate(`/preview/${data.template_id}?receipt_id=${data.id}`);
    } else if (action === 'delete') {
      if (!window.confirm('Delete this receipt permanently?')) return;
      try {
        const response = await authFetch(`${apiBaseUrl}/api/receipts/${data.id}`, { method: 'DELETE' });
        if (!response.ok) throw new Error(await parseApiError(response, 'Failed to delete'));
        showSuccess('Receipt deleted');
        gridRef.current?.api?.refreshInfiniteCache();
      } catch (err) {
        showError(err.message);
      }
    } else if (action === 'export') {
      navigate(`/preview/${data.template_id}?receipt_id=${data.id}`);
    } else if (action === 'share') {
      try {
        const response = await authFetch(`${apiBaseUrl}/api/receipts/${data.id}/share`, { method: 'POST' });
        const resData = await response.json();
        if (!response.ok) throw new Error(resData.error || 'Failed to generate share link');
        const shareUrl = `${window.location.origin}/r/${resData.share_token}`;
        await navigator.clipboard.writeText(shareUrl);
        showSuccess('Share link copied to clipboard');
        gridRef.current?.api?.refreshInfiniteCache();
      } catch (err) {
        showError(err.message);
      }
    } else if (action === 'status_paid' || action === 'status_void') {
      try {
        const newStatus = action === 'status_paid' ? 'paid' : 'void';
        // Note: we need an endpoint to update status or updateReceipt should support it.
        // updateReceipt supports form_data natively right now. I will update it to support status.
        const response = await authFetch(`${apiBaseUrl}/api/receipts/${data.id}/status`, { 
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus })
        });
        if (!response.ok) throw new Error(await parseApiError(response, 'Failed to update status'));
        showSuccess(`Marked as ${newStatus}`);
        gridRef.current?.api?.refreshInfiniteCache();
      } catch (err) {
        showError(err.message);
      }
    }
  }, [navigate, apiBaseUrl, showError, showSuccess]);

  const columns = useMemo(() => getDashboardColumns(dynamicKeys, handleAction), [dynamicKeys, handleAction]);

  const defaultColDef = useMemo(
    () => ({
      filter: false, // Server-side handles filter, disable local filter
      resizable: true,
      sortable: true,
      cellStyle: {
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: '13px',
      },
    }),
    []
  );

  // AG Grid Infinite Datasource
  const datasource = useMemo(() => {
    return {
      getRows: async (params) => {
        try {
          const page = Math.floor(params.startRow / 50) + 1;
          const sortModel = params.sortModel[0];
          const sort_by = sortModel ? sortModel.colId : 'created_at';
          const sort_dir = sortModel ? sortModel.sort : 'desc';

          let url = `${apiBaseUrl}/api/receipts?page=${page}&limit=50&sort_by=${sort_by}&sort_dir=${sort_dir}`;
          if (dateFrom) url += `&from=${encodeURIComponent(dateFrom)}`;
          if (dateTo) url += `&to=${encodeURIComponent(dateTo)}`;
          if (statusFilter) url += `&status=${encodeURIComponent(statusFilter)}`;
          if (debouncedSearch) url += `&search=${encodeURIComponent(debouncedSearch)}`;

          const response = await authFetch(url);
          console.log(`[Dashboard] Fetched ${url}: ${response.status}`);
          if (!response.ok) throw new Error('Failed to fetch data');

          const count = parseInt(response.headers.get('x-total-count') || '0', 10);
          const rawData = await response.json();
          console.log(`[Dashboard] Fetched ${rawData.length} rows, count: ${count}`);

          // Extract unique keys for dynamic columns
          const newKeys = new Set(dynamicKeys);
          let keysChanged = false;

          const flattened = rawData.map(r => {
            const fd = typeof r.form_data === 'string' ? JSON.parse(r.form_data) : (r.form_data || {});
            
            Object.keys(fd).forEach(k => {
              if (!PRIORITY_COLUMNS.includes(k) && !newKeys.has(k)) {
                newKeys.add(k);
                keysChanged = true;
              }
            });

            return {
              id: r.id,
              template_id: r.template_id,
              created_at: r.created_at,
              template_name: r.templates?.name || '',
              status: r.status || 'draft',
              ...fd
            };
          });

          if (keysChanged) {
            setDynamicKeys(Array.from(newKeys));
          }

          params.successCallback(flattened, count);
        } catch (err) {
          console.error(err);
          params.failCallback();
        }
      }
    };
  }, [apiBaseUrl, dateFrom, dateTo, statusFilter, debouncedSearch, dynamicKeys]);

  const onGridReady = useCallback((params) => {
    params.api.setGridOption('datasource', datasource);
  }, [datasource]);

  // Refresh grid when filters change
  useEffect(() => {
    if (gridRef.current?.api && activeTab === 'ledger') {
      gridRef.current.api.setGridOption('datasource', datasource);
    }
  }, [datasource, activeTab]);

  const handleClearFilters = () => {
    setDateFrom('');
    setDateTo('');
    setStatusFilter('');
    setSearchQuery('');
  };

  const handleExportCsv = useCallback(() => {
    gridRef.current?.api?.exportDataAsCsv({ fileName: 'ledger_export.csv' });
  }, []);

  return (
    <section className="dashboard-page px-4 md:px-6 py-6 md:py-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <Logo className="w-8 h-8 rounded-none" />
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent-red">LedgerX</p>
            <h1 className="text-2xl md:text-3xl font-semibold text-text">Sales Dashboard</h1>
          </div>
        </div>
        
        {/* Tabs */}
        <div className="flex bg-[var(--bg-secondary)] border border-[var(--line)]">
          <button 
            className={`px-6 py-2 text-sm font-semibold uppercase tracking-wider transition-colors ${activeTab === 'analytics' ? 'bg-text text-bg' : 'text-[var(--ink-muted)] hover:text-text'}`}
            onClick={() => setActiveTab('analytics')}
          >
            Analytics
          </button>
          <button 
            className={`px-6 py-2 text-sm font-semibold uppercase tracking-wider transition-colors ${activeTab === 'ledger' ? 'bg-text text-bg' : 'text-[var(--ink-muted)] hover:text-text'}`}
            onClick={() => setActiveTab('ledger')}
          >
            Ledger
          </button>
          <button 
            className={`px-6 py-2 text-sm font-semibold uppercase tracking-wider transition-colors ${activeTab === 'customers' ? 'bg-text text-bg' : 'text-[var(--ink-muted)] hover:text-text'}`}
            onClick={() => setActiveTab('customers')}
          >
            Customers
          </button>
        </div>
      </div>

      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <StatBar apiBaseUrl={apiBaseUrl} />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <DailySalesChart apiBaseUrl={apiBaseUrl} />
            <TopCustomersChart apiBaseUrl={apiBaseUrl} />
            <WeeklyChart apiBaseUrl={apiBaseUrl} />
            <MonthlyChart apiBaseUrl={apiBaseUrl} />
          </div>
        </div>
      )}

      {activeTab === 'ledger' && (
        <div className="flex flex-col gap-4">
          {/* Toolbar */}
          <div className="flex flex-col md:flex-row gap-4 items-end bg-[var(--bg-secondary)] p-4 border border-[var(--line)]">
            <div className="flex flex-col gap-1 w-full md:w-auto">
              <label className="text-[10px] font-mono text-[var(--ink-soft)] uppercase tracking-wider">From Date</label>
              <input 
                type="date" 
                className="bg-bg border border-[var(--line)] text-sm px-3 py-1.5 focus:border-text focus:outline-none"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1 w-full md:w-auto">
              <label className="text-[10px] font-mono text-[var(--ink-soft)] uppercase tracking-wider">To Date</label>
              <input 
                type="date" 
                className="bg-bg border border-[var(--line)] text-sm px-3 py-1.5 focus:border-text focus:outline-none"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1 w-full md:w-auto">
              <label className="text-[10px] font-mono text-[var(--ink-soft)] uppercase tracking-wider">Status</label>
              <select 
                className="bg-bg border border-[var(--line)] text-sm px-3 py-1.5 focus:border-text focus:outline-none"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">All Statuses</option>
                <option value="draft">Draft</option>
                <option value="sent">Sent</option>
                <option value="paid">Paid</option>
                <option value="void">Void</option>
              </select>
            </div>
            <div className="flex flex-col gap-1 w-full md:w-auto flex-1">
              <label className="text-[10px] font-mono text-[var(--ink-soft)] uppercase tracking-wider">Search Customer</label>
              <input 
                type="text" 
                placeholder="Search by name..."
                className="bg-bg border border-[var(--line)] text-sm px-3 py-1.5 focus:border-text focus:outline-none w-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-2 w-full md:w-auto justify-end">
              <button 
                type="button" 
                className="editor-secondary whitespace-nowrap"
                onClick={handleClearFilters}
              >
                Clear
              </button>
              <button 
                type="button" 
                className="editor-secondary whitespace-nowrap bg-[var(--bg-tertiary)]"
                onClick={handleExportCsv}
              >
                Export CSV
              </button>
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
      )}

      {activeTab === 'customers' && (
        <CustomersTab apiBaseUrl={apiBaseUrl} theme={theme} />
      )}
    </section>
  );
}
