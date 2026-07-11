// Pure data model for the receipt template editor.
// Factories + constants only — no React, no persistence. Safe to import anywhere.

export const ELEMENT_TYPES = ['text', 'image', 'shape', 'barcode', 'line', 'qr_code', 'table', 'price', 'date', 'logo'];

export const FORM_FIELD_TYPES = [
  'customer_name',
  'customer_address',
  'transaction_date',
  'item_list',
  'subtotal',
  'tax',
  'total',
  'custom_field',
];

// Logical canvas dimensions (px). Canvas renders scaled to fit the viewport,
// but element positions/sizes are stored in this coordinate space.
export const CANVAS_WIDTH = 1280;
export const CANVAS_HEIGHT = 720;

export const DEFAULT_CANVAS_BACKGROUND = '#ffffff';

const uid = (prefix) => `${prefix}_${crypto.randomUUID().slice(0, 8)}`;

// Per-type default sizing for newly created elements.
const sizeDefaults = {
  text: { width: 360, height: 80 },
  image: { width: 280, height: 200 },
  shape: { width: 200, height: 160 },
  barcode: { width: 240, height: 100 },
  line: { width: 400, height: 2 },
  qr_code: { width: 120, height: 120 },
  table: { width: 500, height: 200 },
  price: { width: 150, height: 40 },
  date: { width: 180, height: 35 },
  logo: { width: 150, height: 80 },
};

// Per-type default editable properties. The `props` object shape varies by type;
// components read from it via the element's `type`.
export const defaultProps = {
  text: {
    text: 'Double-click to edit',
    fontSize: 32,
    fontFamily: 'Inter, sans-serif',
    fontWeight: 400,
    color: '#000000',
    textAlign: 'left',
    lineHeight: 1.25,
  },
  image: {
    src: '',
    fit: 'cover',
    radius: 0,
  },
  shape: {
    shape: 'rect', // rect | circle | triangle | line
    fill: '#e0e0e0',
    stroke: '#000000',
    strokeWidth: 1,
    radius: 0,
  },
  barcode: {
    format: 'CODE128',
    value: '000000',
    color: '#000000',
  },
  line: {
    stroke: '#000000',
    strokeWidth: 2,
    strokeStyle: 'solid', // solid | dashed | dotted
  },
  qr_code: {
    value: 'https://example.com',
    size: 120,
    color: '#000000',
    backgroundColor: '#ffffff',
  },
  table: {
    rows: 3,
    columns: 2,
    headerText: 'Header',
    data: [['Item 1', '$10.00'], ['Item 2', '$20.00'], ['Item 3', '$30.00']],
    borderColor: '#000000',
    backgroundColor: '#ffffff',
  },
  price: {
    value: '0.00',
    currency: '$',
    fontSize: 24,
    fontWeight: 700,
    color: '#000000',
  },
  date: {
    value: new Date().toISOString().split('T')[0],
    format: 'YYYY-MM-DD',
    fontSize: 16,
    fontWeight: 400,
    color: '#000000',
  },
  logo: {
    src: '',
    width: 150,
    height: 80,
    fit: 'contain',
  },
};

export function createElement(type, partial = {}) {
  if (!ELEMENT_TYPES.includes(type)) {
    throw new Error(`Unknown element type: ${type}`);
  }

  const { props = {}, ...rest } = partial;
  const size = sizeDefaults[type];

  return {
    id: rest.id || uid('el'),
    type,
    x: 120,
    y: 120,
    width: size.width,
    height: size.height,
    rotation: 0,
    zIndex: 1,
    isDynamic: false,
    formFieldType: null,
    placeholderText: null,
    ...rest,
    props: { ...defaultProps[type], ...props },
  };
}

export function createTemplate(partial = {}) {
  const { elements = [], ...rest } = partial;
  return {
    title: 'Untitled template',
    background: DEFAULT_CANVAS_BACKGROUND,
    width: CANVAS_WIDTH,
    height: CANVAS_HEIGHT,
    ...rest,
    elements: elements.map((element) =>
      element.type ? normalizeElement(element) : element,
    ),
  };
}

export function normalizeElement(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const typeDefaults = defaultProps[raw.type] || {};

  return {
    id: raw.id || uid('el'),
    type: raw.type,
    x: Number(raw.x) || 0,
    y: Number(raw.y) || 0,
    width: Number(raw.width) || 100,
    height: Number(raw.height) || 100,
    rotation: Number(raw.rotation) || 0,
    zIndex: Number(raw.zIndex) || 1,
    isDynamic: Boolean(raw.isDynamic),
    formFieldType: raw.formFieldType || null,
    placeholderText: raw.placeholderText || null,
    props: { ...typeDefaults, ...(raw.props || {}) },
  };
}

export function normalizeTemplate(raw) {
  if (!raw || typeof raw !== 'object') return null;

  return {
    id: raw.id,
    title: raw.title || 'Untitled template',
    background: raw.background || DEFAULT_CANVAS_BACKGROUND,
    width: Number(raw.width) || CANVAS_WIDTH,
    height: Number(raw.height) || CANVAS_HEIGHT,
    elements: Array.isArray(raw.elements)
      ? raw.elements.map(normalizeElement).filter(Boolean)
      : [],
  };
}

// Legacy deck support (for DeckEditor compatibility)
export function createDeck(partial = {}) {
  const { slides = [], ...rest } = partial;
  return {
    title: 'Untitled deck',
    ...rest,
    slides: slides.map((slide) =>
      slide.elements ? normalizeSlide(slide) : slide,
    ),
  };
}

export function createSlide(partial = {}) {
  const { elements = [], ...rest } = partial;
  return {
    background: DEFAULT_CANVAS_BACKGROUND,
    width: CANVAS_WIDTH,
    height: CANVAS_HEIGHT,
    ...rest,
    elements: elements.map((element) =>
      element.type ? normalizeElement(element) : element,
    ),
  };
}

export function normalizeSlide(raw) {
  if (!raw || typeof raw !== 'object') return null;

  return {
    id: raw.id,
    background: raw.background || DEFAULT_CANVAS_BACKGROUND,
    width: Number(raw.width) || CANVAS_WIDTH,
    height: Number(raw.height) || CANVAS_HEIGHT,
    elements: Array.isArray(raw.elements)
      ? raw.elements.map(normalizeElement).filter(Boolean)
      : [],
  };
}

export function normalizeDeck(raw) {
  if (!raw || typeof raw !== 'object') return null;

  return {
    id: raw.id,
    title: raw.title || 'Untitled deck',
    slides: Array.isArray(raw.slides)
      ? raw.slides.map(normalizeSlide).filter(Boolean)
      : [],
  };
}
