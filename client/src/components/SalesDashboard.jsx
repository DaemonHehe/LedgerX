import { useEffect, useMemo, useState } from 'react';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import { authFetch } from '../lib/api.js';

function SalesDashboard({ apiBaseUrl }) {
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const columnDefs = useMemo(
    () => [
      { field: 'date', headerName: 'Date', minWidth: 140 },
      { field: 'customer_name', headerName: 'Customer Name', minWidth: 190 },
      { field: 'customer_address', headerName: 'Address', flex: 1, minWidth: 260 },
      { field: 'total_quantity', headerName: 'Total QTY', minWidth: 140 },
      {
        field: 'grand_total',
        headerName: 'Grand Total',
        minWidth: 150,
        valueFormatter: ({ value }) => `$${Number(value || 0).toFixed(2)}`,
      },
    ],
    [],
  );

  const defaultColDef = useMemo(
    () => ({
      filter: true,
      resizable: true,
      sortable: true,
    }),
    [],
  );

  useEffect(() => {
    const fetchReceipts = async () => {
      try {
        setLoading(true);
        setError('');

        const response = await authFetch(`${apiBaseUrl}/api/receipts`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to load receipts.');
        }

        setReceipts(data);
      } catch (requestError) {
        setError(requestError.message);
      } finally {
        setLoading(false);
      }
    };

    fetchReceipts();
  }, [apiBaseUrl]);

  return (
    <section className="dashboard-page">
      <div className="dashboard-header">
        <div>
          <p>Saved Receipts</p>
          <h1>Sales Dashboard</h1>
        </div>
        <span>{receipts.length} records</span>
      </div>

      {error && <p className="dashboard-error">{error}</p>}

      <div className="ag-theme-alpine dashboard-grid">
        <AgGridReact
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          loading={loading}
          rowData={receipts}
          pagination
          paginationPageSize={20}
        />
      </div>
    </section>
  );
}

export default SalesDashboard;
