-- Rollback of kb/migrations/2026-11-20_commons_handover.sql (hand it over in place, 2026-11-20).
--
-- It closes the surface at once and keeps what people handed over. A hand-over is person-entered data, so this file
-- removes the table and the bucket only while each is EMPTY; where rows or files exist it leaves them in place,
-- unreachable by any API role, for a person to decide on (CLAUDE.md, the ask test: a delete of person-entered data).
--
-- With rows or files in place: read them out first (the service key reads both), then drop the table and empty the
-- bucket through the Storage API (POST /storage/v1/bucket/commons-handover/empty, then DELETE
-- /storage/v1/bucket/commons-handover) on Sam's word.

-- 1. Close the three functions: nothing can be added, answered or counted.
drop function if exists public.commons_handover_add(jsonb);
drop function if exists public.commons_handover_mark(uuid, text, text, text, jsonb);
drop function if exists public.commons_handover_summary();

-- 2. Close the upload.
drop policy if exists "commons handover add" on storage.objects;

-- 3. Close the reviewer read; the table then answers the service role alone.
drop policy if exists commons_handover_reviewer_read on public.commons_handover;
revoke all on public.commons_handover from public, anon, authenticated;

-- 4. Remove the table and the bucket only while empty.
do $rb$
begin
  if to_regclass('public.commons_handover') is not null then
    if not exists (select 1 from public.commons_handover) then
      drop table public.commons_handover;
    else
      raise notice 'commons_handover holds rows: the table is kept, closed to every API role';
    end if;
  end if;
end
$rb$;

delete from storage.buckets b
 where b.id = 'commons-handover'
   and not exists (select 1 from storage.objects o where o.bucket_id = 'commons-handover');

select to_regclass('public.commons_handover') is not null as table_kept,
       exists (select 1 from storage.buckets where id = 'commons-handover') as bucket_kept;

-- Applied: supabase-migrate run 44789876384 created the bucket, the table and the three functions on 2026-11-20
-- (ledger version 20261120180930). Its receipt is kb/receipts/migration_commons_handover_44789876384.json; a live
-- read the same hour showed one storage policy (a reviewer's INSERT), the reviewer read on the table, and no
-- insert, update, delete or mark for an API role.
