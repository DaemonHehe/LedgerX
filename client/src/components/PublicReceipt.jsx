import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import TemplateRenderer from './TemplateRenderer.jsx';
import { convertToStandardSchema } from '../lib/templateSchema.js';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

export default function PublicReceipt() {
  const { share_token } = useParams();
  const [receipt, setReceipt] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/public/receipts/${share_token}`)
      .then(res => {
        if (!res.ok) throw new Error('Receipt not found');
        return res.json();
      })
      .then(data => {
        setReceipt({
          ...data,
          templateData: convertToStandardSchema(data.templates.schema_json)
        });
      })
      .catch(err => setError(err.message));
  }, [share_token]);

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#f5f5f5]">
        <p className="text-xl font-mono text-gray-500">{error}</p>
      </div>
    );
  }

  if (!receipt) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#f5f5f5]">
        <p className="text-sm font-mono text-gray-500">Loading receipt...</p>
      </div>
    );
  }

  // Priority 4 Status Check
  let stampType = null;
  if (receipt.status === 'paid') stampType = 'PAID';
  if (receipt.status === 'void') stampType = 'VOID';

  // Create a localized clone of the template data to inject the stamp if needed
  const renderTemplate = { ...receipt.templateData };
  if (stampType) {
    renderTemplate.elements = [
      ...renderTemplate.elements,
      {
        id: 'status_stamp',
        type: 'shape',
        shapeType: `circle-stamp:${stampType}`,
        x: renderTemplate.width - 150,
        y: 40,
        width: 120,
        height: 120,
        color: stampType === 'PAID' ? '#10b981' : '#ef4444', // Green for paid, Red for void
        rotation: -15,
        zIndex: 99
      }
    ];
  }

  let parsedFormData = receipt.form_data;
  if (typeof parsedFormData === 'string') {
    try {
      parsedFormData = JSON.parse(parsedFormData);
    } catch(e) {}
  }

  return (
    <div className="min-h-screen bg-[#f5f5f5] py-12 flex justify-center items-start">
      <div className="shadow-2xl bg-white" style={{ width: renderTemplate.width }}>
        <TemplateRenderer template={renderTemplate} formData={parsedFormData} />
      </div>
    </div>
  );
}
