-- Receipt — Implementation Funding: per-priority PRICE FACTOR replaces the global
-- target multiplier (Sam & Malone, 2026-08-04). APPLY POST-DEPLOY ONLY.
--
-- WHAT CHANGED IN CODE (this PR): the single global `targetMultiplier` is retired.
-- Each priority carries its own `factor`; its PRICE per CPL FTES = factor × the SCFF
-- base rate, and target = pot ÷ price (higher factor ⇒ fewer FTES earn the pot — a
-- premium on the harder / more-valued behavior). The cumulative-window ×nYears is now
-- STRUCTURAL in prioTarget, so factor 1.0 == today's cumulative model, exactly.
--
-- WHY BEHAVIOR-NEUTRAL TO MERGE: with the live config still on targetMultiplier 2 and
-- NO factor, the new code ignores targetMultiplier and defaults factor to 1.0 →
-- prioEnt/rate × nYears(2) = the same cumulative target the ×2 produced. No live move.
--
-- ⚠ SEQUENCING — DO NOT run these until the new cpl_funding.js is DEPLOYED to Pages.
-- Removing targetMultiplier while OLD code is live would fall back to the (removed)
-- baked default and HALVE every target (per-year instead of cumulative).
-- Order: merge → Pages deploy → statement 1 → statement 2.
--
-- Rule 9: ADDITIVE on the priority objects (|| jsonb_build_object), so it never
-- disturbs the curator's live shares / metrics / strategies. Re-read live at apply
-- time; both statements are idempotent (guarded on targetMultiplier still present).
-- Sam's confirmed starting factors: P1 Applied 0.5, P2 Transcribed 1.0, P3 Portal 2.0.

-- ── Statement 1 — add the per-priority factors to both years (additive merge) ──
update cpl_funding_config
set config =
  jsonb_set(jsonb_set(jsonb_set(jsonb_set(jsonb_set(jsonb_set(config,
    '{projects,cpl-implementation,scenarios,Scenario 1,yearPriorities,1,0}',
      (config#>'{projects,cpl-implementation,scenarios,Scenario 1,yearPriorities,1,0}') || '{"factor":0.5}'::jsonb),
    '{projects,cpl-implementation,scenarios,Scenario 1,yearPriorities,1,1}',
      (config#>'{projects,cpl-implementation,scenarios,Scenario 1,yearPriorities,1,1}') || '{"factor":1.0}'::jsonb),
    '{projects,cpl-implementation,scenarios,Scenario 1,yearPriorities,1,2}',
      (config#>'{projects,cpl-implementation,scenarios,Scenario 1,yearPriorities,1,2}') || '{"factor":2.0}'::jsonb),
    '{projects,cpl-implementation,scenarios,Scenario 1,yearPriorities,2,0}',
      (config#>'{projects,cpl-implementation,scenarios,Scenario 1,yearPriorities,2,0}') || '{"factor":0.5}'::jsonb),
    '{projects,cpl-implementation,scenarios,Scenario 1,yearPriorities,2,1}',
      (config#>'{projects,cpl-implementation,scenarios,Scenario 1,yearPriorities,2,1}') || '{"factor":1.0}'::jsonb),
    '{projects,cpl-implementation,scenarios,Scenario 1,yearPriorities,2,2}',
      (config#>'{projects,cpl-implementation,scenarios,Scenario 1,yearPriorities,2,2}') || '{"factor":2.0}'::jsonb),
  updated_by = 'skyunit@bot', updated_at = now()
where id='default'
  and config#>>'{projects,cpl-implementation,scenarios,Scenario 1,targetMultiplier}' is not null;

-- ── Statement 2 — drop the retired global multiplier ──
update cpl_funding_config
set config = config #- '{projects,cpl-implementation,scenarios,Scenario 1,targetMultiplier}',
    updated_by = 'skyunit@bot', updated_at = now()
where id='default'
  and config#>>'{projects,cpl-implementation,scenarios,Scenario 1,targetMultiplier}' is not null;
