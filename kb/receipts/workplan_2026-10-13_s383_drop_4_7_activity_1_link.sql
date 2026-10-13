-- Receipt: Annual Workplan Goals data change, 2026-10-13 (S383 SkySpruce, Sam's ruling).
--
-- Drop 4.7 EMS Corps's second link to Activity 1. Sam added 4.7 at 18:18Z with
-- Activity 4 as home; the add dialog's default parent left Activity 1 checked, so
-- the row saved with a non-primary link to Activity 1 he had not chosen (#2080
-- clears that box now). Open Asks Sheet 75 card 1, "drop", 2026-10-13T19:17:54Z
-- (https://claude.ai/artifact/FHD8da5vuCN7M3XaL5g4a1; cpl_memory
-- sam-sheet-75-annual-goals-rulings-2026-10-13).
--
-- The session's Supabase guard refuses a delete through the MCP, so Sam runs the
-- APPLY block in the SQL editor (Rule 10: a guarded write whose receipt carries
-- the before-values).
--
-- BEFORE-VALUES (fresh read at 2026-10-13 ~19:20Z):
--   workplan_activity_associations ('4.7','4') is_primary=true  created 2026-10-13 18:18:24.081606+00 (kept)
--   workplan_activity_associations ('4.7','1') is_primary=false created 2026-10-13 18:18:24.081606+00 (removed)

-- ── APPLY ────────────────────────────────────────────────────────────────────
delete from public.workplan_activity_associations
where project_id = '4.7' and activity_id = '1' and is_primary = false
  and created_at = '2026-10-13 18:18:24.081606+00'
returning project_id, activity_id, is_primary, created_at;
-- Expect one row back. Zero rows means the link changed since the read: stop.

-- ── ROLLBACK (restores the removed link exactly) ─────────────────────────────
-- insert into public.workplan_activity_associations (project_id, activity_id, is_primary, created_at)
-- values ('4.7', '1', false, '2026-10-13 18:18:24.081606+00')
-- on conflict do nothing;

-- APPLIED by Sam in the SQL editor (Open Asks Sheet 77 card 4, "done", 2026-10-13 22:26Z).
-- Read back by S384 SkyPoplar at 22:27Z: workplan_activity_associations for 4.7 holds only ('4.7','4') is_primary=true.
