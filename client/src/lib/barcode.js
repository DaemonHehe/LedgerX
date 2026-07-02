// Deterministic pseudo-CODE128 barcode → SVG string, shared by the React
// BarcodeSvg component and the JS-DOM PNG exporter. Bars are derived from the
// value's char codes so output is stable across renders (important for export).
// This is a visual approximation for design mockups, not real scanning.

const START_END = [1, 2, 1, 2, 1, 2]; // thin-wide-thin guard bars

function patternFor(value) {
  const bars = [...START_END];

  const src = String(value || '0');
  for (let i = 0; i < src.length; i += 1) {
    const code = src.charCodeAt(i);
    bars.push(
      (code % 3) + 1,
      ((code >> 2) % 3) + 1,
      ((code >> 4) % 3) + 1,
    );
  }

  bars.push(...START_END);
  return bars;
}

export function renderBarcodeSvg(value = '', color = '#151515') {
  const bars = patternFor(value);
  const total = bars.reduce((sum, w) => sum + w, 0) || START_END.length;

  let x = 0;
  const rects = bars
    .map((width, index) => {
      if (index % 2 !== 0) {
        x += width;
        return '';
      }
      const rect = `<rect x="${x}" y="0" width="${width}" height="96" fill="${color}"/>`;
      x += width;
      return rect;
    })
    .join('');

  return `<svg viewBox="0 0 ${total} 96" preserveAspectRatio="none" width="100%" height="100%" style="display:block" shapeRendering="crispEdges">${rects}</svg>`;
}
