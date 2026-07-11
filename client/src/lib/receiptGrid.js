const PRIORITY_KEYS = [
  'customer_name',
  'total_amount',
  'date',
  'transaction_date',
  'total',
  'amount',
];

function formatFormValue(_key, value) {
  if (Array.isArray(value)) {
    const count = value.length;
    return `${count} item${count === 1 ? '' : 's'}`;
  }

  if (value && typeof value === 'object') {
    return JSON.stringify(value);
  }

  return value ?? '';
}

export function flattenReceiptsForGrid(receipts) {
  if (!Array.isArray(receipts) || receipts.length === 0) {
    return { rows: [], dynamicKeys: [] };
  }

  const allKeys = new Set();
  receipts.forEach((receipt) => {
    if (receipt.form_data && typeof receipt.form_data === 'object') {
      Object.keys(receipt.form_data).forEach((key) => allKeys.add(key));
    }
  });

  const prioritizedKeys = PRIORITY_KEYS.filter((key) => allKeys.has(key));
  const remainingKeys = Array.from(allKeys).filter(
    (key) => !PRIORITY_KEYS.includes(key)
  );
  const orderedKeys = [...prioritizedKeys, ...remainingKeys];

  const rows = receipts.map((receipt) => {
    const flattened = {
      id: receipt.id,
      template_id: receipt.template_id,
      created_at: receipt.created_at,
      template_name: receipt.templates?.name || 'Unknown',
    };

    if (receipt.form_data && typeof receipt.form_data === 'object') {
      orderedKeys.forEach((key) => {
        const rawValue = receipt.form_data[key];
        flattened[key] = formatFormValue(key, rawValue);
      });
    }

    return flattened;
  });

  const dynamicKeys = orderedKeys;

  return { rows, dynamicKeys, orderedKeys };
}

export function buildReceiptColumnDefs(dynamicKeys) {
  const defs = [
    {
      field: 'created_at',
      headerName: 'Date Created',
      minWidth: 170,
      sortable: true,
      valueFormatter: ({ value }) => {
        if (!value) return '';
        return new Date(value).toLocaleString();
      },
    },
    {
      field: 'template_name',
      headerName: 'Template Name',
      minWidth: 180,
      sortable: true,
    },
  ];

  dynamicKeys.forEach((key) => {
    const headerName = key
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase());

    defs.push({
      field: key,
      headerName,
      minWidth: 140,
      sortable: true,
      cellStyle: { fontFamily: 'JetBrains Mono, monospace' },
    });
  });

  return defs;
}
