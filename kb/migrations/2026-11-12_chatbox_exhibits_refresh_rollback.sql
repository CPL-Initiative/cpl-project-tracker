-- Rollback for 2026-11-12_chatbox_exhibits_refresh.sql.
-- Restores chatbox_exhibits to the rows it held before the first nightly refresh
-- (the snapshot chatbox_exhibits_pre_refresh_20261112), and puts back the S471
-- body of cpl_funding_nc_counts(). Remove the "Refresh Sierra's exhibit list"
-- step from scripts/daily_build.sh first (git revert the PR), or the next daily
-- run refreshes the table again.

begin;

delete from public.chatbox_exhibits;
insert into public.chatbox_exhibits
  (id, college, exhibit_title, exhibit_id, cpl_type, collaborative_type, top_code,
   rec_count, sample_courses, sample_credit_recs, discipline)
select id, college, exhibit_title, exhibit_id, cpl_type, collaborative_type, top_code,
       rec_count, sample_courses, sample_credit_recs, discipline
from public.chatbox_exhibits_pre_refresh_20261112;

drop function if exists public.chatbox_exhibits_promote(integer);
drop function if exists public.chatbox_exhibits_stage(jsonb, boolean);
drop table if exists public.stg_chatbox_exhibits;

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
           array_agg(distinct code) filter (where code is not null) as codes
    from public.chatbox_exhibits left join lateral unnest(sample_courses) as code on true
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
    select ex.college, ex.xid, ex.exhibit_id, ex.title, ex.title_norm, coalesce(tgt.targets, '{}') as targets
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
    'institutions', coalesce((select jsonb_agg(jsonb_build_object('college', college, 'cdcp', cdcp, 'titles', to_jsonb(titles)) order by college) from inst), '[]'),
    'exhibits', coalesce((select jsonb_agg(jsonb_build_object('college', college, 'xid', xid, 'exhibit_id', exhibit_id, 'title', title,
                          'title_norm', title_norm, 'targets', to_jsonb(targets)) order by college, xid) from ext), '[]'),
    'attestations', coalesce((select jsonb_agg(jsonb_build_object('college', college, 'status', status,
                          'exhibits', attested_exhibits, 'portfolio_course', portfolio_course) order by college) from att), '[]'),
    'portfolio_courses', coalesce((select jsonb_agg(jsonb_build_object('college', college, 'control_number', control_number)
                          order by college, control_number) from pcs), '[]'));
$$;
revoke all on function public.cpl_funding_nc_counts() from public, anon, authenticated;
grant execute on function public.cpl_funding_nc_counts() to service_role;

-- The three added columns hold nothing after the restore; dropping them is optional:
--   alter table public.chatbox_exhibits drop column learning_mode, drop column courses, drop column synced_at;
-- Keep chatbox_exhibits_pre_refresh_20261112 until the refresh has run clean for a month.

commit;
