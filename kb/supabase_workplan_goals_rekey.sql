-- ============================================================================
-- Annual Workplan Goals — finish the #872 Activities reorg re-key
-- Project: hvuwhnbuahrtptokpqfh ("Work Plan")  |  Author: SkyElemental, 2026-07-27
-- Crosswalk: kb/activity_reorg_out/2026-07-21/rekey.sql (the SAME map #872 applied
--            to projects/item_raci/item_updates — but which was NEVER applied to
--            workplan_goals or workplan_activity_associations).
--
--  ⛔ Rule 9: run ONLY within Sam's edit-hold, after a FRESH read confirms the id
--     set still matches. One transaction; inspect VERIFICATION; COMMIT only if it
--     passes. The crosswalk IS the rollback map (swap the CASE arms).
--
--  WHY: #872 re-keyed projects (+ item_raci/item_updates) to the new numbering but
--  left the workplan_goals LADDER table + workplan_activity_associations on the OLD
--  numbering. Result: Activity-4 Annual-Goals rows displayed the *next* item's
--  targets (off-by-one from the dissolved "4.1 Sprints and Projects" wrapper), and
--  the reorg-renumbered projects (3.1.3, 4.6, and the ex-5.x items) had no ladder.
-- ============================================================================
BEGIN;

-- 1) Dissolve the rows #872 dissolved (they have NO current project):
--    old "4.1 Sprints and Projects" WRAPPER (rollup, replaced by the Activity-4
--    node) and "4.1.3 Statewide Adoption Sprint" (merged into 3.3, which keeps its
--    own "Institutional Participation" ladder). Both GOAL+STRETCH rows.
DELETE FROM public.workplan_goals
  WHERE coalesce(kind,'project')='project' AND activity_id IN ('4.1','4.1.3');

-- 2) TWO-PHASE PERMUTATION (slot reuse on 4.1/4.1.1/4.2/4.3/4.4/4.5) — 8 ids.
--    Phase A: prefix every changing SOURCE id with TMP__.
UPDATE public.workplan_goals SET activity_id = 'TMP__'||activity_id
  WHERE coalesce(kind,'project')='project'
    AND activity_id IN ('3.1.2a','4.1.1','4.1.4','4.1.2','4.2','4.3','4.4','4.5');

--    Phase B: rename TMP__<old> -> <new> (the #872 crosswalk).
UPDATE public.workplan_goals SET activity_id = CASE activity_id
  WHEN 'TMP__3.1.2a' THEN '3.1.3'
  WHEN 'TMP__4.1.1'  THEN '4.1'
  WHEN 'TMP__4.1.4'  THEN '4.1.1'
  WHEN 'TMP__4.1.2'  THEN '4.2'
  WHEN 'TMP__4.2'    THEN '4.3'
  WHEN 'TMP__4.3'    THEN '4.4'
  WHEN 'TMP__4.4'    THEN '4.5'
  WHEN 'TMP__4.5'    THEN '4.6'
  ELSE activity_id END
WHERE activity_id LIKE 'TMP__%';

-- 3) Sync the ladder-row NAME to the authoritative projects.name (kind='project').
--    Cosmetic only — the tab displays projects.name — but keeps the store honest
--    (e.g. 3.3 ladder still read "Institutional Participation").
UPDATE public.workplan_goals wg SET name = p.name
  FROM public.projects p
  WHERE coalesce(wg.kind,'project')='project' AND p.id = wg.activity_id
    AND wg.name IS DISTINCT FROM p.name;

-- 4) Clean stale old-id residue in workplan_activity_associations (dead rows — the
--    generator only reads associations by CURRENT project id, and #902 already
--    backfilled every current project's home link). Finishes the reorg the #872
--    handoff flagged.
DELETE FROM public.workplan_activity_associations
  WHERE project_id NOT IN (SELECT id FROM public.projects);

-- 5) Fill the ONLY empty description (3.1.4, net-new at reorg). Gap-fill only —
--    every other project keeps its curator-authored description.
UPDATE public.projects
  SET description = 'Track CPL offers and awards for other priority populations—first responders, allied health, rising scholars, and noncredit/adult-education learners—within the 250,000 cumulative Goal 1 target.'
  WHERE id = '3.1.4' AND (description IS NULL OR btrim(description) = '');

-- ── VERIFICATION (expect the commented values; ROLLBACK if any is off) ─────────
--  SELECT count(*) FROM public.workplan_goals
--    WHERE coalesce(kind,'project')='project' AND activity_id LIKE 'TMP__%';     -- 0
--  SELECT activity_id FROM public.workplan_goals wg
--    WHERE coalesce(kind,'project')='project'
--      AND activity_id NOT IN (SELECT id FROM public.projects);                  -- (none)
--  -- every ladder row now matches a project; names aligned:
--  SELECT wg.activity_id, wg.name, p.name FROM public.workplan_goals wg
--    JOIN public.projects p ON p.id=wg.activity_id
--    WHERE coalesce(wg.kind,'project')='project' AND wg.row_type='GOAL'
--      AND wg.name IS DISTINCT FROM p.name;                                      -- (none)
--  SELECT count(*) FROM public.workplan_activity_associations
--    WHERE project_id NOT IN (SELECT id FROM public.projects);                   -- 0
--  SELECT description<>'' FROM public.projects WHERE id='3.1.4';                 -- t
COMMIT;
-- ROLLBACK;  -- use instead of COMMIT if any verification value is off.


-- ============================================================================
-- ADDENDUM (same run) — re-home 4.7 "CPL Legislative Advocacy" under 4.5
-- "Law & Regulation Review" (Sam, 2026-07-27). Renumber 4.7 -> 4.5.1 so it nests
-- as a child (id-prefix nesting; nesting is visual, the id is the parent link).
-- Simple rename — 4.5.1 was free in every project-keyed table (checked via
-- information_schema). 4.7 had rows only in projects/item_raci/item_updates/
-- workplan_activity_associations (0 in workplan_goals/project_lifecycle/update_log).
-- workplan_activity stays "Activity 4:" — the Activity home is unchanged.
-- ============================================================================
BEGIN;
UPDATE public.projects     SET id      = '4.5.1' WHERE id      = '4.7';
UPDATE public.item_raci    SET item_id = '4.5.1' WHERE item_id = '4.7' AND item_type='project';
UPDATE public.item_updates SET item_id = '4.5.1' WHERE item_id = '4.7' AND item_type='project';
UPDATE public.workplan_activity_associations SET project_id = '4.5.1' WHERE project_id = '4.7';
-- VERIFY (expect): 0 rows id='4.7'; 4.5.1 name='CPL Legislative Advocacy (2026 Session)'.
COMMIT;
-- ROLLBACK;  -- swap '4.5.1'<->'4.7' to reverse.
