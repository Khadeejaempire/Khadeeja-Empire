-- Add is_featured column to categories table for navbar showcasing
ALTER TABLE categories ADD COLUMN IF NOT EXISTS is_featured boolean NOT NULL DEFAULT false;

-- Initially mark top 3 active categories as featured so navbar is populated
UPDATE categories
SET is_featured = true
WHERE id IN (
  SELECT id FROM categories
  WHERE active = true
  ORDER BY sort_order ASC, created_at ASC
  LIMIT 3
);
