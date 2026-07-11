import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Import the schema builder
import { buildSchema } from '../../client/src/lib/buildWizardSchema.js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment variables.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const examples = [
  {
    name: "Classic Ledger",
    choices: {
      preset: "vertical-standard",
      header: "stacked",
      customer: "simple",
      body: "grid",
      total: "grid",
      footer: "policy-block"
    }
  },
  {
    name: "Corporate Invoice",
    choices: {
      preset: "horizontal-standard",
      header: "letterhead",
      customer: "detailed",
      body: "ledger-double",
      total: "double-rule",
      footer: "signature"
    }
  },
  {
    name: "Boarding Pass",
    choices: {
      preset: "horizontal-wide",
      header: "side-right",
      customer: "compact",
      body: "minimal",
      total: "boxed-total",
      footer: "signature"
    }
  }
];

async function seed() {
  console.log("Seeding example templates...");
  let addedCount = 0;

  for (const example of examples) {
    // Check if it already exists
    const { data: existing } = await supabase
      .from('templates')
      .select('id')
      .eq('name', example.name)
      .eq('is_example', true)
      .maybeSingle();

    if (existing) {
      console.log(`Skipping "${example.name}" - already exists.`);
      continue;
    }

    // Build the schema
    const schemaJson = buildSchema(example.choices);

    // Insert
    const { error } = await supabase
      .from('templates')
      .insert({
        name: example.name,
        schema_json: schemaJson,
        is_example: true,
        user_id: null
      });

    if (error) {
      console.error(`Failed to seed "${example.name}":`, error.message);
    } else {
      console.log(`Successfully seeded "${example.name}".`);
      addedCount++;
    }
  }

  console.log(`Seeding complete. Added ${addedCount} templates.`);
}

seed().catch(console.error);
