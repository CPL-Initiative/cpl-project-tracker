-- Route CRED-VOLUME + COLLEGE-ADOPT: per-credential student numbers for Sierra
-- and the College Course Credit tab.
--
-- APPLIED LIVE 2026-08-10 via Supabase MCP (migrations:
--   create_map_exhibit_credential_bridge
--   create_map_credential_volume_rollups
--   cred_volume_suppress_whole_row_not_just_students
--   cred_volume_statewide_suppress_whole_row
--   cred_volume_grants_read_only
--   create_search_credential_volume_cred_volume_route
--   create_college_adoption_opportunities_route)
-- Committed so the schema is reproducible and reviewable; re-running is safe.
--
-- ── WHY THIS EXISTS ─────────────────────────────────────────────────────────
-- Asked "how many students statewide are eligible for credit for a CompTIA
-- cert, and for which certs?", Sierra answered that no statewide recommendation
-- had been adopted yet and then listed certs it knew from general world
-- knowledge. MAP holds FOURTEEN CompTIA credentials, TEN of them with statewide
-- ASCCC recommendations. The invented list happened to be correct, which is the
-- most dangerous outcome: nobody catches it, and the next guess is wrong.
--
-- The retrieval layer was NOT at fault - search_statewide_recommendations()
-- returns the right rows for 'comptia'. The real gap was the one Sierra named
-- honestly: it had no per-credential STUDENT numbers, because map_student_credit
-- carries exhibit ids and no credential name.
--
-- ── THE BRIDGE ──────────────────────────────────────────────────────────────
-- Student-grain exhibit ids are per-college (MAPICI-CAC1-1-001 is Long Beach's
-- CompTIA A+, MAPICI-CA-1-001 is West LA's). Folding those into one credential
-- is exactly what the curated raw_variants already does, so layer 1 borrows the
-- curation instead of re-deriving it: 1,886 of 2,050 exhibit ids fold (92%),
-- 13 ambiguous and flagged rather than silently resolved.
--
-- ── THE NUMBER THAT GOVERNS THE DESIGN ──────────────────────────────────────
-- Only ~4% of student rows can be named (22,606 of 537,908; 436 credentials at
-- 36 colleges), because the exhibit corpus covers 59 of MAP's 123 colleges.
-- CompTIA A+ has 21 adopter colleges and 7 reach student grain.
--
-- So every count here is a FLOOR. A consumer printing `students` without
-- `colleges_adopted` states a floor as a total - the same failure as reading
-- "not in this dataset" as zero. The denominator therefore travels WITH the
-- number as a column; it is not left to a caveat in prose.
--
-- Note the deliberate distinction, visible in the data:
--   students_suppressed = true            -> real students, under k=10, withheld
--   colleges_with_student_data = 0        -> genuinely nothing there
-- A blind spot and a zero must never render the same way.
--
-- ── DISCLOSURE CONTROL ──────────────────────────────────────────────────────
-- A materialized view cannot honour the reviewer-only RLS on map_student_credit
-- (MVs run as owner; there is no security_invoker for them). So the MV IS the
-- publication step and the grant IS the access control.
--
-- Suppressing only the student COUNT was not enough and was caught before
-- shipping: a cell with one student and "3.0 potential units" IS that student's
-- record. Under k=10 every measure goes null and the row survives only to say
-- the cell exists. Verified: 0 published measures survive on a suppressed row,
-- in both rollups.

-- ── Layer 1: exhibit_id -> canonical credential ─────────────────────────────
drop materialized view if exists public.map_exhibit_credential cascade;

create materialized view public.map_exhibit_credential as
with pairs as (
  select x.exhibit_id,
         c.unified_title,
         max(case when lower(btrim(x.exhibit_title)) = lower(btrim(c.unified_title))
                  then 1 else 0 end) as exact_title,
         max(c.n_articulation_lines)  as n_lines
  from public.chatbox_exhibits x
  join public.chatbox_credentials c
    on lower(btrim(x.exhibit_title)) = lower(btrim(c.unified_title))
    or exists (select 1 from unnest(c.raw_variants) v
               where lower(btrim(v)) = lower(btrim(x.exhibit_title)))
  where x.exhibit_id is not null and btrim(x.exhibit_id) <> ''
  group by 1, 2
),
ranked as (
  select p.*, count(*) over (partition by p.exhibit_id) as n_candidates from pairs p
)
-- Deterministic: an exact title beats a variant, then the better-articulated
-- credential, then alphabetical. `ambiguous` keeps the 13 near-duplicate
-- catalogue pairs ("AP Physics 1" vs "AP Physics 1: Algebra-Based") VISIBLE.
select distinct on (exhibit_id)
       exhibit_id, unified_title, (n_candidates > 1) as ambiguous
from ranked
order by exhibit_id, exact_title desc, n_lines desc, unified_title;

create unique index map_exhibit_credential_pk on public.map_exhibit_credential (exhibit_id);
create index map_exhibit_credential_title on public.map_exhibit_credential (unified_title);

-- ── Layer 2a: per (credential x college) ────────────────────────────────────
--
-- ⚠️ COMPLEMENTARY SUPPRESSION IS LOAD-BEARING (ADR decision 5). Suppressing
-- the row was necessary and NOT sufficient. This view publishes the per-college
-- components of a statewide total that layer 2b also publishes, and units SUM —
-- so where exactly ONE college cell was hidden, the residual
--     statewide_units - sum(published sibling units)
-- WAS that college's figure, exactly. Measured on the first cut, before the fix:
--     AP Chemistry            755.00 - 695.00 = 60.00   (1 hidden cell of 3)
--     AP Calculus BC          588.00 - 540.00 = 48.00
--     AP 2-D Art and Design    66.00 -  42.00 = 24.00
-- Twelve-plus credentials were in that shape. Hiding one cell of a set that sums
-- to a published total hides nothing.
--
-- Fix: within a credential, if only ONE cell would be suppressed, suppress the
-- SMALLEST published cell alongside it, so two unknowns share the residual and
-- no single college is pinned. Smallest = cheapest real information to lose.
-- Cost measured: 16 complement cells (139 -> 123 published of 543).
-- Standing assertion: `suppressed_cells = 1` must return ZERO rows.
drop materialized view if exists public.map_credential_student_rollup cascade;

create materialized view public.map_credential_student_rollup as
with grain as (
  select k.unified_title, m.college_id,
         count(distinct m.student_key) as students,
         sum(m.potential_credits)      as potential_units,
         sum(m.applied_credits)        as applied_units,
         sum(m.transcribed_credits)    as transcribed_units,
         sum(m.articulated_credits)    as articulated_units,
         sum(m.apprenticeship_credits) as apprenticeship_units,
         count(*) filter (where m.cpl_status_plan = 'Needs Action') as rows_needs_action,
         count(*)                      as rows_total
  from public.map_student_credit m
  join public.map_exhibit_credential k on k.exhibit_id = m.exhibit_id
  group by 1, 2
), flagged as (
  select g.*,
         (g.students < 10) as base_supp,
         count(*) filter (where g.students < 10)
           over (partition by g.unified_title) as n_supp,
         row_number() over (
           partition by g.unified_title, (g.students < 10)
           order by g.students, g.college_id) as rn_in_band
  from grain g
), pub as (
  select f.*,
         (f.base_supp
          or (f.n_supp = 1 and not f.base_supp and f.rn_in_band = 1)) as supp
  from flagged f
)
select p.unified_title, p.college_id, col.college_name,
       c.cpl_types, c.statewide, c.discipline,
       p.supp                                                        as students_suppressed,
       (p.supp and not p.base_supp)                                  as suppressed_as_complement,
       case when not p.supp then p.students end                      as students,
       case when not p.supp then round(p.potential_units,2) end      as potential_units,
       case when not p.supp then round(p.applied_units,2) end        as applied_units,
       case when not p.supp then round(p.transcribed_units,2) end    as transcribed_units,
       case when not p.supp then round(p.articulated_units,2) end    as articulated_units,
       case when not p.supp then round(p.apprenticeship_units,2) end as apprenticeship_units,
       case when not p.supp then p.rows_needs_action end             as rows_needs_action,
       case when not p.supp then p.rows_total end                    as rows_total
from pub p
left join public.chatbox_credentials c on c.unified_title = p.unified_title
left join public.map_colleges col on col.college_id = p.college_id;

create unique index map_credential_student_rollup_pk
  on public.map_credential_student_rollup (unified_title, college_id);
create index map_credential_student_rollup_college
  on public.map_credential_student_rollup (college_id);

-- ── Layer 2b: statewide per credential ──────────────────────────────────────
-- Students counted from the GRAIN, never summed from 2a: one student can hold
-- recommendations at more than one college and would be double-counted.
drop materialized view if exists public.map_credential_volume cascade;

create materialized view public.map_credential_volume as
with grain as (
  select k.unified_title,
         count(distinct m.student_key) as students,
         count(distinct m.college_id)  as colleges_with_data,
         sum(m.potential_credits)      as potential_units,
         sum(m.applied_credits)        as applied_units,
         sum(m.transcribed_credits)    as transcribed_units,
         sum(m.articulated_credits)    as articulated_units,
         count(*) filter (where m.cpl_status_plan = 'Needs Action') as rows_needs_action,
         count(*)                      as rows_total
  from public.map_student_credit m
  join public.map_exhibit_credential k on k.exhibit_id = m.exhibit_id
  group by 1
), pub as (
  select g.*, (g.students < 10) as supp from grain g
)
select c.unified_title, c.issuer, c.statewide, c.ccc_rec, c.discipline, c.cpl_types,
       cardinality(c.adopter_colleges)::integer   as colleges_adopted,
       cardinality(c.potential_colleges)::integer as colleges_potential,
       coalesce(p.colleges_with_data, 0)          as colleges_with_student_data,
       (p.unified_title is null)                  as no_student_data,
       coalesce(p.supp, false)                    as students_suppressed,
       case when not coalesce(p.supp, true) then p.students end                  as students,
       case when not coalesce(p.supp, true) then round(p.potential_units,2) end  as potential_units,
       case when not coalesce(p.supp, true) then round(p.applied_units,2) end    as applied_units,
       case when not coalesce(p.supp, true) then round(p.transcribed_units,2) end as transcribed_units,
       case when not coalesce(p.supp, true) then round(p.articulated_units,2) end as articulated_units,
       case when not coalesce(p.supp, true) then p.rows_needs_action end         as rows_needs_action,
       case when not coalesce(p.supp, true) then p.rows_total end                as rows_total
from public.chatbox_credentials c
left join pub p on p.unified_title = c.unified_title;

create unique index map_credential_volume_pk on public.map_credential_volume (unified_title);
create index map_credential_volume_students on public.map_credential_volume (students desc nulls last);

-- ── Grants: the MV cannot carry RLS, so the grant is the access control ─────
revoke all on public.map_exhibit_credential          from anon, authenticated;
revoke all on public.map_credential_student_rollup   from anon, authenticated;
revoke all on public.map_credential_volume           from anon, authenticated;
grant select on public.map_exhibit_credential        to anon, authenticated, service_role;
grant select on public.map_credential_student_rollup to anon, authenticated, service_role;
grant select on public.map_credential_volume         to anon, authenticated, service_role;

-- ── Route CRED-VOLUME ───────────────────────────────────────────────────────
-- Same four-tier matching and the same MEASURED 0.25 tier-4 floor as CRED-STD
-- ("cpr" matching "Emergency Medical Technician NRE and CPR" is just as wrong
-- here). But the RANKING differs because the route's purpose differs: CRED-STD
-- ranks by standing and filters to statewide; CRED-VOLUME ranks by STUDENTS and
-- does NOT filter, because a locally-articulated credential with real students
-- is a perfectly good answer to a volume question.
drop function if exists public.search_credential_volume(text, integer);

create function public.search_credential_volume(
  asked text,
  result_limit integer default 8
)
returns table (
  unified_title              text,
  issuer                     text,
  statewide                  boolean,
  discipline                 text,
  cpl_types                  text[],
  students                   integer,
  students_suppressed        boolean,
  no_student_data            boolean,
  colleges_adopted           integer,
  colleges_with_student_data integer,
  potential_units            numeric,
  applied_units              numeric,
  rows_needs_action          integer,
  match_tier                 integer,
  matched_via                text
)
language sql
stable
security invoker
set search_path = public, pg_catalog
as $$
  with needle as (select lower(btrim(coalesce(asked, ''))) as n)
  select v.unified_title, v.issuer, v.statewide, v.discipline, v.cpl_types,
         v.students, v.students_suppressed, v.no_student_data,
         v.colleges_adopted, v.colleges_with_student_data,
         v.potential_units, v.applied_units, v.rows_needs_action,
         t.tier,
         (select nm from unnest(c.raw_variants || c.unified_title) nm
           order by similarity(lower(nm), needle.n) desc limit 1)
  from public.map_credential_volume v
  join public.chatbox_credentials c on c.unified_title = v.unified_title
  cross join needle
  cross join lateral (
    select case
      when lower(c.unified_title) = needle.n then 1
      when exists (select 1 from unnest(c.raw_variants) x where lower(x) = needle.n) then 2
      when lower(c.unified_title) like '%' || needle.n || '%' then 3
      when exists (select 1 from unnest(c.raw_variants) x
                   where lower(x) like '%' || needle.n || '%') then 4
      else 9
    end as tier
  ) t
  cross join lateral (
    select max(similarity(lower(x), needle.n)) as best_sim
      from unnest(c.raw_variants || c.unified_title) x
  ) s
  where needle.n <> '' and t.tier < 9 and (t.tier < 4 or s.best_sim >= 0.25)
  order by t.tier, v.students desc nulls last, v.colleges_adopted desc, v.unified_title
  limit greatest(1, least(coalesce(result_limit, 8), 25));
$$;

grant execute on function public.search_credential_volume(text, integer)
  to anon, authenticated, service_role;

-- ── Route COLLEGE-ADOPT ─────────────────────────────────────────────────────
-- "What CPL opportunities might I adopt from another college?" - CRED-ADOPT
-- inverted. The answer was already in potential_colleges, disjoint from
-- adopter_colleges by construction (verified: 0 overlapping rows). 120 colleges
-- have opportunities, averaging 126 each (min 8, max 259).
--
-- Ranks statewide first (an ASCCC recommendation is a ready-made standard to
-- adopt rather than negotiate), then by how many PEERS already did it - peer
-- adoption being the honest proxy for "well-trodden, low risk". Ranks
-- OPPORTUNITIES, never colleges against each other.
drop function if exists public.college_adoption_opportunities(text, integer);

create function public.college_adoption_opportunities(
  college text,
  result_limit integer default 10
)
returns table (
  unified_title         text,
  issuer                text,
  statewide             boolean,
  ccc_rec               text,
  discipline            text,
  cpl_types             text[],
  peers_already_adopted integer,
  n_articulation_lines  integer,
  students_at_peers     integer
)
language sql
stable
security invoker
set search_path = public, pg_catalog
as $$
  -- Resolve through MAP's own list (name or variant) so "Bakersfield" and
  -- "Bakersfield College" both land. 117 of the 120 catalogue names resolve.
  with target as (
    select coalesce(
      (select mc.college_name from public.map_colleges mc
        where lower(btrim(mc.college_name)) = lower(btrim(college))
           or exists (select 1 from unnest(mc.variants) v
                      where lower(btrim(v)) = lower(btrim(college)))
        limit 1),
      btrim(college)) as name
  )
  select c.unified_title, c.issuer, c.statewide, c.ccc_rec, c.discipline, c.cpl_types,
         cardinality(c.adopter_colleges)::integer, c.n_articulation_lines, v.students
  from public.chatbox_credentials c
  cross join target t
  left join public.map_credential_volume v on v.unified_title = c.unified_title
  where t.name = any(c.potential_colleges)
  order by c.statewide desc, cardinality(c.adopter_colleges) desc,
           c.n_articulation_lines desc, c.unified_title
  limit greatest(1, least(coalesce(result_limit, 10), 50));
$$;

grant execute on function public.college_adoption_opportunities(text, integer)
  to anon, authenticated, service_role;

-- ── Refresh ─────────────────────────────────────────────────────────────────
-- Order matters: the bridge feeds both rollups. Run after any reload of
-- map_student_credit, chatbox_exhibits or chatbox_credentials.
--   refresh materialized view public.map_exhibit_credential;
--   refresh materialized view public.map_credential_student_rollup;
--   refresh materialized view public.map_credential_volume;

-- ── Probe set (verified live 2026-08-10) ────────────────────────────────────
--   comptia -> A+ 115 students / 7 of 21 colleges; Security+ 57 / 6 of 17;
--              Network+ 20 / 5 of 21; Linux+ suppressed (1 college, <10)
--   post    -> POST Basic Academy 27 students / 10 of 32 colleges
--   Bakersfield College -> CompTIA A+ (21 peers), Security+ (17), Correctional
--              Officer Core (11)
--   Server+/Tech+/Cloud+ -> colleges_with_student_data = 0, NOT suppressed:
--              genuinely no student data, which must not render as a blind spot
--
-- ── Standing disclosure assertions (both must return 0) ─────────────────────
-- 1. No published measure survives on a suppressed row:
--      select count(*) from map_credential_student_rollup
--       where students_suppressed and (students is not null
--          or potential_units is not null or rows_total is not null);
-- 2. No suppressed cell is recoverable by subtracting published siblings from
--    the published statewide total:
--      with per_col as (
--        select unified_title,
--               count(*) filter (where students_suppressed) as suppressed_cells
--        from map_credential_student_rollup group by 1)
--      select count(*) from map_credential_volume v
--        join per_col p using (unified_title)
--       where v.potential_units is not null and p.suppressed_cells = 1;
