-- Add photo_url and video_url columns to testimonials table for customer wear photos and video reels
alter table testimonials
  add column if not exists photo_url text,
  add column if not exists video_url text;
