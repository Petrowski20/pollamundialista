-- Fija tipos MIME permitidos y límite de 5 MB en el bucket de avatares
UPDATE storage.buckets
SET
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp']::text[],
  file_size_limit    = 5242880
WHERE id = 'avatars';
