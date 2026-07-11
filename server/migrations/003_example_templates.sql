-- LedgerX: Example Templates
-- Migration: 003_example_templates.sql

-- Add is_example column
ALTER TABLE public.templates
  ADD COLUMN is_example boolean NOT NULL DEFAULT false;

-- Make user_id optional
ALTER TABLE public.templates
  ALTER COLUMN user_id DROP NOT NULL;

-- Ensure either user_id is provided or it's an example template
ALTER TABLE public.templates
  ADD CONSTRAINT templates_user_id_required_unless_example
  CHECK (user_id IS NOT NULL OR is_example = true);

-- Add RLS policy for viewing example templates
CREATE POLICY "Users can view example templates"
  ON templates FOR SELECT
  USING (is_example = true);
