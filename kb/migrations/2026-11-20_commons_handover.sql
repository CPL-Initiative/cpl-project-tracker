-- commons_handover: hand it over in place (Sam, 2026-11-20, in session, on the locked Commons order mock: "yes,
-- build it!"; cpl_memory r-hand-over-in-place-sam-2026-11-20: "item or link and a try the link button" and "need to
-- be able to do this for all our commons datasets").
--
-- WHAT. A signed-in reviewer opens a course or a college in a side panel on the CPL Commons or College Data
-- Collection and hands over what they hold: a file (dropped or chosen), a link to try, the data itself (pasted), or
-- an API procedure. commons_handover.js writes one row here for each, through commons_handover_add(). The reader's
-- pickup on the runner (kb/_handover_pickup.py, commons-handover-pickup.yml) visits the link or opens the file and
-- answers on the row through commons_handover_mark().
--
-- THE SIGN-IN RULE. A reviewer's own sign-in, never the team phrase: Storage cannot check the phrase, and a
-- hand-over is filed under a person's name. commons_handover_add() stamps handed_by from the sign-in; the page
-- never sends it.
--
-- PRIVATE. A course outline can name faculty, so the file stays private and only parsed outcomes are ever filed in
-- the repository or the outcomes table. The bucket takes a reviewer's upload and gives no API role a read, a change
-- or a delete; the runner reads it with the service key. A row names who handed it over, so only a signed-in
-- reviewer reads the table. commons_handover_summary() is the public read: counts by college, course code, kind and
-- status, with no person, no file name, no address and no text.
--
-- GOVERNANCE (Rule 10 a3): decision right DR-35 in kb/governance_register.json; every surface below is mapped to it
-- in kb/governance_surface_map.json. No student data is touched (the student-detail disclosure ADR does not reach
-- it).
--
-- Idempotent. Rollback: kb/migrations/2026-11-20_commons_handover_rollback.sql.

-- 1. The private store. 50 MB an object: a college's outline packet or a term course file fits; a larger one goes
--    by a link. PDF, a saved web page, plain text, CSV, a spreadsheet, a Word file or a zip of those.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('commons-handover', 'commons-handover', false, 52428800,
        array['application/pdf', 'text/html', 'text/plain', 'text/csv', 'application/zip',
              'application/vnd.ms-excel',
              'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
              'application/msword',
              'application/vnd.openxmlformats-officedocument.wordprocessingml.document'])
on conflict (id) do update
  set public = false, file_size_limit = 52428800,
      allowed_mime_types = array['application/pdf', 'text/html', 'text/plain', 'text/csv', 'application/zip',
                                 'application/vnd.ms-excel',
                                 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                                 'application/msword',
                                 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

-- A signed-in reviewer may add a file. No policy lets an API role read, change or remove one.
drop policy if exists "commons handover add" on storage.objects;
create policy "commons handover add" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'commons-handover' and public.is_allowed_reviewer());

-- 2. The hand-over table: one row per thing handed over.
create table if not exists public.commons_handover (
  id             uuid primary key default gen_random_uuid(),
  created_at     timestamptz not null default now(),
  handed_by      text not null,
  dataset        text not null,
  subject_kind   text not null,
  college        text,
  course_code    text,
  course_title   text,
  control_number text,
  mid_card       text,
  kind           text not null,
  file_path      text,
  file_name      text,
  file_type      text,
  file_bytes     bigint,
  link_url       text,
  pasted         jsonb,
  api            jsonb,
  status         text not null default 'waiting',
  status_note    text,
  status_at      timestamptz,
  status_run     text,
  found          jsonb,
  constraint commons_handover_dataset_ck check (dataset in
    ('course_outlines', 'catalog', 'programs', 'term_reports', 'exhibits', 'credit_recommendations', 'credentials')),
  constraint commons_handover_subject_ck check (subject_kind in ('course', 'college', 'dataset')),
  constraint commons_handover_kind_ck check (kind in ('file', 'link', 'paste', 'api')),
  constraint commons_handover_status_ck check (status in
    ('waiting', 'reads', 'bot_check', 'could_not_read', 'filed', 'set_aside')),
  constraint commons_handover_payload_ck check (
    (kind = 'file'  and file_path is not null and link_url is null and pasted is null and api is null) or
    (kind = 'link'  and link_url is not null and file_path is null and pasted is null and api is null) or
    (kind = 'paste' and pasted is not null and file_path is null and link_url is null and api is null) or
    (kind = 'api'   and api is not null and file_path is null and link_url is null and pasted is null)),
  constraint commons_handover_college_ck check (subject_kind = 'dataset' or length(btrim(coalesce(college, ''))) > 0),
  constraint commons_handover_course_ck check (subject_kind <> 'course' or length(btrim(coalesce(course_code, ''))) > 0)
);
create index if not exists commons_handover_status_idx on public.commons_handover (status, created_at);
create index if not exists commons_handover_subject_idx on public.commons_handover (college, course_code);

comment on table public.commons_handover is
  'Hand it over in place (Sam, 2026-11-20): what a signed-in reviewer handed over for a Commons dataset, one row each. Written only by commons_handover_add(); answered only by commons_handover_mark() (the runner). Reviewer read; the public reads commons_handover_summary().';
comment on column public.commons_handover.handed_by is 'The reviewer''s sign-in address, stamped by commons_handover_add(). Never sent by the page.';
comment on column public.commons_handover.found is 'What the reader found: counts and heading words only. Never a page''s text and never a person''s name.';

alter table public.commons_handover enable row level security;
drop policy if exists commons_handover_reviewer_read on public.commons_handover;
create policy commons_handover_reviewer_read on public.commons_handover
  for select to authenticated using (public.is_allowed_reviewer());

revoke all on public.commons_handover from public, anon, authenticated;
grant select on public.commons_handover to authenticated;
grant select, insert, update on public.commons_handover to service_role;

-- 3. The one way a row is added. Security definer: it checks the reviewer, checks the payload and stamps the name.
create or replace function public.commons_handover_add(p jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_email   text := lower(coalesce(auth.jwt() ->> 'email', ''));
  v_kind    text := p ->> 'kind';
  v_subject text := p ->> 'subject_kind';
  v_link    text := nullif(btrim(coalesce(p ->> 'link_url', '')), '');
  v_path    text := nullif(btrim(coalesce(p ->> 'file_path', '')), '');
  v_pasted  jsonb := p -> 'pasted';
  v_api     jsonb := p -> 'api';
  v_id      uuid;
  k         text;
begin
  if v_email = '' or not public.is_allowed_reviewer() then
    raise exception 'commons_handover_add: sign in as a reviewer to hand something over' using errcode = '42501';
  end if;
  if p is null or jsonb_typeof(p) <> 'object' then
    raise exception 'commons_handover_add: the hand-over is not an object' using errcode = '22023';
  end if;
  if length(coalesce(p ->> 'college', '')) > 200 or length(coalesce(p ->> 'course_code', '')) > 60
     or length(coalesce(p ->> 'course_title', '')) > 300 or length(coalesce(p ->> 'control_number', '')) > 40
     or length(coalesce(p ->> 'mid_card', '')) > 40 or length(coalesce(p ->> 'file_name', '')) > 300 then
    raise exception 'commons_handover_add: a name is too long' using errcode = '22023';
  end if;

  if v_kind = 'file' then
    -- The page uploads first, then names the object. The row may only name a file that is in the store.
    if v_path is null or v_path !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}/[0-9a-f-]{36}/[A-Za-z0-9._-]{1,200}$' then
      raise exception 'commons_handover_add: the file path is not one the page makes' using errcode = '22023';
    end if;
    if not exists (select 1 from storage.objects o where o.bucket_id = 'commons-handover' and o.name = v_path) then
      raise exception 'commons_handover_add: no such file in the store' using errcode = '22023';
    end if;
    v_link := null; v_pasted := null; v_api := null;
  elsif v_kind = 'link' then
    if v_link is null or length(v_link) > 2000 or v_link !~* '^https?://[^[:space:]/]+\.[^[:space:]]+$' then
      raise exception 'commons_handover_add: give a full web address that starts with https://' using errcode = '22023';
    end if;
    v_path := null; v_pasted := null; v_api := null;
  elsif v_kind = 'paste' then
    if v_pasted is null or jsonb_typeof(v_pasted) <> 'object' or length(v_pasted::text) > 60000 then
      raise exception 'commons_handover_add: the pasted data is missing or too long' using errcode = '22023';
    end if;
    for k in select jsonb_object_keys(v_pasted) loop
      if k not in ('description', 'hours', 'slos', 'objectives', 'source_url') then
        raise exception 'commons_handover_add: the pasted data has a field this table does not take (%)', k using errcode = '22023';
      end if;
    end loop;
    if coalesce(btrim(v_pasted ->> 'description'), '') = '' and coalesce(btrim(v_pasted ->> 'hours'), '') = ''
       and coalesce(jsonb_array_length(case when jsonb_typeof(v_pasted -> 'slos') = 'array' then v_pasted -> 'slos' end), 0) = 0
       and coalesce(jsonb_array_length(case when jsonb_typeof(v_pasted -> 'objectives') = 'array' then v_pasted -> 'objectives' end), 0) = 0 then
      raise exception 'commons_handover_add: paste a description, hours or outcomes first' using errcode = '22023';
    end if;
    v_path := null; v_link := null; v_api := null;
  elsif v_kind = 'api' then
    if v_api is null or jsonb_typeof(v_api) <> 'object' or length(v_api::text) > 8000
       or coalesce(v_api ->> 'which', '') not in ('catalog', 'course_outline', 'term_report')
       or coalesce(v_api ->> 'address', '') !~* '^https?://[^[:space:]/]+\.[^[:space:]]+$' then
      raise exception 'commons_handover_add: give the API address first, starting with https://' using errcode = '22023';
    end if;
    for k in select jsonb_object_keys(v_api) loop
      if k not in ('which', 'address', 'procedure', 'test') then
        raise exception 'commons_handover_add: the API procedure has a field this table does not take (%)', k using errcode = '22023';
      end if;
    end loop;
    v_path := null; v_link := null; v_pasted := null;
  else
    raise exception 'commons_handover_add: kind must be file, link, paste or api' using errcode = '22023';
  end if;

  insert into public.commons_handover
    (handed_by, dataset, subject_kind, college, course_code, course_title, control_number, mid_card, kind,
     file_path, file_name, file_type, file_bytes, link_url, pasted, api)
  values
    (v_email, p ->> 'dataset', v_subject, nullif(btrim(coalesce(p ->> 'college', '')), ''),
     nullif(btrim(coalesce(p ->> 'course_code', '')), ''), nullif(btrim(coalesce(p ->> 'course_title', '')), ''),
     nullif(btrim(coalesce(p ->> 'control_number', '')), ''), nullif(btrim(coalesce(p ->> 'mid_card', '')), ''),
     v_kind, v_path,
     case when v_kind = 'file' then nullif(btrim(coalesce(p ->> 'file_name', '')), '') end,
     case when v_kind = 'file' then nullif(btrim(coalesce(p ->> 'file_type', '')), '') end,
     case when v_kind = 'file' and (p ->> 'file_bytes') ~ '^[0-9]{1,12}$' then (p ->> 'file_bytes')::bigint end,
     v_link, v_pasted, v_api)
  returning id into v_id;
  return jsonb_build_object('id', v_id, 'status', 'waiting');
end
$fn$;

grant execute on function public.commons_handover_add(jsonb) to authenticated, service_role;
revoke execute on function public.commons_handover_add(jsonb) from public, anon;

-- 4. The one way a row is answered: the runner's reader says what it found. Service role alone.
create or replace function public.commons_handover_mark(p_id uuid, p_status text, p_note text, p_run text, p_found jsonb)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $fn$
declare v_n int;
begin
  if p_status not in ('reads', 'bot_check', 'could_not_read', 'filed', 'set_aside', 'waiting') then
    raise exception 'commons_handover_mark: unknown status %', p_status using errcode = '22023';
  end if;
  if length(coalesce(p_note, '')) > 600 or length(coalesce(p_found::text, '')) > 6000 then
    raise exception 'commons_handover_mark: the note or what was found is too long' using errcode = '22023';
  end if;
  update public.commons_handover
     set status = p_status, status_note = nullif(btrim(coalesce(p_note, '')), ''), status_at = now(),
         status_run = nullif(btrim(coalesce(p_run, '')), ''), found = p_found
   where id = p_id;
  get diagnostics v_n = row_count;
  return jsonb_build_object('id', p_id, 'status', p_status, 'rows', v_n);
end
$fn$;

grant execute on function public.commons_handover_mark(uuid, text, text, text, jsonb) to service_role;
revoke execute on function public.commons_handover_mark(uuid, text, text, text, jsonb) from public, anon, authenticated;

-- 5. The public read: counts only. No person, no file name, no address, no text.
create or replace function public.commons_handover_summary()
returns table (dataset text, subject_kind text, college text, course_code text, kind text, status text, n bigint, newest date)
language sql
stable
security definer
set search_path = public
as $fn$
  select h.dataset, h.subject_kind, h.college, h.course_code, h.kind, h.status, count(*)::bigint, max(h.created_at)::date
    from public.commons_handover h
   group by 1, 2, 3, 4, 5, 6
$fn$;

grant execute on function public.commons_handover_summary() to anon, authenticated, service_role;
revoke execute on function public.commons_handover_summary() from public;

-- 6. The migration refuses to stand if either half of a grant is wrong (Rule 10 b2).
do $chk$
begin
  if has_function_privilege('anon', 'public.commons_handover_add(jsonb)', 'execute') then
    raise exception 'commons_handover_add is open to anon';
  end if;
  if not has_function_privilege('authenticated', 'public.commons_handover_add(jsonb)', 'execute') then
    raise exception 'commons_handover_add is closed to a signed-in reviewer';
  end if;
  if has_function_privilege('anon', 'public.commons_handover_mark(uuid, text, text, text, jsonb)', 'execute')
     or has_function_privilege('authenticated', 'public.commons_handover_mark(uuid, text, text, text, jsonb)', 'execute') then
    raise exception 'commons_handover_mark is open to an API role';
  end if;
  if not has_function_privilege('service_role', 'public.commons_handover_mark(uuid, text, text, text, jsonb)', 'execute') then
    raise exception 'commons_handover_mark is closed to the service role';
  end if;
  if has_table_privilege('anon', 'public.commons_handover', 'select')
     or has_table_privilege('authenticated', 'public.commons_handover', 'insert')
     or has_table_privilege('authenticated', 'public.commons_handover', 'update')
     or has_table_privilege('authenticated', 'public.commons_handover', 'delete') then
    raise exception 'commons_handover grants an API role more than a reviewer read';
  end if;
  if exists (select 1 from storage.buckets where id = 'commons-handover' and public) then
    raise exception 'the commons-handover bucket is public';
  end if;
  if (select count(*) from pg_policies where schemaname = 'storage' and tablename = 'objects'
        and (coalesce(qual, '') like '%commons-handover%' or coalesce(with_check, '') like '%commons-handover%')) <> 1 then
    raise exception 'the commons-handover bucket should carry exactly one policy, the reviewer upload';
  end if;
end
$chk$;

select 'commons_handover' as surface,
       (select count(*) from public.commons_handover) as rows,
       (select public from storage.buckets where id = 'commons-handover') as bucket_public,
       has_function_privilege('anon', 'public.commons_handover_add(jsonb)', 'execute') as anon_may_add,
       has_function_privilege('authenticated', 'public.commons_handover_add(jsonb)', 'execute') as reviewer_may_add,
       has_function_privilege('anon', 'public.commons_handover_summary()', 'execute') as anon_reads_summary,
       has_function_privilege('authenticated', 'public.commons_handover_mark(uuid, text, text, text, jsonb)', 'execute') as api_may_mark;
