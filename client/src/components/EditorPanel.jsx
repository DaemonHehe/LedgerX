import { Plus, Trash2, Upload } from 'lucide-react';
import { useState } from 'react';

const fieldClass =
  'editor-field w-full border px-3 py-2.5 text-sm outline-none transition';

const labelClass = 'editor-label';

const normalizeQty = (value) => {
  const digits = value.replace(/\D/g, '').slice(-2);
  return digits ? digits.padStart(2, '0') : '00';
};

function EditorPanel({ apiBaseUrl, receipt, updateReceipt, updateItems }) {
  const [uploadingField, setUploadingField] = useState('');
  const [uploadError, setUploadError] = useState('');

  const handleImageUpload = async (field, event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      setUploadingField(field);
      setUploadError('');

      const response = await fetch(`${apiBaseUrl}/api/upload`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed.');
      }

      updateReceipt(field, data.publicUrl);
    } catch (error) {
      setUploadError(error.message);
    } finally {
      setUploadingField('');
      event.target.value = '';
    }
  };

  const addItem = () => {
    updateItems([
      ...receipt.items,
      {
        id: crypto.randomUUID(),
        qty: '01',
        name: `ITEM ${receipt.items.length + 1}`,
        price: '0.00',
      },
    ]);
  };

  const editItem = (id, field, value) => {
    updateItems(
      receipt.items.map((item) => {
        if (item.id !== id) {
          return item;
        }

        return {
          ...item,
          [field]: field === 'qty' ? normalizeQty(value) : value,
        };
      }),
    );
  };

  const deleteItem = (id) => {
    updateItems(receipt.items.filter((item) => item.id !== id));
  };

  const handleSaveToSales = async () => {
    try {
      const totals = receipt.items.reduce(
        (summary, item) => {
          const qty = Number.parseInt(item.qty, 10) || 0;
          const price = Number.parseFloat(item.price) || 0;

          return {
            totalQuantity: summary.totalQuantity + qty,
            grandTotal: summary.grandTotal + qty * price,
          };
        },
        { totalQuantity: 0, grandTotal: 0 },
      );

      const payload = {
        customer_name: receipt.customerName,
        customer_address: receipt.customerAddress,
        date: receipt.orderDate,
        total_quantity: totals.totalQuantity,
        grand_total: totals.grandTotal,
        items: receipt.items,
      };

      const response = await fetch(`${apiBaseUrl}/api/receipts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save receipt.');
      }

      alert('Saved successfully!');
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <div className="space-y-6">
      <button className="save-sales-button" onClick={handleSaveToSales} type="button">
        Save to Sales
      </button>

      <section className="editor-section">
        <div className="section-heading">
          <span>01</span>
          <h2>Header</h2>
        </div>
        <div className="grid gap-4">
          <label>
            <span className={labelClass}>Store Name</span>
            <input
              className={fieldClass}
              placeholder="YOUR STORE NAME"
              value={receipt.storeName}
              onChange={(event) => updateReceipt('storeName', event.target.value.toUpperCase())}
            />
          </label>

          <label>
            <span className={labelClass}>Description</span>
            <input
              className={fieldClass}
              placeholder="YOUR DESCRIPTION"
              value={receipt.receiptTitle}
              onChange={(event) => updateReceipt('receiptTitle', event.target.value.toUpperCase())}
            />
          </label>

          <label>
            <span className={labelClass}>Store Logo</span>
            <div className="upload-row">
              <input
                className="hidden"
                id="logo-upload"
                type="file"
                accept="image/*"
                onChange={(event) => handleImageUpload('logoUrl', event)}
              />
              <label
                className="editor-upload"
                htmlFor="logo-upload"
              >
                <Upload size={16} />
                {uploadingField === 'logoUrl' ? 'Uploading...' : 'Upload image'}
              </label>
              {receipt.logoUrl && (
                <button
                  className="text-sm font-semibold text-[#b55432] hover:text-[#8f4228]"
                  onClick={() => updateReceipt('logoUrl', '')}
                  type="button"
                >
                  Remove
                </button>
              )}
            </div>
          </label>
        </div>
      </section>

      <section className="editor-section">
        <div className="section-heading section-heading-action">
          <div>
            <span>02</span>
            <h2>Items</h2>
          </div>
          <button className="editor-add" onClick={addItem}>
            <Plus size={16} />
            Add item
          </button>
        </div>

        <div className="item-list">
          <div className="item-editor item-editor-head">
            <span>NO</span>
            <span>ITEM</span>
            <span>QTY</span>
            <span>AMT</span>
            <span />
          </div>

          {receipt.items.map((item, index) => (
            <div className="item-editor" key={item.id}>
              <span className="item-number">{String(index + 1).padStart(2, '0')}</span>
              <input
                aria-label="Item name"
                className={fieldClass}
                placeholder="ITEM NAME"
                value={item.name}
                onChange={(event) => editItem(item.id, 'name', event.target.value.toUpperCase())}
              />
              <input
                aria-label="Quantity"
                className={`${fieldClass} text-center font-semibold`}
                placeholder="01"
                value={item.qty}
                onChange={(event) => editItem(item.id, 'qty', event.target.value)}
              />
              <input
                aria-label="Price"
                className={fieldClass}
                min="0"
                placeholder="0.00"
                step="0.01"
                type="number"
                value={item.price}
                onChange={(event) => editItem(item.id, 'price', event.target.value)}
              />
              <button
                aria-label={`Delete ${item.name}`}
                className="editor-delete grid h-10 w-10 place-items-center rounded-lg border"
                onClick={() => deleteItem(item.id)}
                type="button"
              >
                <Trash2 size={17} />
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="editor-section">
        <div className="section-heading">
          <span>03</span>
          <h2>Customer</h2>
        </div>
        <div className="grid gap-4">
          <label>
            <span className={labelClass}>Customer Name</span>
            <input
              className={fieldClass}
              placeholder="CUSTOMER NAME"
              value={receipt.customerName}
              onChange={(event) => updateReceipt('customerName', event.target.value.toUpperCase())}
            />
          </label>
          <label>
            <span className={labelClass}>Customer Address</span>
            <textarea
              className={`${fieldClass} min-h-20 resize-y`}
              placeholder="INSERT CUSTOMER ADDRESS HERE"
              value={receipt.customerAddress}
              onChange={(event) => updateReceipt('customerAddress', event.target.value.toUpperCase())}
            />
          </label>
          <label>
            <span className={labelClass}>Order Date</span>
            <input
              className={fieldClass}
              type="date"
              value={receipt.orderDate}
              onChange={(event) => updateReceipt('orderDate', event.target.value)}
            />
          </label>
        </div>
      </section>

      <section className="editor-section">
        <div className="section-heading">
          <span>04</span>
          <h2>Footer</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label>
            <span className={labelClass}>Remark</span>
            <input
              className={fieldClass}
              placeholder="-"
              value={receipt.footerRemark}
              onChange={(event) => updateReceipt('footerRemark', event.target.value.toUpperCase())}
            />
          </label>
          <label>
            <span className={labelClass}>Payment</span>
            <input
              className={fieldClass}
              placeholder="PAYMENT METHOD"
              value={receipt.paymentMethod}
              onChange={(event) => updateReceipt('paymentMethod', event.target.value.toUpperCase())}
            />
          </label>
          <label>
            <span className={labelClass}>Auth Code</span>
            <input
              className={fieldClass}
              placeholder="AUTH CODE"
              value={receipt.authCode}
              onChange={(event) => updateReceipt('authCode', event.target.value.toUpperCase())}
            />
          </label>
          <label className="sm:col-span-2">
            <span className={labelClass}>Footer Description</span>
            <input
              className={fieldClass}
              placeholder="THANK YOU / COME BACK SOON"
              value={receipt.footerMessage}
              onChange={(event) => updateReceipt('footerMessage', event.target.value.toUpperCase())}
            />
          </label>
          <label className="sm:col-span-2">
            <span className={labelClass}>Barcode Image</span>
            <div className="upload-row">
              <input
                className="hidden"
                id="barcode-upload"
                type="file"
                accept="image/*"
                onChange={(event) => handleImageUpload('barcodeUrl', event)}
              />
              <label
                className="editor-upload"
                htmlFor="barcode-upload"
              >
                <Upload size={16} />
                {uploadingField === 'barcodeUrl' ? 'Uploading...' : 'Upload image'}
              </label>
              {receipt.barcodeUrl && (
                <button
                  className="text-sm font-semibold text-[#b55432] hover:text-[#8f4228]"
                  onClick={() => updateReceipt('barcodeUrl', '')}
                  type="button"
                >
                  Remove
                </button>
              )}
            </div>
          </label>
          {uploadError && <p className="upload-error sm:col-span-2">{uploadError}</p>}
        </div>
      </section>
    </div>
  );
}

export default EditorPanel;
