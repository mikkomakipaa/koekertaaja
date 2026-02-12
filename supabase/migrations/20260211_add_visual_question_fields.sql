-- Add visual-question metadata columns
alter table public.questions
  add column if not exists image_reference text,
  add column if not exists requires_visual boolean not null default false;

comment on column public.questions.image_reference is 'Reference to source visual in prompt format (e.g., IMAGE_1)';
comment on column public.questions.requires_visual is 'Whether question requires a visual asset to answer';

-- Storage bucket for question visuals
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'question-assets',
  'question-assets',
  true,
  2097152,
  array['image/png', 'image/jpeg', 'image/webp', 'image/gif']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Public read policy for published question assets
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'question-assets-public-read'
  ) THEN
    CREATE POLICY "question-assets-public-read"
      ON storage.objects
      FOR SELECT
      USING (bucket_id = 'question-assets');
  END IF;
END
$$;

-- Authenticated uploads (service role bypasses RLS regardless)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'question-assets-auth-write'
  ) THEN
    CREATE POLICY "question-assets-auth-write"
      ON storage.objects
      FOR INSERT
      TO authenticated
      WITH CHECK (bucket_id = 'question-assets');
  END IF;
END
$$;
