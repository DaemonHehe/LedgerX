import { useMemo, useState } from 'react';
import html2canvas from 'html2canvas';
import { Download, LogOut } from 'lucide-react';
import { BrowserRouter, NavLink, Route, Routes } from 'react-router-dom';
import ReceiptPreview from './components/ReceiptPreview.jsx';
import EditorPanel from './components/EditorPanel.jsx';
import LoginScreen from './components/LoginScreen.jsx';
import SalesDashboard from './components/SalesDashboard.jsx';

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
}) {
  return (
    <div className="grid h-[calc(100vh-7.25rem)] min-h-[680px] w-full grid-cols-[minmax(360px,1fr)_minmax(0,3fr)] overflow-hidden rounded-xl border border-[#d8cebf] shadow-2xl shadow-stone-900/10">
      <aside className="editor-pane h-full min-w-0 overflow-hidden">
        <div className="h-full overflow-y-auto overflow-x-hidden px-8 py-8">
          <div className="editor-toolbar sticky top-0 z-10 mb-6 w-full pb-5 pt-1">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#b55432]">
                Receipt Studio
              </p>
              <h1 className="text-3xl font-semibold text-[#151515]">Control Panel</h1>
            </div>
          </div>

          <EditorPanel
            apiBaseUrl={API_BASE_URL}
            receipt={receipt}
            updateReceipt={updateReceipt}
            updateItems={updateItems}
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
        <ReceiptPreview receipt={receipt} totals={totals} />
      </section>
    </div>
  );
}

function App() {
  const [session, setSession] = useState(() => {
    const saved = localStorage.getItem('receipt-generator-session');
    return saved ? JSON.parse(saved) : null;
  });

  const [receipt, setReceipt] = useState(() => {
    const saved = localStorage.getItem('receipt-generator-state');
    return saved ? normalizeSavedReceipt(JSON.parse(saved)) : initialReceipt;
  });

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
    const receiptNode = document.getElementById('receipt-preview');

    return html2canvas(receiptNode, {
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

  const handleLogin = ({ name, email }) => {
    const nextSession = {
      name: name || email,
      email,
      signedInAt: new Date().toISOString(),
    };

    localStorage.setItem('receipt-generator-session', JSON.stringify(nextSession));
    setSession(nextSession);
  };

  const handleLogout = () => {
    localStorage.removeItem('receipt-generator-session');
    setSession(null);
  };

  if (!session) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <BrowserRouter>
      <main className="app-shell min-h-screen overflow-x-hidden p-6 text-neutral-950">
        <nav className="app-nav">
          <div>
            <p>Receipt Studio</p>
            <strong>{session.name}</strong>
          </div>
          <div className="app-nav-links">
            <NavLink to="/">Receipt Generator</NavLink>
            <NavLink to="/sales">Sales Dashboard</NavLink>
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
              />
            }
          />
          <Route path="/sales" element={<SalesDashboard apiBaseUrl={API_BASE_URL} />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}

export default App;
