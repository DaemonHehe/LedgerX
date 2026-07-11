// Standard Template Schema for LedgerX JSON-driven UI pipeline
// This schema defines the standard structure for all templates

/**
 * Standard Template Schema
 * {
 *   width: number,           // Canvas width in pixels
 *   height: number,          // Canvas height in pixels
 *   backgroundColor: string, // Canvas background color (hex or CSS color)
 *   elements: Array<Element>
 * }
 */

/**
 * Element Schema
 * {
 *   id: string,              // Unique identifier for the element
 *   type: 'text' | 'shape' | 'barcode' | 'image' | 'table' | 'qrcode', // Element type
 *   content: string,         // Text content or URL (for images)
 *   x: number,               // X position in pixels
 *   y: number,               // Y position in pixels
 *   width: number,           // Width in pixels
 *   height: number,          // Height in pixels
 *   rotation: number,        // Rotation in degrees (default: 0)
 *   zIndex: number,          // Stacking order
 *   fontFamily: string,      // Font family
 *   fontSize: number,        // Font size in pixels
 *   fontWeight: number,      // Font weight (100-900)
 *   color: string,           // Text/fill color (hex or CSS color)
 *   textAlign: string,       // Text alignment (left, center, right)
 *   lineHeight: number,      // Line height multiplier
 *   isDynamic: boolean,      // Whether this element contains dynamic data
 *   fieldKey: string,        // Key to match against formData (used if isDynamic: true)
 *   columns: Array<{         // For table elements only
 *     key: string,           // Field key for the column
 *     label: string,         // Display label for the column
 *     width: number,         // Column width percentage (0-100)
 *   }>,
 *   tableStyle: string,      // Table style (grid, minimal, zebra, compact-list, ledger-double, boxed-total)
 *   showTotal: boolean,      // Render total row for table element
 *   totalStyle: string,      // Total style (none, grid, minimal, zebra, double-rule, boxed-total)
 *   totalFieldKey: string,   // Form data key for total override
 *   showSubtotal: boolean,   // Render subtotal row before tax/discount
 *   taxRate: number,         // Default tax rate percentage
 *   discount: number,        // Default flat discount amount
 *   shapeType: string,       // Shape element variant (line, border, circle-stamp)
 *   shape: string,           // Image element clipping (rect, circle)
 *   letterSpacing: number    // Font letter spacing in px
 * }
 */

// Helper function to validate template schema
export function validateTemplate(template) {
  if (!template || typeof template !== 'object') {
    throw new Error('Template must be an object');
  }

  if (typeof template.width !== 'number' || template.width <= 0) {
    throw new Error('Template must have a valid width');
  }

  if (typeof template.height !== 'number' || template.height <= 0) {
    throw new Error('Template must have a valid height');
  }

  if (typeof template.backgroundColor !== 'string') {
    throw new Error('Template must have a backgroundColor');
  }

  if (!Array.isArray(template.elements)) {
    throw new Error('Template must have an elements array');
  }

  template.elements.forEach((element, index) => {
    validateElement(element, index);
  });

  return true;
}

// Helper function to validate element schema
function validateElement(element, index) {
  if (!element || typeof element !== 'object') {
    throw new Error(`Element at index ${index} must be an object`);
  }

  const requiredFields = ['id', 'type', 'content', 'x', 'y', 'width', 'height'];
  requiredFields.forEach((field) => {
    if (!(field in element)) {
      throw new Error(`Element at index ${index} missing required field: ${field}`);
    }
  });

  if (typeof element.x !== 'number' || element.x < 0) {
    throw new Error(`Element at index ${index} must have valid x coordinate`);
  }

  if (typeof element.y !== 'number' || element.y < 0) {
    throw new Error(`Element at index ${index} must have valid y coordinate`);
  }

  if (typeof element.width !== 'number' || element.width <= 0) {
    throw new Error(`Element at index ${index} must have valid width`);
  }

  if (typeof element.height !== 'number' || element.height <= 0) {
    throw new Error(`Element at index ${index} must have valid height`);
  }

  if (element.isDynamic && typeof element.fieldKey !== 'string') {
    throw new Error(`Dynamic element at index ${index} must have a fieldKey`);
  }

  // Validate table (repeater) elements have columns array
  if (element.type === 'table') {
    if (element.columns && (!Array.isArray(element.columns) || element.columns.length === 0)) {
      throw new Error(`Table element at index ${index} must have a valid columns array`);
    }
    if (element.columns) {
      element.columns.forEach((column, colIndex) => {
        if (!column.key || typeof column.key !== 'string') {
          throw new Error(`Column ${colIndex} in table element at index ${index} must have a key`);
        }
        if (!column.label || typeof column.label !== 'string') {
          throw new Error(`Column ${colIndex} in table element at index ${index} must have a label`);
        }
        if (typeof column.width !== 'number' || column.width <= 0 || column.width > 100) {
          throw new Error(`Column ${colIndex} in table element at index ${index} must have a valid width (0-100)`);
        }
      });
    }
  }
}

// Helper function to convert legacy template format to standard schema
export function convertToStandardSchema(legacyTemplate) {
  if (!legacyTemplate) return null;

  let inferredWidth = legacyTemplate.width;
  if (!inferredWidth && legacyTemplate.elements && legacyTemplate.elements.length > 0) {
    let maxRight = 0;
    legacyTemplate.elements.forEach(el => {
      const right = (el.x || 0) + (el.width || 0) + 16;
      if (right > maxRight) maxRight = right;
    });
    if (Math.abs(maxRight - 600) <= 32) inferredWidth = 600;
    else if (Math.abs(maxRight - 400) <= 32) inferredWidth = 400;
    else if (Math.abs(maxRight - 380) <= 32) inferredWidth = 380;
    else if (Math.abs(maxRight - 300) <= 32) inferredWidth = 300;
    else inferredWidth = Math.max(400, Math.ceil(maxRight));
  }

  const standardTemplate = {
    width: inferredWidth || 400,
    height: legacyTemplate.height || 620,
    backgroundColor: legacyTemplate.background || '#ffffff',
    elements: legacyTemplate.elements?.map((element) => {
      const baseElement = {
        id: element.id,
        type: element.type,
        content: element.props?.text || element.props?.src || '',
        x: element.x,
        y: element.y,
        width: element.width,
        height: element.height,
        rotation: element.rotation || 0,
        zIndex: element.zIndex || 0,
        fontFamily: element.props?.fontFamily || 'Inter, sans-serif',
        fontSize: element.props?.fontSize || 14,
        fontWeight: element.props?.fontWeight || 400,
        color: element.props?.color || '#000000',
        textAlign: element.props?.textAlign || 'left',
        lineHeight: element.props?.lineHeight || 1.4,
        isDynamic: element.isDynamic || false,
        fieldKey: element.formFieldType || element.id,
      };

      if (element.type === 'table') {
        baseElement.isDynamic = true;
        baseElement.content = element.content || '';
        baseElement.columns = element.props?.columns || element.columns || [];
        baseElement.tableStyle = element.props?.tableStyle || element.tableStyle || 'none';
        baseElement.showTotal = element.props?.showTotal !== undefined ? element.props.showTotal : (element.showTotal !== undefined ? element.showTotal : false);
        baseElement.totalStyle = element.props?.totalStyle || element.totalStyle || 'none';
        baseElement.totalFieldKey = element.props?.totalFieldKey || element.totalFieldKey || 'totalAmount';
        baseElement.showSubtotal = element.props?.showSubtotal !== undefined ? element.props.showSubtotal : (element.showSubtotal !== undefined ? element.showSubtotal : false);
        baseElement.taxRate = element.props?.taxRate || element.taxRate || 0;
        baseElement.discount = element.props?.discount || element.discount || 0;
      }

      if (element.type === 'shape') {
        baseElement.shapeType = element.props?.shapeType || element.shapeType || 'line';
      }

      if (element.type === 'image') {
        baseElement.shape = element.props?.shape || element.shape || 'rect';
      }

      if (element.type === 'text') {
        baseElement.letterSpacing = element.props?.letterSpacing !== undefined ? element.props.letterSpacing : (element.letterSpacing !== undefined ? element.letterSpacing : 0);
      }

      return baseElement;
    }) || [],
  };

  return standardTemplate;
}

/** Default starter row for a table field (qty: 1, other columns empty) */
export function createDefaultTableRow(columns) {
  const cols = Array.isArray(columns) && columns.length > 0 ? columns : [
    { key: 'name' }, { key: 'qty' }, { key: 'price' }
  ];
  const row = {};
  cols.forEach((col) => {
    row[col.key] = '';
  });
  if ('qty' in row) row.qty = '1';
  if ('quantity' in row) row.quantity = '1';
  return row;
}

// Helper function to convert standard schema back to legacy format (for Template Studio)
export function convertFromStandardSchema(standardTemplate) {
  if (!standardTemplate) return null;

  const legacyTemplate = {
    title: 'Untitled Template',
    width: standardTemplate.width,
    height: standardTemplate.height,
    background: standardTemplate.backgroundColor,
    elements: standardTemplate.elements.map((element) => ({
      id: element.id,
      type: element.type,
      x: element.x,
      y: element.y,
      width: element.width,
      height: element.height,
      rotation: element.rotation || 0,
      zIndex: element.zIndex || 0,
      isDynamic: element.isDynamic || false,
      formFieldType: element.isDynamic ? element.fieldKey : null,
      placeholderText: element.isDynamic ? `{{${element.fieldKey}}}` : null,
      props: {
        text: element.content,
        fontSize: element.fontSize,
        fontFamily: element.fontFamily,
        fontWeight: element.fontWeight,
        color: element.color,
        textAlign: element.textAlign,
        lineHeight: element.lineHeight,
        ...(element.type === 'table' ? {
          columns: element.columns || [],
          tableStyle: element.tableStyle || 'none',
          showTotal: element.showTotal !== undefined ? element.showTotal : false,
          totalStyle: element.totalStyle || 'none',
          totalFieldKey: element.totalFieldKey || 'totalAmount',
          showSubtotal: element.showSubtotal !== undefined ? element.showSubtotal : false,
          taxRate: element.taxRate || 0,
          discount: element.discount || 0
        } : {}),
        ...(element.type === 'shape' ? {
          shapeType: element.shapeType || 'line'
        } : {}),
        ...(element.type === 'image' ? {
          shape: element.shape || 'rect'
        } : {}),
        ...(element.type === 'text' ? {
          letterSpacing: element.letterSpacing || 0
        } : {}),
      },
    })),
  };

  return legacyTemplate;
}
