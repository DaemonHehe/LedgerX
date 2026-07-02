import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import multer from 'multer';
import rateLimit from 'express-rate-limit';
import { createClient } from '@supabase/supabase-js';
import FormData from 'form-data';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
const bucketName = process.env.SUPABASE_BUCKET || 'receipt-assets';

// Rate limiting to prevent abuse
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);
app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' }));
app.use(express.json());

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in server environment.');
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

const getExtension = (filename = '') => {
  const extension = filename.split('.').pop();
  return extension && extension !== filename ? extension : 'png';
};

// ---------- Auth ----------
// Verifies the Bearer JWT the client obtained from Supabase Auth and exposes
// the resolved user as `request.user`. Works session-less: getUser(token) hits
// the GoTrue endpoint and does not establish a server-side session, so the
// service-role client can safely validate client-issued tokens.
const requireAuth = async (request, response, next) => {
  const header = request.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return response.status(401).json({ error: 'Authentication required.' });
  }

  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !user) {
      return response.status(401).json({ error: 'Invalid or expired session.' });
    }

    request.user = { id: user.id, email: user.email };
    return next();
  } catch (error) {
    return response.status(401).json({ error: 'Authentication failed.' });
  }
};

app.get('/api/health', (_request, response) => {
  response.json({ ok: true });
});

// Who am I? Echoes the user resolved from the Bearer token. Useful for the
// client to confirm a stored session is still valid and to read the current id.
app.get('/api/me', requireAuth, (request, response) => {
  response.json(request.user);
});

app.get('/api/receipts', requireAuth, async (request, response) => {
  const { data, error } = await supabase
    .from('receipts')
    .select('*')
    .eq('user_id', request.user.id)
    .order('created_at', { ascending: false });

  if (error) {
    return response.status(500).json({ error: error.message });
  }

  return response.json(data);
});

app.post('/api/receipts', requireAuth, async (request, response) => {
  const {
    customer_name: customerName,
    customer_address: customerAddress,
    date,
    total_quantity: totalQuantity,
    grand_total: grandTotal,
    items,
  } = request.body;

  // Input validation
  if (typeof customerName !== 'string' || customerName.length > 255) {
    return response.status(400).json({ error: 'Invalid customer_name.' });
  }
  if (typeof customerAddress !== 'string' || customerAddress.length > 1000) {
    return response.status(400).json({ error: 'Invalid customer_address.' });
  }
  if (typeof date !== 'string' || date.length > 50) {
    return response.status(400).json({ error: 'Invalid date.' });
  }
  if (typeof totalQuantity !== 'number' || totalQuantity < 0) {
    return response.status(400).json({ error: 'Invalid total_quantity.' });
  }
  if (typeof grandTotal !== 'number' || grandTotal < 0) {
    return response.status(400).json({ error: 'Invalid grand_total.' });
  }
  if (!Array.isArray(items) || items.length > 1000) {
    return response.status(400).json({ error: 'Invalid items array.' });
  }

  const receiptRecord = {
    customer_name: customerName,
    customer_address: customerAddress,
    date,
    total_quantity: totalQuantity,
    grand_total: grandTotal,
    items: Array.isArray(items) ? items : [],
    user_id: request.user.id,
  };

  const { data, error } = await supabase
    .from('receipts')
    .insert(receiptRecord)
    .select()
    .single();

  if (error) {
    return response.status(500).json({ error: error.message });
  }

  return response.status(201).json(data);
});

app.post('/api/upload', requireAuth, upload.single('file'), async (request, response) => {
  try {
    if (!request.file) {
      return response.status(400).json({ error: 'No image file provided.' });
    }

    const extension = getExtension(request.file.originalname);
    const safeName = request.file.originalname
      .replace(/\.[^/.]+$/, '')
      .replace(/[^a-z0-9-_]/gi, '-')
      .toLowerCase();
    const filePath = `${Date.now()}-${safeName}.${extension}`;

    const { error } = await supabase.storage.from(bucketName).upload(filePath, request.file.buffer, {
      contentType: request.file.mimetype,
      upsert: false,
    });

    if (error) {
      return response.status(500).json({ error: error.message });
    }

    const { data } = supabase.storage.from(bucketName).getPublicUrl(filePath);

    return response.status(201).json({
      publicUrl: data.publicUrl,
      path: filePath,
    });
  } catch (error) {
    return response.status(500).json({ error: error.message || 'Upload failed.' });
  }
});

// ---------- Receipt Image Analysis (n8n Proxy) ----------

app.post('/api/receipts/analyze', requireAuth, upload.single('image'), async (request, response) => {
  try {
    if (!request.file) {
      return response.status(400).json({ error: 'No image file provided.' });
    }

    const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL;

    if (n8nWebhookUrl) {
      // Forward to n8n webhook
      try {
        const formData = new FormData();
        formData.append('image', request.file.buffer, {
          filename: request.file.originalname,
          contentType: request.file.mimetype,
        });

        const n8nResponse = await fetch(n8nWebhookUrl, {
          method: 'POST',
          body: formData,
          headers: formData.getHeaders(),
        });

        if (!n8nResponse.ok) {
          throw new Error(`n8n webhook returned ${n8nResponse.status}`);
        }

        const n8nData = await n8nResponse.json();
        return response.json(n8nData);
      } catch (error) {
        console.error('n8n webhook error:', error);
        return response.status(500).json({ error: 'Failed to process image with n8n webhook.' });
      }
    } else {
      // Mock response when n8n webhook is not configured
      await new Promise(resolve => setTimeout(resolve, 3000));

      const mockResponse = {
        success: true,
        data: {
          deck_name: 'Imported Receipt Template',
          elements: [
            {
              id: 'elem_auto_1',
              type: 'text',
              content: 'STORE NAME',
              x: 50,
              y: 50,
              isDynamic: false
            },
            {
              id: 'elem_auto_2',
              type: 'text',
              content: 'John Doe',
              x: 50,
              y: 100,
              isDynamic: true,
              formFieldType: 'customer_name'
            },
            {
              id: 'elem_auto_3',
              type: 'items_list',
              content: [{ name: 'Coffee', price: 4.50 }],
              x: 50,
              y: 150,
              isDynamic: true,
              formFieldType: 'line_items'
            }
          ]
        }
      };

      return response.json(mockResponse);
    }
  } catch (error) {
    return response.status(500).json({ error: error.message || 'Image analysis failed.' });
  }
});

// ---------- Canva decks (owner-scoped) ----------

app.get('/api/decks', requireAuth, async (request, response) => {
  const { data, error } = await supabase
    .from('canva_decks')
    .select('id, title, created_at')
    .eq('user_id', request.user.id)
    .order('created_at', { ascending: false });

  if (error) {
    return response.status(500).json({ error: error.message });
  }

  return response.json(data);
});

app.get('/api/decks/:id', requireAuth, async (request, response) => {
  const { data, error } = await supabase
    .from('canva_decks')
    .select('*')
    .eq('id', request.params.id)
    .eq('user_id', request.user.id)
    .single();

  if (error) {
    return response.status(404).json({ error: error.message });
  }

  return response.json(data);
});

app.post('/api/decks', requireAuth, async (request, response) => {
  const { title, background, elements } = request.body;

  // Input validation
  if (title !== undefined && (typeof title !== 'string' || title.length > 255)) {
    return response.status(400).json({ error: 'Invalid title.' });
  }
  if (background !== undefined && (typeof background !== 'string' || background.length > 50)) {
    return response.status(400).json({ error: 'Invalid background.' });
  }
  if (!Array.isArray(elements) || elements.length > 100) {
    return response.status(400).json({ error: 'Invalid elements array.' });
  }

  const record = {
    title: title || 'Untitled template',
    background: background || '#ffffff',
    elements: Array.isArray(elements) ? elements : [],
    user_id: request.user.id,
  };

  const { data, error } = await supabase
    .from('canva_decks')
    .insert(record)
    .select()
    .single();

  if (error) {
    return response.status(500).json({ error: error.message });
  }

  return response.status(201).json(data);
});

app.put('/api/decks/:id', requireAuth, async (request, response) => {
  const { title, background, elements } = request.body;
  const changes = {};

  if (title !== undefined) {
    if (typeof title !== 'string' || title.length > 255) {
      return response.status(400).json({ error: 'Invalid title.' });
    }
    changes.title = title;
  }

  if (background !== undefined) {
    if (typeof background !== 'string' || background.length > 50) {
      return response.status(400).json({ error: 'Invalid background.' });
    }
    changes.background = background;
  }

  if (elements !== undefined) {
    if (!Array.isArray(elements) || elements.length > 100) {
      return response.status(400).json({ error: 'Invalid elements array.' });
    }
    changes.elements = elements;
  }

  const { data, error } = await supabase
    .from('canva_decks')
    .update(changes)
    .eq('id', request.params.id)
    .eq('user_id', request.user.id) // never touch another owner's deck
    .select()
    .single();

  if (error) {
    return response.status(500).json({ error: error.message });
  }

  return response.json(data);
});

app.delete('/api/decks/:id', requireAuth, async (request, response) => {
  const { error } = await supabase
    .from('canva_decks')
    .delete()
    .eq('id', request.params.id)
    .eq('user_id', request.user.id);

  if (error) {
    return response.status(500).json({ error: error.message });
  }

  return response.status(204).send();
});

app.listen(port, () => {
  console.log(`Receipt API running on http://localhost:${port}`);
});
