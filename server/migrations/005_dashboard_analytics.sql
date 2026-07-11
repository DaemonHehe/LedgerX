-- Add parent_receipt_id to track revisions
ALTER TABLE receipts ADD COLUMN IF NOT EXISTS parent_receipt_id UUID REFERENCES receipts(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_receipts_parent_id ON receipts(parent_receipt_id);

-- Add is_archived to templates for soft deletion
ALTER TABLE templates ADD COLUMN IF NOT EXISTS is_archived BOOLEAN NOT NULL DEFAULT false;

-- Create function to get weekly sales aggregates
CREATE OR REPLACE FUNCTION get_weekly_sales(user_uuid UUID, tz TEXT DEFAULT 'UTC')
RETURNS TABLE (
  week_start TIMESTAMP WITH TIME ZONE,
  revenue NUMERIC,
  count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    date_trunc('week', created_at AT TIME ZONE tz) AT TIME ZONE tz AS week_start,
    COALESCE(SUM(CAST(regexp_replace(form_data->>'total_amount', '[^\d.]', '', 'g') AS NUMERIC)), 0) AS revenue,
    COUNT(*) AS count
  FROM receipts
  WHERE user_id = user_uuid
  GROUP BY date_trunc('week', created_at AT TIME ZONE tz) AT TIME ZONE tz
  ORDER BY week_start ASC;
END;
$$ LANGUAGE plpgsql;

-- Create function to get monthly sales aggregates
CREATE OR REPLACE FUNCTION get_monthly_sales(user_uuid UUID, tz TEXT DEFAULT 'UTC')
RETURNS TABLE (
  month_start TIMESTAMP WITH TIME ZONE,
  revenue NUMERIC,
  count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    date_trunc('month', created_at AT TIME ZONE tz) AT TIME ZONE tz AS month_start,
    COALESCE(SUM(CAST(regexp_replace(form_data->>'total_amount', '[^\d.]', '', 'g') AS NUMERIC)), 0) AS revenue,
    COUNT(*) AS count
  FROM receipts
  WHERE user_id = user_uuid
  GROUP BY date_trunc('month', created_at AT TIME ZONE tz) AT TIME ZONE tz
  ORDER BY month_start ASC;
END;
$$ LANGUAGE plpgsql;

-- Create function to get receipt stats
CREATE OR REPLACE FUNCTION get_receipt_stats(user_uuid UUID)
RETURNS TABLE (
  total_revenue NUMERIC,
  receipt_count BIGINT,
  avg_order_value NUMERIC,
  top_template_name TEXT
) AS $$
BEGIN
  RETURN QUERY
  WITH stats AS (
    SELECT 
      COALESCE(SUM(CAST(regexp_replace(form_data->>'total_amount', '[^\d.]', '', 'g') AS NUMERIC)), 0) AS rev,
      COUNT(*) AS cnt,
      COALESCE(AVG(CAST(regexp_replace(form_data->>'total_amount', '[^\d.]', '', 'g') AS NUMERIC)), 0) AS avg_val
    FROM receipts
    WHERE user_id = user_uuid
  ),
  top_template AS (
    SELECT t.name
    FROM receipts r
    JOIN templates t ON r.template_id = t.id
    WHERE r.user_id = user_uuid
    GROUP BY t.id, t.name
    ORDER BY COUNT(*) DESC
    LIMIT 1
  )
  SELECT 
    s.rev AS total_revenue,
    s.cnt AS receipt_count,
    s.avg_val AS avg_order_value,
    (SELECT name FROM top_template) AS top_template_name
  FROM stats s;
END;
$$ LANGUAGE plpgsql;

-- Create function to get template performance
CREATE OR REPLACE FUNCTION get_template_performance(user_uuid UUID)
RETURNS TABLE (
  template_name TEXT,
  count BIGINT,
  total_revenue NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.name AS template_name,
    COUNT(*) AS count,
    COALESCE(SUM(CAST(regexp_replace(r.form_data->>'total_amount', '[^\d.]', '', 'g') AS NUMERIC)), 0) AS total_revenue
  FROM receipts r
  JOIN templates t ON r.template_id = t.id
  WHERE r.user_id = user_uuid
  GROUP BY t.id, t.name
  ORDER BY count DESC
  LIMIT 10;
END;
$$ LANGUAGE plpgsql;

