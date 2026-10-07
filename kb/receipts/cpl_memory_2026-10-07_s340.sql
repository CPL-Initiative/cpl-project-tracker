-- S340 SkyLedger, 2026-10-07: checkpoint rows (PR #1894). Session inferences, status proposed.
-- INSERT-only; rollback: supersede each row by slug (author s340-2026-10-07).
insert into public.cpl_memory (slug, title, kind, summary, detail, plain, tags, affects, source, author, event_date, status)
values
('smc-barbering-43767-record-filed-2026-10-07',
 'Santa Monica Barbering A.S. 43767 has a harvest record in records_maps/, unchecked; its unit check reads incomplete',
 'milestone',
 'Extraction run 37548804006 (source: capture 37545459181): 23 of 25 courses placed (COSM 64, 95D explained), 4 outcomes verbatim, invented 0, arithmetic incomplete (25.5 against 26.5: Salon Experience prints no minimum). Filed to records_maps/ beside Irvine Valley 10265; the live load waits on Sam (open-asks sheet 46 card 8).',
 'Cost $0.09989. A local score() of the filed record equals the run''s score key for key, which proves the transcription from the MCP log. MAP holds a Barbering license articulation (source MAP) on 22 of the program''s courses at Santa Monica, so the record reads up to 21.5 of 26.5 units through CPL.',
 'Santa Monica''s Barbering degree now has a record of its requirements; it is not yet in the live table.',
 array['program-requirements-harvest','santa-monica','records'], array['kb/program_requirements_pilot/records_maps/smc_43767.json','kb/program_requirements_pilot/sources/smc_43767.json'],
 'S340, extraction run 37548804006', 's340-2026-10-07', '2026-10-07', 'proposed'),
('roep-plan-counts-a-course-once-2026-10-07',
 'The ROEP up-to figure counted a course twice when a program names it in two blocks; it now counts once',
 'pitfall',
 'plan() in kb/_build_roep_display.py added a course''s CPL units in every block naming it: Irvine Valley Art A.A. requires ART 85 and lists it again among its electives, so the figure read 6 units from one 3-unit course. S340: a course counts once, and a choice never picks a course already taken.',
 'Santa Monica''s COSM 11C (Level 1 and the Level 4 misprint) did the same. None of the 20 pilot figures moved. tests/roep_display_test.py pins the case (a required course listed again in a choice and in a later all-block).',
 'A course a program lists twice now counts once toward its CPL figure.',
 array['program-requirements-harvest','roep','cpl-pathways'], array['kb/_build_roep_display.py','tests/roep_display_test.py'],
 'S340, PR #1894', 's340-2026-10-07', '2026-10-07', 'proposed'),
('roep-read-map-in-display-2026-10-07',
 'A read term-by-term map rides display.map (status read), and CPL Pathways places each course in its term from it',
 'fact',
 'term_map() copies an accepted sequence record (sequences/<key>.json) into display.map: status "read", the terms as printed, placed (code to term index) and not_placed. roepReadMap in cpl_pathways.js draws one box per term and matches nothing itself. Build 9f60f746ea49: Santa Monica 24 of 25 placed, Irvine Valley 5.',
 'COSM 49R is Santa Monica''s one course off its map. Sierra skips a map status she does not know: cpl-chat''s MAP_STATUS_LINE gains read in #1894, and must be deployed before a display build with a read map reaches program_requirement_records. figure.path stays null (TBA); path_why says the map is read.',
 'CPL Pathways lays out a program term by term where the college publishes a map.',
 array['program-requirements-harvest','roep','cpl-pathways','sierra'], array['kb/_build_roep_display.py','cpl_pathways.js','chatbox/supabase/functions/cpl-chat/index.ts'],
 'S340, PR #1894', 's340-2026-10-07', '2026-10-07', 'proposed'),
('dated-read-refresh-by-row-fingerprint-2026-10-07',
 'Refresh a dated read by fingerprinting each row in SQL and locally, and re-read only the rows that differ',
 'procedure',
 'MCP output is transcribed by hand, so a whole re-read costs a full transcription. Hash each college''s rows in SQL (string_agg ordered by code collate "C") and in Python over the stored file; per-row, then per-title hashes narrow a difference to the values to re-read. S340: three of five colleges matched outright; the other two differed in four courses.',
 'Each of the four differed by one exhibit title; only those and the two new colleges were read in full. Order matters: the per-title hashes gave the live order, and the first rebuild, keeping the stored order, missed until it followed them. Method in docs/kb-notes/methodology-a-postgres-md5-proves-a-transcribed-jsonb-copy.md.',
 'A copy of a database read can be checked and refreshed row by row without copying it all again.',
 array['methodology','supabase','verification','program-requirements-harvest'], array['kb/program_requirements_pilot/map_cr_by_course.json','kb/program_requirements_pilot/registry_read.json'],
 'S340, KB note methodology-a-postgres-md5-proves-a-transcribed-jsonb-copy', 's340-2026-10-07', '2026-10-07', 'proposed')
on conflict (slug) do nothing;

insert into public.cpl_memory_log (memory_id, actor, action, note, after)
select m.id, 's340-2026-10-07', 'create', 'S340 checkpoint, 2026-10-07', to_jsonb(m)
from public.cpl_memory m where m.author = 's340-2026-10-07'
  and not exists (select 1 from public.cpl_memory_log l where l.memory_id = m.id and l.action = 'create');
