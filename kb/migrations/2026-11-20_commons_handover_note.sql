-- commons_handover, a fifth kind: a note (Sam, 2026-11-20, in session: "the hand-over panel needs a place to leave a
-- note. I got to Ohlone's BRDC 127A, 127B, 127C and 127D and they are not in the catalog, but there is no place for
-- me to note that."; cpl_memory r-handover-note-sam-2026-11-20).
--
-- WHAT. The hand-over box (commons_handover.js) gains "Leave a note": the person's words, one box to say a course is
-- not in the current catalog, and where they looked. A note is one row here, kind 'note', through
-- commons_handover_add(), which stamps the reviewer's name from the sign-in as it does for every other kind.
--
-- WHO READS IT. A reviewer (the table's own read). A note can name a person, so its words never reach
-- commons_handover_summary(), which counts a note as it counts any kind: by dataset, college, course code, kind and
-- status. The reader's pickup does not open a note; a session reads it and answers with commons_handover_mark().
--
-- "Not in the current catalog" is a box of its own so the no-longer-offered check can read it as its catalog factor
-- without parsing a sentence (r-no-longer-offered-sam-2026-11-20: nothing is set aside on a note alone).
--
-- Rollback: kb/migrations/2026-11-20_commons_handover_note_rollback.sql.

-- 1. The column, and the two checks that name the kinds.
alter table public.commons_handover add column if not exists note jsonb;

alter table public.commons_handover drop constraint if exists commons_handover_kind_ck;
alter table public.commons_handover add constraint commons_handover_kind_ck
  check (kind in ('file', 'link', 'paste', 'api', 'note'));

alter table public.commons_handover drop constraint if exists commons_handover_payload_ck;
alter table public.commons_handover add constraint commons_handover_payload_ck check (
  (kind = 'file'  and file_path is not null and link_url is null and pasted is null and api is null and note is null) or
  (kind = 'link'  and link_url is not null and file_path is null and pasted is null and api is null and note is null) or
  (kind = 'paste' and pasted is not null and file_path is null and link_url is null and api is null and note is null) or
  (kind = 'api'   and api is not null and file_path is null and link_url is null and pasted is null and note is null) or
  (kind = 'note'  and note is not null and file_path is null and link_url is null and pasted is null and api is null));

-- 2. The one way a row is added, with the note beside the four kinds it already took.
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
  v_note    jsonb := p -> 'note';
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
    v_link := null; v_pasted := null; v_api := null; v_note := null;
  elsif v_kind = 'link' then
    if v_link is null or length(v_link) > 2000 or v_link !~* '^https?://[^[:space:]/]+\.[^[:space:]]+$' then
      raise exception 'commons_handover_add: give a full web address that starts with https://' using errcode = '22023';
    end if;
    v_path := null; v_pasted := null; v_api := null; v_note := null;
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
    v_path := null; v_link := null; v_api := null; v_note := null;
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
    v_path := null; v_link := null; v_pasted := null; v_note := null;
  elsif v_kind = 'note' then
    -- The person's words, the not-in-the-catalog box (a course's alone), and where they looked.
    if v_note is null or jsonb_typeof(v_note) <> 'object' or length(v_note::text) > 4000 then
      raise exception 'commons_handover_add: the note is missing or too long' using errcode = '22023';
    end if;
    for k in select jsonb_object_keys(v_note) loop
      if k not in ('text', 'not_in_catalog', 'source_url') then
        raise exception 'commons_handover_add: the note has a field this table does not take (%)', k using errcode = '22023';
      end if;
    end loop;
    if v_note ? 'text' and jsonb_typeof(v_note -> 'text') <> 'string' then
      raise exception 'commons_handover_add: the note''s words are not text' using errcode = '22023';
    end if;
    if v_note ? 'not_in_catalog' and ((v_note -> 'not_in_catalog') <> 'true'::jsonb or coalesce(v_subject, '') <> 'course') then
      raise exception 'commons_handover_add: not in the catalog is a course''s box, checked or left out' using errcode = '22023';
    end if;
    if v_note ? 'source_url' and (jsonb_typeof(v_note -> 'source_url') <> 'string'
       or coalesce(v_note ->> 'source_url', '') !~* '^https?://[^[:space:]/]+\.[^[:space:]]+$') then
      raise exception 'commons_handover_add: give where you looked as a full web address, or leave it empty' using errcode = '22023';
    end if;
    if coalesce(btrim(v_note ->> 'text'), '') = '' and not (v_note ? 'not_in_catalog') then
      raise exception 'commons_handover_add: write the note first' using errcode = '22023';
    end if;
    v_path := null; v_link := null; v_pasted := null; v_api := null;
  else
    raise exception 'commons_handover_add: kind must be file, link, paste, api or note' using errcode = '22023';
  end if;

  insert into public.commons_handover
    (handed_by, dataset, subject_kind, college, course_code, course_title, control_number, mid_card, kind,
     file_path, file_name, file_type, file_bytes, link_url, pasted, api, note)
  values
    (v_email, p ->> 'dataset', v_subject, nullif(btrim(coalesce(p ->> 'college', '')), ''),
     nullif(btrim(coalesce(p ->> 'course_code', '')), ''), nullif(btrim(coalesce(p ->> 'course_title', '')), ''),
     nullif(btrim(coalesce(p ->> 'control_number', '')), ''), nullif(btrim(coalesce(p ->> 'mid_card', '')), ''),
     v_kind, v_path,
     case when v_kind = 'file' then nullif(btrim(coalesce(p ->> 'file_name', '')), '') end,
     case when v_kind = 'file' then nullif(btrim(coalesce(p ->> 'file_type', '')), '') end,
     case when v_kind = 'file' and (p ->> 'file_bytes') ~ '^[0-9]{1,12}$' then (p ->> 'file_bytes')::bigint end,
     v_link, v_pasted, v_api, v_note)
  returning id into v_id;
  return jsonb_build_object('id', v_id, 'status', 'waiting');
end
$fn$;

grant execute on function public.commons_handover_add(jsonb) to authenticated, service_role;
revoke execute on function public.commons_handover_add(jsonb) from public, anon;

-- 3. The migration refuses to stand if a grant moved or a row broke the new check (Rule 10 b2).
do $chk$
begin
  if has_function_privilege('anon', 'public.commons_handover_add(jsonb)', 'execute') then
    raise exception 'commons_handover_add is open to anon';
  end if;
  if not has_function_privilege('authenticated', 'public.commons_handover_add(jsonb)', 'execute') then
    raise exception 'commons_handover_add is closed to a signed-in reviewer';
  end if;
  if not has_function_privilege('service_role', 'public.commons_handover_add(jsonb)', 'execute') then
    raise exception 'commons_handover_add is closed to the service role';
  end if;
  if has_table_privilege('anon', 'public.commons_handover', 'select')
     or has_table_privilege('authenticated', 'public.commons_handover', 'insert')
     or has_table_privilege('authenticated', 'public.commons_handover', 'update')
     or has_table_privilege('authenticated', 'public.commons_handover', 'delete') then
    raise exception 'commons_handover grants an API role more than a reviewer read';
  end if;
  if exists (select 1 from public.commons_handover where kind <> 'note' and note is not null) then
    raise exception 'a row that is no note carries one';
  end if;
end
$chk$;

select 'commons_handover note' as surface,
       (select count(*) from public.commons_handover) as rows,
       (select count(*) from public.commons_handover where kind = 'note') as notes,
       has_function_privilege('anon', 'public.commons_handover_add(jsonb)', 'execute') as anon_may_add,
       has_function_privilege('authenticated', 'public.commons_handover_add(jsonb)', 'execute') as reviewer_may_add,
       (select pg_get_constraintdef(c.oid) like '%note%' from pg_constraint c where c.conname = 'commons_handover_kind_ck') as kind_takes_note;
