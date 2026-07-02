import { FORM_FIELD_TYPES } from '../lib/deckModel.js';

const fieldClass = 'editor-field w-full border px-3 py-2.5 text-sm outline-none transition';
const labelClass = 'editor-label';

function DynamicFormRenderer({ template, formData, updateFormData }) {
  if (!template || !template.elements) {
    return null;
  }

  const dynamicElements = template.elements.filter((el) => el.isDynamic && el.formFieldType);

  if (dynamicElements.length === 0) {
    return null;
  }

  const renderField = (element) => {
    const { id, formFieldType, placeholderText, props } = element;
    const value = formData[id] || '';

    const handleChange = (newValue) => {
      updateFormData(id, newValue);
    };

    switch (formFieldType) {
      case 'customer_name':
        return (
          <label key={id}>
            <span className={labelClass}>{placeholderText || 'Customer Name'}</span>
            <input
              className={fieldClass}
              placeholder={placeholderText || 'Customer Name'}
              value={value}
              onChange={(e) => handleChange(e.target.value.toUpperCase())}
            />
          </label>
        );

      case 'customer_address':
        return (
          <label key={id}>
            <span className={labelClass}>{placeholderText || 'Customer Address'}</span>
            <textarea
              className={`${fieldClass} min-h-20 resize-y`}
              placeholder={placeholderText || 'Customer Address'}
              value={value}
              onChange={(e) => handleChange(e.target.value.toUpperCase())}
            />
          </label>
        );

      case 'transaction_date':
        return (
          <label key={id}>
            <span className={labelClass}>{placeholderText || 'Transaction Date'}</span>
            <input
              className={fieldClass}
              type="date"
              value={value}
              onChange={(e) => handleChange(e.target.value)}
            />
          </label>
        );

      case 'subtotal':
      case 'tax':
      case 'total':
        return (
          <label key={id}>
            <span className={labelClass}>{placeholderText || formFieldType.replace('_', ' ').toUpperCase()}</span>
            <input
              className={fieldClass}
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={value}
              onChange={(e) => handleChange(e.target.value)}
            />
          </label>
        );

      case 'custom_field':
        return (
          <label key={id}>
            <span className={labelClass}>{placeholderText || 'Custom Field'}</span>
            <input
              className={fieldClass}
              placeholder={placeholderText || 'Custom Field'}
              value={value}
              onChange={(e) => handleChange(e.target.value.toUpperCase())}
            />
          </label>
        );

      case 'item_list':
        return (
          <label key={id}>
            <span className={labelClass}>{placeholderText || 'Items'}</span>
            <textarea
              className={`${fieldClass} min-h-32 resize-y`}
              placeholder="Enter items (one per line)"
              value={value}
              onChange={(e) => handleChange(e.target.value)}
            />
          </label>
        );

      default:
        return null;
    }
  };

  return (
    <section className="editor-section">
      <div className="section-heading">
        <span>05</span>
        <h2>Template Fields</h2>
      </div>
      <div className="grid gap-4">
        {dynamicElements.map(renderField)}
      </div>
    </section>
  );
}

export default DynamicFormRenderer;