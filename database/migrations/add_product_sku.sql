-- Add a product-level SKU field (separate from the per-variant sku on product_variants).
-- Run this migration in the Supabase SQL editor after schema.sql.

ALTER TABLE products ADD COLUMN IF NOT EXISTS sku text;
