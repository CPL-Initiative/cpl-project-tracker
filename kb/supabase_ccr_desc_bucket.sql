-- ─────────────────────────────────────────────────────────────────────────
-- ccr-desc — the Supabase Storage bucket behind SkyView's course descriptions
-- (prototype/ccr_universe.js reads it; scripts/publish_skyview_desc_shards.sh
-- writes it from the Actions runner).
--
-- What it holds: one JSON shard per subject area,
--   { "<control number digits>": [catalog description | null, course title, units] }
-- built by kb/_build_ccr_universe.py from the published COCI course list —
-- PUBLIC catalog text, no student or staff data, ~50 MB in all.
--
-- PUBLIC-READ bucket (the deployed SkyView page fetches a shard when a curator
-- opens an identity). No write policy for anon or authenticated on purpose:
-- the only writer is the runner, whose service-role key bypasses RLS. 25 MB
-- per object (the largest shard is ~3.6 MB), JSON only.
--
-- Applied live 2026-09-03 (Session 223, SkyOrbit) via the Supabase MCP; kept
-- here as the schema-of-record. Idempotent. Governance: mapped to CA-01 (the
-- daily runner's publishing surface) in kb/governance_surface_map.json.
-- ─────────────────────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('ccr-desc', 'ccr-desc', true, 26214400, array['application/json'])
on conflict (id) do update
  set public = true, file_size_limit = 26214400,
      allowed_mime_types = array['application/json'];

-- Public read of objects in this bucket, and nothing else for anon/authenticated.
drop policy if exists ccrdesc_read on storage.objects;
create policy ccrdesc_read on storage.objects for select
  using (bucket_id = 'ccr-desc');
