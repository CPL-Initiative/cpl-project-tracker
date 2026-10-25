-- ============================================================================
-- Implementation Funding: what the noncredit builder reads (Scenario 4)
-- Session S471 SkyPenstemon, 2026-10-25. Applied through supabase-migrate.yml
-- (kb/migrations/.apply) to project hvuwhnbuahrtptokpqfh; this file is the SQL
-- of record. Idempotent: safe to re-run.
--
-- WHAT THIS DOES
--   Scenario 4 releases each noncredit share on two counted outcomes (Sam's Open
--   Asks Sheets 113 and 114, 2026-10-22): NC-1 exhibits built or adopted for the
--   noncredit program's learning, against a target of the greater of 2 and 5% of
--   the institution's CDCP noncredit courses, capped at 10; NC-2 a noncredit CPL
--   portfolio-development course chaptered in a CDCP program. Until the daily
--   artifact carries nc_exh, nc_cdcp and nc_course, both read TBA and $0.
--
--   This function returns the sets the builder matches; the matching (roster
--   names, a standalone's district colleges, the attested tokens) is Python,
--   funding/_build_funding_performance.py, so a test can run it from a fixture:
--     institutions       every COCI college whose courses carry a funding
--                        category: its CDCP course count and CDCP titles
--     exhibits           every MAP exhibit, keyed by id or title (61 carry no
--                        id), with its normalized title and the normalized
--                        titles of its target credit courses
--     attestations       this fiscal year's standing attestations: the exhibits
--                        and the portfolio course the strike team named
--     portfolio_courses  each attested control number COCI confirms: a CDCP
--                        course in an active noncredit program at that college
--   The mirror rule is S449's (title_norm equal at the same college), measured
--   on Cabrillo in funding/nc_outcome_feasibility/2026-10-24_cabrillo/.
--
-- PRIVACY: catalog counts only. The function reads the attestation's
--   reviewer-only columns (the exhibits, the course), so it is closed to anon
--   and authenticated and runs for the service role alone (the daily build).
--   It returns no attestor, no email and no award count.
-- ============================================================================

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
  -- A join, never a subquery per exhibit: 2,400 exhibits against 142,000 courses
  -- ran past a minute that way (S471).
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

-- Closed to everyone but the daily build (CLAUDE.md Rule 10 b2: PUBLIC holds
-- EXECUTE from creation and default privileges grant anon by name).
revoke all on function public.cpl_funding_nc_counts() from public, anon, authenticated;
grant execute on function public.cpl_funding_nc_counts() to service_role;
