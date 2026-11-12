-- ============================================================================
-- chatbox_exhibits: a nightly refresh from the daily MAP pull, with the mode of
-- learning; and the noncredit exhibit count reads that mode.
-- 2026-11-12. Idempotent: safe to re-run. Rollback beside this file.
--
-- WHY
--   chatbox_exhibits was loaded once (about May 2026: 2,397 rows, 59 colleges)
--   and never refreshed. Sierra searches it, and since S471 the funding model's
--   noncredit exhibit count (cpl_funding_nc_counts) reads it. Malone found the
--   cost on 2026-11-12: Las Positas showed 9 noncredit exhibits on the public
--   funding page while MAP lists 47 with the Noncredit mode of learning. 30 of
--   the 47 were not in the table, and the other 17 sat under their old titles.
--   Sam, in session 2026-11-12: all three steps (the count reads the daily pull,
--   it reads the mode of learning, and the table refreshes nightly).
--
-- WHAT THIS DOES
--   1. Two columns on chatbox_exhibits: learning_mode (MAP's "CPL Mode of
--      Learning", e.g. "Noncredit, community education, and contract education
--      coursework (N)"), courses (every target course; sample_courses keeps its
--      five for Sierra) and synced_at.
--   2. A snapshot of the table as it stood, chatbox_exhibits_pre_refresh_20261112:
--      the rollback's source (CLAUDE.md Rule 10 a2).
--   3. A staging table and two service-role functions. The daily build stages
--      the pull in chunks (chatbox_exhibits_stage), then promotes it in ONE
--      transaction (chatbox_exhibits_promote): changed rows update, new rows
--      insert, rows MAP no longer lists delete. A promote the database cancels
--      rolls back whole, so Sierra never reads a half-loaded table (the
--      2026-09-18 offerings lesson, chatbox/sync_coci_offerings.py).
--      The promote FAILS CLOSED on a short pull: fewer rows than sent, fewer
--      than 2,000, fewer than 50 colleges, or under 70% of the live table.
--   4. cpl_funding_nc_counts() returns nc_mode per exhibit (true when MAP lists
--      the Noncredit mode) and matches on every target course, not five.
--
-- PRIVACY: exhibit catalog rows only (college, title, courses, credit
--   recommendations). No student, no staff name, no count of people.
-- ============================================================================

alter table public.chatbox_exhibits add column if not exists learning_mode text;
alter table public.chatbox_exhibits add column if not exists courses text[];
alter table public.chatbox_exhibits add column if not exists synced_at timestamptz;

-- The table as it stood before the first refresh: the rollback restores from it.
do $$
begin
  if to_regclass('public.chatbox_exhibits_pre_refresh_20261112') is null then
    create table public.chatbox_exhibits_pre_refresh_20261112 as
      select id, college, exhibit_title, exhibit_id, cpl_type, collaborative_type, top_code,
             rec_count, sample_courses, sample_credit_recs, discipline
      from public.chatbox_exhibits;
  end if;
end $$;
alter table public.chatbox_exhibits_pre_refresh_20261112 enable row level security;
revoke all on table public.chatbox_exhibits_pre_refresh_20261112 from public, anon, authenticated;

create table if not exists public.stg_chatbox_exhibits (
  college text not null,
  exhibit_title text not null,
  exhibit_id text,
  cpl_type text,
  collaborative_type text,
  top_code text,
  rec_count integer,
  sample_courses text[],
  sample_credit_recs text[],
  discipline text,
  learning_mode text,
  courses text[],
  primary key (college, exhibit_title)
);
alter table public.stg_chatbox_exhibits enable row level security;
revoke all on table public.stg_chatbox_exhibits from public, anon, authenticated;
grant select, insert, update, delete, truncate on table public.stg_chatbox_exhibits to service_role;

-- Stage one chunk of the pull. The first chunk of a run empties the staging table.
create or replace function public.chatbox_exhibits_stage(p_rows jsonb, p_truncate boolean default false)
returns integer language plpgsql set search_path = ''
as $$
declare n integer;
begin
  if p_truncate then
    truncate table public.stg_chatbox_exhibits;
  end if;
  insert into public.stg_chatbox_exhibits
    (college, exhibit_title, exhibit_id, cpl_type, collaborative_type, top_code, rec_count,
     sample_courses, sample_credit_recs, discipline, learning_mode, courses)
  select btrim(r->>'college'), btrim(r->>'exhibit_title'), nullif(btrim(r->>'exhibit_id'), ''),
         nullif(r->>'cpl_type', ''), nullif(r->>'collaborative_type', ''), r->>'top_code',
         coalesce((r->>'rec_count')::integer, 1),
         coalesce((select array_agg(v) from jsonb_array_elements_text(r->'sample_courses') v), '{}'),
         coalesce((select array_agg(v) from jsonb_array_elements_text(r->'sample_credit_recs') v), '{}'),
         nullif(r->>'discipline', ''), nullif(r->>'learning_mode', ''),
         coalesce((select array_agg(v) from jsonb_array_elements_text(r->'courses') v), '{}')
  from jsonb_array_elements(p_rows) r
  where coalesce(btrim(r->>'college'), '') <> '' and coalesce(btrim(r->>'exhibit_title'), '') <> ''
  on conflict (college, exhibit_title) do nothing;
  get diagnostics n = row_count;
  return n;
end;
$$;

-- Promote the staged pull to the live table, in one transaction, or refuse.
create or replace function public.chatbox_exhibits_promote(p_expected integer)
returns jsonb language plpgsql set search_path = ''
as $$
declare
  staged integer; staged_colleges integer; live integer;
  n_ins integer; n_upd integer; n_del integer;
begin
  select count(*), count(distinct college) into staged, staged_colleges from public.stg_chatbox_exhibits;
  select count(*) into live from public.chatbox_exhibits;
  if staged <> p_expected then
    raise exception 'chatbox_exhibits_promote: staging holds % rows, the run sent %', staged, p_expected;
  end if;
  if staged < 2000 or staged_colleges < 50 then
    raise exception 'chatbox_exhibits_promote: a short pull (% rows, % colleges); the live table stands', staged, staged_colleges;
  end if;
  if staged < live * 0.7 then
    raise exception 'chatbox_exhibits_promote: % staged rows against % live (under 70%%); the live table stands', staged, live;
  end if;

  delete from public.chatbox_exhibits e
  where not exists (select 1 from public.stg_chatbox_exhibits s
                    where s.college = e.college and s.exhibit_title = e.exhibit_title);
  get diagnostics n_del = row_count;

  update public.chatbox_exhibits e
  set exhibit_id = s.exhibit_id, cpl_type = s.cpl_type, collaborative_type = s.collaborative_type,
      top_code = s.top_code, rec_count = s.rec_count, sample_courses = s.sample_courses,
      sample_credit_recs = s.sample_credit_recs, discipline = s.discipline,
      learning_mode = s.learning_mode, courses = s.courses, synced_at = now()
  from public.stg_chatbox_exhibits s
  where s.college = e.college and s.exhibit_title = e.exhibit_title
    and (e.exhibit_id, e.cpl_type, e.collaborative_type, e.top_code, e.rec_count, e.sample_courses,
         e.sample_credit_recs, e.discipline, e.learning_mode, e.courses)
        is distinct from
        (s.exhibit_id, s.cpl_type, s.collaborative_type, s.top_code, s.rec_count, s.sample_courses,
         s.sample_credit_recs, s.discipline, s.learning_mode, s.courses);
  get diagnostics n_upd = row_count;

  insert into public.chatbox_exhibits
    (college, exhibit_title, exhibit_id, cpl_type, collaborative_type, top_code, rec_count,
     sample_courses, sample_credit_recs, discipline, learning_mode, courses, synced_at)
  select s.college, s.exhibit_title, s.exhibit_id, s.cpl_type, s.collaborative_type, s.top_code, s.rec_count,
         s.sample_courses, s.sample_credit_recs, s.discipline, s.learning_mode, s.courses, now()
  from public.stg_chatbox_exhibits s
  where not exists (select 1 from public.chatbox_exhibits e
                    where e.college = s.college and e.exhibit_title = s.exhibit_title);
  get diagnostics n_ins = row_count;

  return jsonb_build_object('staged', staged, 'colleges', staged_colleges, 'live_before', live,
                            'inserted', n_ins, 'updated', n_upd, 'deleted', n_del);
end;
$$;

-- Closed to everyone but the daily build (CLAUDE.md Rule 10 b2).
revoke all on function public.chatbox_exhibits_stage(jsonb, boolean) from public, anon, authenticated;
revoke all on function public.chatbox_exhibits_promote(integer) from public, anon, authenticated;
grant execute on function public.chatbox_exhibits_stage(jsonb, boolean) to service_role;
grant execute on function public.chatbox_exhibits_promote(integer) to service_role;

-- The noncredit builder's read: nc_mode per exhibit, and every target course.
-- The SQL of record is kb/supabase_cpl_funding_nc_counts.sql; this is its body.
create or replace function public.cpl_funding_nc_counts()
returns jsonb language sql stable set search_path = ''
as $$
  with cc as (
    select college, subject || ' ' || course_number as code, title_norm, credit_type, control_number,
           credit_type in ('Other Noncredit Enhanced Funding', 'Workforce Preparation Enhanced Funding') as is_cdcp
    from public.chatbox_college_courses
  ),
  inst as (
    select college, count(*) filter (where is_cdcp) as cdcp,
           coalesce(array_agg(distinct title_norm) filter (where is_cdcp and coalesce(title_norm, '') <> ''), '{}') as titles
    from cc where coalesce(credit_type, '') <> '' group by college
  ),
  ex as (
    select college, coalesce(exhibit_id::text, 't:' || exhibit_title) as xid,
           min(exhibit_id::text) as exhibit_id, min(exhibit_title) as title,
           min(public.cpl_course_title_norm(exhibit_title)) as title_norm,
           coalesce(bool_or(learning_mode ~ '\(N\)\s*$'), false) as nc_mode,
           array_agg(distinct code) filter (where code is not null) as codes
    from public.chatbox_exhibits
    left join lateral unnest(case when cardinality(courses) > 0 then courses else sample_courses end) as code on true
    group by 1, 2
  ),
  tgt as (
    select e.college, e.xid, array_agg(distinct t.title_norm) as targets
    from (select college, xid, unnest(codes) as code from ex) e
    join cc t on t.college = e.college and t.code = e.code
     and t.credit_type = 'Credit Course' and coalesce(t.title_norm, '') <> ''
    group by 1, 2
  ),
  ext as (
    select ex.college, ex.xid, ex.exhibit_id, ex.title, ex.title_norm, ex.nc_mode, coalesce(tgt.targets, '{}') as targets
    from ex left join tgt on tgt.college = ex.college and tgt.xid = ex.xid
  ),
  att as (
    select college, status, attested_exhibits, nullif(btrim(portfolio_course), '') as portfolio_course
    from public.cpl_funding_nc_attestation
    where fiscal_year = public.cpl_funding_fy(current_date) and status in ('self_attested', 'confirmed')
  ),
  pcs as (
    select distinct c.college, c.control_number
    from att join cc c on c.control_number = att.portfolio_course and c.is_cdcp
    join public.coci_program_courses p on p.course_control_number = c.control_number and p.college = c.college
    join public.coci_college_programs g on g.control_number = p.program_control_number and g.college = p.college
     and g.award = 'Noncredit program' and g.status in ('Active', 'Approved')
  )
  select jsonb_build_object(
    'fiscal_year', public.cpl_funding_fy(current_date),
    'exhibits_synced_at', (select max(synced_at) from public.chatbox_exhibits),
    'institutions', coalesce((select jsonb_agg(jsonb_build_object('college', college, 'cdcp', cdcp, 'titles', to_jsonb(titles)) order by college) from inst), '[]'),
    'exhibits', coalesce((select jsonb_agg(jsonb_build_object('college', college, 'xid', xid, 'exhibit_id', exhibit_id, 'title', title,
                          'title_norm', title_norm, 'nc_mode', nc_mode, 'targets', to_jsonb(targets)) order by college, xid) from ext), '[]'),
    'attestations', coalesce((select jsonb_agg(jsonb_build_object('college', college, 'status', status,
                          'exhibits', attested_exhibits, 'portfolio_course', portfolio_course) order by college) from att), '[]'),
    'portfolio_courses', coalesce((select jsonb_agg(jsonb_build_object('college', college, 'control_number', control_number)
                          order by college, control_number) from pcs), '[]'));
$$;

revoke all on function public.cpl_funding_nc_counts() from public, anon, authenticated;
grant execute on function public.cpl_funding_nc_counts() to service_role;
