// Pure visual renderer for a single element. Has no Moveable/selection logic —
// it just paints the element into whatever container positions/sizes it.
// Used both inside the live canvas (wrapped by Moveable) and during PNG export.
// Shape + barcode markup come from the shared lib builders so the export path
// renders identically to the live canvas.

import { useEffect, useState } from 'react';
import { renderShapeSvg } from '../../lib/shapeSvg.js';
import BarcodeSvg from './BarcodeSvg.jsx';
import { QRCodeSVG } from 'qrcode.react';

function ShapeBody({ props }) {
  return (
    <span
      style={{ width: '100%', height: '100%', display: 'block' }}
      dangerouslySetInnerHTML={{ __html: renderShapeSvg(props) }}
    />
  );
}

export default function CanvasElementView({ element, isEditing, onTextSave }) {
  const { type, props } = element;

  if (type === 'text') {
    const [draft, setDraft] = useState(props.text);

    useEffect(() => {
      setDraft(props.text);
    }, [props.text]);

    if (isEditing) {
      return (
        <textarea
          autoFocus
          className="canvas-text-editor"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={() => onTextSave(element.id, draft)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault();
              event.currentTarget.blur();
            }
            if (event.key === 'Escape') {
              event.currentTarget.blur();
            }
          }}
          style={{
            width: '100%',
            height: '100%',
            fontSize: `${props.fontSize}px`,
            fontFamily: props.fontFamily,
            fontWeight: props.fontWeight,
            color: props.color,
            textAlign: props.textAlign,
            lineHeight: props.lineHeight,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            border: '1px solid rgba(0,0,0,0.12)',
            background: 'rgba(255,255,255,0.92)',
            padding: '0.35rem',
            boxSizing: 'border-box',
            resize: 'none',
            outline: 'none',
          }}
        />
      );
    }

    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'flex-start',
          overflow: 'hidden',
          fontSize: `${props.fontSize}px`,
          fontFamily: props.fontFamily,
          fontWeight: props.fontWeight,
          color: props.color,
          textAlign: props.textAlign,
          lineHeight: props.lineHeight,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}
      >
        <span style={{ width: '100%' }}>{props.text}</span>
      </div>
    );
  }

  if (type === 'image') {
    if (!props.src) {
      return (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'grid',
            placeItems: 'center',
            background: '#efe6d4',
            border: '2px dashed #c9b997',
            color: '#9a8a6a',
            fontFamily: 'IBM Plex Mono, monospace',
            fontSize: '14px',
            borderRadius: `${props.radius}px`,
          }}
        >
          image
        </div>
      );
    }
    return (
      <img
        src={props.src}
        alt=""
        crossOrigin="anonymous"
        style={{
          width: '100%',
          height: '100%',
          objectFit: props.fit,
          borderRadius: `${props.radius}px`,
          display: 'block',
        }}
      />
    );
  }

  if (type === 'shape') {
    return <ShapeBody shape={props.shape} props={props} />;
  }

  if (type === 'barcode') {
    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '4px 8px',
        }}
      >
        <BarcodeSvg value={props.value} color={props.color} />
      </div>
    );
  }

  if (type === 'line') {
    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <div
          style={{
            width: '100%',
            height: `${props.strokeWidth}px`,
            backgroundColor: props.stroke,
            borderStyle: props.strokeStyle,
          }}
        />
      </div>
    );
  }

  if (type === 'qr_code') {
    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: props.backgroundColor,
        }}
      >
        <QRCodeSVG
          value={props.value}
          size={Math.min(element.width, element.height)}
          fgColor={props.color}
          bgColor={props.backgroundColor}
        />
      </div>
    );
  }

  if (type === 'table') {
    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          overflow: 'auto',
          border: `1px solid ${props.borderColor}`,
          backgroundColor: props.backgroundColor,
          fontSize: '14px',
          fontFamily: 'Inter, sans-serif',
        }}
      >
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
          }}
        >
          <thead>
            <tr
              style={{
                borderBottom: `1px solid ${props.borderColor}`,
                backgroundColor: '#f5f5f5',
              }}
            >
              {Array.from({ length: props.columns }).map((_, i) => (
                <th
                  key={i}
                  style={{
                    padding: '8px',
                    textAlign: 'left',
                    fontWeight: '600',
                    fontSize: '12px',
                  }}
                >
                  {props.headerText} {i + 1}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {props.data.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                style={{
                  borderBottom: rowIndex < props.data.length - 1 ? `1px solid ${props.borderColor}` : 'none',
                }}
              >
                {row.map((cell, cellIndex) => (
                  <td
                    key={cellIndex}
                    style={{
                      padding: '8px',
                      fontSize: '12px',
                    }}
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (type === 'price') {
    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          fontSize: `${props.fontSize}px`,
          fontWeight: props.fontWeight,
          color: props.color,
          fontFamily: 'Inter, sans-serif',
        }}
      >
        {props.currency}{props.value}
      </div>
    );
  }

  if (type === 'date') {
    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          fontSize: `${props.fontSize}px`,
          fontWeight: props.fontWeight,
          color: props.color,
          fontFamily: 'Inter, sans-serif',
        }}
      >
        {props.value}
      </div>
    );
  }

  if (type === 'logo') {
    if (!props.src) {
      return (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'grid',
            placeItems: 'center',
            background: '#efe6d4',
            border: '2px dashed #c9b997',
            color: '#9a8a6a',
            fontFamily: 'IBM Plex Mono, monospace',
            fontSize: '14px',
          }}
        >
          logo
        </div>
      );
    }
    return (
      <img
        src={props.src}
        alt="Logo"
        crossOrigin="anonymous"
        style={{
          width: props.width,
          height: props.height,
          objectFit: props.fit,
          display: 'block',
        }}
      />
    );
  }

  return null;
}
