import React from 'react';

export default function TemplateRenderer({ template, formData }) {
  if (!template) {
    return null;
  }

  const { width, height, backgroundColor, elements } = template;

  // Guaranteed gap between the last data/header row and the Total row.
  // This is a rendering constant — never derived from schema placeholders.
  const SECTION_GAP = 16;

  // Row height is ALWAYS computed from font metrics, never from element.height
  // (which is a design-time placeholder for the Wizard's layout pass).
  const getRowHeight = (element) => {
    if (element.tableStyle === 'compact-list') {
      return Math.max((element.fontSize || 14) * (element.lineHeight || 1.4), 18);
    }
    return Math.max((element.fontSize || 14) * (element.lineHeight || 1.4), 22);
  };

  const getTableExtraHeights = () =>
    elements
      .filter((el) => el.type === 'table')
      .map((table) => {
        const rows = Array.isArray(formData?.[table.fieldKey]) ? formData[table.fieldKey] : [];
        const columns = table.columns || table.props?.columns || [];
        const totalStyle = table.totalStyle || table.props?.totalStyle || 'none';
        const showTotal = totalStyle !== 'none' && (table.showTotal !== undefined ? table.showTotal : (table.props?.showTotal !== undefined ? table.props.showTotal : false));
        const rowHeight = getRowHeight(table);
        const showSubtotalRow = table.showSubtotal !== undefined ? table.showSubtotal : (table.props?.showSubtotal !== undefined ? table.props.showSubtotal : false);
        const showDiscountRow = (table.discount || table.props?.discount) > 0;
        const showTaxRow = (table.taxRate || table.props?.taxRate) > 0;
        const extraRows = (showSubtotalRow ? 1 : 0) + (showDiscountRow ? 1 : 0) + (showTaxRow ? 1 : 0);

        const headerRows = columns.length > 0 ? 1 : 0;
        const dataRows = Math.max(rows.length, 1);
        const totalRows = showTotal ? 1 : 0;
        const sectionGap = (showTotal || extraRows > 0) ? SECTION_GAP : 0;
        const actualContentHeight = (headerRows + dataRows) * rowHeight + sectionGap + (extraRows + totalRows) * rowHeight;
        const extraHeight = actualContentHeight - table.height;
        return { table, extraHeight, y: table.y };
      });

  const getYAdjustment = (elementY, tableExtras) =>
    tableExtras.reduce(
      (adjustment, { y, extraHeight }) =>
        elementY > y ? adjustment + extraHeight : adjustment,
      0
    );

  const tableExtras = getTableExtraHeights();
  const totalExtraHeight = tableExtras.reduce((sum, { extraHeight }) => sum + extraHeight, 0);

  const getAdjustedY = (element) => element.y + getYAdjustment(element.y, tableExtras);

  const computeCanvasHeight = () => {
    let maxBottom = 0;
    elements.forEach((element) => {
      const adjustedY = getAdjustedY(element);
      if (element.type === 'table') {
        const rows = Array.isArray(formData?.[element.fieldKey])
          ? formData[element.fieldKey]
          : [];
        const columns = element.columns || element.props?.columns || [];
        const totalStyle = element.totalStyle || element.props?.totalStyle || 'none';
        const showTotal = totalStyle !== 'none' && (element.showTotal !== undefined ? element.showTotal : (element.props?.showTotal !== undefined ? element.props.showTotal : false));
        const showSubtotalRow = element.showSubtotal !== undefined ? element.showSubtotal : (element.props?.showSubtotal !== undefined ? element.props.showSubtotal : false);
        const showDiscountRow = (element.discount || element.props?.discount) > 0;
        const showTaxRow = (element.taxRate || element.props?.taxRate) > 0;
        const extraRows = (showSubtotalRow ? 1 : 0) + (showDiscountRow ? 1 : 0) + (showTaxRow ? 1 : 0);

        const rowHeight = getRowHeight(element);
        const headerRows = columns.length > 0 ? 1 : 0;
        const dataRows = Math.max(rows.length, 1);
        const totalRows = showTotal ? 1 : 0;
        const sectionGap = (showTotal || extraRows > 0) ? SECTION_GAP : 0;
        const actualContentHeight = (headerRows + dataRows) * rowHeight + sectionGap + (extraRows + totalRows) * rowHeight;
        maxBottom = Math.max(maxBottom, adjustedY + actualContentHeight);
      } else {
        maxBottom = Math.max(maxBottom, adjustedY + element.height);
      }
    });
    return maxBottom + 16;
  };

  const canvasHeight = computeCanvasHeight();

  const cleanZeroDecimals = (val) => {
    if (val === undefined || val === null) return '';
    return String(val).replace(/(\d+)\.00\b/g, '$1');
  };

  const getElementContent = (element) => {
    if (element.isDynamic && element.fieldKey) {
      const dynamicValue = formData?.[element.fieldKey];
      if (dynamicValue !== undefined && dynamicValue !== null && dynamicValue !== '') {
        return cleanZeroDecimals(dynamicValue);
      }
      return cleanZeroDecimals(element.content || `{{${element.fieldKey}}}`);
    }
    return cleanZeroDecimals(element.content);
  };

  const renderElement = (element) => {
    const content = getElementContent(element);
    const adjustedY = getAdjustedY(element);
    const baseStyle = {
      position: 'absolute',
      left: `${element.x}px`,
      top: `${adjustedY}px`,
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
      letterSpacing: element.letterSpacing ? `${element.letterSpacing}px` : 'normal',
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

      case 'shape': {
        const shapeType = element.shapeType || element.content || 'line';
        const RED = '#FF3355';
        if (shapeType.startsWith('circle-stamp')) {
          const stampText = getElementContent(element) || (shapeType.includes(':') ? shapeType.split(':')[1] : 'PAID');
          return (
            <div
              key={element.id}
              style={{
                ...baseStyle,
                borderRadius: '50%',
                border: `2px solid ${element.color || RED}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'transparent',
                overflow: 'visible',
              }}
            >
              <span
                style={{
                  color: element.color || RED,
                  fontFamily: element.fontFamily || 'JetBrains Mono',
                  fontSize: `${element.fontSize || 12}px`,
                  fontWeight: element.fontWeight || 700,
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                }}
              >
                {stampText}
              </span>
            </div>
          );
        } else if (shapeType === 'border') {
          return (
            <div
              key={element.id}
              style={{
                ...baseStyle,
                backgroundColor: 'transparent',
                border: `1px solid ${element.color || '#999999'}`,
              }}
            />
          );
        } else {
          return (
            <div
              key={element.id}
              style={{
                ...baseStyle,
                backgroundColor: element.color || '#000000',
                height: `${element.height || 1}px`,
              }}
            />
          );
        }
      }

      case 'barcode':
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

      case 'image': {
        const borderRadius = element.shape === 'circle' ? '50%' : '0';
        return (
          <div
            key={element.id}
            style={{
              ...baseStyle,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius,
              overflow: 'hidden',
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
                  borderRadius,
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
                  borderRadius,
                }}
              >
                No Image
              </div>
            )}
          </div>
        );
      }

      case 'qrcode':
        return (
          <div
            key={element.id}
            style={{
              ...baseStyle,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#ffffff',
              padding: '2px',
            }}
          >
            {content ? (
              <img
                src={content}
                alt="QR Code"
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
                  display: 'grid',
                  gridTemplateColumns: 'repeat(6, 1fr)',
                  gap: '1px',
                  backgroundColor: '#ffffff',
                }}
              >
                {Array.from({ length: 36 }).map((_, i) => {
                  const isCorner =
                    (i % 6 < 2 && Math.floor(i / 6) < 2) ||
                    (i % 6 >= 4 && Math.floor(i / 6) < 2) ||
                    (i % 6 < 2 && Math.floor(i / 6) >= 4);
                  const isFilled = isCorner || (i * 7) % 3 === 0;
                  return (
                    <div
                      key={i}
                      style={{
                        backgroundColor: isFilled ? '#000000' : 'transparent',
                      }}
                    />
                  );
                })}
              </div>
            )}
          </div>
        );

      case 'table': {
        const rows = Array.isArray(formData?.[element.fieldKey])
          ? formData[element.fieldKey]
          : [];
        const columns = element.columns || element.props?.columns || [];
        const rowHeight = getRowHeight(element);
        const tableStyle = element.tableStyle || element.props?.tableStyle;
        const totalStyle = element.totalStyle || element.props?.totalStyle || 'none';
        const showTotal = totalStyle !== 'none' && (element.showTotal !== undefined ? element.showTotal : (element.props?.showTotal !== undefined ? element.props.showTotal : false));
        const RED = '#FF3355';

        // Compute Values
        const computedSubtotal = rows.reduce((sum, r) => {
          const qty = parseFloat(r.qty ?? r.quantity ?? 1);
          const price = parseFloat(r.price ?? r.unitPrice ?? r.unit_price ?? 0);
          return sum + (isNaN(qty) || isNaN(price) ? 0 : qty * price);
        }, 0);

        const taxRate = parseFloat(element.taxRate || element.props?.taxRate || 0);
        const discountVal = parseFloat(element.discount || element.props?.discount || 0);
        const showSubtotalRow = element.showSubtotal !== undefined ? element.showSubtotal : (element.props?.showSubtotal !== undefined ? element.props.showSubtotal : false);
        const showDiscountRow = discountVal > 0;
        const showTaxRow = taxRate > 0;

        const subtotalStr = formData?.['subtotalAmount'] || `$${computedSubtotal.toFixed(2)}`;
        const taxable = Math.max(0, computedSubtotal - discountVal);
        const taxVal = (taxable * taxRate) / 100;
        
        const discountStr = formData?.['discountAmount'] || `-$${discountVal.toFixed(2)}`;
        const taxStr = formData?.['taxAmount'] || `$${taxVal.toFixed(2)}`;
        
        const totalFieldKey = element.totalFieldKey || element.props?.totalFieldKey || 'totalAmount';
        let totalAmountVal = formData?.[totalFieldKey];
        if (totalAmountVal === undefined || totalAmountVal === null || totalAmountVal === '') {
          totalAmountVal = formData?.['total_amount'];
        }
        if (totalAmountVal === undefined || totalAmountVal === null || totalAmountVal === '') {
          totalAmountVal = `$${(taxable + taxVal).toFixed(2)}`;
        } else {
          if (typeof totalAmountVal === 'number') {
            totalAmountVal = `$${totalAmountVal.toFixed(2)}`;
          } else if (typeof totalAmountVal === 'string' && !totalAmountVal.startsWith('$')) {
            const num = parseFloat(totalAmountVal);
            if (!isNaN(num)) {
              totalAmountVal = `$${num.toFixed(2)}`;
            }
          }
        }
        totalAmountVal = cleanZeroDecimals(totalAmountVal);

        // Styling helper variables
        let totalRowStyle = {};
        let totalCellSpecificStyle = (colIdx) => ({});

        if (totalStyle === 'grid') {
          totalRowStyle = {
            borderTop: `2px solid ${RED}`,
            borderBottom: `2px solid ${RED}`,
            borderLeft: `1px solid ${RED}`,
            borderRight: `1px solid ${RED}`,
            color: RED,
          };
          totalCellSpecificStyle = (colIdx) => ({
            borderLeft: colIdx > 0 ? `1px solid ${RED}` : 'none',
          });
        } else if (totalStyle === 'minimal') {
          totalRowStyle = {
            borderTop: `1.5px solid ${RED}`,
          };
        } else if (totalStyle === 'zebra') {
          totalRowStyle = {
            backgroundColor: '#333333',
            color: '#ffffff',
          };
        } else if (totalStyle === 'compact-list') {
          totalRowStyle = {
            marginTop: '4px',
          };
        } else if (totalStyle === 'ledger-double' || totalStyle === 'double-rule') {
          totalRowStyle = {
            borderBottom: '3px double #999999',
          };
        } else if (totalStyle === 'boxed-total') {
          totalRowStyle = {
            backgroundColor: 'rgba(255, 51, 85, 0.12)',
            border: `1px solid ${RED}`,
            color: RED,
          };
          totalCellSpecificStyle = (colIdx) => ({
            borderLeft: colIdx > 0 ? `1px solid ${RED}` : 'none',
          });
        }

        return (
          <div
            key={element.id}
            style={{
              position: 'absolute',
              left: `${element.x}px`,
              top: `${adjustedY}px`,
              width: `${element.width}px`,
              transform: `rotate(${element.rotation || 0}deg)`,
              zIndex: element.zIndex || 0,
              fontFamily: element.fontFamily || 'Inter, sans-serif',
              fontSize: `${element.fontSize || 14}px`,
              fontWeight: element.fontWeight || 400,
              color: element.color || '#000000',
              lineHeight: element.lineHeight || 1.4,
              overflow: 'visible',
            }}
          >
            {/* Header Row */}
            {columns.length > 0 && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  height: `${rowHeight}px`,
                  width: '100%',
                  fontWeight: 700,
                  ...(tableStyle === 'grid' || tableStyle === 'boxed-total' ? {
                    borderLeft: '1px solid #000000',
                    borderRight: '1px solid #000000',
                    borderTop: '1px solid #000000',
                    borderBottom: '1px solid #000000',
                    backgroundColor: '#f5f5f5',
                  } : {}),
                  ...(tableStyle === 'minimal' ? {
                    borderBottom: `1.5px solid ${RED}`,
                  } : {}),
                  ...(tableStyle === 'ledger-double' ? {
                    borderTop: '3px double #999999',
                    borderBottom: '1px solid #000000',
                  } : {}),
                }}
              >
                {columns.map((col, colIndex) => (
                  <div
                    key={col.key}
                    style={{
                      width: `${col.width}%`,
                      flexShrink: 0,
                      textAlign: col.textAlign || element.textAlign || 'left',
                      overflow: 'hidden',
                      whiteSpace: 'nowrap',
                      textOverflow: 'ellipsis',
                      padding: '2px 4px',
                      ...( (tableStyle === 'grid' || tableStyle === 'boxed-total') && colIndex > 0 ? {
                        borderLeft: '1px solid #000000',
                      } : {}),
                    }}
                  >
                    {col.label}
                  </div>
                ))}
              </div>
            )}
            {/* Data Rows */}
            {rows.length === 0 ? (
              <div
                style={{
                  height: `${rowHeight}px`,
                  display: 'flex',
                  alignItems: 'center',
                  color: '#999',
                  fontStyle: 'italic',
                  padding: '2px 4px',
                  ...(tableStyle === 'grid' || tableStyle === 'boxed-total' ? {
                    borderLeft: '1px solid #000000',
                    borderRight: '1px solid #000000',
                    borderBottom: '1px solid #000000',
                  } : {}),
                }}
              >
                {element.content || `{{${element.fieldKey}}}`}
              </div>
            ) : (
              rows.map((row, rowIndex) => (
                <div
                  key={rowIndex}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    height: `${rowHeight}px`,
                    width: '100%',
                    ...(tableStyle === 'grid' || tableStyle === 'boxed-total' ? {
                      borderLeft: '1px solid #000000',
                      borderRight: '1px solid #000000',
                      borderBottom: '1px solid #000000',
                    } : {}),
                    ...(tableStyle === 'minimal' ? {
                      borderBottom: '0.5px solid #999999',
                    } : {}),
                    ...(tableStyle === 'zebra' && rowIndex % 2 === 0 ? {
                      backgroundColor: '#f5f5f5',
                    } : {}),
                    ...(tableStyle === 'compact-list' ? {
                      height: `${rowHeight - 2}px`,
                    } : {}),
                    ...(tableStyle === 'ledger-double' && columns.length === 0 && rowIndex === 0 ? {
                      borderTop: '3px double #999999',
                    } : {}),
                  }}
                >
                  {columns.map((col, colIndex) => {
                    let cellContent = row[col.key] ?? '';
                    if (col.key === 'no') {
                      cellContent = String(rowIndex + 1).padStart(2, '0');
                    } else if (col.key === 'price') {
                      const priceNum = parseFloat(row.price) || 0;
                      cellContent = cleanZeroDecimals(priceNum.toFixed(2));
                    } else if (col.key === 'amount') {
                      const qty = parseFloat(row.qty) || 0;
                      const price = parseFloat(row.price) || 0;
                      cellContent = cleanZeroDecimals((qty * price).toFixed(2));
                    } else {
                      cellContent = cleanZeroDecimals(cellContent);
                    }

                    return (
                      <div
                        key={col.key}
                        style={{
                          width: `${col.width}%`,
                          flexShrink: 0,
                          textAlign: col.textAlign || element.textAlign || 'left',
                          overflow: 'hidden',
                          whiteSpace: 'nowrap',
                          textOverflow: 'ellipsis',
                          padding: '2px 4px',
                          ...( (tableStyle === 'grid' || tableStyle === 'boxed-total') && colIndex > 0 ? {
                            borderLeft: '1px solid #000000',
                          } : {}),
                        }}
                      >
                        {cellContent}
                      </div>
                    );
                  })}
                </div>
              ))
            )}
            {/* Additional Rows (Subtotal, Discount, Tax) */}
            {(showSubtotalRow || showDiscountRow || showTaxRow) && (
              <div style={{ marginTop: `${SECTION_GAP}px`, display: 'flex', flexDirection: 'column' }}>
                {showSubtotalRow && (
                  <div style={{ display: 'flex', height: `${rowHeight}px`, alignItems: 'center' }}>
                    <div style={{ flex: 1 }} />
                    <div style={{ width: '40%', display: 'flex', justifyContent: 'space-between', padding: '0 4px', fontSize: '0.9em' }}>
                      <span>Subtotal</span>
                      <span>{cleanZeroDecimals(subtotalStr)}</span>
                    </div>
                  </div>
                )}
                {showDiscountRow && (
                  <div style={{ display: 'flex', height: `${rowHeight}px`, alignItems: 'center' }}>
                    <div style={{ flex: 1 }} />
                    <div style={{ width: '40%', display: 'flex', justifyContent: 'space-between', padding: '0 4px', fontSize: '0.9em' }}>
                      <span>Discount</span>
                      <span>{cleanZeroDecimals(discountStr)}</span>
                    </div>
                  </div>
                )}
                {showTaxRow && (
                  <div style={{ display: 'flex', height: `${rowHeight}px`, alignItems: 'center' }}>
                    <div style={{ flex: 1 }} />
                    <div style={{ width: '40%', display: 'flex', justifyContent: 'space-between', padding: '0 4px', fontSize: '0.9em' }}>
                      <span>Tax ({taxRate}%)</span>
                      <span>{cleanZeroDecimals(taxStr)}</span>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {/* Total Row */}
            {showTotal && (
              columns.length > 0 ? (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    height: `${rowHeight}px`,
                    width: '100%',
                    fontWeight: 700,
                    marginTop: (showSubtotalRow || showDiscountRow || showTaxRow) ? '0' : `${SECTION_GAP}px`,
                    ...totalRowStyle,
                  }}
                >
                  <div
                    style={{
                      width: `${columns.slice(0, -1).reduce((sum, col) => sum + (col.width || 0), 0)}%`,
                      flexShrink: 0,
                      textAlign: 'right',
                      overflow: 'hidden',
                      whiteSpace: 'nowrap',
                      textOverflow: 'ellipsis',
                      padding: '2px 8px',
                    }}
                  >
                    TOTAL
                  </div>
                  <div
                    style={{
                      width: `${columns[columns.length - 1].width}%`,
                      flexShrink: 0,
                      textAlign: columns[columns.length - 1].textAlign || element.textAlign || 'left',
                      overflow: 'hidden',
                      whiteSpace: 'nowrap',
                      textOverflow: 'ellipsis',
                      padding: '2px 4px',
                      ...totalCellSpecificStyle(columns.length - 1),
                    }}
                  >
                    {totalAmountVal}
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    height: `${rowHeight}px`,
                    width: '100%',
                    fontWeight: 700,
                    padding: '2px 4px',
                    marginTop: (showSubtotalRow || showDiscountRow || showTaxRow) ? '0' : `${SECTION_GAP}px`,
                    ...totalRowStyle,
                  }}
                >
                  <span>TOTAL</span>
                  <span>{totalAmountVal}</span>
                </div>
              )
            )}
          </div>
        );
      }

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
        height: `${canvasHeight}px`,
        backgroundColor: backgroundColor || '#ffffff',
        overflow: 'hidden',
      }}
    >
      {elements.map((element) => renderElement(element))}
    </div>
  );
}
