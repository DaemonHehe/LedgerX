// PNG export of a slide at full logical resolution (1280×720).
// The on-screen canvas is scaled to fit the viewport, so rather than capture the
// live surface we build a temporary, full-size, non-interactive copy off-screen
// using plain DOM (mirroring CanvasElementView's styles), snapshot it with
// html2canvas, and tear it down. This guarantees a crisp, consistent export
// regardless of zoom/window size, and keeps this module JSX-free.

import html2canvas from 'html2canvas';
import { renderShapeSvg } from './shapeSvg.js';

const px = (n) => `${n}px`;

function applyCommon(el, style) {
  Object.entries(style).forEach(([key, value]) => {
    el.style[key] = value;
  });
}

function buildElementNode(element) {
  const node = document.createElement('div');
  applyCommon(node, {
    position: 'absolute',
    left: '0',
    top: '0',
    width: px(element.width),
    height: px(element.height),
    transform: `translate(${element.x}px, ${element.y}px) rotate(${element.rotation || 0}deg)`,
  });

  const { type, props } = element;
  let body;

  if (type === 'text') {
    body = document.createElement('div');
    applyCommon(body, {
      width: '100%',
      height: '100%',
      display: 'flex',
      alignItems: 'flex-start',
      overflow: 'hidden',
      fontSize: px(props.fontSize),
      fontFamily: props.fontFamily,
      fontWeight: String(props.fontWeight),
      color: props.color,
      textAlign: props.textAlign,
      lineHeight: String(props.lineHeight),
      whiteSpace: 'pre-wrap',
      wordBreak: 'break-word',
    });
    body.textContent = props.text;
  } else if (type === 'image') {
    if (!props.src) {
      body = document.createElement('div');
      applyCommon(body, {
        width: '100%',
        height: '100%',
        background: '#efe6d4',
        border: '2px dashed #c9b997',
        borderRadius: px(props.radius),
      });
    } else {
      body = document.createElement('img');
      body.setAttribute('src', props.src);
      body.setAttribute('crossorigin', 'anonymous');
      applyCommon(body, {
        width: '100%',
        height: '100%',
        objectFit: props.fit,
        borderRadius: px(props.radius),
        display: 'block',
      });
    }
  } else if (type === 'shape') {
    body = document.createElement('div');
    body.style.width = '100%';
    body.style.height = '100%';
    body.innerHTML = renderShapeSvg(props);
  } else if (type === 'barcode') {
    body = document.createElement('div');
    applyCommon(body, {
      width: '100%',
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '4px 8px',
    });
    body.innerHTML = renderBarcodeSvg(props.value, props.color);
  }

  if (body) node.appendChild(body);
  return node;
}

/**
 * Render `slide` to a PNG and trigger a download.
 * Returns a promise that resolves once the file download has started.
 */
export async function exportSlidePng(slide, filename = 'slide.png') {
  const host = document.createElement('div');
  const slideWidth = slide.width || 1280;
  const slideHeight = slide.height || 720;

  // Position fully off-screen but laid out (not display:none, which breaks
  // html2canvas measurements).
  host.style.cssText =
    `position:fixed;left:-99999px;top:0;width:${slideWidth}px;height:${slideHeight}px;z-index:-1;`;

  const surface = document.createElement('div');
  applyCommon(surface, {
    width: px(slideWidth),
    height: px(slideHeight),
    background: slide.background,
    position: 'relative',
    overflow: 'hidden',
  });

  slide.elements.forEach((element) => {
    surface.appendChild(buildElementNode(element));
  });

  host.appendChild(surface);
  document.body.appendChild(host);

  // Wait two frames so the off-screen tree is committed & painted.
  await new Promise((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(resolve)),
  );

  try {
    const canvas = await html2canvas(surface, {
      backgroundColor: slide.background,
      scale: 2,
      useCORS: true,
      width: slideWidth,
      height: slideHeight,
      windowWidth: slideWidth,
      windowHeight: slideHeight,
    });

    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = filename;
    link.click();
  } finally {
    host.remove();
  }
}
