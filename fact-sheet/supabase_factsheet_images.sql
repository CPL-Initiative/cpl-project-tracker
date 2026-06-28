-- ─────────────────────────────────────────────────────────────────────────
-- factsheet-images — the Supabase Storage bucket behind the Fact Sheet Curate
-- IMAGE layer (fact-sheet/factsheet_edit.js, Phase 2). A signed-in reviewer can
-- add / replace / resize / delete images on the public Fact Sheet; the bytes go
-- here and the override (factsheet_overrides) stores the public URL.
--
-- PUBLIC-READ bucket (the overlay renders images for every visitor), writes
-- (insert/update/delete) gated by is_allowed_reviewer() — the same reviewer
-- trust boundary as factsheet_overrides / item_raci / item_updates. 5 MB cap,
-- raster image MIME types only.
--
-- Applied live 2026-06-28 (Session 81, StarFarout) via the Supabase MCP; kept
-- here as the schema-of-record. Idempotent.
-- ─────────────────────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('factsheet-images', 'factsheet-images', true, 5242880,
        array['image/png','image/jpeg','image/webp','image/gif'])
on conflict (id) do update
  set public = true, file_size_limit = 5242880,
      allowed_mime_types = array['image/png','image/jpeg','image/webp','image/gif'];

-- Public read of objects in this bucket.
drop policy if exists fsimg_read on storage.objects;
create policy fsimg_read on storage.objects for select
  using (bucket_id = 'factsheet-images');

-- Reviewer-gated write in this bucket only.
drop policy if exists fsimg_write on storage.objects;
create policy fsimg_write on storage.objects for all
  to authenticated, anon
  using (bucket_id = 'factsheet-images' and is_allowed_reviewer())
  with check (bucket_id = 'factsheet-images' and is_allowed_reviewer());
