-- Replace the unused testimonial photo with a star rating (1-5).
-- Run this migration in the Supabase SQL editor after schema.sql.

ALTER TABLE testimonials ADD COLUMN IF NOT EXISTS rating integer NOT NULL DEFAULT 5;
ALTER TABLE testimonials DROP COLUMN IF EXISTS image;

ALTER TABLE testimonials DROP CONSTRAINT IF EXISTS testimonials_rating_check;
ALTER TABLE testimonials ADD CONSTRAINT testimonials_rating_check CHECK (rating BETWEEN 1 AND 5);
