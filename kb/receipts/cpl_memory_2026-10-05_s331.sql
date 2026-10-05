-- S331 (SkyForge), 2026-10-05: the harvest tab port, the reader's expand and rows steps, and Cerritos's
-- high school list by other routes (reads 7-12). Session findings, so status proposed.
-- Rollback: supersede each row by slug under actor 'SkyForge-s331-rollback'.
insert into public.cpl_memory (slug, title, kind, summary, detail, plain, tags, affects, source, author, event_date, status)
values
('cerritos-hs-list-other-routes-2026-10-05',
 'Cerritos''s high school articulation list: CATEMA, CTE Course Connect, CCAP, BoardDocs and the archive, read',
 'fact',
 'Reads 7-12 (S331): Cerritos is not a CATEMA site; cerritos.ctecourseconnect.com has no DNS record or archive capture; the CCAP page names Downey, Warren and Columbus high schools as partners; BoardDocs bars readers; DualEnroll is a sign-in page; /epp/Articulation_List.htm is 404. No public source holds the current list or Columbus High''s welding route.',
 'Runs 37247286802 (read 7), 37247716971 (8), 37248015019 (9), 37248993313 (10), 37249565514 (11), 37250119275 (12). Downey High''s 2023 post: the welding pathway "will be equivalent to the Cerritos College course: WELD 100", articulation wording. Columbus High''s CTE Welding page (read 12): Welding and Materials Joining I and its Capstone, with OSHA 10 General Industry and OSHA 30 Construction certifications, Cerritos named as partner college; taught by Downey Unified teachers. Recorded on Cerritos''s procedure record v4. The request to Cerritos''s Educational Partnerships office stays held (Sam, sheet 36 card 2) until he rules the public routes exhausted.',
 'We checked every public place Cerritos''s list of high school courses that earn college credit might be, and none holds today''s list; Columbus High is one of Cerritos''s dual enrollment partner schools.',
 array['program-requirements','high-school-articulation','cerritos','catema','college-page-read','cpl-pathways'], array['docs/reference/lanes/program-requirements-harvest.md','cpl_pathways_data.js'],
 'Runner reads 7-12, S331', 'SkyForge-s331', '2026-10-05', 'proposed'),
('cerritos-hs-agreements-2016-list-2026-10-05',
 'The last public list of Cerritos''s high school agreements (2016): 57 agreements, 27 schools and ROPs, no welding',
 'fact',
 'The Internet Archive''s 2016-03-14 capture of Statewide Career Pathways'' full agreement list holds 57 Cerritos agreements with 27 high schools and ROPs: Project Lead The Way engineering (ENGT 103, ET 101, ENGT 104, ARCH 101), AUTO 100, CA 101, accounting, MTT 180, WMT, film and pharmacy. None is a welding agreement; none names Columbus High.',
 'Read 10 (run 37248993313) through the reader''s rows step; kept dated in kb/program_requirements_pilot/cerritos_hs_agreements_2016.json with each agreement''s PDF address. It shows what Cerritos had articulated by 2016, not today''s list. On the ladder as an In our data line.',
 'An archived copy of the old statewide database shows the 57 high school courses Cerritos had agreed to give credit for by 2016; welding was not among them.',
 array['program-requirements','high-school-articulation','cerritos','cpl-pathways'], array['kb/program_requirements_pilot/cerritos_hs_agreements_2016.json','cpl_pathways_data.js'],
 'Runner read 10, S331', 'SkyForge-s331', '2026-10-05', 'proposed'),
('program-requirements-tab-in-cobi-2026-10-05',
 'The Program Requirements tab is in COBI (Beta draft): catalogs, records, sequences and each college''s reading procedure, read live',
 'milestone',
 'program_requirements.js (PR #1860) reads program_source_registry and program_requirement_records live under Reference & Curation. Procedures shows each college''s procedure record (hosts, reads with run links, answers, open questions, nuances, held requests). Sierra is one link to the CPL Assistant. A failed read names its table and paints no count.',
 'Ports the approved mock-up v3 (https://claude.ai/artifact/DkfRYLpyusuqYy6ErqQe6f). The admin surface scan finds a read only in the REST + "/<table>" idiom, so the module keeps it. Test tests/program_requirements.test.js. A docked Sierra (mountInto with the program-requirements surface) needs the surface in cpl-chat KNOWN_SURFACES; an unknown surface is treated as unscoped, so docking would work without the deploy.',
 'The new COBI tab shows where every college''s catalog is, each program record we have read and checked, and the step-by-step reading notes for each college.',
 array['program-requirements','cobi','procedure-record','harvest-tab'], array['program_requirements.js','docs/reference/lanes/program-requirements-harvest.md'],
 'S331 build', 'SkyForge-s331', '2026-10-05', 'proposed'),
('a-search-result-is-a-lead-not-a-source-2026-10-05',
 'A search result is a lead, not a source: three addresses search returned for Cerritos''s list were dead',
 'pitfall',
 'hsarticulation.cerritos.edu (no DNS), cerritos.ctecourseconnect.com (no DNS, no archive capture) and /epp/Articulation_List.htm (404) all came from web search, which keeps a page''s title and snippet long after the page is gone. Read the address from a runner before writing it anywhere, and mark the host on the procedure record so no read repeats it.',
 'S331 reads 7 and 11. The reader''s expand step (innerText of a display:none element returns its textContent in Chromium, so "not shown" is tested with getClientRects) and rows step (every matching table row with its links) came from the same reads.',
 'Search engines keep listing pages that no longer exist, so we confirm each one before relying on it.',
 array['college-page-read','methodology','program-requirements'], array['kb/_college_page_read.py'],
 'S331 reads 7 and 11', 'SkyForge-s331', '2026-10-05', 'proposed')
on conflict (slug) do nothing;
insert into public.cpl_memory_log (memory_id, actor, action, note, after)
select id, 'SkyForge-s331', 'create', 'S331 findings', to_jsonb(m)
from public.cpl_memory m where m.author = 'SkyForge-s331'
 and not exists (select 1 from public.cpl_memory_log l where l.memory_id = m.id and l.action = 'create');
select m.slug, m.status, (select count(*) from public.cpl_memory_log l where l.memory_id=m.id and l.action='create') creates
from public.cpl_memory m where m.author = 'SkyForge-s331' order by m.slug;
