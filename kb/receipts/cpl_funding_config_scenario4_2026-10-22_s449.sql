-- S449 side session (beside SkyBuckwheat), 2026-10-22: Scenario 4 written into the stored funding config.
-- Sam, 2026-10-22 ~20:26Z, in chat to the funding side session: "go ahead and build Scenario 4" (cpl_memory
-- sam-build-scenario-4-go-2026-10-22). The build is a copy of Scenario 3 with the noncredit lane as he ruled on Open
-- Asks Sheets 113 and 114 (cpl_memory sam-sheet-113-rulings-2026-10-22, sam-sheet-114-rulings-2026-10-22). Scenario 3
-- stays published: `published` is not touched, so colleges keep reading Scenario 3 until he publishes 4 on the tab.
--
-- What the tab's New scenario would have done: p.scenarios["Scenario 4"] = clone(the current scenario's override).
-- This statement does the same from the LIVE Scenario 3 at execution time (never a stale copy), drops its
-- docStatus (the memo is final for 3, not for 4), and adds the noncredit outcomes lane's keys, which cpl_funding.js
-- reads since the Scenario 4 code PR: ncLane, ncOutcomes, ncReported.
--
-- Rule 10: one guarded UPDATE. The guard is updated_at as read at write time (a save by anyone since makes it update
-- nothing); a second guard refuses to overwrite a Scenario 4 that already exists; the cpl_funding_config_touch trigger
-- sets updated_at to now() so an open tab window refuses its next stale save and reloads the newer config (#1672).
--
-- BEFORE (read 2026-10-22 20:3xZ through the Supabase MCP): id 'default', updated_by slee@cccco.edu,
--   updated_at 2026-10-22 17:32:53.784002+00, md5(config::text) 9c944a8217e90f5cd988b740fa05bc70, 48,840 chars,
--   scenarios [Scenario 1, Scenario 2, Scenario 3], published Scenario 3. The whole before-image is committed as
--   funding/nc_outcome_feasibility/2026-10-22/cpl_funding_config_9c944a82.json (the same md5).
-- AFTER: the same three scenarios plus Scenario 4; nothing else in the config changes.
--
-- ROLLBACK (removes Scenario 4 alone; nothing else moved):
--   update public.cpl_funding_config
--      set config = config #- '{projects,cpl-implementation,scenarios,Scenario 4}'
--    where id = 'default' and config #> '{projects,cpl-implementation,scenarios}' ? 'Scenario 4';
--   (If Sam has since published Scenario 4, first set published back to 'Scenario 3' on the tab, or
--    jsonb_set(config, '{projects,cpl-implementation,published}', '"Scenario 3"') in the same statement.)
--
-- A good result is one row: rows_updated = 1, scenarios listing four names, published still Scenario 3.
-- rows_updated = 0 means the config was saved after the guard time, or Scenario 4 already exists: re-read and retry.
with old as (
  select id, config, updated_at from public.cpl_funding_config where id = 'default'
), s4 as (
  select ((old.config #> '{projects,cpl-implementation,scenarios,Scenario 3}') - 'docStatus') || $nc$
{
  "ncLane": "outcomes",
  "ncOutcomes": {
    "1": [
      {
        "key": "exh",
        "title": "Exhibits built or adopted",
        "share": 0.5,
        "goals": ["A"],
        "unit_word": "exhibits",
        "metric_src": "nc_exh",
        "target_rule": { "kind": "pct_floor_cap", "of": "nc_cdcp", "pct": 0.05, "floor": 2, "cap": 10 },
        "metric": "Exhibits in MAP built or adopted for the noncredit program's learning: the exhibit names a noncredit course, its target credit course mirrors a noncredit course at the college (for a standalone, at the district's credit colleges), its credential is one the program's courses name, or the strike team lists it on the attestation. An adopted statewide exhibit counts.",
        "description": "Standing CPL opportunities for what the noncredit program teaches: the greater of 2 and 5% of its CDCP noncredit courses, capped at 10, the same target both years.",
        "strategies": [
          "Adopt the statewide exhibits that match courses the noncredit program mirrors, before building new ones",
          "Title a credit-by-exam exhibit with the noncredit course itself, so the opportunity names the program's learning",
          "Post the industry certifications the program prepares students for as exhibits with a credit recommendation at the college",
          "List on the attestation the exhibits the strike team built or adopted for the program"
        ]
      },
      {
        "key": "course",
        "title": "Noncredit CPL portfolio-development course",
        "share": 0.5,
        "goals": ["A"],
        "unit_word": "courses",
        "metric_src": "nc_course",
        "target_rule": { "kind": "fixed", "n": 1 },
        "metric": "A noncredit CPL portfolio-development course chaptered in a CDCP program in COCI by the end of Year 1 (the strike team attests its control number; the COCI sync confirms it), offered with enrollment attested in Year 2.",
        "description": "A noncredit course that guides adult learners through documenting their experience against specific CPL opportunities, inside a chaptered CDCP program: required in a short-term vocational Certificate of Completion, or as a two-course Certificate of Competency whose outcome is credit coursework.",
        "strategies": [
          "Write the course under Workforce Preparation (CB22 J, CB24 program-applicable) and route it through local curriculum approval this year",
          "Place it as a required course in a short-term vocational Certificate of Completion the program already offers, or pair it with a career exploration course as a Certificate of Competency",
          "Attest the COCI control number once the program is chaptered, and the offering and enrollment in Year 2"
        ]
      }
    ]
  },
  "ncReported": [
    {
      "key": "students",
      "title": "Former noncredit students awarded CPL credit",
      "text": "The count of former noncredit students the college awarded CPL credit, from the college's own student information system, reported on the annual attestation. Reported, not funded, until the Chancellor's Office can measure it; the CCCID path is a long-term integration request with CCCApply."
    }
  ]
}
$nc$::jsonb as body
  from old
), upd as (
  update public.cpl_funding_config c
     set config = jsonb_set(old.config, '{projects,cpl-implementation,scenarios,Scenario 4}', s4.body, true)
    from old, s4
   where c.id = old.id
     and c.updated_at = timestamptz '2026-10-22 17:32:53.784002+00'
     and not (old.config #> '{projects,cpl-implementation,scenarios}' ? 'Scenario 4')
   returning c.updated_at as new_updated_at,
             (select array_agg(k order by k) from jsonb_object_keys(c.config #> '{projects,cpl-implementation,scenarios}') k) as scenarios,
             c.config #>> '{projects,cpl-implementation,published}' as published
)
select (select count(*) from upd) as rows_updated,
       (select new_updated_at from upd) as new_updated_at,
       (select scenarios from upd) as scenarios,
       (select published from upd) as published;
