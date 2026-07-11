import { useState, useEffect, useCallback } from 'react';
import { LogOut } from 'lucide-react';
import { BrowserRouter, NavLink, Route, Routes, useNavigate, useLocation, useParams, useSearchParams, Navigate } from 'react-router-dom';
import ReceiptPreviewNew from './components/ReceiptPreviewNew.jsx';
import LoginScreen from './components/LoginScreen.jsx';
import ProfileScreen from './components/ProfileScreen.jsx';
import SalesDashboard from './components/Dashboard.jsx';
import PublicReceipt from './components/PublicReceipt.jsx';
import TemplateEditor from './components/deck/TemplateEditor.jsx';
import TemplateGallery from './components/TemplateGallery.jsx';
import TemplateWizard from './components/deck/TemplateWizard.jsx';
import Pricing from './components/Pricing.jsx';
import CheckoutSuccess from './components/CheckoutSuccess.jsx';
import LandingPage from './pages/LandingPage.jsx';
import NotFound from './pages/NotFound.jsx';
import GlassNav from './components/GlassNav.jsx';
import { ToastProvider } from './context/ToastContext.jsx';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { authFetch } from './lib/api.js';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

function mapTemplateToLegacy(data) {
  if (!data) return null;
  let schemaJson = data.schema_json;
  if (typeof schemaJson === 'string') {
    try { schemaJson = JSON.parse(schemaJson); } catch (e) { console.error(e); }
  }
  return {
    id: data.id,
    title: data.name,
    background: schemaJson?.backgroundColor || '#ffffff',
    width: schemaJson?.width || schemaJson?.canvas?.width || 400,
    height: schemaJson?.height || schemaJson?.canvas?.height || 800,
    elements: schemaJson?.elements?.filter(Boolean).map((el) => ({
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
        ...(el.type === 'table' ? {
          columns: el.columns || [],
          tableStyle: el.tableStyle || 'none',
          showTotal: el.showTotal !== undefined ? el.showTotal : false,
          totalStyle: el.totalStyle || 'none',
          totalFieldKey: el.totalFieldKey || 'totalAmount'
        } : {}),
        ...(el.type === 'shape' ? {
          shapeType: el.shapeType || 'line'
        } : {}),
        ...(el.type === 'image' ? {
          shape: el.shape || 'rect'
        } : {}),
        ...(el.type === 'text' ? {
          letterSpacing: el.letterSpacing || 0
        } : {}),
      },
    })) || [],
  };
}

/**
 * Route wrapper: loads a template from the DB by :id
 * and renders ReceiptPreviewNew with it.
 */
function ReceiptRoute({ apiBaseUrl }) {
  const { id } = useParams();
  const [templateData, setTemplateData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTemplate = async () => {
      try {
        const response = await authFetch(`${apiBaseUrl}/api/templates/${id}`);
        if (response.ok) {
          const data = await response.json();
          setTemplateData(mapTemplateToLegacy(data));
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

/**
 * Legacy redirect: /preview/:id → /receipt/:id (preserves query params)
 */
function LegacyPreviewRedirect() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const queryString = searchParams.toString();
  return <Navigate to={`/receipt/${id}${queryString ? `?${queryString}` : ''}`} replace />;
}

/**
 * Route wrapper: Deck Studio editor with template ID from URL params.
 */
function TemplateEditorRoute({ apiBaseUrl }) {
  const { id } = useParams();
  return <TemplateEditor apiBaseUrl={apiBaseUrl} templateId={id} />;
}

function Shell() {
  const { user, name, loading, subLoading, isPro, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [templates, setTemplates] = useState([]);
  const [templatesLoaded, setTemplatesLoaded] = useState(false);
  const [receipts, setReceipts] = useState([]);
  const [receiptsLoaded, setReceiptsLoaded] = useState(false);
  const [receiptsError, setReceiptsError] = useState(null);

  // Centralized fetching logic for templates
  const fetchTemplates = useCallback(async () => {
    try {
      const response = await authFetch(`${API_BASE_URL}/api/templates`);
      if (response.ok) {
        const data = await response.json();
        const templatesList = Array.isArray(data) ? data : [];

        setTemplates(templatesList);

        if (templatesList.length === 0) {
          // Trigger welcome template seeding if user has zero templates
          const seedResponse = await authFetch(`${API_BASE_URL}/api/templates/seed-welcome`, {
            method: 'POST',
          });

          if (seedResponse.ok) {
            const reFetchResponse = await authFetch(`${API_BASE_URL}/api/templates`);
            if (reFetchResponse.ok) {
              const reFetchData = await reFetchResponse.json();
              setTemplates(reFetchData);
            }
          }
        }
        setTemplatesLoaded(true);
      }
    } catch (error) {
      console.error('Failed to fetch templates:', error);
    }
  }, []);

  const fetchReceipts = useCallback(async () => {
    setReceiptsError(null);
    try {
      const response = await authFetch(`${API_BASE_URL}/api/receipts`);
      if (response.ok) {
        const data = await response.json();
        setReceipts(Array.isArray(data) ? data : []);
        setReceiptsLoaded(true);
      } else {
        setReceiptsError(`Failed to load receipts: ${response.statusText}`);
        setReceiptsLoaded(true);
      }
    } catch (error) {
      console.error('Failed to fetch receipts:', error);
      setReceiptsError('Network error while fetching receipts.');
      setReceiptsLoaded(true);
    }
  }, []);

  // Fetch initial data on mount and navigation to keep in sync
  useEffect(() => {
    if (user) {
      fetchTemplates();
      fetchReceipts();
    }
  }, [fetchTemplates, fetchReceipts, location.pathname, user]);

  const handleLogout = () => {
    signOut();
  };

  if (loading || subLoading) {
    return (
      <main className="app-shell grid min-h-screen place-items-center">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#ff0000]">
          Loading…
        </p>
      </main>
    );
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginScreen />} />
        <Route path="/r/:share_token" element={<PublicReceipt />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    );
  }

  if (!isPro) {
    return (
      <main className="app-shell min-h-screen overflow-x-hidden px-4 pb-4 pt-20 md:px-6 md:pb-6 md:pt-24">
        <GlassNav />
        <Routes>
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/checkout-success" element={<CheckoutSuccess />} />
          <Route path="/account" element={<ProfileScreen />} />
          <Route path="*" element={<Navigate to="/pricing" replace />} />
        </Routes>
      </main>
    );
  }

  return (
    <main className="app-shell min-h-screen overflow-x-hidden px-4 pb-4 pt-20 md:px-6 md:pb-6 md:pt-24">
      <GlassNav />

      <Routes>
        <Route path="/" element={<Navigate to="/receipt" replace />} />

        {/* Receipt: template picker (no id) or fill-and-export (with id) */}
        <Route
          path="/receipt"
          element={
            <ReceiptPreviewNew
              apiBaseUrl={API_BASE_URL}
              templates={templates}
              templatesLoaded={templatesLoaded}
              onRefreshTemplates={fetchTemplates}
            />
          }
        />
        <Route
          path="/receipt/:id"
          element={<ReceiptRoute apiBaseUrl={API_BASE_URL} />}
        />

        {/* Dashboard */}
        <Route path="/sales" element={<Navigate to="/dashboard" replace />} />
        <Route
          path="/dashboard"
          element={
            <SalesDashboard
              apiBaseUrl={API_BASE_URL}
              receipts={receipts}
              receiptsLoaded={receiptsLoaded}
              receiptsError={receiptsError}
              onRefreshReceipts={fetchReceipts}
            />
          }
        />

        {/* Legacy redirect */}
        <Route path="/preview/:id" element={<LegacyPreviewRedirect />} />

        {/* Deck Studio: template gallery, wizard, or manual editor by ID */}
        <Route
          path="/deck"
          element={
            <TemplateGallery
              templates={templates}
              templatesLoaded={templatesLoaded}
              onRefreshTemplates={fetchTemplates}
              apiBaseUrl={API_BASE_URL}
            />
          }
        />
        <Route
          path="/deck/wizard"
          element={<TemplateWizard apiBaseUrl={API_BASE_URL} />}
        />
        <Route
          path="/deck/:id"
          element={<TemplateEditorRoute apiBaseUrl={API_BASE_URL} />}
        />

        <Route path="/pricing" element={<Pricing />} />
        <Route path="/checkout-success" element={<CheckoutSuccess />} />

        <Route path="/account" element={<ProfileScreen />} />
        <Route path="/login" element={<Navigate to="/receipt" replace />} />
        <Route path="/r/:share_token" element={<PublicReceipt />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </main>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <ToastProvider>
          <Shell />
        </ToastProvider>
      </BrowserRouter>
    </AuthProvider>
  );
}
