import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { welcomeTemplateSchema } from '../data/welcomeTemplate.js';

// Load environment variables relative to the script location
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('ERROR: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env.');
  process.exit(1);
}

// Parse user ID from CLI arguments
const userId = process.argv[2];
if (!userId) {
  console.error('ERROR: Please provide a user_id as an argument.');
  console.log('Usage: node seedDashboard.js <user_id>');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

const FAKE_NAMES = [
  'Alice Smith', 'Bob Johnson', 'Charlie Brown', 'David Miller',
  'Emma Davis', 'Frank Wilson', 'Grace Taylor', 'Henry Jones',
  'Ivy Thomas', 'Jack White', 'Kate Harris', 'Leo Martin',
  'Mia Clark', 'Nathan Lewis', 'Olivia Walker'
];

const ITEMS_POOL = [
  { desc: 'Software License Upgrade', basePrice: 49.99 },
  { desc: 'Premium Support Plan', basePrice: 89.99 },
  { desc: 'Hourly Consulting Fee', basePrice: 150.00 },
  { desc: 'Server Deployment Node', basePrice: 29.99 },
  { desc: 'UI Design Kit Pro', basePrice: 59.99 },
  { desc: 'Security Audit Consulting', basePrice: 350.00 },
  { desc: 'Hardware Lease (Desktop)', basePrice: 120.00 }
];

async function seed() {
  try {
    console.log(`Starting mock receipt seeding for user: ${userId}`);

    // 1. Fetch user's first template ID
    let { data: templates, error: templateError } = await supabase
      .from('templates')
      .select('id')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })
      .limit(1);

    if (templateError) throw templateError;

    let templateId;

    // 2. Auto-seed welcome template if none exists
    if (!templates || templates.length === 0) {
      console.log('No templates found for this user. Seeding Receipt Template first...');
      const { data: newTemplate, error: insertError } = await supabase
        .from('templates')
        .insert({
          name: 'Receipt Template',
          schema_json: welcomeTemplateSchema,
          user_id: userId
        })
        .select('id')
        .single();
 
      if (insertError) throw insertError;
      templateId = newTemplate.id;
      console.log(`Receipt Template seeded with ID: ${templateId}`);
    } else {
      templateId = templates[0].id;
      console.log(`Using existing template ID: ${templateId}`);
    }

    // 3. Generate 15 randomized receipts spaced out over the past 30 days
    const mockReceipts = [];
    const now = Date.now();

    for (let i = 0; i < 15; i++) {
      // Space receipts out roughly every 2 days
      const dateObj = new Date(now - i * 2 * 24 * 60 * 60 * 1000 - Math.random() * 24 * 60 * 60 * 1000);
      const dateString = dateObj.toISOString().split('T')[0];

      const customerName = FAKE_NAMES[i % FAKE_NAMES.length];

      // Pick 1 to 3 random items
      const numItems = Math.floor(Math.random() * 3) + 1;
      const selectedItems = [];
      let grandTotal = 0;

      // Shuffle items pool to select unique items
      const shuffledPool = [...ITEMS_POOL].sort(() => 0.5 - Math.random());

      for (let j = 0; j < numItems; j++) {
        const itemInfo = shuffledPool[j];
        const qty = Math.floor(Math.random() * 3) + 1; // 1 to 3
        const price = itemInfo.basePrice;
        const total = qty * price;
        grandTotal += total;

        selectedItems.push({
          qty: String(qty),
          desc: itemInfo.desc,
          price: price.toFixed(2)
        });
      }

      const formData = {
        customer_name: customerName,
        date: dateString,
        line_items: selectedItems,
        total_amount: `$${grandTotal.toFixed(2)}`,
        footer_message: 'THANK YOU FOR TRUSTING LEDGERX'
      };

      mockReceipts.push({
        user_id: userId,
        template_id: templateId,
        form_data: formData,
        created_at: dateObj.toISOString()
      });
    }

    // 4. Bulk insert into public.receipts
    const { data: inserted, error: insertError } = await supabase
      .from('receipts')
      .insert(mockReceipts)
      .select('id');

    if (insertError) throw insertError;

    console.log(`SUCCESS: Successfully seeded ${inserted.length} mock receipts for user ${userId}.`);
  } catch (err) {
    console.error('FATAL SEEDING ERROR:', err);
    process.exit(1);
  }
}

seed();
