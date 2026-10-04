-- Add photo_url and video_url columns to reviews table for customer product review photos and videos
alter table reviews
  add column if not exists photo_url text,
  add column if not exists video_url text;
