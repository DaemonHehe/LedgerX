import { useState } from "react";
import { Check, ArrowRight, ArrowLeft, RotateCcw, Eye, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { authFetch } from "../../lib/api.js";
import { useToast } from "../../context/ToastContext.jsx";

// ---------------------------------------------------------------------------
// LedgerX — Receipt Template Creation Wizard
// Nothing-UI inspired: monochrome black/white, red accent, JetBrains Mono
// for data/labels, dot-matrix status markers, camera-viewfinder corner
// brackets on the selected option.
// ---------------------------------------------------------------------------

import {
  RED,
  PRESETS,
  HEADER_LAYOUTS,
  CUSTOMER_LAYOUTS,
  BODY_STYLES,
  TOTAL_STYLES,
  FOOTER_STYLES,
  buildSchema,
} from "../../lib/buildWizardSchema.js";

const STEPS = [
  { n: 1, label: "Format" },
  { n: 2, label: "Header" },
  { n: 3, label: "Customer Details" },
  { n: 4, label: "Body" },
  { n: 5, label: "Total Section" },
  { n: 6, label: "Footer" },
];

// Corner-bracket frame — the signature element. Appears on the selected card.
function Brackets({ active }) {
  if (!active) return null;
  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
      <path d="M2 10 V2 H10" stroke="var(--accent-red)" strokeWidth="2" fill="none" vectorEffect="non-scaling-stroke" />
      <path d="M90 2 H98 V10" stroke="var(--accent-red)" strokeWidth="2" fill="none" vectorEffect="non-scaling-stroke" />
      <path d="M98 90 V98 H90" stroke="var(--accent-red)" strokeWidth="2" fill="none" vectorEffect="non-scaling-stroke" />
      <path d="M10 98 H2 V90" stroke="var(--accent-red)" strokeWidth="2" fill="none" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

function OptionCard({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`relative text-left w-full p-3 border transition-all flex flex-col items-start min-h-[44px] hover:scale-[1.01] hover:border-accent-red bg-surface ${active ? 'border-accent-red' : 'border-line'}`}
    >
      <Brackets active={active} />
      {active && (
        <div className="absolute top-2 right-2 w-1.5 h-1.5 bg-accent-red" />
      )}
      {children}
    </button>
  );
}

// --- Mini preview glyphs (pure SVG, monochrome + red) ----------------------

function PresetGlyph({ p }) {
  const scale = 0.12;
  return (
    <svg width={p.w * scale + 8} height={p.h * scale + 8} className="mb-2">
      <rect x="4" y="4" width={p.w * scale} height={p.h * scale} fill="none" stroke="#666" strokeWidth="1.5" />
    </svg>
  );
}

function HeaderGlyph({ id }) {
  const box = (x, y, w, h, filled) => <rect x={x} y={y} width={w} height={h} fill={filled ? "#666" : "none"} stroke="#666" strokeWidth="1" />;
  return (
    <svg width="88" height="40" className="mb-2">
      <rect x="0.5" y="0.5" width="87" height="39" fill="none" stroke="#333" />
      {id === "stacked" && (<>{box(30, 6, 28, 12, true)}{box(14, 24, 60, 4)}{box(14, 31, 40, 4)}</>)}
      {id === "side-left" && (<>{box(6, 10, 18, 20, true)}{box(32, 12, 50, 4)}{box(32, 19, 50, 4)}{box(32, 26, 34, 4)}</>)}
      {id === "side-right" && (<>{box(64, 10, 18, 20, true)}{box(6, 12, 50, 4)}{box(6, 19, 50, 4)}{box(6, 26, 34, 4)}</>)}
      {id === "minimal" && (<>
        <rect x="20" y="13" width="48" height="5" fill="#666" />
        <line x1="10" y1="26" x2="78" y2="26" stroke="#3a3a3a" strokeWidth="1" />
      </>)}
      {id === "badge" && (<>
        <circle cx="44" cy="13" r="7" fill="#666" />
        {[0, 1, 2, 3, 4, 5].map((i) => <rect key={i} x={19 + i * 8} y="26" width="4" height="4" fill="#3a3a3a" />)}
      </>)}
      {id === "letterhead" && (<>
        <rect x="6" y="6" width="10" height="10" fill="#666" />
        <line x1="6" y1="20" x2="82" y2="20" stroke={RED} strokeWidth="1" />
        <rect x="6" y="24" width="50" height="3" fill="#3a3a3a" />
        <rect x="6" y="29" width="34" height="3" fill="#3a3a3a" />
      </>)}
    </svg>
  );
}

function CustomerGlyph({ id }) {
  return (
    <svg width="88" height="40" className="mb-2">
      <rect x="0.5" y="0.5" width="87" height="39" fill="none" stroke="#333" />
      {id === "none" && (
        <text x="44" y="24" textAnchor="middle" fill="#666" fontSize="8" fontFamily="sans-serif">SKIP</text>
      )}
      {id === "simple" && (
        <>
          <rect x="8" y="17" width="22" height="4" fill="#888" />
          <rect x="36" y="17" width="36" height="4" fill="#3a3a3a" />
        </>
      )}
      {id === "detailed" && (
        <>
          <rect x="8" y="8" width="20" height="3" fill="#888" />
          <rect x="32" y="8" width="32" height="3" fill="#3a3a3a" />
          
          <rect x="8" y="16" width="20" height="3" fill="#555" />
          <rect x="32" y="16" width="44" height="3" fill="#3a3a3a" />
          
          <rect x="8" y="24" width="20" height="3" fill="#555" />
          <rect x="32" y="24" width="36" height="3" fill="#3a3a3a" />
        </>
      )}
      {id === "compact" && (
        <>
          <rect x="8" y="17" width="16" height="4" fill="#888" />
          <rect x="28" y="17" width="22" height="4" fill="#3a3a3a" />
          
          <rect x="54" y="17" width="10" height="4" fill="#555" />
          <rect x="68" y="17" width="14" height="4" fill="#3a3a3a" />
        </>
      )}
    </svg>
  );
}

function BodyGlyph({ id }) {
  const rows = [0, 1];
  return (
    <svg width="88" height="40" className="mb-2">
      <rect x="0.5" y="0.5" width="87" height="39" fill="none" stroke="#333" />
      {id === "grid" && (<>
        {rows.map((r) => (
          <g key={r}>
            <rect x={6} y={10 + r * 10} width="76" height="8" fill="none" stroke="#666" strokeWidth="1" />
            <line x1={50} y1={10 + r * 10} x2={50} y2={10 + r * 10 + 8} stroke="#666" strokeWidth="1" />
          </g>
        ))}
      </>)}
      {id === "minimal" && (<>
        <line x1="6" y1="8" x2="82" y2="8" stroke="#888" strokeWidth="1.5" />
        {rows.map((r) => <line key={r} x1="6" y1={18 + r * 10} x2="82" y2={18 + r * 10} stroke="#3a3a3a" strokeWidth="1" />)}
      </>)}
      {id === "zebra" && (<>
        {rows.map((r) => <rect key={r} x="6" y={10 + r * 11} width="76" height="9" fill={r % 2 === 0 ? "#222" : "none"} />)}
      </>)}
      {id === "compact-list" && (<>
        {[0, 1, 2].map((r) => (
          <g key={r}>
            <rect x="6" y={10 + r * 8} width="34" height="3" fill="#555" />
            <rect x="66" y={10 + r * 8} width="16" height="3" fill="#555" />
          </g>
        ))}
      </>)}
      {id === "ledger-double" && (<>
        <line x1="6" y1="6" x2="82" y2="6" stroke="#888" strokeWidth="1" />
        <line x1="6" y1="8.5" x2="82" y2="8.5" stroke="#888" strokeWidth="1" />
        {[0, 1].map((r) => <rect key={r} x="6" y={15 + r * 9} width="76" height="4" fill="#3a3a3a" />)}
      </>)}
      {id === "boxed-total" && (<>
        {rows.map((r) => (
          <rect key={r} x={6} y={10 + r * 10} width="76" height="8" fill="none" stroke="#666" strokeWidth="1" />
        ))}
      </>)}
    </svg>
  );
}

function TotalGlyph({ id }) {
  return (
    <svg width="88" height="40" className="mb-2">
      <rect x="0.5" y="0.5" width="87" height="39" fill="none" stroke="#333" />
      {id === "none" && (
        <text x="44" y="24" textAnchor="middle" fill="#666" fontSize="8" fontFamily="sans-serif">SKIP</text>
      )}
      {id === "grid" && (
        <g>
          <rect x="6" y="14.5" width="76" height="11" fill="none" stroke={RED} strokeWidth="1.5" />
          <line x1="50" y1="14.5" x2="50" y2="25.5" stroke={RED} strokeWidth="1.2" />
        </g>
      )}
      {id === "minimal" && (
        <line x1="6" y1="20" x2="82" y2="20" stroke={RED} strokeWidth="1.5" />
      )}
      {id === "zebra" && (
        <rect x="6" y="14.5" width="76" height="11" fill="#333" />
      )}
      {id === "double-rule" && (
        <g>
          <line x1="6" y1="14" x2="82" y2="14" stroke="#888" strokeWidth="1" />
          <line x1="6" y1="16.5" x2="82" y2="16.5" stroke="#888" strokeWidth="1" />
          <line x1="6" y1="23" x2="82" y2="23" stroke="#888" strokeWidth="1" />
          <line x1="6" y1="25.5" x2="82" y2="25.5" stroke="#888" strokeWidth="1" />
        </g>
      )}
      {id === "boxed-total" && (
        <rect x="6" y="14.5" width="76" height="11" fill={RED} opacity="0.18" stroke={RED} strokeWidth="1" />
      )}
    </svg>
  );
}

function FooterGlyph({ id }) {
  return (
    <svg width="88" height="40" className="mb-2">
      <rect x="0.5" y="0.5" width="87" height="39" fill="none" stroke="#333" />
      {id === "centered" && (<><rect x="26" y="14" width="36" height="4" fill="#666" /><rect x="32" y="22" width="24" height="4" fill="#3a3a3a" /></>)}
      {id === "barcode" && (<>
        {[0, 2, 4, 6, 8, 10, 13, 15, 17].map((x) => <rect key={x} x={6 + x} y="10" width="1.4" height="16" fill="#888" />)}
        <rect x="50" y="12" width="32" height="3" fill="#3a3a3a" />
        <rect x="50" y="18" width="32" height="3" fill="#3a3a3a" />
        <rect x="50" y="24" width="20" height="3" fill="#3a3a3a" />
      </>)}
      {id === "signature" && (<>
        <line x1="20" y1="20" x2="68" y2="20" stroke={RED} strokeWidth="1.5" strokeDasharray="3 2" />
        <rect x="20" y="25" width="30" height="4" fill="#3a3a3a" />
      </>)}
      {id === "qr" && (<>
        {[...Array(16)].map((_, i) => (
          <rect key={i} x={8 + (i % 4) * 4} y={10 + Math.floor(i / 4) * 4} width="3.4" height="3.4" fill={(i * 7) % 3 === 0 ? "#888" : "none"} />
        ))}
        <rect x="34" y="16" width="44" height="4" fill="#3a3a3a" />
      </>)}
      {id === "stamp" && (<>
        <rect x="6" y="18" width="30" height="4" fill="#3a3a3a" />
        <g transform="rotate(-14 62 20)">
          <circle cx="62" cy="20" r="10" fill="none" stroke={RED} strokeWidth="1.5" />
          <rect x="55" y="18" width="14" height="4" fill={RED} />
        </g>
      </>)}
      {id === "policy-block" && (<>
        <rect x="10" y="6" width="68" height="28" fill="none" stroke="#666" strokeWidth="1" />
        {[0, 1, 2].map((r) => (
          <g key={r}>
            <circle cx="16" cy={13 + r * 7} r="1.2" fill={RED} />
            <rect x="20" y={12 + r * 7} width={48 - r * 6} height="2" fill="#3a3a3a" />
          </g>
        ))}
      </>)}
    </svg>
  );
}

// --- Live receipt preview ----------------------------------------------

function ReceiptPreview({ choices }) {
  const { preset, header, customer, body, total, footer } = choices;
  const p = PRESETS.find((x) => x.id === preset) || PRESETS[1];
  const scale = Math.min(240 / p.w, 380 / p.h);
  const w = p.w * scale;
  const h = p.h * scale;

  let bodyTop = h * 0.26;
  if (customer === "simple" || customer === "compact") {
    bodyTop = h * 0.29;
  } else if (customer === "detailed") {
    bodyTop = h * 0.35;
  }
  const bodyHeight = h * 0.5 - (bodyTop - h * 0.26);

  return (
    <div className="bg-white text-black relative shadow-[0_0_0_1px_#2b2b2b]" style={{ width: w, height: h, fontFamily: "'JetBrains Mono', monospace" }}>
      {/* header */}
      <div className="absolute top-0 left-0 right-0 p-2" style={{ height: h * 0.24 }}>
        {(!header || header === "stacked") && (
          <div className="flex flex-col items-center justify-center h-full gap-1">
            <div className="w-6 h-6 bg-black" />
            <div className="text-[6px] tracking-widest">BUSINESS NAME</div>
            <div className="text-[5px] text-gray-500">123 Ledger St · City</div>
          </div>
        )}
        {header === "side-left" && (
          <div className="flex items-center h-full gap-2">
            <div className="w-5 h-5 bg-black shrink-0" />
            <div className="leading-tight">
              <div className="text-[6px] tracking-widest">BUSINESS NAME</div>
              <div className="text-[5px] text-gray-500">123 Ledger St · City</div>
            </div>
          </div>
        )}
        {header === "side-right" && (
          <div className="flex items-center h-full gap-2 justify-end text-right">
            <div className="leading-tight">
              <div className="text-[6px] tracking-widest">BUSINESS NAME</div>
              <div className="text-[5px] text-gray-500">123 Ledger St · City</div>
            </div>
            <div className="w-5 h-5 bg-black shrink-0" />
          </div>
        )}
        {header === "minimal" && (
          <div className="flex flex-col items-center justify-center h-full gap-1.5">
            <div className="text-[6px] tracking-widest">BUSINESS NAME</div>
            <div style={{ width: "40%", borderBottom: "0.5px solid #999" }} />
          </div>
        )}
        {header === "badge" && (
          <div className="flex flex-col items-center justify-center h-full gap-1">
            <div className="w-6 h-6 rounded-full bg-black" />
            <div className="text-[5.5px] tracking-[0.3em]">BUSINESS</div>
          </div>
        )}
        {header === "letterhead" && (
          <div className="h-full flex flex-col justify-center px-1">
            <div className="flex items-center gap-1 mb-1">
              <div className="w-3 h-3 bg-black shrink-0" />
              <div className="text-[5.5px] tracking-widest">BUSINESS NAME</div>
            </div>
            <div style={{ borderTop: "0.5px solid " + RED, marginBottom: 2 }} />
            <div className="text-[4.5px] text-gray-500">123 Ledger St · City</div>
          </div>
        )}
      </div>

      {/* customer info */}
      {customer && customer !== "none" && (
        <div className="absolute left-2 right-2 flex flex-col text-[4.2px] leading-tight text-gray-700" style={{ top: h * 0.23 }}>
          {customer === "simple" && (
            <div><span className="font-bold">CLIENT:</span> John Doe</div>
          )}
          {customer === "detailed" && (
            <>
              <div><span className="font-bold">CLIENT:</span> John Doe</div>
              <div><span className="text-gray-500">ADD:</span> 456 Client Rd</div>
              <div><span className="text-gray-500">TEL:</span> +1 555-0199</div>
            </>
          )}
          {customer === "compact" && (
            <div className="flex justify-between">
              <div><span className="font-bold">CLIENT:</span> John Doe</div>
              <div><span className="text-gray-500">TEL:</span> +1 555-0199</div>
            </div>
          )}
        </div>
      )}

      {/* body */}
      <div className="absolute left-0 right-0 px-2 flex flex-col" style={{ top: bodyTop, height: bodyHeight }}>
        {body === "ledger-double" && <div style={{ borderTop: "3px double #999", marginBottom: 2 }} />}
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="flex justify-between text-[5.5px]"
            style={{
              borderBottom: body === "grid" || body === "minimal" || body === "boxed-total" ? "0.5px solid #999" : "none",
              borderTop: body === "grid" && i === 0 ? "1px solid " + RED : "none",
              background: body === "zebra" && i % 2 === 0 ? "#f0f0f0" : "transparent",
              padding: body === "compact-list" ? "1px 0" : "3px 0",
            }}
          >
            <span>Item {i + 1}</span>
            <span>$0.00</span>
          </div>
        ))}

        {/* total row — present only if a total style is chosen */}
        {total && total !== "none" && (
          <div className="mt-auto">
            {total === "grid" && (
              <div className="flex justify-between text-[6px] font-bold py-[3px] px-1" style={{ borderTop: "1.5px solid " + RED, borderBottom: "1.5px solid " + RED, borderLeft: "0.5px solid " + RED, borderRight: "0.5px solid " + RED, color: RED }}>
                <span>TOTAL</span><span>$0.00</span>
              </div>
            )}
            {total === "minimal" && (
              <div className="flex justify-between text-[6px] font-bold py-[3px]" style={{ borderTop: "1.5px solid " + RED }}>
                <span>TOTAL</span><span>$0.00</span>
              </div>
            )}
            {total === "zebra" && (
              <div className="flex justify-between text-[6px] font-bold py-[3px] px-1" style={{ background: "#555", color: "#fff" }}>
                <span>TOTAL</span><span>$0.00</span>
              </div>
            )}
            {total === "double-rule" && (
              <>
                <div style={{ borderTop: "0.5px solid #999", borderBottom: "0.5px solid #999", padding: "1px 0" }} />
                <div className="flex justify-between text-[6px] font-bold py-[2px]">
                  <span>TOTAL</span><span>$0.00</span>
                </div>
                <div style={{ borderBottom: "0.5px solid #999", borderTop: "0.5px solid #999", padding: "1px 0" }} />
              </>
            )}
            {total === "boxed-total" && (
              <div className="flex justify-between text-[5.5px] font-bold py-[3px] px-1 mt-1" style={{ background: "rgba(255,51,85,0.12)", border: "0.5px solid " + RED, color: RED }}>
                <span>TOTAL</span>
                <span>$0.00</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* footer */}
      <div className="absolute bottom-0 left-0 right-0 p-2 flex flex-col justify-center" style={{ height: h * 0.2 }}>
        {(!footer || footer === "centered") && <div className="text-center text-[5.5px] tracking-wide">Thank you for your business</div>}
        {footer === "barcode" && (
          <div className="flex items-center justify-between">
            <div className="flex gap-[1px]">{[...Array(10)].map((_, i) => <div key={i} style={{ width: 1, height: 14, background: i % 2 === 0 ? "#000" : "#ccc" }} />)}</div>
            <div className="text-[4.5px] text-gray-500 text-right leading-tight">No refunds<br />after 14 days</div>
          </div>
        )}
        {footer === "signature" && (
          <div className="px-2">
            <div style={{ borderTop: "0.5px dashed " + RED, marginBottom: 2 }} />
            <div className="text-[5px] text-gray-500">Signature · Date</div>
          </div>
        )}
        {footer === "qr" && (
          <div className="flex items-center gap-2 px-1">
            <div className="grid grid-cols-4 gap-[1px]" style={{ width: 16, height: 16 }}>
              {[...Array(16)].map((_, i) => <div key={i} style={{ background: (i * 7) % 3 === 0 ? "#000" : "transparent" }} />)}
            </div>
            <div className="text-[4.5px]">Scan to leave a review</div>
          </div>
        )}
        {footer === "stamp" && (
          <div className="relative h-full flex items-center px-1">
            <div className="text-[5px]">Thank you</div>
            <div
              className="absolute right-3 border-2 rounded-full flex items-center justify-center"
              style={{ width: 22, height: 22, borderColor: RED, transform: "rotate(-12deg)" }}
            >
              <span className="text-[4px] font-bold" style={{ color: RED }}>PAID</span>
            </div>
          </div>
        )}
        {footer === "policy-block" && (
          <div className="mx-1 border px-2 py-1" style={{ borderColor: "#999" }}>
            <div className="text-[4.2px] text-gray-500 leading-tight">• No refunds after 14 days</div>
            <div className="text-[4.2px] text-gray-500 leading-tight">• Exchanges within 30 days</div>
          </div>
        )}
      </div>
    </div>
  );
}

// --- Schema builder, matching templates.schema_json -------------------



// --- Main wizard ---------------------------------------------------------

export default function TemplateWizard({ apiBaseUrl }) {
  const navigate = useNavigate();
  const { showError, showSuccess } = useToast();
  const [step, setStep] = useState(1);
  const [choices, setChoices] = useState({ preset: null, header: null, customer: null, body: null, total: null, footer: null, showSubtotal: false, taxRate: 0, discount: 0 });
  const [name, setName] = useState("Untitled Template");
  const [isSaving, setIsSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const canAdvance =
    (step === 1 && choices.preset) ||
    (step === 2 && choices.header) ||
    (step === 3 && choices.customer) ||
    (step === 4 && choices.body) ||
    (step === 5 && choices.total) ||
    (step === 6 && choices.footer);

  const done = choices.preset && choices.header && choices.customer && choices.body && choices.total && choices.footer;

  const select = (key, id) => setChoices((c) => ({ ...c, [key]: id }));

  const schema = buildSchema({
    preset: choices.preset || "vertical-standard",
    header: choices.header || "stacked",
    customer: choices.customer || "none",
    body: choices.body || "grid",
    total: choices.total || "grid",
    footer: choices.footer || "centered",
    showSubtotal: choices.showSubtotal,
    taxRate: choices.taxRate,
    discount: choices.discount,
  });

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await authFetch(`${apiBaseUrl}/api/templates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          schema_json: schema,
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save template");
      }
      const newTemplate = await response.json();
      showSuccess("Template created successfully");
      navigate(`/deck/${newTemplate.id}`);
    } catch (err) {
      console.error(err);
      showError(err.message || "Failed to save template");
    } finally {
      setIsSaving(false);
    }
  };

  const reset = () => {
    setStep(1);
    setChoices({ preset: null, header: null, customer: null, body: null, total: null, footer: null, showSubtotal: false, taxRate: 0, discount: 0 });
    setName("Untitled Template");
  };

  return (
    <div className="w-full min-h-[680px] flex flex-col md:flex-row text-text bg-bg" style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}>
      {/* Mobile Step rail (Horizontal compact) */}
      <div className="md:hidden w-full border-b border-line p-4 flex flex-col gap-2 shrink-0 bg-bg sticky top-0 z-20">
        <div className="flex justify-between items-center text-[11px] font-mono tracking-widest text-text-tertiary">
          <span>STEP {step} OF 6</span>
          <span className="text-text">{STEPS.find(s => s.n === step)?.label.toUpperCase()}</span>
        </div>
        <div className="w-full h-1 bg-line flex">
          <div className="h-full bg-accent-red transition-all" style={{ width: `${(step / 6) * 100}%` }} />
        </div>
      </div>

      {/* Desktop Step rail (Vertical) */}
      <div className="hidden md:flex w-[168px] shrink-0 border-r border-line p-5 flex-col">
        <div className="text-[10px] tracking-[0.2em] text-text-tertiary mb-6" style={{ fontFamily: "'JetBrains Mono', monospace" }}>NEW TEMPLATE</div>
        <div className="flex flex-col gap-0.5">
          {STEPS.map((s, i) => {
            const isActive = s.n === step;
            return (
              <div key={s.n} className="flex items-start gap-3 pb-6 relative">
                {i < STEPS.length - 1 && <div className="absolute left-[9px] top-[22px] w-[1px] h-[26px]" style={{ background: s.n < step ? "var(--accent-red)" : "var(--line)" }} />}
                <div
                  className="w-[18px] h-[18px] rounded-full flex items-center justify-center shrink-0 text-[9px]"
                  style={{ border: `1px solid ${isActive || s.n < step ? "var(--accent-red)" : "var(--line)"}`, background: s.n < step ? "var(--accent-red)" : "transparent", color: s.n < step ? "var(--bg-primary)" : isActive ? "var(--accent-red)" : "var(--text-muted)", fontFamily: "'JetBrains Mono', monospace" }}
                >
                  {s.n < step ? <Check size={11} strokeWidth={3} /> : s.n}
                </div>
                <button onClick={() => s.n < step && setStep(s.n)} className="text-[12px] pt-[1px] text-left whitespace-nowrap min-h-[44px] -mt-3 pt-3" style={{ color: isActive ? "var(--text)" : s.n < step ? "var(--text-soft)" : "var(--text-muted)", cursor: s.n < step ? "pointer" : "default" }}>
                  {s.label}
                </button>
              </div>
            );
          })}
        </div>
        <button onClick={reset} className="mt-auto flex items-center gap-1.5 text-[10px] text-text-soft hover:text-text transition-colors min-h-[44px]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
          <RotateCcw size={11} /> RESTART
        </button>
      </div>

      {/* Options */}
      <div className="flex-1 p-4 md:p-6 flex flex-col min-w-0 pb-28 md:pb-6">
        {step === 1 && (
          <>
            <h2 className="text-[15px] mb-1">Choose format</h2>
            <p className="text-[11px] text-gray-500 mb-5">Sets the canvas width and height for this template.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {PRESETS.map((p) => (
                <OptionCard key={p.id} active={choices.preset === p.id} onClick={() => select("preset", p.id)}>
                  <PresetGlyph p={p} />
                  <div className="text-[12px] mb-0.5">{p.label}</div>
                  <div className="text-[10px] text-gray-500" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{p.w}×{p.h}px</div>
                  <div className="text-[10px] text-gray-600 mt-1">{p.note}</div>
                </OptionCard>
              ))}
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h2 className="text-[15px] mb-1">Header layout</h2>
            <p className="text-[11px] text-gray-500 mb-5">Where the logo sits relative to the business description.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {HEADER_LAYOUTS.map((h) => (
                <OptionCard key={h.id} active={choices.header === h.id} onClick={() => select("header", h.id)}>
                  <HeaderGlyph id={h.id} />
                  <div className="text-[12px] mb-0.5">{h.label}</div>
                  <div className="text-[10px] text-gray-600">{h.note}</div>
                </OptionCard>
              ))}
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <h2 className="text-[15px] mb-1">Customer Details</h2>
            <p className="text-[11px] text-gray-500 mb-5">Select details to capture client identities on the receipt.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {CUSTOMER_LAYOUTS.map((c) => (
                <OptionCard key={c.id} active={choices.customer === c.id} onClick={() => select("customer", c.id)}>
                  <CustomerGlyph id={c.id} />
                  <div className="text-[12px] mb-0.5">{c.label}</div>
                  <div className="text-[10px] text-gray-600">{c.note}</div>
                </OptionCard>
              ))}
            </div>
          </>
        )}

        {step === 4 && (
          <>
            <h2 className="text-[15px] mb-1">Body — item table</h2>
            <p className="text-[11px] text-gray-500 mb-5">How line items are ruled and separated.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {BODY_STYLES.map((b) => (
                <OptionCard key={b.id} active={choices.body === b.id} onClick={() => select("body", b.id)}>
                  <BodyGlyph id={b.id} />
                  <div className="text-[12px] mb-0.5">{b.label}</div>
                  <div className="text-[10px] text-gray-600">{b.note}</div>
                </OptionCard>
              ))}
            </div>
          </>
        )}

        {step === 5 && (
          <>
            <h2 className="text-[15px] mb-1">Total section</h2>
            <p className="text-[11px] text-gray-500 mb-5">How the total amount row is boxed and highlighted.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {TOTAL_STYLES.map((t) => (
                <OptionCard key={t.id} active={choices.total === t.id} onClick={() => select("total", t.id)}>
                  <TotalGlyph id={t.id} />
                  <div className="text-[12px] mb-0.5">{t.label}</div>
                  <div className="text-[10px] text-gray-600">{t.note}</div>
                </OptionCard>
              ))}
            </div>

            {choices.total && choices.total !== "none" && (
              <div className="mt-6 p-4 border border-line bg-surface flex flex-col gap-4">
                <div className="text-[11px] font-bold tracking-wider" style={{ fontFamily: "'JetBrains Mono', monospace" }}>CALCULATIONS</div>
                
                <label className="flex items-center gap-2 text-[12px] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={choices.showSubtotal}
                    onChange={(e) => setChoices((c) => ({ ...c, showSubtotal: e.target.checked }))}
                    className="w-3.5 h-3.5 accent-red"
                  />
                  Show Subtotal Row
                </label>

                <div className="flex gap-4">
                  <div className="flex flex-col gap-1 flex-1">
                    <label className="text-[10px] text-gray-500" style={{ fontFamily: "'JetBrains Mono', monospace" }}>TAX RATE (%)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      value={choices.taxRate}
                      onChange={(e) => setChoices((c) => ({ ...c, taxRate: parseFloat(e.target.value) || 0 }))}
                      className="w-full bg-bg border border-line px-2 py-1 text-[12px] outline-none focus:border-accent-red"
                    />
                  </div>
                  <div className="flex flex-col gap-1 flex-1">
                    <label className="text-[10px] text-gray-500" style={{ fontFamily: "'JetBrains Mono', monospace" }}>FLAT DISCOUNT ($)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={choices.discount}
                      onChange={(e) => setChoices((c) => ({ ...c, discount: parseFloat(e.target.value) || 0 }))}
                      className="w-full bg-bg border border-line px-2 py-1 text-[12px] outline-none focus:border-accent-red"
                    />
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {step === 6 && (
          <>
            <h2 className="text-[15px] mb-1">Footer style</h2>
            <p className="text-[11px] text-gray-500 mb-5">The closing element beneath the item table.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {FOOTER_STYLES.map((f) => (
                <OptionCard key={f.id} active={choices.footer === f.id} onClick={() => select("footer", f.id)}>
                  <FooterGlyph id={f.id} />
                  <div className="text-[12px] mb-0.5">{f.label}</div>
                  <div className="text-[10px] text-text-tertiary">{f.note}</div>
                </OptionCard>
              ))}
            </div>

            {done && (
              <div className="mt-5">
                <label className="text-[10px] text-text-tertiary tracking-wide" style={{ fontFamily: "'JetBrains Mono', monospace" }}>TEMPLATE NAME</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full mt-1 bg-surface border border-line px-3 py-2 text-[12px] text-text outline-none"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                />
              </div>
            )}
          </>
        )}

        {/* Mobile Preview Toggle */}
        <div className="mt-8 mb-4 lg:hidden">
          <button 
            onClick={() => setShowPreview(true)}
            className="w-full flex justify-center items-center gap-2 px-4 py-3 border border-line text-text-soft hover:text-text hover:bg-surface min-h-[44px] text-xs font-mono"
          >
            <Eye size={14} /> View Live Preview
          </button>
        </div>

        {/* nav */}
        <div className="fixed bottom-0 left-0 right-0 bg-bg border-t border-line p-4 pl-24 pb-[max(1rem,env(safe-area-inset-bottom))] flex items-center gap-2 z-20 md:static md:bg-transparent md:border-t-0 md:p-0 md:mt-auto md:pt-6">
          {step > 1 && (
            <button onClick={() => setStep((s) => s - 1)} className="flex items-center justify-center gap-1.5 px-3 py-2 text-[11px] border border-line text-text-soft hover:text-text transition-colors min-h-[44px] min-w-[80px]">
              <ArrowLeft size={12} /> Back
            </button>
          )}
          {step < 6 && (
            <button
              disabled={!canAdvance}
              onClick={() => setStep((s) => s + 1)}
              className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-3 py-2 text-[11px] transition-colors min-h-[44px] min-w-[120px]"
              style={{ background: canAdvance ? "var(--accent-red)" : "var(--line)", color: canAdvance ? "var(--bg-primary)" : "var(--text-muted)", cursor: canAdvance ? "pointer" : "not-allowed" }}
            >
              Continue <ArrowRight size={12} />
            </button>
          )}
          {step === 6 && done && (
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-3 py-2 text-[11px] transition-colors min-h-[44px]"
              style={{ background: "var(--accent-red)", color: "var(--bg-primary)", cursor: "pointer" }}
            >
              {isSaving ? "Saving..." : "Save & Customize"} <ArrowRight size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Live preview + schema */}
      <div className="hidden lg:flex w-[340px] shrink-0 border-l border-line p-6 flex-col items-center">
        <div className="text-[10px] tracking-[0.2em] text-text-tertiary mb-4 self-start" style={{ fontFamily: "'JetBrains Mono', monospace" }}>LIVE PREVIEW</div>
        <ReceiptPreview choices={choices} />
      </div>

      {/* Mobile Live Preview Overlay */}
      {showPreview && (
        <div className="fixed inset-0 bg-bg z-50 flex flex-col lg:hidden">
          <div className="flex items-center justify-between p-4 border-b border-line">
            <div className="text-[10px] tracking-[0.2em] text-text-tertiary" style={{ fontFamily: "'JetBrains Mono', monospace" }}>LIVE PREVIEW</div>
            <button onClick={() => setShowPreview(false)} className="p-2 -mr-2 text-text-soft hover:text-text">
              <X size={20} />
            </button>
          </div>
          <div className="flex-1 overflow-auto p-6 flex flex-col items-center bg-bg">
            <ReceiptPreview choices={choices} />
          </div>
        </div>
      )}
    </div>
  );
}
