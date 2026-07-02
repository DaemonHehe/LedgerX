import { useEffect, useMemo, useState } from 'react';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import { authFetch } from '../lib/api.js';

// Data flattening utility to extract common keys from form_data
function flattenFormData(receipts) {
  if (!Array.isArray(receipts) || receipts.length === 0) return [];

  // Collect all unique keys from form_data
  const allKeys = new Set();
  receipts.forEach((receipt) => {
    if (receipt.form_data && typeof receipt.form_data === 'object') {
      Object.keys(receipt.form_data).forEach((key) => allKeys.add(key));
    }
  });

  // Define common keys to prioritize
  const commonKeys = ['customer_name', 'total_amount', 'date', 'transaction_date', 'total', 'amount'];
  const prioritizedKeys = commonKeys.filter((key) => allKeys.has(key));
  const remainingKeys = Array.from(allKeys).filter((key) => !commonKeys.includes(key));

  // Combine prioritized keys with remaining keys
  const orderedKeys = [...prioritizedKeys, ...remainingKeys];

  // Flatten each receipt
  return receipts.map((receipt) => {
    const flattened = {
      id: receipt.id,
      created_at: receipt.created_at,
      template_name: receipt.templates?.name || 'Unknown',
    };

    // Add form_data fields
    if (receipt.form_data && typeof receipt.form_data === 'object') {
      orderedKeys.forEach((key) => {
        flattened[key] = receipt.form_data[key] || '';
      });
    }

    return flattened;
  });
}

function SalesDashboard({ apiBaseUrl }) {
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Flatten receipts data and generate dynamic columns
  const { flattenedData, columnDefs } = useMemo(() => {
    const flattened = flattenFormData(receipts);
    
    if (flattened.length === 0) {
      return { flattenedData: [], columnDefs: [] };
    }

    // Collect all keys from flattened data for column generation
    const allKeys = new Set();
    flattened.forEach((item) => {
      Object.keys(item).forEach((key) => allKeys.add(key));
    });

    // Generate column definitions
    const defs = [
      {
        field: 'created_at',
        headerName: 'Date Created',
        minWidth: 160,
        valueFormatter: ({ value }) => {
          if (!value) return '';
          return new Date(value).toLocaleDateString();
        },
      },
      {
        field: 'template_name',
        headerName: 'Template Name',
        minWidth: 180,
      },
    ];

    // Add dynamic columns from form_data (skip metadata fields)
    const metadataFields = ['id', 'created_at', 'template_name'];
    const formDataKeys = Array.from(allKeys).filter((key) => !metadataFields.includes(key));

    formDataKeys.forEach((key) => {
      const headerName = key.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
      
      defs.push({
        field: key,
        headerName,
        minWidth: 140,
        cellStyle: { fontFamily: 'JetBrains Mono, monospace' },
      });
    });

    return { flattenedData: flattened, columnDefs: defs };
  }, [receipts]);

  const defaultColDef = useMemo(
    () => ({
      filter: true,
      resizable: true,
      sortable: true,
      cellStyle: {
        fontFamily: 'Inter, sans-serif',
        fontSize: '14px',
      },
      headerClass: 'ag-header-cell-label',
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

      <div className="ag-theme-alpine dashboard-grid ledgerx-grid">
        <AgGridReact
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          loading={loading}
          rowData={flattenedData}
          pagination
          paginationPageSize={20}
        />
      </div>
    </section>
  );
}

export default SalesDashboard;
