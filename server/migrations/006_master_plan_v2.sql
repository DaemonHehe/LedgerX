-- Priority 4: Status ENUM
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'receipt_status') THEN
        CREATE TYPE receipt_status AS ENUM ('draft', 'sent', 'paid', 'void');
    END IF;
END$$;

-- Priority 3: Customers Table
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_customers_user_id ON customers(user_id);

-- Add missing columns to Receipts table
ALTER TABLE receipts 
  -- Priority 1: Share Token
  ADD COLUMN IF NOT EXISTS share_token UUID UNIQUE DEFAULT gen_random_uuid(),
  -- Priority 4: Status
  ADD COLUMN IF NOT EXISTS status receipt_status DEFAULT 'draft',
  -- Priority 3: Customer FK
  ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  -- Priority 5: Export Format
  ADD COLUMN IF NOT EXISTS export_format VARCHAR(10) DEFAULT 'png';

CREATE INDEX IF NOT EXISTS idx_receipts_share_token ON receipts(share_token);
CREATE INDEX IF NOT EXISTS idx_receipts_customer_id ON receipts(customer_id);
