-- cpl-receipts: the PRIVATE Supabase Storage bucket that holds large receipts instead of git
-- (S680 SkyPhoebe, 2026-11-18; issue #3476 Part 4 step 1).
--
-- WHY. Sam, 2026-11-17: "Let's move the bloated data out first thing and make sure we don't allow
-- to go beyond a limit." The program display receipts (about 17 MB each) were 1,531 MB of a 2.0 GB
-- depth-1 clone. From S680 git ignores them; the display job of program-requirements-college.yml
-- builds each on the runner, uploads it here with kb/_receipt_store.py, reads it back, and names it
-- with its size, sha256 and row count in kb/receipts/index.json before it applies.
--
-- PRIVATE. program_requirement_records has a person column, so a receipt that mirrors it is never
-- public. No policy names this bucket: anon and authenticated can neither read nor write it. The only
-- writer and reader is the GitHub runner, whose service-role key bypasses RLS (the ccr-desc pattern,
-- kb/supabase_ccr_desc_bucket.sql, Sam's Aug 24 call). Governance: kb/governance_surface_map.json,
-- dismissed "bucket:cpl-receipts" with its reason.
--
-- LIMITS. 50 MB an object (a gzipped display receipt is about 18 MB; the 44 plain .sql receipts
-- committed before S398 run up to 72.7 MB and are gzipped before they are stored). Gzip, SQL, JSON,
-- plain text and Markdown only (row_audit snapshots are the next tenant, #3476 Part 4 step 5).
--
-- Idempotent. Rollback: 2026-11-18_s680_cpl_receipts_bucket_rollback.sql.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('cpl-receipts', 'cpl-receipts', false, 52428800,
        array['application/gzip', 'application/sql', 'application/json', 'text/plain', 'text/markdown'])
on conflict (id) do update
  set public = false, file_size_limit = 52428800,
      allowed_mime_types = array['application/gzip', 'application/sql', 'application/json', 'text/plain',
                                 'text/markdown'];
