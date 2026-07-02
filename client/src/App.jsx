import { useMemo, useState, useEffect } from 'react';
import html2canvas from 'html2canvas';
import { Download, LogOut } from 'lucide-react';
import { BrowserRouter, NavLink, Route, Routes, useNavigate, useLocation, useParams } from 'react-router-dom';
import ReceiptPreview from './components/ReceiptPreview.jsx';
import ReceiptPreviewNew from './components/ReceiptPreviewNew.jsx';
import EditorPanel from './components/EditorPanel.jsx';
import LoginScreen from './components/LoginScreen.jsx';
import ProfileScreen from './components/ProfileScreen.jsx';
import SalesDashboard from './components/SalesDashboard.jsx';
import TemplateEditor from './components/deck/TemplateEditor.jsx';
import TemplateGallery from './components/TemplateGallery.jsx';
import DynamicFormRenderer from './components/DynamicFormRenderer.jsx';
import TemplateCanvas from './components/TemplateCanvas.jsx';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { authFetch } from './lib/api.js';
import { TEMPLATES as LOCAL_TEMPLATES } from './lib/templates.js';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

const initialReceipt = {
  storeName: 'YOUR STORE NAME',
  receiptTitle: 'YOUR DESCRIPTION',
  logoUrl: '',
  customerName: 'CUSTOMER NAME',
  customerAddress: 'INSERT CUSTOMER ADDRESS HERE',
  orderDate: new Date().toISOString().slice(0, 10),
  footerRemark: '-',
  paymentMethod: 'PAYMENT METHOD',
  authCode: 'AUTH CODE',
  footerMessage: 'THANK YOU / COME BACK SOON',
  barcodeUrl: '',
  items: [
    { id: crypto.randomUUID(), qty: '01', name: 'ITEM 1', price: '0.00' },
    { id: crypto.randomUUID(), qty: '01', name: 'ITEM 2', price: '0.00' },
    { id: crypto.randomUUID(), qty: '01', name: 'ITEM 3', price: '0.00' },
  ],
};

const legacyDefaults = {
  storeName: 'TRANQUILITY BASE',
  receiptTitle: 'ONLINE SHOP RECEIPT',
  customerName: 'Alex Turner',
  customerAddress: '505 Main Street, Sheffield',
  footerRemark: 'NO RETURNS AFTER 30 DAYS',
  paymentMethod: 'CARD',
};

const normalizeSavedReceipt = (savedReceipt) => {
  const receipt = { ...initialReceipt, ...savedReceipt };


  Object.entries(legacyDefaults).forEach(([field, value]) => {
    if (receipt[field] === value) {
      receipt[field] = initialReceipt[field];
    }
  });

  const legacyItemNames = ['Vinyl Record', 'Black Coffee', 'Poster Tube'];
  const usesLegacyItems = receipt.items?.every((item, index) => item.name === legacyItemNames[index]);

  if (usesLegacyItems) {
    receipt.items = initialReceipt.items;
  }

  return receipt;
};

function ReceiptWorkspace({
  handleExportImage,
  receipt,
  totals,
  updateItems,
  updateReceipt,
  templates,
  selectedTemplate,
  setSelectedTemplate,
  selectedTemplateData,
  formData,
  setFormData,
}) {
  const updateFormData = (fieldId, value) => {
    setFormData((prev) => ({ ...prev, [fieldId]: value }));
  };

  return (
    <div className="grid h-[calc(100vh-7.25rem)] min-h-[680px] w-full grid-cols-[minmax(360px,1fr)_minmax(0,3fr)] overflow-hidden border border-[#e0e0e0]">
      <aside className="editor-pane h-full min-w-0 overflow-hidden">
        <div className="h-full overflow-y-auto overflow-x-hidden px-8 py-8">
          <div className="editor-toolbar sticky top-0 z-10 mb-6 w-full pb-5 pt-1">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#ff0000]">
                LedgerX
              </p>
              <h1 className="text-3xl font-semibold text-[#000000]">Control Panel</h1>
            </div>
          </div>

          {templates.length > 0 && (
            <div className="mb-6">
              <label className="editor-label">Template</label>
              <select
                className="editor-field w-full border px-3 py-2.5 text-sm outline-none transition"
                value={selectedTemplate || ''}
                onChange={(e) => setSelectedTemplate(e.target.value || null)}
              >
                <option value="">Default Template</option>
                {templates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          <EditorPanel
            apiBaseUrl={API_BASE_URL}
            receipt={receipt}
            updateReceipt={updateReceipt}
            updateItems={updateItems}
          />

          <DynamicFormRenderer
            template={selectedTemplateData}
            formData={formData}
            updateFormData={updateFormData}
          />

          <div className="download-footer">
            <button className="control-action control-image w-full" onClick={handleExportImage}>
              <Download size={18} />
              Download Image
            </button>
          </div>
        </div>
      </aside>

      <section className="preview-pane flex h-full min-w-0 items-center justify-center overflow-y-auto overflow-x-hidden px-6 py-12">
        {selectedTemplateData ? (
          <TemplateCanvas template={selectedTemplateData} formData={formData} />
        ) : (
          <ReceiptPreview receipt={receipt} totals={totals} />
        )}
      </section>
    </div>
  );
}

function Shell() {
  const { user, name, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [receipt, setReceipt] = useState(() => {
    const saved = localStorage.getItem('receipt-generator-state');
    return saved ? normalizeSavedReceipt(JSON.parse(saved)) : initialReceipt;
  });

  const [templates, setTemplates] = useState(LOCAL_TEMPLATES);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [selectedTemplateData, setSelectedTemplateData] = useState(null);
  const [formData, setFormData] = useState({});
  const [showTemplateGallery, setShowTemplateGallery] = useState(false);

  // Fetch remote templates on mount, merge into local templates if present
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const response = await authFetch(`${API_BASE_URL}/api/decks`);
        if (response.ok) {
          const data = await response.json();
          setTemplates((current) => {
            const existingIds = new Set(current.map((template) => template.id));
            const merged = [...current];
            data.forEach((remoteTemplate) => {
              if (!existingIds.has(remoteTemplate.id)) {
                merged.push(remoteTemplate);
              }
            });
            return merged;
          });
        }
      } catch (error) {
        console.error('Failed to fetch templates:', error);
      }
    };

    fetchTemplates();
  }, []);

  // Show template gallery when navigating to deck route without an ID
  useEffect(() => {
    if (location.pathname === '/deck' || location.pathname === '/template') {
      const pathMatch = location.pathname.match(/\/(deck|template)\/(.+)/);
      if (!pathMatch) {
        setShowTemplateGallery(true);
      } else {
        setShowTemplateGallery(false);
      }
    }
  }, [location.pathname]);

  const handleSelectTemplate = (template) => {
    setSelectedTemplate(template.id);
    setShowTemplateGallery(false);
    navigate(`/deck/${template.id}`);
  };

  const handleCreateNew = () => {
    setSelectedTemplate(null);
    setShowTemplateGallery(false);
    navigate('/deck');
  };

  const handleImportFromImage = (templateData) => {
    // Create a new template from the imported data
    const createImportedTemplate = async () => {
      try {
        const response = await authFetch(`${API_BASE_URL}/api/decks`, {
          method: 'POST',
          body: JSON.stringify(templateData),
        });

        if (response.ok) {
          const createdTemplate = await response.json();
          setSelectedTemplate(createdTemplate.id);
          setShowTemplateGallery(false);
          navigate(`/deck/${createdTemplate.id}`);
        }
      } catch (error) {
        console.error('Failed to create imported template:', error);
      }
    };

    createImportedTemplate();
  };

  // Load template data when template changes, preferring local templates
  useEffect(() => {
    const loadTemplateData = async () => {
      if (!selectedTemplate) {
        setSelectedTemplateData(null);
        setFormData({});
        return;
      }

      const local = templates.find((template) => template.id === selectedTemplate);
      if (local) {
        setSelectedTemplateData(local);
        const initialFormData = {};
        local.elements
          .filter((el) => el.isDynamic && el.formFieldType)
          .forEach((el) => {
            initialFormData[el.id] = '';
          });
        setFormData(initialFormData);
        return;
      }

      try {
        const response = await authFetch(`${API_BASE_URL}/api/decks/${selectedTemplate}`);
        if (response.ok) {
          const data = await response.json();
          setSelectedTemplateData(data);
          const initialFormData = {};
          data.elements
            .filter((el) => el.isDynamic && el.formFieldType)
            .forEach((el) => {
              initialFormData[el.id] = '';
            });
          setFormData(initialFormData);
        }
      } catch (error) {
        console.error('Failed to fetch template data:', error);
      }
    };

    loadTemplateData();
  }, [selectedTemplate, templates]);

  const totals = useMemo(() => {
    return receipt.items.reduce(
      (summary, item) => {
        const qty = Number.parseInt(item.qty, 10) || 0;
        const price = Number.parseFloat(item.price) || 0;

        return {
          itemCount: summary.itemCount + qty,
          grandTotal: summary.grandTotal + qty * price,
        };
      },
      { itemCount: 0, grandTotal: 0 },
    );
  }, [receipt.items]);

  const updateReceipt = (field, value) => {
    setReceipt((current) => ({ ...current, [field]: value }));
  };

  const updateItems = (items) => {
    setReceipt((current) => ({ ...current, items }));
  };

  const captureReceipt = async () => {
    // Try to capture template canvas first, fall back to receipt preview
    const templateCanvas = document.querySelector('.template-canvas-container');
    const receiptNode = document.getElementById('receipt-preview');

    const targetNode = templateCanvas || receiptNode;

    if (!targetNode) {
      throw new Error('No preview element found');
    }

    return html2canvas(targetNode, {
      backgroundColor: null,
      scale: 2,
      useCORS: true,
    });
  };

  const handleExportImage = async () => {
    const canvas = await captureReceipt();
    const image = canvas.toDataURL('image/png');
    const link = document.createElement('a');

    link.href = image;
    link.download = `${receipt.storeName.toLowerCase().replace(/\s+/g, '-')}-receipt.png`;
    link.click();
  };

  const handleLogout = () => {
    signOut();
  };

  function TemplateEditorRoute({ apiBaseUrl }) {
    const { id } = useParams();
    return <TemplateEditor apiBaseUrl={apiBaseUrl} templateId={id} />;
  }

  function ReceiptPreviewRoute({ apiBaseUrl }) {
    const { id } = useParams();
    const [templateData, setTemplateData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      const fetchTemplate = async () => {
        try {
          const response = await authFetch(`${apiBaseUrl}/api/templates/${id}`);
          if (response.ok) {
            const data = await response.json();
            // Convert standard schema back to legacy format for useTemplate
            const legacyTemplate = {
              id: data.id,
              title: data.name,
              background: data.schema_json?.backgroundColor || '#ffffff',
              elements: data.schema_json?.elements?.map((el) => ({
                id: el.id,
                type: el.type,
                x: el.x,
                y: el.y,
                width: el.width,
                height: el.height,
                rotation: el.rotation || 0,
                zIndex: el.zIndex || 0,
                isDynamic: el.isDynamic || false,
                formFieldType: el.isDynamic ? el.fieldKey : null,
                placeholderText: el.isDynamic ? `{{${el.fieldKey}}}` : null,
                props: {
                  text: el.content,
                  fontSize: el.fontSize,
                  fontFamily: el.fontFamily,
                  fontWeight: el.fontWeight,
                  color: el.color,
                  textAlign: el.textAlign,
                  lineHeight: el.lineHeight,
                },
              })) || [],
            };
            setTemplateData(legacyTemplate);
          }
        } catch (error) {
          console.error('Failed to fetch template:', error);
        } finally {
          setLoading(false);
        }
      };

      fetchTemplate();
    }, [apiBaseUrl, id]);

    if (loading) {
      return <div className="flex h-full items-center justify-center">Loading template...</div>;
    }

    if (!templateData) {
      return <div className="flex h-full items-center justify-center">Template not found</div>;
    }

    return <ReceiptPreviewNew templateId={id} templateData={templateData} />;
  }

  if (loading) {
    return (
      <main className="app-shell grid min-h-screen place-items-center text-neutral-950">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#ff0000]">
          Loading…
        </p>
      </main>
    );
  }

  if (!user) {
    return <LoginScreen />;
  }

  return (
      <main className="app-shell min-h-screen overflow-x-hidden p-6 text-neutral-950">
        <nav className="app-nav">
          <div>
            <p>LedgerX</p>
          </div>
          <div className="app-nav-links">
            <NavLink to="/">Receipt</NavLink>
            <NavLink to="/sales">Sales Dashboard</NavLink>
            <NavLink to="/deck">Deck Studio</NavLink>
            <NavLink to="/account">{name || user.email}</NavLink>
            <button className="logout-button" onClick={handleLogout} type="button">
              <LogOut size={16} />
              Logout
            </button>
          </div>
        </nav>

        <Routes>
          <Route
            path="/"
            element={
              <ReceiptWorkspace
                handleExportImage={handleExportImage}
                receipt={receipt}
                totals={totals}
                updateItems={updateItems}
                updateReceipt={updateReceipt}
                templates={templates}
                selectedTemplate={selectedTemplate}
                setSelectedTemplate={setSelectedTemplate}
                selectedTemplateData={selectedTemplateData}
                formData={formData}
                setFormData={setFormData}
              />
            }
          />
          <Route path="/sales" element={<SalesDashboard apiBaseUrl={API_BASE_URL} />} />
          <Route
            path="/preview/:id"
            element={<ReceiptPreviewRoute apiBaseUrl={API_BASE_URL} />}
          />
          <Route
            path="/deck"
            element={
              showTemplateGallery ? (
                <TemplateGallery
                  apiBaseUrl={API_BASE_URL}
                  onSelectTemplate={handleSelectTemplate}
                  onCreateNew={handleCreateNew}
                  onImportFromImage={handleImportFromImage}
                />
              ) : (
                <TemplateEditor apiBaseUrl={API_BASE_URL} />
              )
            }
          />
          <Route
            path="/deck/:id"
            element={<TemplateEditorRoute apiBaseUrl={API_BASE_URL} />}
          />
          <Route
            path="/template"
            element={
              showTemplateGallery ? (
                <TemplateGallery
                  apiBaseUrl={API_BASE_URL}
                  onSelectTemplate={handleSelectTemplate}
                  onCreateNew={handleCreateNew}
                />
              ) : (
                <TemplateEditor apiBaseUrl={API_BASE_URL} />
              )
            }
          />
          <Route
            path="/template/:id"
            element={<TemplateEditorRoute apiBaseUrl={API_BASE_URL} />}
          />
          <Route path="/account" element={<ProfileScreen />} />
        </Routes>
      </main>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Shell />
      </BrowserRouter>
    </AuthProvider>
  );
}
