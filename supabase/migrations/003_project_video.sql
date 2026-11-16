-- Optional video per project (cover that autoplays, or extra media on the project page).
-- Run once in the Supabase SQL editor, BEFORE adding a video in Studio.

alter table public.portfolio_projects
  add column if not exists video_url          text,
  add column if not exists video_storage_path text,
  add column if not exists video_is_cover     boolean not null default false;

-- Videos upload to the existing public 'portfolio-media' bucket under videos/.
-- Supabase's default per-file upload limit is 50 MB (Storage settings); keep clips short and compressed.

-- Allow video files in the bucket. Without this, uploads fail with
-- "mime type video/mp4 is not supported" because the bucket only accepts images.
update storage.buckets
set allowed_mime_types = (
      select array_agg(distinct m)
      from unnest(coalesce(allowed_mime_types, array[]::text[]) || array['video/mp4', 'video/webm', 'video/quicktime']) as m
    ),
    file_size_limit = greatest(coalesce(file_size_limit, 0), 52428800)  -- 50 MB
where id = 'portfolio-media';
