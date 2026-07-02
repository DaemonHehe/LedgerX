import { useState, useRef } from 'react';
import { Camera, Upload, Loader2 } from 'lucide-react';
import { authFetch } from '../lib/api.js';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

export default function ImportImageButton({ onAnalysisComplete, apiBaseUrl }) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const fileInputRef = useRef(null);

  const handleFileSelect = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setStatus('> analyzing_layout...');

    try {
      const formData = new FormData();
      formData.append('image', file);

      setStatus('> processing_image...');
      const response = await authFetch(`${apiBaseUrl}/api/templates/analyze`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Analysis failed');
      }

      const data = await response.json();
      
      // Convert OpenAI response to our template format
      if (data.canvas && data.elements) {
        const templateData = {
          title: 'Imported Receipt Template',
          background: data.canvas.backgroundColor || '#ffffff',
          elements: data.elements.map((el, index) => ({
            id: el.id || `el_${Date.now()}_${index}`,
            type: el.type || 'text',
            x: el.x || 0,
            y: el.y || 0,
            width: 200, // Default width, can be adjusted
            height: 30, // Default height, can be adjusted
            rotation: 0,
            zIndex: index,
            isDynamic: el.isDynamic || false,
            formFieldType: el.isDynamic ? el.fieldKey : null,
            placeholderText: el.isDynamic ? `{{${el.fieldKey}}}` : null,
            props: {
              text: el.content || '',
              fontSize: el.fontSize || 14,
              fontFamily: 'Inter, sans-serif',
              fontWeight: 400,
              color: '#000000',
              textAlign: 'left',
              lineHeight: 1.4,
            },
          })),
        };
        
        onAnalysisComplete(templateData);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Image analysis error:', error);
      setStatus('> error: analysis_failed');
      setTimeout(() => {
        setLoading(false);
        setStatus('');
      }, 2000);
      return;
    }

    setLoading(false);
    setStatus('');
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  if (loading) {
    return (
      <button
        className="editor-secondary"
        disabled
        type="button"
        style={{ fontFamily: 'JetBrains Mono, monospace' }}
      >
        <Loader2 size={16} className="animate-spin" />
        {status}
      </button>
    );
  }

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
      <button
        className="editor-secondary"
        onClick={handleClick}
        type="button"
      >
        <Camera size={16} />
        Import Receipt from Image
        <Upload size={14} />
      </button>
    </>
  );
}