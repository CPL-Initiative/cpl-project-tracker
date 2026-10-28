-- S450 SkyMariposa, 2026-10-23: Scenario 4's seeded strategies follow Sam's own wording of the noncredit rules.
-- Sam, 2026-10-23 ~13:30Z in chat: "I edited the NC funding rules and saved on the tab. Can you see my edits and use them to
-- adjust any suggested strategies, etc. that are seeded in scenario 4." His saved text (Scenario 4, text.nc_rules, 13:29:56Z)
-- names four exhibit channels (a noncredit course or certificate by credit by exam or a mirrored course; an industry
-- credential; a not-for-credit course or certificate; a portfolio) and a noncredit Career Exploration and CPL Portfolio
-- course; his card edits already carry that wording in the two descriptions and metrics. This receipt rewrites the two
-- strategies lists to match, and gives NC-2 the title his description uses (proceeded on the recommendation; the tab's
-- Edit on the card reverses it in place).
-- Rule 10: one guarded UPDATE; the guard is updated_at as read (2026-10-23 13:29:56.174111+00, updated_by slee@cccco.edu):
-- a save by anyone since makes it update nothing (rows_updated 0: re-read and retry).
-- BEFORE (read 2026-10-23 ~13:35Z through the Supabase MCP), Scenario 4 ncOutcomes."1":
--   [0] title "Exhibits built or adopted"; strategies: "Adopt the statewide exhibits that match courses the noncredit
--       program mirrors, before building new ones" / "Title a credit-by-exam exhibit with the noncredit course itself, so the
--       opportunity names the program's learning" / "Post the industry certifications the program prepares students for as
--       exhibits with a credit recommendation at the college" / "List on the attestation the exhibits the strike team built or
--       adopted for the program".
--   [1] title "Noncredit CPL portfolio-development course"; strategies: "Write the course under Workforce Preparation (CB22 J,
--       CB24 program-applicable) and route it through local curriculum approval this year" / "Place it as a required course in
--       a short-term vocational Certificate of Completion the program already offers, or pair it with a career exploration
--       course as a Certificate of Competency" / "Attest the COCI control number once the program is chaptered, and the offering
--       and enrollment in Year 2".
-- ROLLBACK: the same statement with the BEFORE values (or Edit on the tab); nothing else in the config moves.
-- S505 (2026-10-28): applied 2026-10-23 13:45Z by supabase-migrate run 39963220849 from #2379's branch, which never
-- merged; committed here as the record. Read back 2026-10-28: both lists and NC-2's title are live.
update public.cpl_funding_config
set config = jsonb_set(jsonb_set(jsonb_set(config,
      '{projects,cpl-implementation,scenarios,Scenario 4,ncOutcomes,1,0,strategies}', $j$["Build a credit-by-exam exhibit on a noncredit course or certificate the program teaches, or adopt a statewide exhibit whose credit course mirrors one", "Post the industry credentials the program prepares students for as exhibits with a credit recommendation at the college", "Articulate a not-for-credit course or certificate the program offers as an exhibit, in collaboration with the credit college (for a standalone, the district's credit colleges)", "Build a portfolio exhibit so a student's documented learning is assessed for credit toward the academic pathway"]$j$::jsonb),
      '{projects,cpl-implementation,scenarios,Scenario 4,ncOutcomes,1,1,strategies}', $j$["Develop the noncredit Career Exploration and CPL Portfolio course, or adapt one a college already offers, and document the development process as it moves through local curriculum approval", "Write it as noncredit Workforce Preparation (CB22 J) so it can sit in a CDCP certificate: required in a short-term vocational Certificate of Completion, or paired as a Certificate of Competency leading to credit coursework", "Design its portfolio to document a student's learning against specific CPL opportunities on an academic pathway leading to career attainment", "Report the course annually on the attestation, and post its MAP exhibit once local curriculum approval is in place"]$j$::jsonb),
      '{projects,cpl-implementation,scenarios,Scenario 4,ncOutcomes,1,1,title}', $j$"Noncredit Career Exploration and CPL Portfolio course"$j$::jsonb)
where id = 'default'
  and updated_at = '2026-10-23 13:29:56.174111+00'
  and config #> '{projects,cpl-implementation,scenarios,Scenario 4,ncOutcomes,1}' is not null
returning updated_at as new_updated_at,
  jsonb_array_length(config #> '{projects,cpl-implementation,scenarios,Scenario 4,ncOutcomes,1,0,strategies}') as exh_strategies,
  jsonb_array_length(config #> '{projects,cpl-implementation,scenarios,Scenario 4,ncOutcomes,1,1,strategies}') as course_strategies,
  config #>> '{projects,cpl-implementation,scenarios,Scenario 4,ncOutcomes,1,1,title}' as nc2_title;
