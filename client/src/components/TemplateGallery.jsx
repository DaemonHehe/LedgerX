import { useState, useEffect } from 'react';
import { Plus, Image as ImageIcon, Search, X, Edit, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { authFetch } from '../lib/api.js';
import ImportImageButton from './ImportImageButton.jsx';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

export default function TemplateGallery({ onSelectTemplate, onCreateNew, onImportFromImage, apiBaseUrl }) {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const response = await authFetch(`${apiBaseUrl}/api/templates`);
        if (response.ok) {
          const data = await response.json();
          setTemplates(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        console.error('Failed to fetch templates:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTemplates();
  }, [apiBaseUrl]);

  const filteredTemplates = templates.filter(template =>
    template.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleTemplateClick = (template) => {
    setSelectedTemplate(template);
  };

  const handleUseTemplate = () => {
    if (selectedTemplate) {
      navigate(`/preview/${selectedTemplate.id}`);
    }
  };

  const handleEditTemplate = (template, event) => {
    event.stopPropagation();
    navigate(`/deck/${template.id}`);
  };

  const handleCreateNew = () => {
    navigate('/deck');
  };

  const handleAnalysisComplete = (data) => {
    // Convert AI response to template format
    const templateData = {
      title: data.deck_name || 'Imported Receipt',
      background: '#ffffff',
      elements: data.elements?.map((elem) => {
        const baseElement = {
          id: elem.id,
          type: elem.type,
          x: elem.x || 50,
          y: elem.y || 50,
          width: elem.width || 200,
          height: elem.height || 40,
          rotation: 0,
          zIndex: 1,
          isDynamic: elem.isDynamic || false,
          formFieldType: elem.formFieldType || null,
          placeholderText: elem.placeholderText || null,
          props: {},
        };

        if (elem.type === 'text') {
          baseElement.props = {
            text: elem.content || '',
            fontSize: 24,
            fontFamily: 'Inter, sans-serif',
            fontWeight: 400,
            color: '#000000',
            textAlign: 'left',
            lineHeight: 1.25,
          };
        } else if (elem.type === 'items_list') {
          baseElement.props = {
            data: elem.content || [],
          };
        }

        return baseElement;
      }) || [],
    };

    onImportFromImage(templateData);
  };

  return (
    <div className="template-gallery-page">
      <div className="template-gallery">
        <div className="template-gallery-header">
          <div>
            <p className="template-gallery-eyebrow">Templates first</p>
            <h2 className="template-gallery-title">Start with a design, then customize it</h2>
            <p className="template-gallery-subtitle">
              Browse your receipt templates, or create a new one from scratch.
            </p>
          </div>
          <button
            className="template-gallery-close"
            onClick={() => window.history.back()}
            type="button"
            aria-label="Close template gallery"
          >
            <X size={20} />
          </button>
        </div>

        <div className="template-gallery-actions">
          <div className="template-gallery-actions-row">
            <button
              className="template-gallery-create-btn"
              onClick={handleCreateNew}
              type="button"
            >
              <Plus size={20} />
              Create blank canvas
            </button>
            {onImportFromImage && (
              <ImportImageButton
                apiBaseUrl={apiBaseUrl}
                onAnalysisComplete={handleAnalysisComplete}
              />
            )}
          </div>

          <div className="template-gallery-search">
            <Search size={18} className="template-gallery-search-icon" />
            <input
              type="text"
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="template-gallery-search-input"
            />
          </div>
        </div>

        <div className="template-gallery-content">
          {loading ? (
            <div className="template-gallery-loading">
              <div className="template-gallery-spinner" />
              <p>Loading templates...</p>
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div className="template-gallery-empty">
              <ImageIcon size={48} className="template-gallery-empty-icon" />
              <p>No templates found</p>
              <button
                className="template-gallery-create-btn-small"
                onClick={handleCreateNew}
                type="button"
              >
                Create your first template
              </button>
            </div>
          ) : (
            <div className="template-gallery-grid">
              {filteredTemplates.map((template) => {
                const elementCount = template.schema_json?.elements?.length || 0;
                const createdAt = new Date(template.created_at).toLocaleDateString();

                return (
                  <div
                    key={template.id}
                    className={`template-card ${selectedTemplate?.id === template.id ? 'selected' : ''}`}
                    onClick={() => handleTemplateClick(template)}
                  >
                    <div className="template-card-content">
                      <h3 className="template-card-name">{template.name}</h3>
                      <p className="template-card-meta">{elementCount} elements</p>
                      <p className="template-card-date">{createdAt}</p>
                    </div>
                    <div className="template-card-actions">
                      <button
                        className="template-card-edit-btn"
                        onClick={(e) => handleEditTemplate(template, e)}
                        type="button"
                      >
                        <Edit size={14} />
                        Edit
                      </button>
                      <button
                        className="template-card-use-btn"
                        onClick={handleUseTemplate}
                        type="button"
                        disabled={!selectedTemplate}
                      >
                        Use Template
                        <ArrowRight size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        {selectedTemplate && (
          <div className="template-gallery-footer">
            <button
              className="template-gallery-use-btn"
              onClick={handleUseTemplate}
              type="button"
            >
              Use Template: {selectedTemplate.name}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
