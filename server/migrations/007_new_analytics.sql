-- Create function to get daily sales aggregates over the last 14 days
CREATE OR REPLACE FUNCTION get_daily_sales(user_uuid UUID, tz TEXT DEFAULT 'UTC')
RETURNS TABLE (
  day_start TIMESTAMP WITH TIME ZONE,
  revenue NUMERIC,
  count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    date_trunc('day', created_at AT TIME ZONE tz) AT TIME ZONE tz AS day_start,
    COALESCE(SUM(CAST(regexp_replace(form_data->>'total_amount', '[^\d.]', '', 'g') AS NUMERIC)), 0) AS revenue,
    COUNT(*) AS count
  FROM receipts
  WHERE user_id = user_uuid
  GROUP BY date_trunc('day', created_at AT TIME ZONE tz) AT TIME ZONE tz
  ORDER BY day_start ASC;
END;
$$ LANGUAGE plpgsql;

-- Create function to get top customers
CREATE OR REPLACE FUNCTION get_top_customers(user_uuid UUID)
RETURNS TABLE (
  customer_name TEXT,
  revenue NUMERIC,
  receipt_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(c.name, r.form_data->>'customer_name', 'Unknown Customer') AS customer_name,
    COALESCE(SUM(CAST(regexp_replace(r.form_data->>'total_amount', '[^\d.]', '', 'g') AS NUMERIC)), 0) AS revenue,
    COUNT(*) AS receipt_count
  FROM receipts r
  LEFT JOIN customers c ON r.customer_id = c.id
  WHERE r.user_id = user_uuid
  GROUP BY COALESCE(c.name, r.form_data->>'customer_name', 'Unknown Customer')
  ORDER BY revenue DESC
  LIMIT 10;
END;
$$ LANGUAGE plpgsql;
