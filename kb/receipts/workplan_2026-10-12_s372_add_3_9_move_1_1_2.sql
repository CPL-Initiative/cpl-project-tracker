-- Receipt: Annual Workplan Goals data changes, 2026-10-12 (S372, Sam's go in session).
--
-- (A) Add 3.9 Futuro Behavioral Healthcare Project under Activity 3.
--     Sam tried to add it through the Annual Goals "Add new row" dialog, which
--     rejected it ("Project prefix '3' is not an existing Activity ID"): the
--     dialog's Activity list reads a DOM marker the current table no longer
--     prints, and the dialog inserts only the goal ladder, never the project
--     the table iterates. His values, verbatim from the dialog:
--       GOAL    2025-26..2029-30 = 0, 2, 4, 4, 4   (total 14)
--       STRETCH 2025-26..2029-30 = 0, 4, 8, 8, 8   (total 28)
--     Contributes to: Activity 3 (home). Sam: "Yes, add it now".
--
-- (B) Move 1.1.2 AI Apprenticeship CPL Tools under 4.2 Apprenticeship Sprint,
--     as 4.2.1. Sam: "Move now; keep Activity 1 link". The workplan tree is
--     keyed by the id itself (projects has no parent column), so a move is a
--     re-key of every table that stores the id (the #872 lesson). Measured
--     2026-10-12 before the write: projects 1, item_raci 1, item_updates 1,
--     workplan_activity_associations 2, workplan_goals 0, project_lifecycle 0,
--     update_log 0, nc_artifacts 0. The only FK on projects(id) is
--     update_log_project_id_fkey (no rows for 1.1.2).
--
-- BEFORE-VALUES (fresh read at write time, 2026-10-12 ~23:10Z):
--   projects '1.1.2': workplan_activity = 'Activity 1: AI-Enhanced CPL Infrastructure',
--     sprint_tag = 'Apprenticeship Sprint', lead = 'Terence Nelson' (all other
--     fields unchanged by this write).
--   item_raci (project, '1.1.2'): updated 2026-10-12T22:43:34Z by slee@cccco.edu.
--   item_updates id 40 (project, '1.1.2'), created 2026-06-29.
--   workplan_activity_associations ('1.1.2','4') is_primary=false (created 2026-10-12 22:56:55Z)
--   workplan_activity_associations ('1.1.2','1') is_primary=false (created 2026-10-12 22:57:06Z)
--   (both links were set by Sam in the popover minutes before this write).
--   Nothing existed for id '3.9' or '4.2.1' in any table.

-- ── APPLIED (A) ──────────────────────────────────────────────────────────────
insert into public.projects (id, name, description, workplan_activity, cpl_goal, lead,
                             status, percent_complete, start_date, end_date)
values ('3.9', 'Futuro Behavioral Healthcare Project', null,
        'Activity 3: Scale CPL Access, Awards, and Procedures', null, null,
        'Not Started', 0, null, null);
insert into public.workplan_goals (activity_id, name, row_type, kind, total,
                                   yr_2025_26, yr_2026_27, yr_2027_28, yr_2028_29, yr_2029_30)
values ('3.9', 'Futuro Behavioral Healthcare Project', 'GOAL',    'project', 14, 0, 2, 4, 4, 4),
       ('3.9', 'Futuro Behavioral Healthcare Project', 'STRETCH', 'project', 28, 0, 4, 8, 8, 8);
insert into public.workplan_activity_associations (project_id, activity_id, is_primary)
values ('3.9', '3', true);

-- ── APPLIED (B), one atomic block ───────────────────────────────────────────
do $$
begin
  update public.projects
     set id = '4.2.1', workplan_activity = 'Activity 4: Sprints, Projects & Partnerships'
   where id = '1.1.2';
  update public.item_raci    set item_id = '4.2.1' where item_type = 'project' and item_id = '1.1.2';
  update public.item_updates set item_id = '4.2.1' where item_type = 'project' and item_id = '1.1.2';
  update public.workplan_activity_associations
     set project_id = '4.2.1', is_primary = (activity_id = '4')
   where project_id = '1.1.2';
  if exists (select 1 from public.projects where id = '1.1.2')
     or exists (select 1 from public.item_raci where item_id = '1.1.2')
     or exists (select 1 from public.item_updates where item_type = 'project' and item_id = '1.1.2')
     or exists (select 1 from public.workplan_activity_associations where project_id = '1.1.2') then
    raise exception 'move 1.1.2 -> 4.2.1 incomplete';
  end if;
end $$;

-- ── ROLLBACK (run only to undo) ─────────────────────────────────────────────
-- delete from public.workplan_activity_associations where project_id = '3.9';
-- delete from public.workplan_goals where activity_id = '3.9' and kind = 'project';
-- delete from public.projects where id = '3.9';
-- do $$ begin
--   update public.projects set id = '1.1.2',
--          workplan_activity = 'Activity 1: AI-Enhanced CPL Infrastructure' where id = '4.2.1';
--   update public.item_raci    set item_id = '1.1.2' where item_type = 'project' and item_id = '4.2.1';
--   update public.item_updates set item_id = '1.1.2' where item_type = 'project' and item_id = '4.2.1';
--   update public.workplan_activity_associations set project_id = '1.1.2', is_primary = false
--    where project_id = '4.2.1';
-- end $$;
