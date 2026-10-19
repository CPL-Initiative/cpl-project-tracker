-- Annual Workplan Goals: the duplicate ladder rows, and the index that stops the next ones.
-- Found 2026-10-19 (S426 SkyTorreya) while wiring per-year Current values: four
-- sub-activities carry exact duplicate GOAL and STRETCH rows in public.workplan_goals,
-- all inserted on 2026-10-14 within seconds of each other by Set targets:
--   1.1.1  GOAL ids 69, 71, 73, 75   STRETCH ids 70, 72, 74, 76   (12:26:01 to 12:26:35Z)
--   1.1.3  GOAL ids 77, 79           STRETCH ids 78, 80           (12:27:24, 12:27:28Z)
--   4.2.1  GOAL ids 81, 83           STRETCH ids 82, 84           (12:35:28, 12:35:32Z)
--   4.4.1  GOAL ids 85, 87           STRETCH ids 86, 88           (12:37:35, 12:37:38Z)
-- Each pair is identical in every value column; only `id` and the timestamps differ.
-- Cause: after a Set targets save the row kept its Set targets control until the nightly
-- rebuild, so a second press inserted a second pair (cpl-project-tracker S426 fixes the
-- control to patch rows that exist and to paint the row at once).
--
-- APPLIED by Sam in the SQL editor, 2026-10-19 21:06Z (Open Asks Sheet 100 card 1, "Success: no rows returned");
-- read back 21:07Z: no duplicate groups, 68 rows, the index present.
-- NOT RUN BY A SESSION: a delete on a shared human-write table is Sam's to run (Rule 10;
-- the MCP guard refuses deletes). Paste the whole file into the Supabase SQL editor.
--
-- What it does: keeps the lowest id of each (activity_id, row_type, kind) and deletes the
-- rest (12 rows), then adds the unique index so a duplicate pair can never land again.
-- The generator read the LAST row of each pair (dict assignment), the editor patched all
-- of them alike, so nothing a reader sees changes.
--
-- ROLLBACK (re-inserts the 12 rows with their original ids and values; the index first):
--   drop index if exists public.workplan_goals_one_row_per_type;
--   insert into public.workplan_goals (id, activity_id, name, row_type, kind, total,
--     yr_2025_26, yr_2026_27, yr_2027_28, yr_2028_29, yr_2029_30) values
--     (71,'1.1.1','AI Certification-to-Course Matching','GOAL','project',117,117,0,0,0,0),
--     (73,'1.1.1','AI Certification-to-Course Matching','GOAL','project',117,117,0,0,0,0),
--     (75,'1.1.1','AI Certification-to-Course Matching','GOAL','project',117,117,0,0,0,0),
--     (72,'1.1.1','AI Certification-to-Course Matching','STRETCH','project',117,117,0,0,0,0),
--     (74,'1.1.1','AI Certification-to-Course Matching','STRETCH','project',117,117,0,0,0,0),
--     (76,'1.1.1','AI Certification-to-Course Matching','STRETCH','project',117,117,0,0,0,0),
--     (79,'1.1.3','WestEd CPL Scope of Work','GOAL','project',8,4,4,0,0,0),
--     (80,'1.1.3','WestEd CPL Scope of Work','STRETCH','project',8,4,4,0,0,0),
--     (83,'4.2.1','AI Apprenticeship CPL Tools','GOAL','project',6,2,4,0,0,0),
--     (84,'4.2.1','AI Apprenticeship CPL Tools','STRETCH','project',6,2,4,0,0,0),
--     (87,'4.4.1','VRC CPL Module Revision','GOAL','project',18,0,6,4,4,4),
--     (88,'4.4.1','VRC CPL Module Revision','STRETCH','project',36,0,12,8,8,8);

begin;

-- 1. Delete every row that is not the lowest id of its (activity_id, row_type, kind).
with keep as (
  select min(id) as id
    from public.workplan_goals
   group by activity_id, row_type, coalesce(kind, 'project')
)
delete from public.workplan_goals w
 where w.id not in (select id from keep)
   and w.activity_id in ('1.1.1', '1.1.3', '4.2.1', '4.4.1');

-- 2. One ladder row per (activity_id, row_type, kind), from now on.
create unique index if not exists workplan_goals_one_row_per_type
  on public.workplan_goals (activity_id, row_type, coalesce(kind, 'project'));

-- Read back: expect 12 deleted above, and every sub-activity on exactly one row per type.
select activity_id, row_type, count(*) from public.workplan_goals
 group by activity_id, row_type having count(*) > 1;

commit;
