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
 *   type: 'text' | 'shape' | 'barcode' | 'image' | 'table', // Element type
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
 *   }>
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

  // Validate table elements have columns array
  if (element.type === 'table') {
    if (!Array.isArray(element.columns) || element.columns.length === 0) {
      throw new Error(`Table element at index ${index} must have a columns array`);
    }
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

// Helper function to convert legacy template format to standard schema
export function convertToStandardSchema(legacyTemplate) {
  if (!legacyTemplate) return null;

  const standardTemplate = {
    width: 1280, // Default canvas width
    height: 720, // Default canvas height
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

      // Handle table elements with columns
      if (element.type === 'table' && element.props?.columns) {
        baseElement.columns = element.props.columns;
      }

      return baseElement;
    }) || [],
  };

  return standardTemplate;
}

// Helper function to convert standard schema back to legacy format (for Template Studio)
export function convertFromStandardSchema(standardTemplate) {
  if (!standardTemplate) return null;

  const legacyTemplate = {
    title: 'Untitled Template',
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
      },
    })),
  };

  return legacyTemplate;
}
