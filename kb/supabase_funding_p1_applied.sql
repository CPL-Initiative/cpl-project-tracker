-- Receipt — Implementation Funding config change, 2026-08-03 (SkyUnit), applied live.
-- Sam's rulings across 2026-08-01..03:
--   P1 scores APPLIED units (proxy for the upfront articulation work: you can only
--     apply credit that was articulated, and the "applicable to their program"
--     checkmark filters out JST recommendations no college offers -- e.g. marksmanship).
--   P2 keeps TRANSCRIBED units (proxy that counseling + A&R evaluation happened).
--   P3 keeps outside-submission activity (the long-term access booster; small share
--     because it is "too much of an ask for the Y1 & 2 phase").
--   Targets CUMULATIVE.
--
-- WHY THE MULTIPLIER AND NOT prioEntitlement:
--   prioTarget = (sizePct x netCollege x share / nYears) / rate x multiplier.
--   With nYears = 2, multiplier 2.0 IS the cumulative 2-year window target, exactly:
--       net x share / rate  ==  net x share / 2 / rate x 2.0
--   Changing prioEntitlement to drop the / nYears would deliver the same target BUT
--   cancel the front-load incentive (Sam, 2026-07-30: "double the per-student amount,
--   not the students"), which is called out in prioEntitlement's own comment as the
--   reason it is the ONE named exemption from the no-inline-scope guard.
--   So: multiplier = cumulative, WITHOUT touching the seam. Guarded by
--   tests/cpl_funding_cumulative_target.test.js.
--
-- Guarded UPDATE: only fires while P1 is still the Eligible metric (no-op if a
-- curator got there first -- Rule 9, his rows win).
update cpl_funding_config
set config = jsonb_set(jsonb_set(jsonb_set(config,
      '{projects,cpl-implementation,scenarios,Scenario 1,yearPriorities,1}',
        (config#>'{projects,cpl-implementation,scenarios,Scenario 1,yearPriorities,1}')
        || jsonb_build_object(
             '0', (config#>'{projects,cpl-implementation,scenarios,Scenario 1,yearPriorities,1,0}')
                  || '{"metric":"Applied CPL Units as FTES (1 Unit = .0334 FTES)","share":0.50}'::jsonb,
             '1', (config#>'{projects,cpl-implementation,scenarios,Scenario 1,yearPriorities,1,1}') || '{"share":0.45}'::jsonb,
             '2', (config#>'{projects,cpl-implementation,scenarios,Scenario 1,yearPriorities,1,2}') || '{"share":0.05}'::jsonb)),
      '{projects,cpl-implementation,scenarios,Scenario 1,yearPriorities,2}',
        (config#>'{projects,cpl-implementation,scenarios,Scenario 1,yearPriorities,2}')
        || jsonb_build_object(
             '0', (config#>'{projects,cpl-implementation,scenarios,Scenario 1,yearPriorities,2,0}')
                  || '{"metric":"Applied CPL Units as FTES (1 Unit = .0334 FTES)","share":0.50}'::jsonb,
             '1', (config#>'{projects,cpl-implementation,scenarios,Scenario 1,yearPriorities,2,1}') || '{"share":0.45}'::jsonb,
             '2', (config#>'{projects,cpl-implementation,scenarios,Scenario 1,yearPriorities,2,2}') || '{"share":0.05}'::jsonb)),
      '{projects,cpl-implementation,scenarios,Scenario 1,targetMultiplier}', '2.0'::jsonb),
    updated_by = 'skyunit@bot', updated_at = now()
where id='default'
  and config#>>'{projects,cpl-implementation,scenarios,Scenario 1,yearPriorities,1,0,metric}'
      = 'Eligible CPL Units as FTES (1 Unit = .0334 FTES)';

-- Year-2 P1 had been "Transcribed CPL Units as FTES", duplicating P2 -- a curation
-- artifact, corrected above so both years read Applied / Transcribed / Portal.
--
-- Live result (2026-08-03, perf as_of 2026-08-02):
--   statewide target 4,114 CPL FTES · pool earns $9,650,725 of $23,240,308 (41.5%, was 30.1%)
--   median college 50.0% of cap (was 34.0%) · 29 colleges at $0 (11 of them have no feed row)
