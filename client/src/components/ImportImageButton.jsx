import { useState, useRef } from 'react';
import { Camera, Upload, Loader2, Sparkles } from 'lucide-react';
import { authFetch, parseApiError } from '../lib/api.js';
import { useToast } from '../context/ToastContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

export default function ImportImageButton({ onAnalysisComplete, apiBaseUrl }) {
  const { showError, showSuccess } = useToast();
  const { isPro } = useAuth();
  const navigate = useNavigate();
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
        const message = await parseApiError(response, 'Failed to analyze image.');
        throw new Error(message);
      }

      const data = await response.json();
      
      // Convert OpenAI response to our template format
      if (data.canvas && data.elements) {
        const templateData = {
          title: 'Imported Receipt Template',
          background: data.canvas.backgroundColor || '#ffffff',
          width: data.canvas.width || 400,
          height: Math.max(400, Math.min(1200, data.canvas.height || 620)),
          elements: data.elements.map((el, index) => {
            const isTable = el.type === 'table';
            return {
              id: el.id || `el_${Date.now()}_${index}`,
              type: el.type || 'text',
              x: el.x || 0,
              y: el.y || 0,
              width: el.width || (isTable ? 360 : 200),
              height: el.height || (isTable ? 20 : 30),
              rotation: 0,
              zIndex: index,
              isDynamic: isTable ? true : (el.isDynamic || false),
              formFieldType: isTable || el.isDynamic ? el.fieldKey : null,
              placeholderText: isTable || el.isDynamic ? `{{${el.fieldKey}}}` : null,
              props: {
                text: el.content || '',
                fontSize: el.fontSize || 14,
                fontFamily: 'Inter, sans-serif',
                fontWeight: 400,
                color: '#000000',
                textAlign: 'left',
                lineHeight: 1.4,
                ...(isTable && el.columns ? { columns: el.columns } : {}),
              },
            };
          }),
        };
        
        onAnalysisComplete(templateData);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Image analysis error:', error);
      showError(error.message || 'Failed to analyze image.');
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
    if (!isPro) {
      showError('AI Template Generation is a Pro feature. Upgrade to unlock!');
      navigate('/pricing');
      return;
    }
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
        className="editor-secondary group"
        onClick={handleClick}
        type="button"
      >
        <Sparkles size={16} className={!isPro ? "text-[var(--accent-red)]" : ""} />
        Import Receipt from Image
        <Upload size={14} />
      </button>
    </>
  );
}