import { useState, useEffect } from 'react';
import { Plus, Image as ImageIcon, Search, X, Edit, ArrowRight, Trash2, Copy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { authFetch } from '../lib/api.js';
import ImportImageButton from './ImportImageButton.jsx';
import TemplateRenderer from './TemplateRenderer.jsx';
import { convertToStandardSchema } from '../lib/templateSchema.js';

export default function TemplateGallery({
  templates: propTemplates,
  templatesLoaded,
  onRefreshTemplates,
  apiBaseUrl,
  onImportFromImage,
}) {
  const navigate = useNavigate();
  const [localTemplates, setLocalTemplates] = useState([]);
  const [localLoading, setLocalLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  const templates = propTemplates || localTemplates;
  const loading = propTemplates ? !templatesLoaded : localLoading;

  useEffect(() => {
    if (propTemplates) return;

    const fetchTemplates = async () => {
      try {
        const response = await authFetch(`${apiBaseUrl}/api/templates`);
        if (response.ok) {
          const data = await response.json();
          setLocalTemplates(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        console.error('Failed to fetch templates:', error);
      } finally {
        setLocalLoading(false);
      }
    };

    fetchTemplates();
  }, [apiBaseUrl, propTemplates]);

  const filteredTemplates = templates.filter(template =>
    (template.name || template.title || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleTemplateClick = (template) => {
    setSelectedTemplate(template);
  };

  const handleUseTemplate = (template) => {
    const target = template || selectedTemplate;
    if (target) {
      navigate(`/receipt/${target.id}`);
    }
  };

  const handleEditTemplate = (template, event) => {
    event.stopPropagation();
    navigate(`/deck/${template.id}`);
  };

  const handleCreateWithWizard = () => {
    navigate('/deck/wizard');
  };

  const handleDeleteTemplate = async (template, event) => {
    event.stopPropagation();
    if (!window.confirm(`Are you sure you want to delete template "${template.name || template.title}"? This action cannot be undone.`)) {
      return;
    }
    try {
      const response = await authFetch(`${apiBaseUrl}/api/templates/${template.id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        if (onRefreshTemplates) {
          onRefreshTemplates();
        } else {
          setLocalTemplates((prev) => prev.filter((t) => t.id !== template.id));
        }
        if (selectedTemplate?.id === template.id) {
          setSelectedTemplate(null);
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete template');
      }
    } catch (error) {
      console.error('Failed to delete template:', error);
      alert(error.message || 'Failed to delete template');
    }
  };

  const handleDuplicateExample = async (template, event) => {
    event.stopPropagation();
    try {
      const newName = `${template.name || template.title} (Copy)`;
      const response = await authFetch(`${apiBaseUrl}/api/templates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName,
          schema_json: template.schema_json,
        }),
      });

      if (response.ok) {
        if (onRefreshTemplates) {
          onRefreshTemplates();
        } else {
          const newData = await response.json();
          setLocalTemplates((prev) => [newData, ...prev]);
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to duplicate template');
      }
    } catch (error) {
      console.error('Failed to duplicate template:', error);
      alert(error.message || 'Failed to duplicate template');
    }
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

    if (onImportFromImage) {
      onImportFromImage(templateData);
    }
  };

  return (
    <div className="template-gallery-page">
      <div className="template-gallery">
        <div className="template-gallery-header">
          <div>
            <p className="template-gallery-eyebrow">Templates first</p>
            <h2 className="template-gallery-title">Start with a design, then customize it</h2>
            <p className="template-gallery-subtitle">
              Browse your receipt templates, or create a new one using the wizard.
            </p>
          </div>
          <button
            className="template-gallery-close"
            onClick={() => navigate('/receipt')}
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
              onClick={handleCreateWithWizard}
              type="button"
            >
              <Plus size={20} />
              Create with wizard
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
                onClick={handleCreateWithWizard}
                type="button"
              >
                Create your first template
              </button>
            </div>
          ) : (
            <>
              {(() => {
                const myTemplates = filteredTemplates.filter((t) => !t.is_example);
                const exampleTemplates = filteredTemplates.filter((t) => t.is_example);

                const renderTemplateCard = (template, isExample) => {
                  let schemaJson = template.schema_json;
                  if (typeof schemaJson === 'string') {
                    try { schemaJson = JSON.parse(schemaJson); } catch (e) {}
                  }
                  const elementCount = schemaJson?.elements?.length || 0;
                  const createdAt = new Date(template.created_at).toLocaleDateString();
                  const standardSchema = convertToStandardSchema(schemaJson || template);
                  
                  // Target width for thumbnail container
                  const targetWidth = 180;
                  const scale = targetWidth / standardSchema.width;
                  const targetHeight = standardSchema.height * scale;

                  return (
                      <div
                      key={template.id}
                      className={`template-card ${selectedTemplate?.id === template.id ? 'selected' : ''}`}
                      onClick={() => handleTemplateClick(template)}
                    >
                      <div className="template-card-preview-container" style={{
                        width: '100%',
                        height: 200,
                        backgroundColor: '#f5f5f5',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden',
                        borderBottom: '1px solid var(--line)',
                        position: 'relative',
                      }}>
                        <div style={{
                          width: standardSchema.width,
                          transform: `scale(${scale})`,
                          transformOrigin: 'top center',
                          position: 'absolute',
                          top: Math.max(10, (200 - targetHeight) / 2),
                          pointerEvents: 'none',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                        }}>
                          <TemplateRenderer template={standardSchema} formData={{}} />
                        </div>
                      </div>
                      <div className="template-card-content">
                        <h3 className="template-card-name">{template.name || template.title}</h3>
                        <p className="template-card-meta">{elementCount} elements</p>
                        {!isExample && <p className="template-card-date">{createdAt}</p>}
                        {isExample && <p className="template-card-date text-text-tertiary font-semibold">EXAMPLE</p>}
                      </div>
                      <div className="template-card-actions">
                        {isExample ? (
                          <button
                            className="template-card-edit-btn"
                            onClick={(e) => handleDuplicateExample(template, e)}
                            type="button"
                          >
                            <Copy size={14} />
                            Duplicate
                          </button>
                        ) : (
                          <>
                            <button
                              className="template-card-edit-btn"
                              onClick={(e) => handleEditTemplate(template, e)}
                              type="button"
                            >
                              <Edit size={14} />
                              Edit
                            </button>
                            <button
                              className="template-card-edit-btn text-accent-red border-accent-red hover:bg-accent-red/10"
                              onClick={(e) => handleDeleteTemplate(template, e)}
                              type="button"
                            >
                              <Trash2 size={14} />
                              Delete
                            </button>
                          </>
                        )}
                        <button
                          className="template-card-use-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUseTemplate(template);
                          }}
                          type="button"
                        >
                          Use Template
                          <ArrowRight size={14} />
                        </button>
                      </div>
                    </div>
                  );
                };

                return (
                  <div className="space-y-10">
                    {exampleTemplates.length > 0 && (
                      <section>
                        <h3 className="text-sm font-semibold uppercase tracking-[0.15em] mb-4 border-b border-border pb-2 text-text">
                          Examples
                        </h3>
                        <div className="template-gallery-grid">
                          {exampleTemplates.map(t => renderTemplateCard(t, true))}
                        </div>
                      </section>
                    )}
                    
                    {myTemplates.length > 0 && (
                      <section>
                        <h3 className="text-sm font-semibold uppercase tracking-[0.15em] mb-4 border-b border-border pb-2 text-text">
                          My Templates
                        </h3>
                        <div className="template-gallery-grid">
                          {myTemplates.map(t => renderTemplateCard(t, false))}
                        </div>
                      </section>
                    )}
                  </div>
                );
              })()}
            </>
          )}
        </div>

        {selectedTemplate && (
          <div className="template-gallery-footer">
            <button
              className="template-gallery-use-btn"
              onClick={() => handleUseTemplate(selectedTemplate)}
              type="button"
            >
              Use Template: {selectedTemplate.name || selectedTemplate.title}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
