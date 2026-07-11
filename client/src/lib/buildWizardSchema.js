export const RED = "#FF3355";

export const PRESETS = [
  { id: "vertical-compact", type: "vertical", label: "Thermal", w: 300, h: 580, note: "300px wide · POS thermal roll" },
  { id: "vertical-standard", type: "vertical", label: "Standard", w: 380, h: 620, note: "380px · classic receipt" },
  { id: "horizontal-standard", type: "horizontal", label: "Voucher", w: 400, h: 300, note: "400×300 · ticket / voucher" },
  { id: "horizontal-wide", type: "horizontal", label: "Wide", w: 620, h: 340, note: "620×340 · boarding-pass style" },
];

export const HEADER_LAYOUTS = [
  { id: "stacked", label: "Stacked", note: "Logo above, description below" },
  { id: "side-left", label: "Side · logo left", note: "Logo left, description right" },
  { id: "side-right", label: "Side · logo right", note: "Description left, logo right" },
  { id: "minimal", label: "Minimal", note: "Business name only, thin rule beneath" },
  { id: "badge", label: "Badge", note: "Circular logo mark, letter-spaced name" },
  { id: "letterhead", label: "Letterhead", note: "Corner mark + full-width rule + address" },
];

export const CUSTOMER_LAYOUTS = [
  { id: "none", label: "No Customer Info", note: "Skip customer details on receipt" },
  { id: "simple", label: "Customer Name", note: "Name only, dynamic field" },
  { id: "detailed", label: "Full Details", note: "Customer Name, Address, & Phone" },
  { id: "compact", label: "Compact Info", note: "Name & Phone side-by-side" },
];

export const BODY_STYLES = [
  { id: "grid", label: "Bordered Grid", note: "Every cell boxed with grid outlines" },
  { id: "minimal", label: "Minimal Rules", note: "Header rule + horizontal dividers" },
  { id: "zebra", label: "Zebra Rows", note: "Alternating row background colors" },
  { id: "compact-list", label: "Compact List", note: "Tight thermal line-item spacing" },
  { id: "ledger-double", label: "Ledger Rules", note: "Double horizontal rules top & bottom" },
  { id: "boxed-total", label: "Standard Ruled", note: "Light thin rules between lines" },
];

export const TOTAL_STYLES = [
  { id: "none", label: "No Total Row", note: "Do not render a total section" },
  { id: "grid", label: "Bordered Grid Box", note: "Red borders with bold total text" },
  { id: "minimal", label: "Minimal Red Line", note: "Clean red line divider separator" },
  { id: "zebra", label: "Solid Bar Accent", note: "Dark gray background highlight bar" },
  { id: "double-rule", label: "Ledger Double Rule", note: "Double rules enclosing the total" },
  { id: "boxed-total", label: "Highlighted Box", note: "Red border with soft pink background" },
];

export const FOOTER_STYLES = [
  { id: "centered", label: "Centered Note", note: "Thank-you line, centered" },
  { id: "barcode", label: "Barcode + Terms", note: "Barcode left, fine print right" },
  { id: "signature", label: "Signature Line", note: "Signature rule + date field" },
  { id: "qr", label: "QR Code", note: "QR code + thank-you line" },
  { id: "stamp", label: "Paid Stamp", note: "Rotated circular stamp mark" },
  { id: "policy-block", label: "Policy Box", note: "Bordered return-policy block" },
];

export function buildSchema(choices) {
  const p = PRESETS.find((x) => x.id === choices.preset) || PRESETS[1];
  const elements = [];
  let z = 1;

  let currentY = 16;

  // Header
  if (choices.header === "stacked") {
    elements.push({ id: "logo", type: "image", content: "", x: p.w / 2 - 24, y: currentY, width: 48, height: 48, rotation: 0, zIndex: z++, fontFamily: "", fontSize: 0, fontWeight: 400, color: "", textAlign: "center", lineHeight: 1, isDynamic: true, fieldKey: "logoUrl" });
    currentY += 48 + 6;
    elements.push({ id: "business_name", type: "text", content: "Business Name", x: 0, y: currentY, width: p.w, height: 20, rotation: 0, zIndex: z++, fontFamily: "JetBrains Mono", fontSize: 14, fontWeight: 700, color: "#000000", textAlign: "center", lineHeight: 1.2, isDynamic: true, fieldKey: "businessName" });
    currentY += 20 + 2;
    elements.push({ id: "business_address", type: "text", content: "123 Ledger St, City", x: 0, y: currentY, width: p.w, height: 16, rotation: 0, zIndex: z++, fontFamily: "JetBrains Mono", fontSize: 10, fontWeight: 400, color: "#555555", textAlign: "center", lineHeight: 1.2, isDynamic: true, fieldKey: "businessAddress" });
    currentY += 16 + 12;
  } else if (choices.header === "side-left" || choices.header === "side-right") {
    const logoX = choices.header === "side-left" ? 16 : p.w - 56;
    const textX = choices.header === "side-left" ? 72 : 16;
    const textW = p.w - 88;
    const textAlign = choices.header === "side-left" ? "left" : "right";
    elements.push({ id: "logo", type: "image", content: "", x: logoX, y: currentY, width: 40, height: 40, rotation: 0, zIndex: z++, fontFamily: "", fontSize: 0, fontWeight: 400, color: "", textAlign: "center", lineHeight: 1, isDynamic: true, fieldKey: "logoUrl" });
    elements.push({ id: "business_name", type: "text", content: "Business Name", x: textX, y: currentY + 2, width: textW, height: 20, rotation: 0, zIndex: z++, fontFamily: "JetBrains Mono", fontSize: 13, fontWeight: 700, color: "#000000", textAlign, lineHeight: 1.2, isDynamic: true, fieldKey: "businessName" });
    elements.push({ id: "business_address", type: "text", content: "123 Ledger St, City", x: textX, y: currentY + 24, width: textW, height: 16, rotation: 0, zIndex: z++, fontFamily: "JetBrains Mono", fontSize: 9, fontWeight: 400, color: "#555555", textAlign, lineHeight: 1.2, isDynamic: true, fieldKey: "businessAddress" });
    currentY += 40 + 12;
  } else if (choices.header === "minimal") {
    elements.push({ id: "business_name", type: "text", content: "Business Name", x: 0, y: currentY, width: p.w, height: 20, rotation: 0, zIndex: z++, fontFamily: "JetBrains Mono", fontSize: 14, fontWeight: 700, color: "#000000", textAlign: "center", lineHeight: 1.2, isDynamic: true, fieldKey: "businessName" });
    currentY += 20 + 4;
    elements.push({ id: "header_rule", type: "shape", content: "line", x: p.w * 0.3, y: currentY, width: p.w * 0.4, height: 1, rotation: 0, zIndex: z++, fontFamily: "", fontSize: 0, fontWeight: 400, color: "#999999", textAlign: "left", lineHeight: 1, isDynamic: false, fieldKey: "" });
    currentY += 1 + 12;
  } else if (choices.header === "badge") {
    elements.push({ id: "logo", type: "image", content: "", x: p.w / 2 - 20, y: currentY, width: 40, height: 40, rotation: 0, zIndex: z++, fontFamily: "", fontSize: 0, fontWeight: 400, color: "", textAlign: "center", lineHeight: 1, isDynamic: true, fieldKey: "logoUrl", shape: "circle" });
    currentY += 40 + 6;
    elements.push({ id: "business_name", type: "text", content: "BUSINESS NAME", x: 0, y: currentY, width: p.w, height: 18, rotation: 0, zIndex: z++, fontFamily: "JetBrains Mono", fontSize: 11, fontWeight: 700, color: "#000000", textAlign: "center", lineHeight: 1.2, isDynamic: true, fieldKey: "businessName", letterSpacing: 2 });
    currentY += 18 + 12;
  } else if (choices.header === "letterhead") {
    elements.push({ id: "logo", type: "image", content: "", x: 16, y: currentY, width: 24, height: 24, rotation: 0, zIndex: z++, fontFamily: "", fontSize: 0, fontWeight: 400, color: "", textAlign: "center", lineHeight: 1, isDynamic: true, fieldKey: "logoUrl" });
    elements.push({ id: "business_name", type: "text", content: "Business Name", x: 46, y: currentY + 4, width: p.w - 62, height: 18, rotation: 0, zIndex: z++, fontFamily: "JetBrains Mono", fontSize: 12, fontWeight: 700, color: "#000000", textAlign: "left", lineHeight: 1.2, isDynamic: true, fieldKey: "businessName" });
    currentY += 24 + 6;
    elements.push({ id: "header_rule", type: "shape", content: "line", x: 16, y: currentY, width: p.w - 32, height: 1, rotation: 0, zIndex: z++, fontFamily: "", fontSize: 0, fontWeight: 400, color: RED, textAlign: "left", lineHeight: 1, isDynamic: false, fieldKey: "" });
    currentY += 1 + 5;
    elements.push({ id: "business_address", type: "text", content: "123 Ledger St, City", x: 16, y: currentY, width: p.w - 32, height: 16, rotation: 0, zIndex: z++, fontFamily: "JetBrains Mono", fontSize: 9, fontWeight: 400, color: "#555555", textAlign: "left", lineHeight: 1.2, isDynamic: true, fieldKey: "businessAddress" });
    currentY += 16 + 12;
  }

  // Customer Details
  if (choices.customer === "simple") {
    elements.push({ id: "cust_label", type: "text", content: "CLIENT:", x: 16, y: currentY, width: 60, height: 16, rotation: 0, zIndex: z++, fontFamily: "JetBrains Mono", fontSize: 9, fontWeight: 700, color: "#555555", textAlign: "left", lineHeight: 1.2, isDynamic: false, fieldKey: "" });
    elements.push({ id: "cust_name", type: "text", content: "John Doe", x: 76, y: currentY, width: p.w - 92, height: 16, rotation: 0, zIndex: z++, fontFamily: "JetBrains Mono", fontSize: 9, fontWeight: 400, color: "#000000", textAlign: "left", lineHeight: 1.2, isDynamic: true, fieldKey: "customerName" });
    currentY += 16 + 12;
  } else if (choices.customer === "detailed") {
    elements.push({ id: "cust_label", type: "text", content: "CLIENT:", x: 16, y: currentY, width: 60, height: 14, rotation: 0, zIndex: z++, fontFamily: "JetBrains Mono", fontSize: 9, fontWeight: 700, color: "#555555", textAlign: "left", lineHeight: 1.2, isDynamic: false, fieldKey: "" });
    elements.push({ id: "cust_name", type: "text", content: "John Doe", x: 76, y: currentY, width: p.w - 92, height: 14, rotation: 0, zIndex: z++, fontFamily: "JetBrains Mono", fontSize: 9, fontWeight: 400, color: "#000000", textAlign: "left", lineHeight: 1.2, isDynamic: true, fieldKey: "customerName" });
    currentY += 14 + 2;
    elements.push({ id: "cust_addr_label", type: "text", content: "ADDRESS:", x: 16, y: currentY, width: 60, height: 14, rotation: 0, zIndex: z++, fontFamily: "JetBrains Mono", fontSize: 8, fontWeight: 400, color: "#777777", textAlign: "left", lineHeight: 1.2, isDynamic: false, fieldKey: "" });
    elements.push({ id: "cust_address", type: "text", content: "123 Client St", x: 76, y: currentY, width: p.w - 92, height: 14, rotation: 0, zIndex: z++, fontFamily: "JetBrains Mono", fontSize: 8, fontWeight: 400, color: "#000000", textAlign: "left", lineHeight: 1.2, isDynamic: true, fieldKey: "customerAddress" });
    currentY += 14 + 2;
    elements.push({ id: "cust_phone_label", type: "text", content: "PHONE:", x: 16, y: currentY, width: 60, height: 14, rotation: 0, zIndex: z++, fontFamily: "JetBrains Mono", fontSize: 8, fontWeight: 400, color: "#777777", textAlign: "left", lineHeight: 1.2, isDynamic: false, fieldKey: "" });
    elements.push({ id: "cust_phone", type: "text", content: "+1 555-0100", x: 76, y: currentY, width: p.w - 92, height: 14, rotation: 0, zIndex: z++, fontFamily: "JetBrains Mono", fontSize: 8, fontWeight: 400, color: "#000000", textAlign: "left", lineHeight: 1.2, isDynamic: true, fieldKey: "customerPhone" });
    currentY += 14 + 12;
  } else if (choices.customer === "compact") {
    elements.push({ id: "cust_label", type: "text", content: "CLIENT:", x: 16, y: currentY, width: 50, height: 16, rotation: 0, zIndex: z++, fontFamily: "JetBrains Mono", fontSize: 9, fontWeight: 700, color: "#555555", textAlign: "left", lineHeight: 1.2, isDynamic: false, fieldKey: "" });
    elements.push({ id: "cust_name", type: "text", content: "John Doe", x: 66, y: currentY, width: p.w / 2 - 76, height: 16, rotation: 0, zIndex: z++, fontFamily: "JetBrains Mono", fontSize: 9, fontWeight: 400, color: "#000000", textAlign: "left", lineHeight: 1.2, isDynamic: true, fieldKey: "customerName" });
    elements.push({ id: "cust_phone_label", type: "text", content: "TEL:", x: p.w / 2 + 10, y: currentY, width: 30, height: 16, rotation: 0, zIndex: z++, fontFamily: "JetBrains Mono", fontSize: 8, fontWeight: 400, color: "#777777", textAlign: "left", lineHeight: 1.2, isDynamic: false, fieldKey: "" });
    elements.push({ id: "cust_phone", type: "text", content: "+1 555-0100", x: p.w / 2 + 40, y: currentY, width: p.w / 2 - 56, height: 16, rotation: 0, zIndex: z++, fontFamily: "JetBrains Mono", fontSize: 8, fontWeight: 400, color: "#000000", textAlign: "left", lineHeight: 1.2, isDynamic: true, fieldKey: "customerPhone" });
    currentY += 16 + 12;
  }

  const footerH = choices.footer === "policy-block" ? 40 : 
                  choices.footer === "stamp" ? 56 : 
                  choices.footer === "barcode" ? 30 : 
                  choices.footer === "qr" ? 30 : 
                  choices.footer === "signature" ? 17 : 20;

  // Body — item table
  const tableY = currentY;
  // Use a base height representing a minimal table (header + 1 item + total = ~60px)
  const tableHeight = 60;
  elements.push({
    id: "items_table", type: "table", content: "", x: 16, y: tableY, width: p.w - 32, height: tableHeight,
    rotation: 0, zIndex: z++, fontFamily: "JetBrains Mono", fontSize: 10, fontWeight: 400, color: "#000000",
    textAlign: "left", lineHeight: 1.3, isDynamic: true, fieldKey: "lineItems",
    tableStyle: choices.body,
    showTotal: choices.total !== "none",
    totalStyle: choices.total,
    totalFieldKey: "totalAmount",
    showSubtotal: choices.showSubtotal || false,
    taxRate: choices.taxRate || 0,
    discount: choices.discount || 0,
    columns: [
      { key: "name", label: "ITEM", width: 50, textAlign: "left" },
      { key: "qty", label: "QTY", width: 20, textAlign: "right" },
      { key: "price", label: "PRICE", width: 30, textAlign: "right" }
    ]
  });

  // Footer Y follows sequentially after the minimal table height
  const SECTION_GAP = 16;
  const footerY = tableY + tableHeight + SECTION_GAP;

  // Footer
  if (choices.footer === "centered") {
    elements.push({ id: "footer_note", type: "text", content: "Thank you for your business", x: 0, y: footerY, width: p.w, height: 20, rotation: 0, zIndex: z++, fontFamily: "JetBrains Mono", fontSize: 10, fontWeight: 400, color: "#000000", textAlign: "center", lineHeight: 1.2, isDynamic: false, fieldKey: "" });
  } else if (choices.footer === "barcode") {
    elements.push({ id: "footer_barcode", type: "barcode", content: "", x: 16, y: footerY, width: p.w * 0.35, height: 30, rotation: 0, zIndex: z++, fontFamily: "", fontSize: 0, fontWeight: 400, color: "#000000", textAlign: "left", lineHeight: 1, isDynamic: true, fieldKey: "receiptId" });
    elements.push({ id: "footer_terms", type: "text", content: "No refunds after 14 days", x: p.w * 0.5, y: footerY, width: p.w * 0.44, height: 30, rotation: 0, zIndex: z++, fontFamily: "JetBrains Mono", fontSize: 8, fontWeight: 400, color: "#555555", textAlign: "right", lineHeight: 1.3, isDynamic: false, fieldKey: "" });
  } else if (choices.footer === "signature") {
    elements.push({ id: "footer_sig_line", type: "shape", content: "line", x: 16, y: footerY, width: p.w - 32, height: 1, rotation: 0, zIndex: z++, fontFamily: "", fontSize: 0, fontWeight: 400, color: RED, textAlign: "left", lineHeight: 1, isDynamic: false, fieldKey: "" });
    elements.push({ id: "footer_sig_label", type: "text", content: "Signature · Date", x: 16, y: footerY + 6, width: p.w - 32, height: 16, rotation: 0, zIndex: z++, fontFamily: "JetBrains Mono", fontSize: 9, fontWeight: 400, color: "#555555", textAlign: "left", lineHeight: 1.2, isDynamic: true, fieldKey: "signatureDate" });
  } else if (choices.footer === "qr") {
    elements.push({ id: "footer_qr", type: "qrcode", content: "", x: 16, y: footerY, width: 30, height: 30, rotation: 0, zIndex: z++, fontFamily: "", fontSize: 0, fontWeight: 400, color: "#000000", textAlign: "left", lineHeight: 1, isDynamic: true, fieldKey: "reviewQrUrl" });
    elements.push({ id: "footer_qr_label", type: "text", content: "Scan to leave a review", x: 52, y: footerY + 8, width: p.w - 68, height: 16, rotation: 0, zIndex: z++, fontFamily: "JetBrains Mono", fontSize: 8, fontWeight: 400, color: "#555555", textAlign: "left", lineHeight: 1.2, isDynamic: false, fieldKey: "" });
  } else if (choices.footer === "stamp") {
    elements.push({ id: "footer_note", type: "text", content: "Thank you for your business", x: 16, y: footerY + 8, width: p.w * 0.5, height: 16, rotation: 0, zIndex: z++, fontFamily: "JetBrains Mono", fontSize: 9, fontWeight: 400, color: "#000000", textAlign: "left", lineHeight: 1.2, isDynamic: false, fieldKey: "" });
    elements.push({ id: "footer_stamp", type: "shape", content: "circle-stamp:PAID", x: p.w - 76, y: footerY - 4, width: 56, height: 56, rotation: -12, zIndex: z++, fontFamily: "JetBrains Mono", fontSize: 9, fontWeight: 700, color: RED, textAlign: "center", lineHeight: 1, isDynamic: true, fieldKey: "paymentStatus" });
  } else if (choices.footer === "policy-block") {
    elements.push({ id: "footer_policy_box", type: "shape", content: "border", x: 16, y: footerY, width: p.w - 32, height: 40, rotation: 0, zIndex: z++, fontFamily: "", fontSize: 0, fontWeight: 400, color: "#999999", textAlign: "left", lineHeight: 1, isDynamic: false, fieldKey: "" });
    elements.push({ id: "footer_policy_text", type: "text", content: "• No refunds after 14 days\n• Exchanges within 30 days", x: 22, y: footerY + 6, width: p.w - 44, height: 30, rotation: 0, zIndex: z++, fontFamily: "JetBrains Mono", fontSize: 8, fontWeight: 400, color: "#555555", textAlign: "left", lineHeight: 1.5, isDynamic: false, fieldKey: "" });
  }

  const contentHeight = footerY + footerH + 16;
  const finalHeight = Math.max(p.h, contentHeight);
  return { width: p.w, height: finalHeight, backgroundColor: "#FFFFFF", elements };
}
