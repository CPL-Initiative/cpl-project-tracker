-- Side session (CPL @ Copper Mountain annual update), 2026-10-26. Sam, in chat (~20:25Z): "I need to provide an
-- annual update on the CREDIT FOR PRIOR LEARNING @ COPPER MOUNTAIN demonstration Project that is part of our Veteran
-- Sprint ... Please look at our COBI Activity updates and KB for the project and draft an update that I can copy and
-- paste into an existing Word doc the CO is maintaining." Then, of the draft (~20:55Z): "Wonderful! Thankyou! Please
-- post this to the Library as a document."
-- (1) One Library record for the update: a Claude Doc (home web), status approved on his "Wonderful", the Word copy
--     built from the report's own Veterans Mental Health formatting going to the CPLLibrary SharePoint folder by hand.
-- (2) Rule 8 ingest: what MAP showed at Copper Mountain College on 2026-10-26 and which figures came from COBI alone.
-- INSERT-only, idempotent on slug, cohort library-cmc-dp@bot.
-- Rollback: delete from cpl_library where slug = 'cpl-copper-mountain-dp-update-fall-2026' and added_by = 'library-cmc-dp@bot';
--           delete from cpl_memory_log where actor = 'library-cmc-dp-2026-10-26';
--           delete from cpl_memory where slug = 'copper-mountain-dp-fall-2026-update-2026-10-26' and author = 'library-cmc-dp-2026-10-26';
insert into public.cpl_library (slug, title, kind, occasion, made_on, version, summary, extent, file_type,
  status, seen_by, home, url, file_name, made_by, figures, rebuild_from, note, versions, for_kind, for_name, knowledge,
  added_by)
values ('cpl-copper-mountain-dp-update-fall-2026',
  'CPL @ Copper Mountain: Demonstration Project Update, Fall 2026', 'document',
  'Vision 2030 Demonstration Projects Progress & Accomplishments Report, Fall 2026 Update', '2026-10-26', '1',
  'The Fall 2026 entry for the Credit for Prior Learning @ Copper Mountain demonstration project (MCAGCC Twentynine Palms and Copper Mountain College) in the Chancellor''s Office Vision 2030 Demonstration Projects report: overview, the first year''s progress, seven measures and four headline figures, in the Veterans Mental Health entry''s format.',
  'About 620 words, two pages in the report', 'doc', 'approved', 'team', 'web',
  'https://claude.ai/artifact/LQwDfyPDW1KSWKAF7yZ4Yh',
  '20261026_CPL_Copper_Mountain_DP_Update_Fall_2026.docx',
  'A side session of 2026-10-26 at Sam''s request, from the MAP team''s COBI updates for project 4.1.1 and MAP''s data for Copper Mountain College',
  'MAP platform figures as of 2026-10-26 (MAP CPL Insights Dashboard, scraped 18:46Z; MAP custom-report load 70, 19:40Z): 84 students, 300 units, $513,810 estimated savings, $1.8M 20-year impact, 83 JSTs against 72 enrolled veterans. From COBI alone: 69 JSTs since May 1, 50 ACE CRs to 22 courses in 11 pathways (Oct 19), 578 articulations in 15 disciplines (Jul 1).',
  'The doc is edited in place on claude.ai. The Word copy: CPLBrain/04-projects/cpl-initiative/copper-mountain-dp/20261026_CPL_Copper_Mountain_DP_Update_Fall_2026_build.py, run against the CO''s report .docx (V2030_DP_Progress_and_Accomplishments_Report_Fall_2026_V2) as its template.',
  'To confirm before it goes in: the investment figure counts the $50,000 in hand (the $250,000 IEPI PRT proposal is not yet awarded); MAP shows 0 units transcribed at CMC, framed as the next milestone; the 578 articulations comes from the July 1 COBI update alone; Established Spring 2026 (COBI''s project record starts 2025-09-01); Vision 2030 outcomes copy CPL-MAP''s (1, 2, 3a, 3c, 6). The Word copy goes to the CPLLibrary SharePoint folder by hand.',
  '[{"url":"https://claude.ai/artifact/LQwDfyPDW1KSWKAF7yZ4Yh","date":"2026-10-26","label":"Version 1","status":"Current"}]'::jsonb,
  'co', 'Vision 2030 Demonstration Projects report (Fall 2026 Update)', true, 'library-cmc-dp@bot')
on conflict (slug) do nothing;

insert into public.cpl_memory (slug, kind, title, summary, detail, plain, tags, status, source, verified_by, verified_at, event_date, author, related)
select x.slug, x.kind, x.title, x.summary, x.detail, x.plain, x.tags, x.status, x.source, x.verified_by,
       case when x.verified_by is null then null else now() end, '2026-10-26'::date, 'library-cmc-dp-2026-10-26', x.related
from jsonb_to_recordset($json$[
 {"slug":"copper-mountain-dp-fall-2026-update-2026-10-26","kind":"fact",
  "title":"CPL @ Copper Mountain: the Fall 2026 DP update, and what MAP shows at the college",
  "summary":"Fall 2026 V2030 DP entry for CPL @ Copper Mountain, from COBI 4.1.1 and MAP. MAP 2026-10-26, CMC (college_id 12): 84 students, 300 units, $513,810 savings, 83 JSTs vs 72 enrolled vets (Star), 0 units transcribed, 249 BMT units articulated and waiting (83 students), 3,578 potential ACE units not articulated. Library slug cpl-copper-mountain-dp-update-fall-2026.",
  "detail":"Sources: cpl_memory held nothing on the project; COBI item_updates for 4.1.1 (2026-07-01, 09-15, 10-19) and 4.1; projects row 4.1.1 (start 2025-09-01, latest_update still 2026-04-08); the KB note overview/military-base-cpl-demonstration.md (plan, March 2026); live_metrics.json (scraped 2026-10-26T18:46Z); map_college_credit_summary and map_college_cr_unit for college_id 12 (load 70, 19:40Z). The 249 waiting units are all course_type 'Credit for Basic Military Service-Area' (the KB note reference-the-waiting-credit-backlog-is-basic-military-service holds at CMC). ACE articulated: 51 units Applied to CPL Plan, 168 In Process. Not reproduced from MAP: COBI's 578 articulations across 15 disciplines (272 military, 306 non-military; July 1); the nearest is 539 rows in chatbox_peer_articulations. COBI counts that move: 37 unique CRs (Sep 15) then 50 (Oct 19). Funding: $50,000 received and in use; a $250,000 IEPI PRT proposal submitted, PRT visits Oct 9 and Nov 16, Menu of Options by Nov 8. The plan's Year 1 targets (15 MOS fields, 25 courses, CPL transcribed for 500 students by Fall 2026) stand against 11 pathways, 22 courses and 0 transcribed. Doc: https://claude.ai/artifact/LQwDfyPDW1KSWKAF7yZ4Yh",
  "plain":"The yearly update on the Twentynine Palms and Copper Mountain College project is written and in the Library. Copper Mountain has uploaded more military transcripts than it has enrolled veterans, but no CPL has reached a student transcript yet.",
  "tags":["veteran-sprint","copper-mountain","29-palms","demonstration-project","library"],"status":"proposed",
  "source":"Side session 2026-10-26 (CPL @ Copper Mountain annual update): COBI item_updates 4.1.1 and MAP tables, read live","verified_by":null,
  "related":[]}
]$json$::jsonb)
  as x(slug text, kind text, title text, summary text, detail text, plain text, tags text[], status text,
       source text, verified_by text, related text[])
on conflict (slug) do nothing;

-- Log, as its own statement (a CTE log insert sees nothing; playbook step 6).
insert into public.cpl_memory_log (memory_id, actor, action, note, after)
select m.id, 'library-cmc-dp-2026-10-26', 'create', 'Side session: the CPL @ Copper Mountain Fall 2026 update', to_jsonb(m)
from public.cpl_memory m
where m.author = 'library-cmc-dp-2026-10-26'
  and not exists (select 1 from public.cpl_memory_log l where l.memory_id = m.id and l.action = 'create');
