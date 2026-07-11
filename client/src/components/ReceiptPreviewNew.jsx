// ReceiptPreviewNew: JSON-driven template rendering
// Two modes:
//   1. Template picker (no templateData) — shown at /receipt
//   2. Fill-and-export (with templateData) — shown at /receipt/:id

import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import html2canvas from 'html2canvas';
import { Download, ArrowRight, Search, FileText } from 'lucide-react';
import { authFetch, parseApiError } from '../lib/api.js';
import TemplateRenderer from './TemplateRenderer.jsx';
import RepeaterInput from './RepeaterInput.jsx';
import { convertToStandardSchema, createDefaultTableRow } from '../lib/templateSchema.js';
import { useToast } from '../context/ToastContext.jsx';
import Skeleton, { TemplateGallerySkeleton } from './Skeleton.jsx';
import { Logo } from './Logo.jsx';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

function buildInitialFormData(elements) {
  const initialFormData = {};
  elements?.forEach((element) => {
    if (!element.isDynamic || !element.fieldKey) return;

    if (element.type === 'table') {
      const cols = element.columns || element.props?.columns || [];
      initialFormData[element.fieldKey] = [createDefaultTableRow(cols)];
    } else {
      initialFormData[element.fieldKey] = element.content || '';
    }
  });
  return initialFormData;
}

function parseNumeric(value) {
  const parsed = parseFloat(String(value ?? '').replace(/[^0-9.-]/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
}

function calculateLineItemsTotal(lineItems) {
  if (!Array.isArray(lineItems)) return 0;
  return lineItems.reduce((sum, item) => {
    const qty = parseNumeric(item.qty ?? item.quantity ?? 1);
    const price = parseNumeric(item.price ?? item.unit_price ?? 0);
    const lineAmount = parseNumeric(item.amount);
    if (lineAmount > 0 && price === 0) {
      return sum + lineAmount;
    }
    return sum + qty * price;
  }, 0);
}

// ────────────────────────────────────────────────────────────
// Template Picker — shown when user navigates to /receipt
// ────────────────────────────────────────────────────────────
function TemplatePicker({ templates = [], templatesLoaded = false, onRefreshTemplates }) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (onRefreshTemplates) {
      onRefreshTemplates().catch((err) => {
        console.error('Failed to refresh templates:', err);
      });
    }
  }, [onRefreshTemplates]);

  const filteredTemplates = templates.filter((t) =>
    (t.name || t.title || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const loading = !templatesLoaded;

  return (
    <section className="py-8 px-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent-red mb-1">
          LedgerX
        </p>
        <h1 className="text-3xl font-semibold text-text mb-2">
          Generate Receipt
        </h1>
        <p className="text-sm text-text-soft">
          Choose a template to start filling in your receipt data.
        </p>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
          <input
            type="text"
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-sm border border-line bg-bg text-text outline-none focus:border-text transition-colors"
            style={{ fontFamily: 'JetBrains Mono, monospace' }}
          />
        </div>
      </div>

      {loading ? (
        <TemplateGallerySkeleton count={4} />
      ) : filteredTemplates.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center py-24 border border-line bg-surface"
          style={{ fontFamily: 'JetBrains Mono, monospace' }}
        >
          <FileText size={48} className="text-text-muted mb-4" />
          <p className="text-xs uppercase tracking-wider text-text-tertiary text-center mb-4">
            No templates found. Create one in Deck Studio first.
          </p>
          <button
            className="px-4 py-2 text-xs font-mono uppercase border border-line bg-text text-bg hover:bg-text-soft transition-colors"
            onClick={() => navigate('/deck')}
            type="button"
          >
            Open Deck Studio
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTemplates.map((template) => {
            const elementCount =
              template.schema_json?.elements?.length || template.elements?.length || 0;
            const createdAt = template.created_at
              ? new Date(template.created_at).toLocaleDateString()
              : 'Local Preset';

            return (
              <button
                key={template.id}
                type="button"
                className="text-left border border-line bg-bg p-5 hover:border-text transition-colors group"
                onClick={() => navigate(`/receipt/${template.id}`)}
              >
                <h3 className="text-sm font-semibold text-text mb-1 group-hover:text-accent-red transition-colors">
                  {template.name || template.title}
                </h3>
                <p className="text-xs text-text-muted font-mono mb-3">
                  {elementCount} elements · {createdAt}
                </p>
                <div className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-text">
                  Use Template
                  <ArrowRight size={12} />
                </div>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}

// ────────────────────────────────────────────────────────────
// Receipt Editor / Viewer — fill dynamic data and export
// ────────────────────────────────────────────────────────────
function ReceiptEditor({ templateId, templateData }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [receiptId, setReceiptId] = useState(searchParams.get('receipt_id'));
  const { showError, showSuccess } = useToast();

  const [formData, setFormData] = useState({});
  const [activeTemplate, setActiveTemplate] = useState(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isLoadingReceipt, setIsLoadingReceipt] = useState(Boolean(receiptId));
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
  const [activeTab, setActiveTab] = useState('edit');
  const [customerId, setCustomerId] = useState(null);
  const [customers, setCustomers] = useState([]);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (templateData) {
      const standardTemplate = convertToStandardSchema(templateData);
      setActiveTemplate(standardTemplate);
      
      if (!receiptId) {
        setFormData(buildInitialFormData(standardTemplate.elements));
        setIsLoadingReceipt(false);
        return;
      }

      const fetchReceipt = async () => {
        setIsLoadingReceipt(true);
        try {
          const response = await authFetch(`${API_BASE_URL}/api/receipts/${receiptId}`);
          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.error || 'Failed to load receipt.');
          }

          let parsedFormData = null;
          if (data.form_data) {
            if (typeof data.form_data === 'object') {
              parsedFormData = data.form_data;
            } else if (typeof data.form_data === 'string') {
              try {
                parsedFormData = JSON.parse(data.form_data);
                if (typeof parsedFormData === 'string') {
                  parsedFormData = JSON.parse(parsedFormData);
                }
              } catch (e) {
                console.error('Failed to parse form_data:', e);
              }
            }
          }

          setFormData(
            parsedFormData && typeof parsedFormData === 'object'
              ? parsedFormData
              : buildInitialFormData(standardTemplate.elements)
          );
          if (data.customer_id) setCustomerId(data.customer_id);
        } catch (error) {
          console.error('Failed to load receipt:', error);
          showError(error.message || 'Failed to load receipt.');
          setFormData(buildInitialFormData(standardTemplate.elements));
        } finally {
          setIsLoadingReceipt(false);
        }
      };

      fetchReceipt();
    }
  }, [templateData, receiptId, showError]);

  useEffect(() => {
    authFetch(`${API_BASE_URL}/api/customers`)
      .then(res => res.json())
      .then(data => setCustomers(Array.isArray(data) ? data : []))
      .catch(err => console.error('Error fetching customers:', err));
  }, []);

  const tableElement = activeTemplate?.elements?.find((el) => el.type === 'table');
  const lineItemsFieldKey = tableElement?.fieldKey || 'line_items';
  const totalFieldKey = tableElement?.totalFieldKey || 'totalAmount';
  const hasTotalQtyField = activeTemplate?.elements?.some(
    (el) => el.isDynamic && el.fieldKey === 'total_qty'
  );

  useEffect(() => {
    if (!activeTemplate || isLoadingReceipt) return;

    const lineItems = formData[lineItemsFieldKey];

    // Calculate amounts based on template settings
    const subtotal = calculateLineItemsTotal(lineItems);
    const taxRate = parseFloat(tableElement?.taxRate || tableElement?.props?.taxRate || 0);
    const discountVal = parseFloat(tableElement?.discount || tableElement?.props?.discount || 0);
    
    const taxable = Math.max(0, subtotal - discountVal);
    const taxVal = (taxable * taxRate) / 100;
    const finalTotal = taxable + taxVal;

    // Remove .00 after 0 like 0.00, just 0 is okay
    const formattedAmount = finalTotal.toFixed(2).replace(/\.00$/, '');
    const formattedSubtotal = `$${subtotal.toFixed(2)}`;
    const formattedDiscount = `-$${discountVal.toFixed(2)}`;
    const formattedTax = `$${taxVal.toFixed(2)}`;

    // Calculate total quantity
    const totalQty = Array.isArray(lineItems) ? lineItems.reduce((sum, item) => {
      const q = parseFloat(item.qty || item.quantity || 0);
      return sum + (isNaN(q) ? 0 : q);
    }, 0) : 0;
    // Format quantity (zero-padded if integer < 10)
    const formattedQty = totalQty % 1 === 0
      ? String(totalQty).padStart(2, '0')
      : String(totalQty);

    setFormData((prev) => {
      let updated = false;
      const nextData = { ...prev };

      // Update both camelCase and snake_case total keys to ensure DB/Dashboard compatibility
      if (prev[totalFieldKey] !== formattedAmount) {
        nextData[totalFieldKey] = formattedAmount;
        updated = true;
      }

      if (prev.total_amount !== formattedAmount) {
        nextData.total_amount = formattedAmount;
        updated = true;
      }

      if (prev.subtotalAmount !== formattedSubtotal) {
        nextData.subtotalAmount = formattedSubtotal;
        updated = true;
      }

      if (prev.discountAmount !== formattedDiscount) {
        nextData.discountAmount = formattedDiscount;
        updated = true;
      }

      if (prev.taxAmount !== formattedTax) {
        nextData.taxAmount = formattedTax;
        updated = true;
      }

      if (hasTotalQtyField && prev.total_qty !== formattedQty) {
        nextData.total_qty = formattedQty;
        updated = true;
      }

      return updated ? nextData : prev;
    });
  }, [
    formData[lineItemsFieldKey],
    hasTotalQtyField,
    lineItemsFieldKey,
    totalFieldKey,
    activeTemplate,
    isLoadingReceipt,
  ]);

  const handleFieldChange = (fieldKey, value) => {
    setFormData((prev) => ({ ...prev, [fieldKey]: value }));
  };

  const handleRepeaterChange = (fieldKey, rowIndex, colKey, value) => {
    setFormData((prev) => {
      const rows = [...(prev[fieldKey] || [])];
      rows[rowIndex] = { ...rows[rowIndex], [colKey]: value };
      return { ...prev, [fieldKey]: rows };
    });
  };

  const handleAddRow = (fieldKey, newRow) => {
    setFormData((prev) => ({
      ...prev,
      [fieldKey]: [...(prev[fieldKey] || []), newRow],
    }));
  };

  const handleDeleteRow = (fieldKey, columns, rowIndex) => {
    setFormData((prev) => {
      const rows = [...(prev[fieldKey] || [])];
      rows.splice(rowIndex, 1);
      return {
        ...prev,
        [fieldKey]: rows.length > 0 ? rows : [createDefaultTableRow(columns)],
      };
    });
  };

  const saveReceipt = async (format = 'png') => {
    const bodyObj = {
      template_id: activeTemplate.id,
      form_data: formData,
      export_format: format
    };
    if (receiptId) {
      bodyObj.parent_receipt_id = receiptId;
    }
    if (customerId) {
      bodyObj.customer_id = customerId;
    }

    const response = await authFetch(`${API_BASE_URL}/api/receipts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(bodyObj),
    });

    if (response.ok) {
      const savedData = await response.json();
      showSuccess(receiptId ? 'New receipt revision saved to Ledger' : 'Receipt saved to Ledger');
      return savedData.id;
    }

    const message = await parseApiError(response, 'Failed to save receipt record.');
    throw new Error(message);
  };

  const handleExport = async (format = 'png') => {
    if (!activeTemplate) return;

    setIsExporting(true);
    try {
      // 1. Save receipt first to get ID
      const savedReceiptId = await saveReceipt(format);

      // 2. Generate share token
      const shareRes = await authFetch(`${API_BASE_URL}/api/receipts/${savedReceiptId}/share`, { method: 'POST' });
      const shareData = await shareRes.json();
      const shareUrl = `${window.location.origin}/r/${shareData.share_token}`;

      // 3. If there is a dynamic QR code element, generate QR Data URI and inject it
      const qrElement = activeTemplate.elements.find(el => el.type === 'qrcode' && el.isDynamic && el.fieldKey);
      if (qrElement) {
        const QRCode = (await import('qrcode')).default;
        const qrDataUrl = await QRCode.toDataURL(shareUrl, { width: qrElement.width || 150, margin: 1 });
        
        // Force synchronous update (or wait a bit) for DOM
        setFormData(prev => ({ ...prev, [qrElement.fieldKey]: qrDataUrl }));
        await new Promise(resolve => setTimeout(resolve, 300));
      }

      const exportNode = document.getElementById('export-node');
      if (!exportNode) {
        showError('Export preview not found.');
        return;
      }

      // Temporarily remove the scale transform from the wrapper to ensure pixel-perfect export sizing
      const wrapper = exportNode.parentElement.parentElement;
      const originalTransform = wrapper.style.transform;
      const originalMarginBottom = wrapper.style.marginBottom;
      wrapper.style.transform = 'none';
      wrapper.style.marginBottom = '0';

      const canvas = await html2canvas(exportNode, {
        scale: 2,
        backgroundColor: activeTemplate.backgroundColor,
        logging: false,
      });

      // Restore transform
      wrapper.style.transform = originalTransform;
      wrapper.style.marginBottom = originalMarginBottom;

      if (format === 'pdf') {
        const { jsPDF } = await import('jspdf');
        const imgWidth = canvas.width / 2; // scale: 2 was used
        const imgHeight = canvas.height / 2;
        const pdf = new jsPDF({
          orientation: imgWidth > imgHeight ? 'landscape' : 'portrait',
          unit: 'px',
          format: [imgWidth, imgHeight]
        });
        const imgData = canvas.toDataURL('image/png');
        pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
        pdf.save(`receipt-${Date.now()}.pdf`);
        
        navigate('/dashboard');
      } else {
        await new Promise((resolve, reject) => {
          canvas.toBlob(async (blob) => {
            if (!blob) {
              reject(new Error('Failed to generate PNG.'));
              return;
            }

            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `receipt-${Date.now()}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            navigate('/dashboard');
            resolve();
          });
        });
      }
    } catch (error) {
      console.error('Export failed:', error);
      showError(error.message || 'Export failed.');
    } finally {
      setIsExporting(false);
    }
  };

  if (!activeTemplate || isLoadingReceipt) {
    return (
      <div className="flex flex-col md:flex-row min-h-screen bg-bg p-6 gap-6">
        <Skeleton className="h-64 md:h-auto md:flex-1" />
        <div className="w-full md:w-96 space-y-4">
          <Skeleton className="h-8 w-1/2" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    );
  }

  const dynamicElements = activeTemplate.elements?.filter(
    (el) => el.isDynamic && el.fieldKey
  ) || [];

  const generalFields = dynamicElements.filter((el) => el.type !== 'table');
  const tableFields = dynamicElements.filter((el) => el.type === 'table');

  const renderDynamicForm = () => {
    if (dynamicElements.length === 0) {
      return (
        <div className="text-sm text-gray-500">
          This template has no dynamic fields. Edit the template in Deck Studio to add dynamic fields.
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {generalFields.length > 0 && (
          <section className="border border-line">
            <div className="px-3 py-2 border-b border-line bg-surface">
              <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-text">
                General Info
              </h3>
            </div>
            <div className="p-4 space-y-4">
              {generalFields.map((element) => {
                const isCalculatedField = element.fieldKey === 'total_amount' || element.fieldKey === 'total_qty';
                return (
                  <div key={element.id}>
                    <label className="block mb-2 text-xs font-semibold uppercase tracking-[0.1em] text-text-soft">
                      {element.fieldKey.replace(/_/g, ' ')} {isCalculatedField && '(calculated)'}
                    </label>
                    <input
                      type="text"
                      value={formData[element.fieldKey] || ''}
                      onChange={(e) => handleFieldChange(element.fieldKey, e.target.value)}
                      disabled={isCalculatedField}
                      className={`w-full px-3 py-2 text-sm border border-line bg-bg text-text outline-none focus:border-text transition-colors ${isCalculatedField ? 'bg-surface text-text-tertiary cursor-not-allowed' : ''
                        }`}
                      style={{ fontFamily: 'JetBrains Mono, monospace' }}
                      placeholder={element.content || `{{${element.fieldKey}}}`}
                    />
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {tableFields.length > 0 && (
          <section>
            <div className="mb-3">
              <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-text">
                Line Items
              </h3>
            </div>
            <div className="space-y-4">
              {tableFields.map((element) => (
                <RepeaterInput
                  key={element.id}
                  fieldKey={element.fieldKey}
                  label={element.fieldKey.replace(/_/g, ' ')}
                  columns={element.columns}
                  rows={formData[element.fieldKey] || [createDefaultTableRow(element.columns)]}
                  onChange={(rowIndex, colKey, value) =>
                    handleRepeaterChange(element.fieldKey, rowIndex, colKey, value)
                  }
                  onAddRow={(newRow) => handleAddRow(element.fieldKey, newRow)}
                  onDeleteRow={(rowIndex) =>
                    handleDeleteRow(element.fieldKey, element.columns, rowIndex)
                  }
                />
              ))}
            </div>
          </section>
        )}
      </div>
    );
  };

  const isMobile = windowWidth < 1024;
  const padding = isMobile ? 32 : 64; 
  const availableWidth = isMobile ? windowWidth - 16 : windowWidth - 384 - padding;
  
  let scale = 1;
  if (activeTemplate && activeTemplate.width > availableWidth) {
        scale = availableWidth / activeTemplate.width;
  }

  return (
    <div className="flex flex-col lg:flex-row min-h-screen lg:h-screen bg-bg">
      {/* MOBILE STICKY EXPORT BAR */}
      <div className="flex lg:hidden bg-bg border-b border-line sticky top-0 z-20">
        <button 
          type="button"
          className={`flex-1 py-3 text-xs font-mono uppercase tracking-wider transition-colors ${activeTab === 'edit' ? 'border-b-2 border-accent-red text-text font-semibold' : 'text-text-soft hover:text-text'}`}
          onClick={() => setActiveTab('edit')}
        >
          Form
        </button>
        <button 
          type="button"
          className={`flex-1 py-3 text-xs font-mono uppercase tracking-wider transition-colors ${activeTab === 'preview' ? 'border-b-2 border-accent-red text-text font-semibold' : 'text-text-soft hover:text-text'}`}
          onClick={() => setActiveTab('preview')}
        >
          Preview
        </button>
      </div>

      <main className={`order-2 lg:order-2 flex-shrink-0 lg:flex-1 flex flex-col overflow-auto p-4 lg:p-8 bg-bg max-h-none border-b lg:border-b-0 border-line overflow-x-hidden ${activeTab === 'preview' ? 'flex' : 'hidden lg:flex'}`}>
        <div
          className="w-full flex justify-between items-center mb-4 mx-auto font-mono text-[10px] uppercase tracking-wider text-text-tertiary select-none"
          style={{ width: `${activeTemplate.width * scale}px`, maxWidth: '100%' }}
        >
          <span>● Live Preview</span>
          <span>{activeTemplate.width} × {activeTemplate.height}px</span>
        </div>
        
        <div style={{ 
          width: `${activeTemplate.width}px`, 
          minWidth: `${activeTemplate.width}px`,
          transform: `scale(${scale})`, 
          transformOrigin: 'top center',
          margin: '0 auto',
          marginBottom: scale < 1 ? `-${activeTemplate.height * (1 - scale)}px` : 0
        }}>
          <div
            className="shadow-2xl m-auto bg-white"
            style={{ width: `${activeTemplate.width}px` }}
          >
            <div id="export-node" className="block w-full">
              <TemplateRenderer template={activeTemplate} formData={formData} />
            </div>
          </div>
        </div>
      </main>

      <aside className={`order-1 lg:order-1 w-full lg:w-96 lg:min-w-[384px] bg-surface border-r border-line flex flex-col flex-1 lg:flex-none min-h-0 ${activeTab === 'edit' ? 'flex' : 'hidden lg:flex'}`}>
        <div className="hidden lg:block p-4 lg:p-6 border-b border-line bg-surface">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-accent-red mb-1">
            LedgerX
          </p>
          <h1 className="text-xl lg:text-2xl font-bold uppercase tracking-tight text-text">
            Generate Receipt
          </h1>
          <p className="text-xs text-text-soft mt-1 font-sans">Fill in the fields to generate a new record</p>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 lg:px-6 lg:py-6 space-y-6">
          <div className="mb-4 space-y-1">
            <label className="text-xs font-mono text-[var(--ink-soft)] uppercase tracking-wider">Link Customer (Optional)</label>
            <select
              className="w-full px-3 py-2 text-sm border border-line bg-bg text-text outline-none focus:border-text"
              value={customerId || ''}
              onChange={(e) => {
                const val = e.target.value;
                setCustomerId(val || null);
                if (val) {
                  const cust = customers.find(c => c.id === val);
                  if (cust) {
                    setFormData(prev => ({
                      ...prev,
                      customer_name: cust.name,
                      customer_email: cust.email,
                      customer_phone: cust.phone,
                      customer_address: cust.address
                    }));
                  }
                }
              }}
            >
              <option value="">-- No Customer --</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          {renderDynamicForm()}
        </div>

        <div className="pl-20 pr-4 pt-4 lg:p-6 border-t border-line bg-surface space-y-3 sticky bottom-0 z-10 pb-[max(1rem,env(safe-area-inset-bottom))] lg:pb-6 flex gap-2">
          <button
            onClick={() => handleExport('png')}
            disabled={isExporting}
            className="flex-1 px-4 py-3 bg-text text-bg text-xs font-mono uppercase tracking-widest hover:bg-text-soft active:bg-text transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 rounded-none border border-text font-semibold shadow-sm hover:shadow-md min-h-[44px]"
          >
            <Download size={14} />
            {isExporting ? '...' : 'PNG'}
          </button>
          <button
            onClick={() => handleExport('pdf')}
            disabled={isExporting}
            className="flex-1 px-4 py-3 bg-text text-bg text-xs font-mono uppercase tracking-widest hover:bg-text-soft active:bg-text transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 rounded-none border border-text font-semibold shadow-sm hover:shadow-md min-h-[44px]"
          >
            <Download size={14} />
            {isExporting ? '...' : 'PDF'}
          </button>
        </div>
      </aside>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Main export — delegates to TemplatePicker or ReceiptEditor
// ────────────────────────────────────────────────────────────
export default function ReceiptPreviewNew({
  templateId,
  templateData,
  // Props for template picker mode (when no templateData)
  apiBaseUrl,
  templates,
  templatesLoaded,
  onRefreshTemplates,
}) {
  // If no templateData is provided, show the template picker
  if (!templateData) {
    return (
      <TemplatePicker
        templates={templates}
        templatesLoaded={templatesLoaded}
        onRefreshTemplates={onRefreshTemplates}
      />
    );
  }

  return <ReceiptEditor templateId={templateId} templateData={templateData} />;
}
