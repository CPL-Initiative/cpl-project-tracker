-- S287 (SkyLane), 2026-09-24: Sam's review-sheet verdicts written into the stored funding config.
-- The two section titles and the five timeline labels are STORED settings in cpl_funding_config (his own earlier
-- renames and timeline edits sit under each scenario's `titles` and `timing`), so the code's new house defaults do
-- not show until the stored copies change. He ruled the titles on the sheet (item 2 "Change title to 'Introduction'",
-- item 3 "Change title to 'Minimum Conditions'") and edited the five lines in place (the sheet's `edits` store, refs
-- 4.3, 4.4, 4.5, 4.7, 4.8), then asked on 2026-09-24 why they were not done. His words are the new values.
--
-- Rule 10: one guarded UPDATE, the guard being the updated_at read at 16:5x and 18:0x UTC (a save by anyone since
-- makes it update nothing), updated_at set to now() so an open tab window refuses its next stale save and reloads
-- the newer config (#1672), and this receipt carrying the before-values.
--
-- EXECUTION: the repo's PreToolUse guard (scripts/supabase_sql_guard.py) refused the session's run, as designed (the
-- statement contains update and replace), so Sam runs it in the Supabase SQL editor. A good result is one row:
-- rows_updated = 1, new_updated_at = the run's own time, before/after listing both scenarios. rows_updated = 0 means
-- the config was saved after 2026-09-23 21:30 UTC — re-read it (the guard value and the before-values) before retrying.
--
-- BEFORE (both scenarios, identical): titles.about = 'CPL Infrastructure and Local Implementation Funding',
--   titles.eligibility = 'Baseline Outcomes'; timing labels [2] 'Participation Request', [3] 'First Disbursement
--   based on cumulative CPL in MAP', [4] 'Second Disbursement based on cumulative CPL in MAP', [6] 'First
--   Disbursement based on cumulative CPL in MAP', [7] 'Second Disbursement based on cumulative CPL in MAP'
--   (dates and the other labels untouched); updated_at 2026-09-23 21:30:12.313614+00; updated_by slee@cccco.edu.
-- AFTER: titles.about = 'Introduction', titles.eligibility = 'Minimum Conditions'; [2] 'Confirmation Deadline',
--   [3]/[6] 'First Disbursement based on cumulative CPL', [4]/[7] 'Second Disbursement based on cumulative CPL'.
--
-- ROLLBACK (restores the six values in both scenarios; or Sam renames in the tab):
--   update public.cpl_funding_config set config = jsonb_set(jsonb_set(config,
--     '{projects,cpl-implementation,scenarios,Scenario 1,titles}', '{"about":"CPL Infrastructure and Local Implementation Funding","timing":"Timeline","college":"College Dashboard","priorities":"Statutory Outcomes","eligibility":"Baseline Outcomes"}'),
--     '{projects,cpl-implementation,scenarios,Scenario 3,titles}', '{"about":"CPL Infrastructure and Local Implementation Funding","timing":"Timeline","college":"College Dashboard","priorities":"Statutory Outcomes","eligibility":"Baseline Outcomes"}'),
--     updated_at = now() where id = 'default';
--   and, for the timing labels, the reverse of the CASE below (replace 'Confirmation Deadline' with
--   'Participation Request' and append ' in MAP' to the four disbursement labels).
with old as (
  select id, config, updated_at from public.cpl_funding_config where id = 'default'
), scen as (
  select s.key as name, s.value as body
  from old, jsonb_each(old.config->'projects'->'cpl-implementation'->'scenarios') s
), fixed as (
  select name,
         jsonb_set(jsonb_set(body, '{titles,about}', '"Introduction"'), '{titles,eligibility}', '"Minimum Conditions"') as body1,
         (select jsonb_agg(
             case when e->>'label' = 'Participation Request' then jsonb_set(e, '{label}', '"Confirmation Deadline"')
                  when e->>'label' like '% in MAP' then jsonb_set(e, '{label}', to_jsonb(replace(e->>'label', ' in MAP', '')))
                  else e end order by o)
          from jsonb_array_elements(body->'timing') with ordinality t(e, o)) as timing2
  from scen
), newscen as (
  select jsonb_object_agg(name, case when timing2 is null then body1 else jsonb_set(body1, '{timing}', timing2) end) as scenarios
  from fixed
), upd as (
  update public.cpl_funding_config c
     set config = jsonb_set(old.config, '{projects,cpl-implementation,scenarios}', newscen.scenarios),
         updated_at = now()
    from old, newscen
   where c.id = old.id
     and c.updated_at = timestamptz '2026-09-23 21:30:12.313614+00'
   returning c.updated_at as new_updated_at
)
select (select count(*) from upd) as rows_updated,
       (select new_updated_at from upd) as new_updated_at,
       (select jsonb_object_agg(name, jsonb_build_object('titles', body->'titles', 'labels', (select jsonb_agg(e->>'label') from jsonb_array_elements(body->'timing') e))) from scen) as before,
       (select jsonb_object_agg(name, jsonb_build_object('titles', body1->'titles', 'labels', (select jsonb_agg(e->>'label') from jsonb_array_elements(timing2) e))) from fixed) as after;
