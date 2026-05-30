import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import multer from 'multer';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
const bucketName = process.env.SUPABASE_BUCKET || 'receipt-assets';

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

app.get('/api/health', (_request, response) => {
  response.json({ ok: true });
});

app.get('/api/receipts', async (_request, response) => {
  const { data, error } = await supabase
    .from('receipts')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return response.status(500).json({ error: error.message });
  }

  return response.json(data);
});

app.post('/api/receipts', async (request, response) => {
  const {
    customer_name: customerName,
    customer_address: customerAddress,
    date,
    total_quantity: totalQuantity,
    grand_total: grandTotal,
    items,
  } = request.body;

  const receiptRecord = {
    customer_name: customerName,
    customer_address: customerAddress,
    date,
    total_quantity: totalQuantity,
    grand_total: grandTotal,
    items: Array.isArray(items) ? items : [],
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

app.post('/api/upload', upload.single('file'), async (request, response) => {
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

app.listen(port, () => {
  console.log(`Receipt API running on http://localhost:${port}`);
});
