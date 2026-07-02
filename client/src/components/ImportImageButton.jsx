import { useState, useRef } from 'react';
import { Camera, Upload, Loader2 } from 'lucide-react';
import { authFetch } from '../lib/api.js';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

export default function ImportImageButton({ onAnalysisComplete, apiBaseUrl }) {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const fileInputRef = useRef(null);

  const handleFileSelect = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setProgress(0);
    setStatus('> initializing_ocr_pipeline...');

    try {
      const formData = new FormData();
      formData.append('image', file);

      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 300);

      setStatus('> uploading_image_data...');
      await new Promise(resolve => setTimeout(resolve, 500));

      setStatus('> analyzing_receipt_structure...');
      const response = await authFetch(`${apiBaseUrl}/api/receipts/analyze`, {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setProgress(100);
      setStatus('> processing_complete...');

      if (!response.ok) {
        throw new Error('Analysis failed');
      }

      const data = await response.json();
      
      if (data.success && data.data) {
        onAnalysisComplete(data.data);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Image analysis error:', error);
      setStatus('> error: analysis_failed');
      setTimeout(() => {
        setLoading(false);
        setProgress(0);
        setStatus('');
      }, 2000);
    } finally {
      if (status !== '> error: analysis_failed') {
        setTimeout(() => {
          setLoading(false);
          setProgress(0);
          setStatus('');
        }, 500);
      }
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  if (loading) {
    return (
      <div className="import-image-button loading">
        <div className="import-image-loading-content">
          <Loader2 size={20} className="animate-spin" />
          <div className="import-image-loading-text">
            <p className="import-image-status">{status}</p>
            <div className="import-image-progress-bar">
              <div 
                className="import-image-progress-fill"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      </div>
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
        className="import-image-button"
        onClick={handleClick}
        type="button"
      >
        <Camera size={18} />
        <span>Import from Image</span>
        <Upload size={16} />
      </button>
    </>
  );
}