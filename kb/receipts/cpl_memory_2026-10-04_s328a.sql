-- S328 (SkyLadder), 2026-10-04 ~19:30Z: Rule 8 ingest - three rows.
-- New (author 'SkyLadder-s328'): Sam's sheet 34 rulings (decision, verified: his words); his word
-- for MAP's counts, datasets (convention, verified: his words); the #1854 deploy (fact, proposed).
-- Rollback: supersede each row by slug under actor 'SkyLadder-s328-rollback'.

insert into public.cpl_memory (slug, title, kind, summary, detail, plain, tags, affects, source, author, event_date, status, verified_by, verified_at)
values
('sam-sheet34-rulings-2026-10-04',
 'Sam''s rulings on open-asks sheet 34: the statement of who CPL serves, and one procedure record per college',
 'decision',
 'Sam, sheet 34 (2026-10-04 19:18Z, both his own call): 1 the statement as drafted with two edits: "The CPL Initiative serves California''s 116 community colleges, two noncredit campuses, and partner programs such as LAUNCH and Futuro Health. Cal State LA is the first CSU campus on MAP. Adult education, ROP and not-for-credit programs join later." 2 one procedure record per college, as proposed.',
 'His card 1 note: "Looks good. Take out the statement that UpSkill will be added nest and just leave the later addition of these types of programs generic. Change the word "scrape" to datasets." Card 2 (as proposed): a procedure record per college kept with its history on the college''s program_source_registry row (hosts, platform, reading steps, refusals, workarounds tried, nuances); the reader loads it before each run; the harvest tab''s Procedures view shows it; each workaround Sam suggests lands as a change under his name and date; a request to a college is drafted only when its record shows every step tried; Cerritos first, from a runner read. The 116 is the 115 credit colleges plus Calbright; MAP''s datasets count 116 as the 115 plus Cal State LA. Sheet https://claude.ai/artifact/PE2mmQZBvoArb5MTnC2gCG.',
 'Sam approved one sentence set on who the CPL Initiative serves, and a written reading procedure for each college''s catalog.',
 array['decision-sheet','csu','college-identity','program-requirements','agents','statement'], array['docs/reference/lanes/college-district-identity.md','docs/reference/lanes/program-requirements-harvest.md','excel_to_dashboard.py','chatbox/supabase/functions/cpl-chat/index.ts'],
 'Sam, open-asks sheet 34 replies, 2026-10-04', 'SkyLadder-s328', '2026-10-04', 'verified', 'Sam', now()),
('sam-datasets-not-scrape-2026-10-04',
 'Sam: call MAP''s counts its datasets, not the scrape',
 'decision',
 'Sam, 2026-10-04 19:18Z (sheet 34 card 1 note): "Change the word "scrape" to datasets." In anything a reader sees, what MAP counts is MAP''s datasets; "scrape" stays an internal and code word (scraped_at, the scraper).',
 'Raised on the card that said "MAP''s scrape also counts 116". Applies to statements, letters, Sierra''s lines and explainers that describe MAP''s figures. Identifiers such as scraped_at and file names keep their names.',
 'Say MAP''s datasets when describing MAP''s numbers to readers.',
 array['naming','vocabulary','map','house-voice'], array['docs/reference/lanes/college-district-identity.md'],
 'Sam, open-asks sheet 34 card 1 note, 2026-10-04', 'SkyLadder-s328', '2026-10-04', 'verified', 'Sam', now()),
('roep-display-deployed-2026-10-04',
 'Sierra reads each checked program''s display facts in production (#1854, deployed 2026-10-04)',
 'fact',
 '#1854 merged as db1b9ff; cpl-chat deployed by run 37227471803 at 19:14Z under the standing A/B authorization (A/B 37225759463: no regressions, preview all modes OK, 7l and the CPL-figure mode fixed). Production smoke 37227589712: ALL MODES OK, including 7t (Ironworker A.S., up to 31.5 of 34-38 units).',
 'The CPL-figure smoke mode is 7t; the S327 row roep-display-build-live-2026-10-04 says 7r, the name it had before the rename (7r is the offerings mode and the A/B''s control). The preview function cpl-chat-preview still exists; the next A/B run with cleanup: true deletes it.',
 'Sierra now gives the same CPL figures the CPL Pathways page shows for checked programs.',
 array['sierra','roep','cpl-pathways','deploy','program-requirements'], array['chatbox/supabase/functions/cpl-chat/index.ts','chatbox/smoke_test.sh'],
 'S328, workflow runs 37227471803 and 37227589712', 'SkyLadder-s328', '2026-10-04', 'proposed', null, null)
on conflict do nothing;

insert into public.cpl_memory_log (memory_id, actor, action, note, after)
select m.id, 'SkyLadder-s328', 'create', 'S328 ingest (sheet 34, datasets, deploy)', to_jsonb(m)
from public.cpl_memory m
where m.slug in ('sam-sheet34-rulings-2026-10-04','sam-datasets-not-scrape-2026-10-04','roep-display-deployed-2026-10-04')
  and not exists (select 1 from public.cpl_memory_log l where l.memory_id = m.id and l.action = 'create');
