-- S359 SkyMoss, 2026-10-10: the Liberal Arts emphasis read fix and Long Beach City's catalog address (PR #1965).
-- INSERT-only; rollback: supersede each row by slug (author s359-2026-10-10).
insert into public.cpl_memory (slug, title, kind, summary, detail, plain, tags, affects, source, author, event_date, status)
values
('roep-curriqunet-subject-number-lists-2026-10-10',
 'RCCD''s Liberal Arts emphasis pages list each subject once and then bare course numbers; the college read now reads them',
 'pitfall',
 'RCCD''s emphasis pages print "Mathematics (MATH): C2210, C2210H, 5, 9" and "Biology (BIO) 1, 1H, 4" (run 38092480434), so the college read matched almost no listed course and gave the page to no program (21 programs). cq_subject_lists() (PR #1965) reads each bare number with its subject: coverage 0.955 and 0.939 on the two real pages.',
 'The seven degrees are ordinary entries in each college''s curriQunet index (Riverside City: 6290 Math and Science AS493, 6284 Administration and Information Systems AA494; run 38092150229), so the index walk reaches them. A number followed by units, hours or credits stays a quantity; a code written whole and a parenthesis naming no code are left alone; the words between numbers stay as printed. The courses still unmatched are subjects the Program Course File keeps under an old code (MAT 1A, ECO 7). Communication, Media & Languages was not found by name in Riverside City''s index read; the re-capture (claude/s359-rcc-la) says whether it has a page.',
 'The district''s Liberal Arts degrees can now be matched to their catalog pages, so the harvest can read them like any other program.',
 array['program-requirements-harvest','phase-2','rccd','curriqunet'], array['kb/_program_requirements_college.py','tests/program_requirements_college_test.py'],
 'S359, college page reads 38092150229 and 38092480434', 's359-2026-10-10', '2026-10-10', 'verified'),
('roep-lbcc-catalog-address-2026-10-10',
 'Long Beach City''s current catalog is lbcc-public.courseleaf.com; the registry now holds it',
 'fact',
 'www.lbcc.edu/college-catalog (the census''s reading) links "This Year''s Catalog" to https://lbcc-public.courseleaf.com/ and lists 2025-2026 as archived (run 38092181470). The registry row now holds that address and 2026-2027, corrected so the weekly census keeps it (migration program_source_registry_lbcc_catalog_2026_10_10_s359).',
 'catalog.lbcc.edu does not resolve. Receipt kb/receipts/program_source_registry_lbcc_catalog_2026-10-10_s359.sql. Applied as a migration because execute_sql''s guard routes data writes away from it, as S345''s registry receipt was. The history table holds the prior row. The capture-only read runs on claude/s359-lbcc-read; its extraction waits on Sam''s go.',
 'The harvest knows where Long Beach City''s catalog lives and can read it next.',
 array['program-requirements-harvest','phase-2','long-beach-city','registry'], array['program_source_registry'],
 'S359, college page read run 38092181470', 's359-2026-10-10', '2026-10-10', 'verified')
on conflict (slug) do nothing;
