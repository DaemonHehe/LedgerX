import { useState, useEffect } from 'react';
import { Plus, Image as ImageIcon, Search, X } from 'lucide-react';
import { authFetch } from '../lib/api.js';
import ImportImageButton from './ImportImageButton.jsx';
import { TEMPLATES as LOCAL_TEMPLATES } from '../lib/templates.js';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

export default function TemplateGallery({ onSelectTemplate, onCreateNew, onImportFromImage, apiBaseUrl }) {
  const [templates, setTemplates] = useState(LOCAL_TEMPLATES);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const response = await authFetch(`${apiBaseUrl}/api/decks`);
        if (response.ok) {
          const data = await response.json();
          if (Array.isArray(data) && data.length > 0) {
            setTemplates((current) => {
              const existingIds = new Set(current.map((template) => template.id));
              const merged = [...current];
              data.forEach((template) => {
                if (!existingIds.has(template.id)) {
                  merged.push(template);
                }
              });
              return merged;
            });
          }
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
    template.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleTemplateClick = (template) => {
    setSelectedTemplate(template);
  };

  const handleUseTemplate = () => {
    if (selectedTemplate) {
      onSelectTemplate(selectedTemplate);
    }
  };

  const handleCreateNew = () => {
    onCreateNew();
  };

  const handleAnalysisComplete = (data) => {
    // Convert n8n response to template format
    const templateData = {
      title: data.deck_name || 'Imported Receipt',
      background: '#ffffff',
      elements: data.elements?.map((elem) => {
        // Map n8n element format to our canvas element format
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

        // Set type-specific props
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
              Browse ready-made receipt layouts, or choose a blank canvas when you want to build from scratch.
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
                const variant = template.id === 'coffee-house'
                  ? { bg: '#fff7e8', accent: '#c96b29', title: '#2f2418', badge: '#f3d8b2', rows: ['#fff2d6', '#fffaf1'] }
                  : template.id === 'boutique-bakery'
                    ? { bg: '#fffaf4', accent: '#d95f90', title: '#4d2434', badge: '#ffe2ea', rows: ['#fff0f5', '#fff7fb'] }
                    : template.id === 'minimal-grocery'
                      ? { bg: '#f5f6ef', accent: '#3f6b3d', title: '#233423', badge: '#dde9d7', rows: ['#eef4e8', '#f8fbf3'] }
                      : template.id === 'cinema-stub'
                        ? { bg: '#f7f7fb', accent: '#444b8f', title: '#1d2146', badge: '#dfe2f7', rows: ['#f1f3ff', '#f8f9ff'] }
                        : { bg: '#ffffff', accent: '#111111', title: '#111111', badge: '#f1f1f1', rows: ['#fafafa', '#ffffff'] };

                const headerText = (template.title || 'Receipt').split(' ').slice(0, 2).join(' ').toUpperCase();

                return (
                  <button
                    key={template.id}
                    type="button"
                    className={`template-gallery-item ${selectedTemplate?.id === template.id ? 'selected' : ''}`}
                    onClick={() => handleTemplateClick(template)}
                  >
                    <div className="template-gallery-item-preview">
                      <div
                        className="template-gallery-item-preview-bg"
                        style={{ backgroundColor: variant.bg }}
                      >
                        <div className="template-gallery-item-preview-receipt">
                          <div className="receipt-paper template-gallery-receipt-paper" style={{ backgroundColor: variant.bg }}>
                            <header className="receipt-header">
                              <div className="receipt-logo" aria-hidden="true">
                                <div className="waveform" style={{ gap: '3px' }}>
                                  <span style={{ backgroundColor: variant.accent }} />
                                  <span style={{ backgroundColor: variant.accent }} />
                                  <span style={{ backgroundColor: variant.accent }} />
                                  <span style={{ backgroundColor: variant.accent }} />
                                  <span style={{ backgroundColor: variant.accent }} />
                                  <span style={{ backgroundColor: variant.accent }} />
                                  <span style={{ backgroundColor: variant.accent }} />
                                </div>
                              </div>
                              <h2 style={{ color: variant.title }}>{headerText}</h2>
                              <p style={{ color: variant.accent }}>{template.title || 'Receipt Layout'}</p>
                            </header>

                            <div className="receipt-divider" style={{ color: variant.accent }}>--------------------------------</div>

                            <section className="receipt-meta">
                              <p>
                                <span style={{ color: variant.title }}>CUSTOMER</span>
                                <strong style={{ color: variant.title }}>WALK-IN</strong>
                              </p>
                              <p>
                                <span style={{ color: variant.title }}>DATE</span>
                                <strong style={{ color: variant.title }}>2026-07-02</strong>
                              </p>
                            </section>

                            <div className="receipt-divider" style={{ color: variant.accent }}>--------------------------------</div>

                            <section>
                              <div className="receipt-row receipt-table-head" style={{ color: variant.title }}>
                                <span>NO</span>
                                <span>ITEM</span>
                                <span>QTY</span>
                                <span>AMT</span>
                              </div>
                              <div className="receipt-row" style={{ backgroundColor: variant.rows[0], padding: '2px 4px' }}>
                                <span>01</span>
                                <span>Item A</span>
                                <span>1</span>
                                <span>4.50</span>
                              </div>
                              <div className="receipt-row" style={{ backgroundColor: variant.rows[1], padding: '2px 4px' }}>
                                <span>02</span>
                                <span>Item B</span>
                                <span>2</span>
                                <span>7.20</span>
                              </div>
                            </section>

                            <div className="receipt-divider" style={{ color: variant.accent }}>--------------------------------</div>

                            <section className="receipt-totals">
                              <p>
                                <span style={{ color: variant.title }}>TOTAL ITEMS</span>
                                <strong style={{ color: variant.title }}>02</strong>
                              </p>
                              <p>
                                <span style={{ color: variant.title }}>GRAND TOTAL</span>
                                <strong style={{ color: variant.accent }}>$11.70</strong>
                              </p>
                            </section>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="template-gallery-item-info">
                      <h3 className="template-gallery-item-title">{template.title}</h3>
                      <p className="template-gallery-item-meta">
                        {template.elements?.length || 0} elements
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {selectedTemplate && (
          <div className="template-gallery-footer">
            <button
              className="template-gallery-use-btn"
              onClick={handleUseTemplate}
              type="button"
            >
              Use Template: {selectedTemplate.title}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}