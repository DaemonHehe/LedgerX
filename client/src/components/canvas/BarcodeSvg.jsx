// Thin React wrapper around the shared barcode SVG string builder so it can be
// used directly in JSX. The actual pattern logic lives in lib/barcode.js and is
// reused by the PNG exporter.

import { renderBarcodeSvg } from '../../lib/barcode.js';

export default function BarcodeSvg({ value = '', color = '#151515' }) {
  return (
    <span
      style={{ width: '100%', height: '100%', display: 'block' }}
      dangerouslySetInnerHTML={{ __html: renderBarcodeSvg(value, color) }}
    />
  );
}
