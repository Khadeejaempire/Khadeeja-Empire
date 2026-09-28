-- Add a separate mobile-crop image for hero slides so nothing gets cropped on phones.
-- Run this migration in the Supabase SQL editor after schema.sql.

ALTER TABLE hero_slides ADD COLUMN IF NOT EXISTS mobile_image text;
