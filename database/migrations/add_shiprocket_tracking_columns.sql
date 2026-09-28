-- Persist Shiprocket shipment/tracking details on the order itself, so the
-- customer order-detail page and admin panel can show AWB/courier/live
-- status without an extra table. Run this migration in the Supabase SQL
-- editor after schema.sql.

ALTER TABLE orders ADD COLUMN IF NOT EXISTS shiprocket_order_id text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shiprocket_shipment_id text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS awb_code text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS courier_name text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shiprocket_status text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipped_at timestamptz;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivered_at timestamptz;
