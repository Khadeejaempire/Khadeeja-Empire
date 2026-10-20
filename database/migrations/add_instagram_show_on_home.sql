-- Let admins choose which Instagram gallery posts appear on the home page.
-- Every post still appears on the full /gallery page.
-- Run this migration in the Supabase SQL editor after schema.sql.

ALTER TABLE instagram_posts ADD COLUMN IF NOT EXISTS show_on_home boolean NOT NULL DEFAULT true;
ALTER TABLE instagram_posts ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;

-- One-time setup: tick "Show on home page" for the first 8 posts (by sort order); the rest stay gallery-only.
UPDATE instagram_posts SET show_on_home = false;
UPDATE instagram_posts SET show_on_home = true
WHERE id IN (SELECT id FROM instagram_posts ORDER BY sort_order, id LIMIT 8);
