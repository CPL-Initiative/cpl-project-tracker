-- map_college_goal2 — the PUBLISHED per-college Veteran Sprint goal 2 aggregate.
--
-- Schema of record for the table built live via the Supabase MCP on 2026-08-08
-- (SkyNaut, Session 128). Re-run this WHOLE FILE after every map_student_credit
-- reload — Sam wants that nightly, so this is a rebuild step, not a one-off.
--
-- WHAT IT IS. One row per (college, destination). Sprint goal 2 asks whether a
-- college awards prior-learning credit to a REAL COURSE or dumps it into a GE
-- area / generic elective. MAP already labels every awarded row with which,
-- in course_type — and course_type is the only field in this export that
-- colleges do NOT type themselves, which is exactly why it is trustworthy where
-- `College Course` (a literal "-" at Antelope Valley) and `Status` (empty
-- everywhere) were not.
--
-- DISCLOSURE CONTROL, applied HERE at write time, never at render time:
-- docs/kb-notes/adr-student-detail-aggregate-disclosure-control.md
--   * k = 10, driven by DISTINCT STUDENTS, not rows
--   * a suppressed cell nulls BOTH students and rows_n -- a one-student cell
--     that published its row count would disclose that student
--   * complementary suppression: hiding one cell of a set that sums to a total
--     hides nothing, so where exactly one cell fell below k and siblings were
--     publishable, the smallest sibling is hidden too
--   * the consumer publishes NO rate for a college with any suppressed cell --
--     any two of {total, part, rate} give you the third
--
-- THE TEST THAT MATTERS is the property, not the flag: after this runs, no
-- college may have exactly one suppressed cell alongside a visible sibling.
-- The assertion query is at the bottom of this file.
--
-- ⚠ NEVER RANK COLLEGES PUBLICLY. Standing project rule.

drop table if exists public.map_college_goal2;

create table public.map_college_goal2 as
with classed as (
  select college_id, student_key,
    case
      -- Explicit 11-value map, deliberately NOT a LIKE pattern. The full
      -- vocabulary is known (Sam enumerated it 2026-08-08), and every loose
      -- rule tried against this data broke on the next sample. Anything
      -- unrecognised lands in UNKNOWN, which is countable rather than folded
      -- into a legitimate bucket.
      when course_type in ('Course credit','Course credit (1)','Course credit (2)',
                           'Course credit (3)','Course credit (4)',
                           'Credit for Basic Military Service-Course')   then 'COURSE'
      when course_type in ('Area credit','Credit for Basic Military Service-Area')  then 'AREA'
      when course_type in ('Elective credit','Elective credit (1)',
                           'Credit for Basic Military Service-Elective') then 'ELECTIVE'
      when course_type = ''                                              then 'NONE'
      else 'UNKNOWN' end as dest
  from public.map_student_credit
),
cells as (
  select college_id, dest,
         count(distinct student_key)::int as students,
         count(*)::int                    as rows_n
  from classed where dest <> 'NONE'
  group by 1,2
),
flagged as (
  select *, (students < 10) as below_k from cells
),
complement_target as (
  select distinct on (college_id) college_id, dest
  from flagged
  where not below_k
    and college_id in (
      select college_id from flagged
      group by college_id
      having count(*) filter (where below_k) = 1
         and count(*) filter (where not below_k) > 0
    )
  order by college_id, students asc, dest asc   -- smallest sibling costs least
)
select
  f.college_id,
  f.dest,
  case when f.below_k or ct.dest is not null then null else f.students end as students,
  case when f.below_k or ct.dest is not null then null else f.rows_n  end as rows_n,
  (f.below_k or ct.dest is not null)                                      as suppressed,
  case when f.below_k           then 'below_k'
       when ct.dest is not null then 'complement'
       else null end                                                      as reason
from flagged f
left join complement_target ct
  on ct.college_id = f.college_id and ct.dest = f.dest;

alter table public.map_college_goal2 add primary key (college_id, dest);

comment on table public.map_college_goal2 is
  'PUBLISHED per-college Sprint goal 2 (COURSE vs AREA vs ELECTIVE), suppression '
  'already applied at write time. k=10 on DISTINCT STUDENTS; a suppressed cell '
  'nulls BOTH students and rows_n. Complementary suppression applied so a hidden '
  'cell is not recoverable by subtraction. Rebuild after every map_student_credit '
  'load. Do NOT publish a per-college awarded-rows total alongside this -- rows '
  'sum, and a total would undo the complement. NEVER rank colleges publicly.';

alter table public.map_college_goal2 enable row level security;

-- Gated to the team rather than anon. Per-CELL the data is safe -- that is what
-- suppression is for -- but the FULL TABLE is a comparative league table of ~96
-- colleges, and "never rank colleges publicly" is standing. This takes the
-- reversible side: opening a gated table later is easy, un-publishing is not.
-- Sierra is unaffected: an edge function reads server-side with the service
-- role, which bypasses RLS.
create policy map_college_goal2_select on public.map_college_goal2
  for select to anon, authenticated
  using (is_allowed_reviewer() or team_pass_ok());

-- Record the rebuild so every surface can state its own freshness.
insert into public.map_data_loads (table_name, source_rows, loaded_rows, reconciled, note)
select 'map_college_goal2',
       (select count(*) from public.map_college_goal2),
       (select count(*) from public.map_college_goal2),
       true,
       'Rebuilt from map_student_credit by kb/supabase_map_college_goal2.sql';

-- ── THE ASSERTION ─────────────────────────────────────────────────────────
-- Must return zero rows. One hidden cell alongside a visible sibling is the
-- recoverable configuration: subtract the visible cells from the total and the
-- hidden one falls out. Testing `suppressed = true` would pass on a broken
-- implementation; this tests the property.
--
--   with per_college as (
--     select college_id,
--            count(*) filter (where suppressed)     as hidden,
--            count(*) filter (where not suppressed) as shown
--     from public.map_college_goal2 group by 1)
--   select * from per_college where hidden = 1 and shown > 0;
--
-- Also expected: zero rows where dest = 'UNKNOWN' (an unmapped course_type),
-- and zero rows where suppressed and (students is not null or rows_n is not null).
