-- Rollback of kb/migrations/2026-11-20_commons_handover_note.sql (the hand-over's note, 2026-11-20).
--
-- A note is person-entered data, so this file closes the way in and keeps every note already written: the column
-- stays while a note exists, and the checks go back to four kinds only once none does (CLAUDE.md, the ask test: a
-- delete of person-entered data is Sam's call). To finish the rollback with notes in place, read them out first
-- (a reviewer or the service key reads the table), then drop the rows and the column on his word.

-- 1. The add function as kb/migrations/2026-11-20_commons_handover.sql wrote it: four kinds, no note.
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

-- 2. The checks and the column go back only while no note exists.
do $rb$
begin
  if not exists (select 1 from public.commons_handover where kind = 'note' or note is not null) then
    alter table public.commons_handover drop constraint if exists commons_handover_payload_ck;
    alter table public.commons_handover drop constraint if exists commons_handover_kind_ck;
    alter table public.commons_handover drop column if exists note;
    alter table public.commons_handover add constraint commons_handover_kind_ck
      check (kind in ('file', 'link', 'paste', 'api'));
    alter table public.commons_handover add constraint commons_handover_payload_ck check (
      (kind = 'file'  and file_path is not null and link_url is null and pasted is null and api is null) or
      (kind = 'link'  and link_url is not null and file_path is null and pasted is null and api is null) or
      (kind = 'paste' and pasted is not null and file_path is null and link_url is null and api is null) or
      (kind = 'api'   and api is not null and file_path is null and link_url is null and pasted is null));
  else
    raise notice 'commons_handover holds notes: the column and the five-kind checks are kept; no new note can be added';
  end if;
end
$rb$;

select exists (select 1 from information_schema.columns
                where table_schema = 'public' and table_name = 'commons_handover' and column_name = 'note') as note_column_kept,
       (select count(*) from public.commons_handover where kind = 'note') as notes_kept;
