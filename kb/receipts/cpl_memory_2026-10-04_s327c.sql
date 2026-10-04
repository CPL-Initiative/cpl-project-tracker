-- S327 (SkyAmend) checkpoint, 2026-10-04: Rule 8 ingest - four rows, all proposed, all logged.
-- Rollback: supersede by slug under actor 'SkyAmend-s327-rollback'.
insert into public.cpl_memory (slug, title, kind, summary, detail, plain, tags, affects, source, author, event_date, status)
values
('roep-display-build-live-2026-10-04',
 'Each checked program''s display facts are built once for CPL Pathways and Sierra (build bbbbfb611f15)',
 'milestone',
 'kb/_build_roep_display.py writes CPL in three kinds per course, the up-to figure, gaps and map status to cpl_pathways_roep_data.js and program_requirement_records.display under one build stamp. All 20 pilot rows live and match the receipt (--verify-sql). Ironworker A.S.: up to 31.5 of 34-38 units.',
 'Sierra reads display in CATALOG REQUIREMENTS lines (PR #1854, deploying after a clean A/B; smoke 7r). Guard tests/roep_display_test.py holds the page file and the receipt equal and recomputes the figure. Refresh the two dated reads (map_cr_by_course.json, registry_read.json) when the harvest adds a college. KB note methodology-one-build-two-readers.',
 'CPL Pathways and Sierra now read the same program facts from one build.',
 array['program-requirements','roep','cpl-pathways','sierra'], array['kb/_build_roep_display.py','cpl_pathways_roep_data.js','chatbox/supabase/functions/cpl-chat/index.ts'],
 'S327, PR #1854', 'SkyAmend-s327', '2026-10-04', 'proposed'),
('connector-holds-bare-update-2026-10-04',
 'The Supabase connector holds a bare UPDATE and writes nothing; the insert-select-on-conflict form passes',
 'pitfall',
 'Two apply_migration calls with a bare UPDATE (one a single 3.5 KB row) timed out at 60 s writing nothing. The same change as insert ... select from the row ... on conflict (key) do update set col = excluded.col went through; selecting the row means it can never add one. About 40 KB is the most one migration carried.',
 'execute_sql refuses an UPDATE at the repo guard (scripts/supabase_sql_guard.py), whose documented route is a migration. For a session-written table (program_requirement_records) the migration path is the precedent (S326 load). Verify with md5(display::text) against a jsonb-text fingerprint.',
 'Write a row change as an insert that conflicts, never a plain update, or the database tool stalls.',
 array['supabase','connector','pitfall','migration'], array['kb/_build_roep_display.py'],
 'S327 apply runs, 2026-10-04', 'SkyAmend-s327', '2026-10-04', 'proposed'),
('outcomes-printed-on-13-of-20-pilot-pages-2026-10-04',
 '13 of the 20 captured pilot pages print program or student learning outcomes',
 'fact',
 'Measured S327 over kb/program_requirements_pilot/sources: Cerritos, Riverside and West LA print outcomes on all four of their pages, Mt. San Antonio on one, Miramar on none. The record shape does not carry them yet; COCI course outcomes are not in our data.',
 'Supports Sam''s 18:03Z ask (an outcomes element in the harvest; compare credential skills with course outcomes). Open-asks sheet 33 card 4 proposes record shape v3 with outcomes as printed. The skills file kb/reference/industry_credential_skills.json is not started.',
 'Most catalog pages the harvest already reads list learning outcomes.',
 array['program-requirements','outcomes','slo','roep'], array['kb/program_requirements_pilot/sources'],
 'S327 measurement', 'SkyAmend-s327', '2026-10-04', 'proposed'),
('for-consideration-zero-on-pilot-2026-10-04',
 '"For consideration" CPL reads zero on the 20 pilot programs, for two measured reasons',
 'fact',
 'None of the 384 CER titles without an articulation, nor any of the 1,165 IT/AI catalog credentials, names a course identity; the 24 C-IDs the statewide recommendations name share none with the pilot''s 27 C-IDs, and Riverside''s AJ courses carry no C-ID in our data.',
 'The builder wires the kind to statewide C-ID recommendations not articulated at the college; Sam''s answer widens it through a skills-to-outcomes comparison. Also from the build: Miramar''s AUTO 156G carries an EMT Certification and a Driver Operator 1B articulation in MAP''s own feed (a clean-up item to raise with the college).',
 'No unarticulated certificate yet points at a pilot course, so that column is empty for now.',
 array['program-requirements','cpl-pathways','cer','roep'], array['kb/_build_roep_display.py','credential_reference_data.js'],
 'S327 measurement', 'SkyAmend-s327', '2026-10-04', 'proposed')
on conflict do nothing;

insert into public.cpl_memory_log (memory_id, actor, action, note, after)
select m.id, 'SkyAmend-s327', 'create', 'S327 checkpoint ingest', to_jsonb(m)
from public.cpl_memory m
where m.author = 'SkyAmend-s327'
  and not exists (select 1 from public.cpl_memory_log l where l.memory_id = m.id and l.action = 'create');
