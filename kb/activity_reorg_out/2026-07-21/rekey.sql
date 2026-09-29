-- ============================================================================
-- COBI Activities reorg — LIVE Supabase re-key (Phase 2)
-- Project: hvuwhnbuahrtptokpqfh ("Work Plan")  |  Author: SkyPlan-II, 2026-07-21
-- Crosswalk: kb/activity_reorg_alias_map.json   |  Dry-run: ./dry_run_receipt.md
--
--  ⛔ DO NOT RUN autonomously. Rule 9: Sam curates live. Execute ONLY within his
--     ~15-min edit hold, AFTER a FRESH read confirms the live id set still matches
--     the dry-run (re-run ./dry_run_receipt.md's verification query first). Run as
--     ONE transaction; inspect the verification block; COMMIT only if it passes.
--     The alias map IS the rollback map (swap the CASE arms) if needed.
--
--  Pre-flight to confirm at write-time:
--   • item_raci / item_updates have NO foreign key to projects.id (loose text keys).
--   • No new project ids were added by Sam since the dry-run (fresh coverage query).
-- ============================================================================
BEGIN;

-- 0) sprint_tag column (cross-cutting campaign tag; drives the ◆ badge + filter)
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS sprint_tag text;

-- 1) Dissolve the old "4.1 Sprints and Projects" WRAPPER.
--    Its 2 update rows re-home by content (dry-run): id 73 (Apprenticeship text)
--    -> new 4.2 ; id 61 (general "all four sprints") stays on 4.1 -> the new
--    Veteran Sprint node (old 4.1.1 lands on 4.1 in Phase B). Wrapper RACI dropped
--    (redundant — the surviving 4.1/4.2 nodes carry their own).
UPDATE public.item_updates SET item_id = 'ROUTE__4.2'
  WHERE id = 73 AND item_id = '4.1' AND item_type = 'project';
DELETE FROM public.item_raci WHERE item_id = '4.1'   AND item_type = 'project';
DELETE FROM public.projects  WHERE id = '4.1';

-- 2) Dissolve "4.1.3 Statewide Adoption Sprint" -> merge into 3.3.
--    RACI union: keep 3.3's existing assignment (every 4.1.3 assignee is already
--    present in 3.3 — verified in the dry-run). 4.1.3 has 0 update rows.
DELETE FROM public.item_raci WHERE item_id = '4.1.3' AND item_type = 'project';
DELETE FROM public.projects  WHERE id = '4.1.3';

-- 3) TWO-PHASE PERMUTATION (slot reuse on 4.1/4.2/4.3/4.4/4.5) — 15 changing ids.
--    Phase A: prefix every changing SOURCE id with TMP__ across all 3 tables.
WITH src(o) AS (VALUES
  ('3.1.2a'),('4.1.1'),('4.1.4'),('4.1.2'),('4.2'),('4.3'),('4.4'),('4.5'),
  ('5.2'),('5.3'),('5.6'),('5.4'),('5.7'),('5.5'),('5.8'))
UPDATE public.projects p SET id = 'TMP__'||p.id FROM src WHERE p.id = src.o;
WITH src(o) AS (VALUES
  ('3.1.2a'),('4.1.1'),('4.1.4'),('4.1.2'),('4.2'),('4.3'),('4.4'),('4.5'),
  ('5.2'),('5.3'),('5.6'),('5.4'),('5.7'),('5.5'),('5.8'))
UPDATE public.item_raci r SET item_id = 'TMP__'||r.item_id FROM src
  WHERE r.item_type = 'project' AND r.item_id = src.o;
WITH src(o) AS (VALUES
  ('3.1.2a'),('4.1.1'),('4.1.4'),('4.1.2'),('4.2'),('4.3'),('4.4'),('4.5'),
  ('5.2'),('5.3'),('5.6'),('5.4'),('5.7'),('5.5'),('5.8'))
UPDATE public.item_updates u SET item_id = 'TMP__'||u.item_id FROM src
  WHERE u.item_type = 'project' AND u.item_id = src.o;

--    Phase B: rename TMP__<old> -> <new>. (Same CASE for all 3 tables.)
UPDATE public.projects SET id = CASE id
  WHEN 'TMP__3.1.2a' THEN '3.1.3'
  WHEN 'TMP__4.1.1'  THEN '4.1'
  WHEN 'TMP__4.1.4'  THEN '4.1.1'
  WHEN 'TMP__4.1.2'  THEN '4.2'
  WHEN 'TMP__4.2'    THEN '4.3'
  WHEN 'TMP__4.3'    THEN '4.4'
  WHEN 'TMP__4.4'    THEN '4.5'
  WHEN 'TMP__4.5'    THEN '4.6'
  WHEN 'TMP__5.2'    THEN '1.1.1'
  WHEN 'TMP__5.3'    THEN '1.1.2'
  WHEN 'TMP__5.6'    THEN '1.1.3'
  WHEN 'TMP__5.4'    THEN '3.7'
  WHEN 'TMP__5.7'    THEN '3.8'
  WHEN 'TMP__5.5'    THEN '4.4.1'
  WHEN 'TMP__5.8'    THEN '4.7'
  ELSE id END
WHERE id LIKE 'TMP__%';
UPDATE public.item_raci SET item_id = CASE item_id
  WHEN 'TMP__3.1.2a' THEN '3.1.3' WHEN 'TMP__4.1.1' THEN '4.1'
  WHEN 'TMP__4.1.4'  THEN '4.1.1' WHEN 'TMP__4.1.2' THEN '4.2'
  WHEN 'TMP__4.2' THEN '4.3' WHEN 'TMP__4.3' THEN '4.4'
  WHEN 'TMP__4.4' THEN '4.5' WHEN 'TMP__4.5' THEN '4.6'
  WHEN 'TMP__5.2' THEN '1.1.1' WHEN 'TMP__5.3' THEN '1.1.2' WHEN 'TMP__5.6' THEN '1.1.3'
  WHEN 'TMP__5.4' THEN '3.7' WHEN 'TMP__5.7' THEN '3.8'
  WHEN 'TMP__5.5' THEN '4.4.1' WHEN 'TMP__5.8' THEN '4.7'
  ELSE item_id END
WHERE item_type = 'project' AND item_id LIKE 'TMP__%';
UPDATE public.item_updates SET item_id = CASE item_id
  WHEN 'TMP__3.1.2a' THEN '3.1.3' WHEN 'TMP__4.1.1' THEN '4.1'
  WHEN 'TMP__4.1.4'  THEN '4.1.1' WHEN 'TMP__4.1.2' THEN '4.2'
  WHEN 'TMP__4.2' THEN '4.3' WHEN 'TMP__4.3' THEN '4.4'
  WHEN 'TMP__4.4' THEN '4.5' WHEN 'TMP__4.5' THEN '4.6'
  WHEN 'TMP__5.2' THEN '1.1.1' WHEN 'TMP__5.3' THEN '1.1.2' WHEN 'TMP__5.6' THEN '1.1.3'
  WHEN 'TMP__5.4' THEN '3.7' WHEN 'TMP__5.7' THEN '3.8'
  WHEN 'TMP__5.5' THEN '4.4.1' WHEN 'TMP__5.8' THEN '4.7'
  ELSE item_id END
WHERE item_type = 'project' AND item_id LIKE 'TMP__%';

-- 4) Finalize the routed wrapper update now that new 4.2 exists.
UPDATE public.item_updates SET item_id = '4.2' WHERE item_id = 'ROUTE__4.2' AND id = 73;

-- 5) Renames.
UPDATE public.projects SET name = 'CPL Offers & Awards Tracking — Apprentices and Journey Workers'
  WHERE id = '3.1.3';
UPDATE public.projects SET name = 'Statewide Adoption & Participation' WHERE id = '3.3';

-- 6) New sub-activity 3.1.4 (net-new; empty history at creation).
INSERT INTO public.projects (id, name, workplan_activity, cpl_goal, lead, status, percent_complete)
VALUES ('3.1.4', 'CPL Offers & Awards Tracking — Other Populations',
        'Activity 3: Scale CPL Access, Awards, and Procedures', 'Goal 2',
        'Terence Nelson', 'Not Started', 0)
ON CONFLICT (id) DO NOTHING;

-- 7) Retitle Activity 3 across every Activity-3 workplan_activity string.
UPDATE public.projects SET workplan_activity = 'Activity 3: Scale CPL Access, Awards, and Procedures'
  WHERE workplan_activity LIKE 'Activity 3:%';

-- 8) Populate sprint_tag (post-rename ids).
UPDATE public.projects SET sprint_tag = CASE id
  WHEN '3.1.2' THEN 'Veteran Sprint'
  WHEN '4.1'   THEN 'Veteran Sprint'
  WHEN '4.1.1' THEN 'Veteran Sprint'
  WHEN '3.1.3' THEN 'Apprenticeship Sprint'
  WHEN '4.2'   THEN 'Apprenticeship Sprint'
  WHEN '1.1.2' THEN 'Apprenticeship Sprint'
  WHEN '3.3'   THEN 'Statewide Adoption Sprint'
  ELSE sprint_tag END;

-- ── VERIFICATION (run before COMMIT; expect the commented values) ────────────
--   SELECT count(*) FROM public.projects;                              -- 33 (32 active + tabled 5.1)
--   SELECT count(*) FROM public.projects WHERE id LIKE 'TMP__%'
--       OR id LIKE 'ROUTE__%';                                         -- 0
--   SELECT count(*) FROM public.item_updates WHERE item_id LIKE 'TMP__%'
--       OR item_id LIKE 'ROUTE__%';                                    -- 0
--   SELECT count(*) FROM public.item_raci   WHERE item_id LIKE 'TMP__%';-- 0
--   SELECT id FROM public.projects WHERE id ~ '^5\.' AND id <> '5.1';  -- (none)
--   SELECT count(*) FROM public.item_updates WHERE item_id='4.1'
--       AND item_type='project';                                       -- 2 (old-4.1.1 update + id 61)
--   SELECT count(*) FROM public.item_updates WHERE item_id='4.2'
--       AND item_type='project';                                       -- 2 (old-4.1.2 update + id 73)
--   SELECT DISTINCT workplan_activity FROM public.projects
--       WHERE workplan_activity LIKE 'Activity 3:%';                   -- exactly the new title
COMMIT;
-- ROLLBACK;  -- use instead of COMMIT if any verification value is off.
