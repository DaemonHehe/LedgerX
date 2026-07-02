import CanvasSlide from './canvas/CanvasSlide.jsx';

function TemplateCanvas({ template, formData }) {
  if (!template) {
    return null;
  }

  // Create a modified template with dynamic elements updated from form data
  const modifiedTemplate = {
    ...template,
    elements: template.elements.map((element) => {
      if (!element.isDynamic || !element.formFieldType) {
        return element;
      }

      const value = formData[element.id] || element.placeholderText || '';

      // Update element props based on form field type
      const updatedProps = { ...element.props };

      switch (element.formFieldType) {
        case 'customer_name':
        case 'customer_address':
        case 'custom_field':
          updatedProps.text = value || element.props.text;
          break;
        case 'transaction_date':
          updatedProps.text = value || element.props.text;
          break;
        case 'subtotal':
        case 'tax':
        case 'total':
          updatedProps.text = value ? `$${parseFloat(value).toFixed(2)}` : element.props.text;
          break;
        case 'item_list':
          // For item lists, we might want to render multiple text elements
          // For now, we'll just update the text with the raw value
          updatedProps.text = value || element.props.text;
          break;
        default:
          break;
      }

      return {
        ...element,
        props: updatedProps,
      };
    }),
  };

  return (
    <div className="template-canvas-container">
      <CanvasSlide
        slide={{ background: template.background, elements: modifiedTemplate.elements }}
        selectedIds={[]}
        selectedElements={[]}
        onSelect={() => {}}
        onChange={() => {}}
        onDropElement={() => {}}
      />
    </div>
  );
}

export default TemplateCanvas;