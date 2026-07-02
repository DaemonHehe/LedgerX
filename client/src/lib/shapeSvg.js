// Pure string builders for shape + barcode SVG markup, shared by both the
// React renderer (CanvasElementView / BarcodeSvg) and the JS-DOM PNG exporter
// (slideExport). Keeping the markup in one place guarantees the export matches
// what's shown on the canvas.

export function renderShapeSvg(props) {
  const {
    shape = 'rect',
    fill = '#000000',
    stroke = 'transparent',
    strokeWidth = 0,
    radius = 0,
  } = props;

  const strokeAttr =
    stroke !== 'transparent' ? `stroke="${stroke}" stroke-width="${strokeWidth}"` : '';

  if (shape === 'circle') {
    const r = 50 - strokeWidth / 2;
    return `<svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none"><circle cx="50" cy="50" r="${r}" fill="${fill}" ${strokeAttr}/></svg>`;
  }

  if (shape === 'triangle') {
    return `<svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none"><polygon points="50,2 98,98 2,98" fill="${fill}" ${strokeAttr} stroke-linejoin="round"/></svg>`;
  }

  if (shape === 'line') {
    return `<svg width="100%" height="100%" preserveAspectRatio="none"><line x1="0" y1="50%" x2="100%" y2="50%" stroke="${fill}" stroke-width="${Math.max(strokeWidth, 4)}" stroke-linecap="round"/></svg>`;
  }

  return `<div style="width:100%;height:100%;background:${fill};${stroke !== 'transparent' ? `border:${strokeWidth}px solid ${stroke};` : ''}border-radius:${radius}px;"></div>`;
}
