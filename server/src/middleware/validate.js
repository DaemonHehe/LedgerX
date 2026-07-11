const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
const ALLOWED_EXTENSIONS = ['jpeg', 'jpg', 'png', 'webp', 'gif'];

// Validates that a route param (e.g. :id) is a valid UUID
export const validateUuid = (paramName) => {
  return (req, res, next) => {
    const value = req.params[paramName];
    if (value && !UUID_REGEX.test(value)) {
      return res.status(400).json({ error: `Invalid ID format. Must be a valid UUID.` });
    }
    return next();
  };
};

// Validates multer uploaded file details (mime-type, extension, existence)
export const validateImageUpload = (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No image file provided.' });
  }

  const file = req.file;

  // Validate MIME type
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    return res.status(400).json({ 
      error: `Invalid file type. Allowed formats: ${ALLOWED_EXTENSIONS.join(', ')}` 
    });
  }

  // Validate Extension
  const extension = file.originalname.split('.').pop()?.toLowerCase();
  if (!extension || !ALLOWED_EXTENSIONS.includes(extension)) {
    return res.status(400).json({ 
      error: `Invalid file extension. Allowed extensions: ${ALLOWED_EXTENSIONS.join(', ')}` 
    });
  }

  return next();
};

// Validates request body for Decks
export const validateDeckBody = (req, res, next) => {
  const { title, background, elements } = req.body;

  if (title !== undefined && (typeof title !== 'string' || title.length > 255)) {
    return res.status(400).json({ error: 'Invalid title. Must be a string up to 255 characters.' });
  }

  if (background !== undefined && (typeof background !== 'string' || background.length > 50)) {
    return res.status(400).json({ error: 'Invalid background color value.' });
  }

  if (elements !== undefined) {
    if (!Array.isArray(elements) || elements.length > 100) {
      return res.status(400).json({ error: 'Invalid elements. Must be an array of up to 100 elements.' });
    }
  }

  return next();
};

// Validates request body for Templates
export const validateTemplateBody = (req, res, next) => {
  const { name, schema_json } = req.body;

  // For POST, name and schema_json are required. For PUT, they are optional but validated if present.
  if (req.method === 'POST') {
    if (typeof name !== 'string' || name.length > 255) {
      return res.status(400).json({ error: 'Invalid name. Must be a string up to 255 characters.' });
    }
    if (!schema_json || typeof schema_json !== 'object' || Array.isArray(schema_json)) {
      return res.status(400).json({ error: 'Invalid schema_json. Must be an object.' });
    }
  } else if (req.method === 'PUT') {
    if (name !== undefined && (typeof name !== 'string' || name.length > 255)) {
      return res.status(400).json({ error: 'Invalid name. Must be a string up to 255 characters.' });
    }
    if (schema_json !== undefined && (!schema_json || typeof schema_json !== 'object' || Array.isArray(schema_json))) {
      return res.status(400).json({ error: 'Invalid schema_json. Must be an object.' });
    }
  }

  return next();
};

// Validates request body for Receipts
export const validateReceiptBody = (req, res, next) => {
  const { template_id, form_data } = req.body;

  if (req.method === 'POST') {
    if (template_id !== undefined && (typeof template_id !== 'string' || !UUID_REGEX.test(template_id))) {
      return res.status(400).json({ error: 'Invalid template_id. Must be a valid UUID if provided.' });
    }
    if (form_data === undefined || typeof form_data !== 'object' || form_data === null || Array.isArray(form_data)) {
      return res.status(400).json({ error: 'Invalid form_data. Must be a valid object.' });
    }
    if (Object.keys(form_data).length > 200) {
      return res.status(400).json({ error: 'form_data is too large. Max 200 keys allowed.' });
    }
  } else if (req.method === 'PUT') {
    if (form_data !== undefined) {
      if (typeof form_data !== 'object' || form_data === null || Array.isArray(form_data)) {
        return res.status(400).json({ error: 'Invalid form_data. Must be a valid object.' });
      }
      if (Object.keys(form_data).length > 200) {
        return res.status(400).json({ error: 'form_data is too large. Max 200 keys allowed.' });
      }
    }
  }

  return next();
};
