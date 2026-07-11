import FormData from 'form-data';
import { supabase, bucketName } from '../config/supabase.js';
import { openai } from '../config/openai.js';

const getExtension = (filename = '') => {
  const extension = filename.split('.').pop();
  return extension && extension !== filename ? extension.toLowerCase() : 'png';
};

export const uploadMedia = async (req, res, next) => {
  try {
    const file = req.file;
    const extension = getExtension(file.originalname);
    const safeName = file.originalname
      .replace(/\.[^/.]+$/, '')
      .replace(/[^a-z0-9-_]/gi, '-')
      .toLowerCase();
    const filePath = `${Date.now()}-${safeName}.${extension}`;

    const { error } = await supabase.storage.from(bucketName).upload(filePath, file.buffer, {
      contentType: file.mimetype,
      upsert: false,
    });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    const { data } = supabase.storage.from(bucketName).getPublicUrl(filePath);

    return res.status(201).json({
      publicUrl: data.publicUrl,
      path: filePath,
    });
  } catch (err) {
    next(err);
  }
};

export const analyzeReceiptN8n = async (req, res, next) => {
  try {
    const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL;

    if (n8nWebhookUrl) {
      try {
        const formData = new FormData();
        formData.append('image', req.file.buffer, {
          filename: req.file.originalname,
          contentType: req.file.mimetype,
        });

        // Use AbortController for a 15-second fetch timeout to prevent hanging connections
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);

        const n8nResponse = await fetch(n8nWebhookUrl, {
          method: 'POST',
          body: formData,
          headers: formData.getHeaders(),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!n8nResponse.ok) {
          throw new Error(`n8n webhook returned status ${n8nResponse.status}`);
        }

        const n8nData = await n8nResponse.json();
        return res.json(n8nData);
      } catch (err) {
        console.error('n8n webhook proxy error:', err);
        return res.status(502).json({ error: 'Failed to process image with n8n webhook.' });
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

      return res.json(mockResponse);
    }
  } catch (err) {
    next(err);
  }
};

export const analyzeTemplateOpenAI = async (req, res, next) => {
  try {
    if (!openai) {
      return res.status(503).json({ error: 'OpenAI API key not configured on server.' });
    }

    // Convert buffer to base64 data URI
    const base64Image = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;

    // Call OpenAI GPT-4o with the image
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are an expert UI layout engine. Analyze this physical receipt image and convert it into a digital template JSON schema. The canvas width should be 400. Estimate the canvas height based on the content. Map every piece of text into the \'elements\' array. Return ONLY a JSON object matching this schema: { canvas: { width: 400, height: number, backgroundColor: \'#ffffff\' }, elements: [ { id: \'el_uuid\', type: \'text\' | \'table\', content: \'string\', x: number, y: number, width: number, height: number, fontSize: number, isDynamic: boolean, fieldKey: \'string_if_dynamic\', columns: [{ key: \'string\', label: \'string\', width: number }] /* columns required when type is table; width is percentage 0-100 */ } ] }. Estimate X and Y coordinates to replicate the visual layout. If a text field represents a variable (customer name, date, total amount), set isDynamic: true and assign a snake_case fieldKey. If it is static (store name, headers, \'Thank You\'), set isDynamic: false. If the receipt contains a list of purchased items, group them into a single element of type: \'table\' with a columns array defining the structure (e.g., qty, description, price). Do not create separate text elements for every single item row. Table elements must have isDynamic: true, a fieldKey (e.g. line_items), width spanning the item area, height for one row, and columns with key/label/width percentages that sum to 100.'
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Analyze this receipt image and generate a template JSON.'
            },
            {
              type: 'image_url',
              image_url: {
                url: base64Image
              }
            }
          ]
        }
      ],
      response_format: { type: 'json_object' },
      max_tokens: 4096,
    });

    const generatedContent = completion.choices[0].message.content;
    const parsedJson = JSON.parse(generatedContent);

    if (parsedJson?.canvas?.height) {
      parsedJson.canvas.height = Math.max(400, Math.min(1200, parsedJson.canvas.height));
    }

    return res.json(parsedJson);
  } catch (err) {
    next(err);
  }
};
