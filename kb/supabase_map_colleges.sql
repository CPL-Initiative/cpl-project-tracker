-- map_colleges — CollegeID ↔ canonical name ↔ variants ↔ entity kind.
--
-- Schema of record for the table built live via the Supabase MCP, 2026-08-08
-- (SkyNaut, Session 128). Rebuild after any map_college_users sync.
--
-- WHY IT EXISTS. Sam: "there are several variations to college text names in the
-- CCC datasets, so the only reliable is College ID. I would like to have a lookup
-- in supabase that has all the text variations on a CollegeID row."
--
-- CANONICAL SOURCE is map_college_users -- the ONLY table in this project
-- carrying MAP's numeric CollegeID next to a name. Verified same namespace as the
-- student-detail export: 17 = Allan Hancock, 18 = American River, 19 = Antelope
-- Valley, matching TblSOURCE.Location exactly.
--
-- ⭐ variants[] STARTS EMPTY, AND THAT IS CORRECT. Measured across five
-- name-keyed tables: 123 distinct names, 120 resolve, ZERO spelled differently.
-- Our Supabase tables do not disagree with each other -- they all descend from
-- the same MAP sync. The variation Sam hits is against EXTERNAL sources (COCI,
-- the CCCCO MIS appendix, partner lists), so variants[] should ACCUMULATE
-- external spellings as sessions meet them, curated once and kept, rather than
-- being harvested from tables that already agree.
--
-- ⚠ NOT EVERY ROW IS A COLLEGE. entity_kind separates them. IDs 1-118 are the
-- CCC colleges alphabetically (117 = Woodland, 118 = Yuba); above that are
-- continuing-education institutions, outside training agencies whose trainees
-- seek CCC credit, and test entries. NEVER infer this from the id range -- the
-- next id MAP adds breaks that assumption.
drop table if exists public.map_colleges;

create table public.map_colleges as
with canon as (
  select distinct on (college_id::int)
         college_id::int as college_id, trim(college) as college_name
  from public.map_college_users
  where college_id ~ '^\d+$' and coalesce(trim(college),'') <> ''
  order by college_id::int, trim(college)
)
select college_id, college_name,
       '{}'::text[] as variants,
       (college_name ~* '(test|syllabus manager|MAP INITIATIVE)') as is_test,
       null::text as entity_kind
from canon;

alter table public.map_colleges add primary key (college_id);
create index map_colleges_name_idx on public.map_colleges (lower(college_name));

update public.map_colleges set entity_kind = 'test'                 where is_test;
update public.map_colleges set entity_kind = 'college'              where not is_test and college_id <= 118;
update public.map_colleges set entity_kind = 'continuing_education' where college_id in (119, 121);
update public.map_colleges set entity_kind = 'partner'              where college_id in (132, 133);
-- 122 and 131 appear in the student data but are absent from map_college_users,
-- so there is no name here to classify. Sam's read is that they are agency
-- partners (Futuro Health is 133 and Launch Apprenticeship is 132, so these are
-- two others). Left NULL DELIBERATELY: a guess recorded as fact is how a wrong
-- classification becomes permanent. Name them via MAP, then set.

alter table public.map_colleges enable row level security;
create policy map_colleges_select on public.map_colleges
  for select to anon, authenticated using (true);

-- ── Expected shape, 2026-08-08 ──────────────────────────────────────────────
--   106 colleges hold 220,398 of 220,588 student rows (99.9%)
--   5 non-college entities: 190 rows, 127 students, ZERO awarded credit
--   Per-college metrics MUST filter entity_kind = 'college'
