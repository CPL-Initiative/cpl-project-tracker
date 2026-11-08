-- 2026-11-07 (S602 SkySombrero): security step 3, COBIx item 9 (docs/security/cobix_round1_reply_2026-11-05.md).
-- Sam, Open Asks Sheet 167 card 4: go on steps 3 to 5, each applied on his word. Not applied by this commit:
-- kb/migrations/.apply names it only when he gives that word.
--
-- Before (read live 2026-11-07): tmc_submissions_anon_update is `using (true)`, so any visitor can rewrite any
-- college's draft, and anon holds table-wide SELECT, INSERT, UPDATE, DELETE, TRUNCATE, TRIGGER and REFERENCES.
-- The table holds 0 rows, so nothing is backfilled and no saved draft loses its owner.
--
-- After: the browser that first saves a draft mints owner_token (tmc_builder.js), sends it in the x-tmc-token
-- header, and the UPDATE policy matches it. anon cannot SELECT owner_token (a token anyone can read protects
-- nothing), so SELECT becomes a column grant of every other column; the client names its columns on every read
-- and on the upsert's RETURNING. Reviewer actions keep going through tmc_review_submission() (SECURITY DEFINER).
-- TRUNCATE, TRIGGER and REFERENCES come off anon and authenticated: no client uses them, and TRUNCATE ignores RLS.
-- ROLLBACK: kb/migrations/2026-11-07_tmc_submissions_owner_token_rollback.sql

alter table public.tmc_submissions add column if not exists owner_token uuid;

-- The caller's x-tmc-token header as a uuid, or null when absent or malformed (a bad cast must never raise
-- inside a policy). Callable by anon on purpose: it returns only the caller's own header.
create or replace function public.tmc_request_token()
 returns uuid
 language sql
 stable
 set search_path to 'pg_catalog'
as $function$
  select case when h ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then h::uuid end
  from (select nullif(current_setting('request.headers', true), '')::json ->> 'x-tmc-token' as h) s;
$function$;

drop policy if exists tmc_submissions_anon_update on public.tmc_submissions;
create policy tmc_submissions_owner_update on public.tmc_submissions
  for update to anon
  using (owner_token is not null and owner_token = public.tmc_request_token())
  with check (status = any (array['draft'::text, 'submitted'::text])
              and owner_token = public.tmc_request_token());

drop policy if exists tmc_submissions_anon_insert on public.tmc_submissions;
create policy tmc_submissions_anon_insert on public.tmc_submissions
  for insert to anon
  with check (status = any (array['draft'::text, 'submitted'::text])
              and owner_token is not null
              and owner_token = public.tmc_request_token());

revoke select, truncate, trigger, references on public.tmc_submissions from anon, authenticated;
grant select (id, college, tmc_id, tmc_discipline, degree_type, alignments, notes, contact_name, contact_email,
              status, total_major_units, filled_slots, total_slots, created_at, updated_at, review_note,
              reviewed_by, reviewed_at)
  on public.tmc_submissions to anon, authenticated;
