-- S360 SkyLichen, 2026-10-11: Sam's word on catalog addenda, and his Sheet 61 rulings.
-- INSERT-only; rollback: supersede each row by slug (author s360-2026-10-11).
-- APPLIED 2026-10-11 ~01:45Z by S360 through apply_migration (cpl_memory_2026_10_11_s360_addenda_sheet61).
insert into public.cpl_memory (slug, title, kind, summary, detail, plain, tags, affects, source, author, event_date, status)
values
('sam-catalog-addenda-correct-errors-late-courses-2026-10-11',
 'Sam: RCCD and other colleges publish catalog addenda that correct errors and add late-approved courses',
 'fact',
 'Sam, 2026-10-11 ~01:40Z, in chat to S360: "Something to be aware of. RCCD and others publish catalog agenda to correct errors and late approved courses." So a mismatch between a catalog page and COCI (a catalog addition, a listed course not printed) may be settled by the college''s addendum before it is the college''s to fix.',
 'Measured the same hour: program_source_addenda lists an addendum for Moreno Valley (https://rccd.curriqunet.com/catalog/alias/mvc-catalog/iq/6375, "Changes and Addendums"), Norco (https://rccd.curriqunet.com/catalog/alias/nc-catalog/iq/5361) and Cerritos (policies-and-resources/addendums), all status listed and none read; the census found none for Riverside City, Mt. San Antonio or Long Beach City. 61 colleges hold a listed addendum. The harvest lane already tracks addenda (Sam, 2026-10-04: "We need to track this in our schema and have our agents aware.") and names the addenda reading agent as NEXT.',
 'A college''s catalog addendum can fix an error or add a course approved after the catalog printed, so check it before telling the college a program disagrees with the state''s records.',
 array['program-requirements-harvest','addenda','rccd','coci-status'], array['program_source_addenda','kb/_build_roep_display.py'],
 'Sam, chat to S360, 2026-10-11', 's360-2026-10-11', '2026-10-11', 'verified'),
('sam-sheet-61-rulings-lbcc-rules-remove-39120-2026-10-11',
 'Sam (Sheet 61): Long Beach City reads once the extraction carries rules 4 and 5; Riverside City 39120 is removed',
 'decision',
 'Sam, Open Asks Sheet 61, 2026-10-11 01:26Z, both his own call (through 2): card 1 "rules" (extract Long Beach City''s 379 programs once the extraction carries recommended electives as their own block and printed careers); card 2 "remove" (Riverside City 39120, which reads HVAC Commercial Technology''s page). In chat: "Go Long Beach and remove stale".',
 'Card 1: a session changes the extraction first, shows Sam a few records read with it, then reads Long Beach City once (capture run 38092572555 found a page for 379 of 385 programs; about $22). Card 2: the row is deleted with a receipt holding the full row, only while its md5 matches the live read, it is unchecked and no verdict names it.',
 'Sam chose to read Long Beach City after the extraction learns his two new rules, and to remove one stale Riverside City record.',
 array['program-requirements-harvest','decision-sheet','rccd','long-beach-city'], array['program_requirement_records','chatbox/supabase/functions/program-requirements-extract/index.ts'],
 'Sam, Open Asks Sheet 61 replies (items 1-2, done through 2)', 's360-2026-10-11', '2026-10-11', 'verified');
