// New ReceiptPreview with JSON-driven template rendering
// Implements split-pane layout with dynamic form generation and live preview

import { useState, useEffect } from 'react';
import html2canvas from 'html2canvas';
import { Download } from 'lucide-react';
import { authFetch } from '../lib/api.js';
import TemplateRenderer from './TemplateRenderer.jsx';
import { convertToStandardSchema } from '../lib/templateSchema.js';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

export default function ReceiptPreviewNew({ templateId, templateData }) {
  const [formData, setFormData] = useState({});
  const [activeTemplate, setActiveTemplate] = useState(null);
  const [isExporting, setIsExporting] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Convert template to standard schema when it changes
  useEffect(() => {
    if (templateData) {
      const standardTemplate = convertToStandardSchema(templateData);
      setActiveTemplate(standardTemplate);

      // Initialize formData with empty values for dynamic fields
      const initialFormData = {};
      templateData.elements?.forEach((element) => {
        if (element.isDynamic && element.formFieldType) {
          initialFormData[element.formFieldType] = element.props?.text || '';
        }
      });
      setFormData(initialFormData);
    }
  }, [templateData]);

  // Handle form data changes
  const handleFieldChange = (fieldKey, value) => {
    setFormData((prev) => ({ ...prev, [fieldKey]: value }));
  };

  // Show toast notification
  const showToastNotification = (message) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  // Export to PNG using html2canvas and save record to database
  const handleExport = async () => {
    if (!activeTemplate) return;

    setIsExporting(true);
    try {
      const exportNode = document.getElementById('export-node');
      if (!exportNode) {
        console.error('Export node not found');
        return;
      }

      const canvas = await html2canvas(exportNode, {
        scale: 2, // Higher resolution
        backgroundColor: activeTemplate.backgroundColor,
        logging: false,
      });

      // Convert to blob and download
      canvas.toBlob(async (blob) => {
        if (!blob) return;

        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `receipt-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        // Save record to database
        try {
          const response = await authFetch(`${API_BASE_URL}/api/receipts`, {
            method: 'POST',
            body: JSON.stringify({
              template_id: templateId,
              form_data: formData,
            }),
          });

          if (response.ok) {
            showToastNotification('Receipt generated and saved to ledger.');
          } else {
            console.error('Failed to save receipt record');
          }
        } catch (error) {
          console.error('Failed to save receipt record:', error);
        }

        setIsExporting(false);
      });
    } catch (error) {
      console.error('Export failed:', error);
      setIsExporting(false);
    }
  };

  if (!activeTemplate) {
    return (
      <div className="flex h-full items-center justify-center text-gray-500">
        No template loaded
      </div>
    );
  }

  // Render dynamic form fields for template elements
  const renderDynamicForm = () => {
    const dynamicElements = templateData.elements?.filter((el) => el.isDynamic && el.formFieldType) || [];

    if (dynamicElements.length === 0) {
      return (
        <div className="text-sm text-gray-500">
          This template has no dynamic fields. Edit the template in Template Studio to add dynamic fields.
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {dynamicElements.map((element) => (
          <div key={element.id}>
            <label className="block mb-2 text-sm font-medium text-gray-700">
              {element.formFieldType.replace(/_/g, ' ').toUpperCase()}
            </label>
            <input
              type="text"
              value={formData[element.formFieldType] || ''}
              onChange={(e) => handleFieldChange(element.formFieldType, e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 outline-none focus:border-black transition-colors"
              style={{ fontFamily: 'JetBrains Mono, monospace' }}
              placeholder={element.placeholderText || element.props?.text || ''}
            />
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-[#f5f5f5]">
      {/* Left Pane - Form */}
      <aside className="w-96 min-w-96 bg-[#ffffff] border-r border-[#e0e0e0] flex flex-col">
        <div className="p-6 border-b border-[#e0e0e0]">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#ff0000] mb-1">
            LedgerX
          </p>
          <h1 className="text-2xl font-semibold text-[#000000]">Receipt Preview</h1>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <h2 className="text-sm font-semibold text-[#000000] mb-4">Dynamic Fields</h2>
          {renderDynamicForm()}
        </div>

        <div className="p-6 border-t border-[#e0e0e0] space-y-3">
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="w-full px-4 py-2.5 bg-[#000000] text-white text-sm font-medium hover:bg-[#333333] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Download size={16} />
            {isExporting ? 'Exporting...' : 'Export PNG'}
          </button>
        </div>
      </aside>

      {/* Right Pane - Live Preview */}
      <main className="flex-1 flex items-center justify-center overflow-auto p-8 bg-[#f5f5f5]">
        <div id="export-node" className="shadow-lg">
          <TemplateRenderer template={activeTemplate} formData={formData} />
        </div>
      </main>

      {/* Success Toast */}
      {showToast && (
        <div className="fixed bottom-6 right-6 px-4 py-3 bg-[#000000] text-white text-sm font-medium border border-[#e0e0e0] shadow-lg">
          {toastMessage}
        </div>
      )}
    </div>
  );
}
