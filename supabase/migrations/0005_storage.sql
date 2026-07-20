-- ForTheSoul — Bucket de stockage des images (photos praticiens, événements, lieux)
-- Les images sont redimensionnées/compressées CÔTÉ CLIENT avant upload
-- (lib/image.ts) — règle d'or n°6.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('images', 'images', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

-- Lecture publique (bucket public), upload réservé aux utilisateurs connectés,
-- chacun dans son propre dossier (<user_id>/...).
create policy "images: upload par utilisateur connecté dans son dossier"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'images' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "images: remplacement de ses propres fichiers"
  on storage.objects for update to authenticated
  using (bucket_id = 'images' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "images: suppression de ses propres fichiers ou admin"
  on storage.objects for delete to authenticated
  using (bucket_id = 'images' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));
