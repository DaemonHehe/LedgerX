// TemplateRenderer: JSON-driven template rendering component
// Renders templates based on the standard schema with dynamic data substitution

import React from 'react';

export default function TemplateRenderer({ template, formData }) {
  if (!template) {
    return null;
  }

  const { width, height, backgroundColor, elements } = template;

  // Get the display content for an element (substituting dynamic data if needed)
  const getElementContent = (element) => {
    if (element.isDynamic && element.fieldKey) {
      const dynamicValue = formData?.[element.fieldKey];
      if (dynamicValue !== undefined && dynamicValue !== null && dynamicValue !== '') {
        return dynamicValue;
      }
      // Return placeholder if no data exists yet
      return element.content || `{{${element.fieldKey}}}`;
    }
    return element.content;
  };

  // Render individual element based on type
  const renderElement = (element) => {
    const content = getElementContent(element);
    const baseStyle = {
      position: 'absolute',
      left: `${element.x}px`,
      top: `${element.y}px`,
      width: `${element.width}px`,
      height: `${element.height}px`,
      transform: `rotate(${element.rotation || 0}deg)`,
      zIndex: element.zIndex || 0,
      fontFamily: element.fontFamily || 'Inter, sans-serif',
      fontSize: `${element.fontSize || 14}px`,
      fontWeight: element.fontWeight || 400,
      color: element.color || '#000000',
      textAlign: element.textAlign || 'left',
      lineHeight: element.lineHeight || 1.4,
      overflow: 'hidden',
    };

    switch (element.type) {
      case 'text':
        return (
          <div
            key={element.id}
            style={{
              ...baseStyle,
              display: 'flex',
              alignItems: 'center',
              justifyContent:
                element.textAlign === 'center'
                  ? 'center'
                  : element.textAlign === 'right'
                    ? 'flex-end'
                    : 'flex-start',
              whiteSpace: 'nowrap',
            }}
          >
            {content}
          </div>
        );

      case 'shape':
        return (
          <div
            key={element.id}
            style={{
              ...baseStyle,
              backgroundColor: element.color || '#000000',
            }}
          />
        );

      case 'barcode':
        // For barcode elements, we'll render a placeholder or the actual barcode
        return (
          <div
            key={element.id}
            style={{
              ...baseStyle,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#ffffff',
            }}
          >
            {content ? (
              <img
                src={content}
                alt="Barcode"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                }}
              />
            ) : (
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  background: 'repeating-linear-gradient(90deg, #000 0px, #000 2px, transparent 2px, transparent 4px)',
                }}
              />
            )}
          </div>
        );

      case 'image':
        return (
          <div
            key={element.id}
            style={{
              ...baseStyle,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {content ? (
              <img
                src={content}
                alt="Element"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                }}
              />
            ) : (
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  backgroundColor: '#f0f0f0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  color: '#999',
                }}
              >
                No Image
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div
      className="template-renderer"
      style={{
        position: 'relative',
        width: `${width}px`,
        height: `${height}px`,
        backgroundColor: backgroundColor || '#ffffff',
        overflow: 'hidden',
      }}
    >
      {elements.map((element) => renderElement(element))}
    </div>
  );
}
