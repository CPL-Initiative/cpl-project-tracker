-- S331 (SkyForge), 2026-10-05: Cerritos's procedure record v3 -> v4, through program_source_procedure_set().
-- Reads 7-12 (Sam, sheet 36 card 2: find the high school list another way). Composed from the stored v3 so
-- nothing unchanged is retyped: four host notes edited, four hosts added, six steps appended, the high school
-- answer, open item, nuances and workarounds updated. Guarded on v3's md5 (dcf96a508207ee55e604437d9ef71802).
-- Written 2026-10-05: was_md5 dcf96a508207ee55e604437d9ef71802, md5 290ad739ec4acbe46b39793ac5642046 (v4).
-- Rollback: program_source_procedure_set('Cerritos College', <v3 from program_source_registry_history>,
--   'SkyForge-s331-rollback', '290ad739ec4acbe46b39793ac5642046').
with cur as (select procedure p from public.program_source_registry where college = 'Cerritos College'),
v4 as (
  select p
    || jsonb_build_object('v', 4)
    || jsonb_build_object('reader', 'kb/_college_page_read.py (robots.txt first, 4 s between loads, the census user agent; a plan''s page may open collapsed sections, print a long table''s matching rows, or submit a form)')
    || jsonb_build_object('hosts', (
         select jsonb_agg(case h->>'host'
           when 'www.cerritos.edu' then h || jsonb_build_object('note', (h->>'note') || ' The EPP address /academics/divisions/epp/Articulation_List.htm, which web search returns, answers 404 (2026-10-05). The CCAP page closes Participating High Schools in an accordion; a plan reads it with expand.')
           when 'hsarticulation.cerritos.edu' then h || jsonb_build_object('note', (h->>'note') || ' Search results call it Cerritos College CTE Articulation; the address that replaced it, cerritos.ctecourseconnect.com, has no DNS record either (2026-10-05).')
           when 'www.statewidepathways.org' then h || jsonb_build_object('note', (h->>'note') || ' The 2016-03-14 capture of showagreements.php?careerpathid=0 (Show All Agreements) is the full list, 419,364 characters: 57 Cerritos agreements with 27 schools and ROPs, none for welding, none with Columbus High (read 10; kb/program_requirements_pilot/cerritos_hs_agreements_2016.json). The career-path queries 3 and 11 were never captured.')
           when 'web.dusd.net' then h || jsonb_build_object('note', 'Downey Unified. Downey High''s 2023 Welding Pathway post: the pathway will be equivalent to WELD 100 Welding Fundamentals, articulation wording. Columbus High''s CTE Welding page (/columbus/cte-welding/): Welding and Materials Joining I and its Capstone, OSHA 10 General Industry and OSHA 30 Construction certifications, Cerritos named as the partner college, taught by Downey Unified teachers. Downey High''s Dual Enrollment page: dual enrollment may be offered to Columbus, Downey and Warren students; Early College runs only at Downey and Warren.')
           when 'web.archive.org' then h || jsonb_build_object('note', 'The Wayback Machine, read from a runner (the session container cannot reach it). No capture of hsarticulation.cerritos.edu or cerritos.ctecourseconnect.com. Statewide Career Pathways'' 2016-03-14 full agreement list is captured. The index (cdx/search/cdx?url=<address>&matchType=prefix) shows which query addresses were captured; an uncaptured one answers 404.')
           else h end)
         from jsonb_array_elements(p->'hosts') h)
       || jsonb_build_array(
         jsonb_build_object('host', 'cerritos.ctecourseconnect.com', 'access', 'unreached', 'platform', 'outside', 'note', 'CTE Course Connect, which web search still lists as Cerritos College CTE Course Articulation: an agreement search by high school and industry sector, agreements at /View/<id>. No DNS record on 2026-10-05 (run 37247286802), and the archive holds no capture.'),
         jsonb_build_object('host', 'www.catema.com', 'access', 'open', 'platform', 'outside', 'note', 'CATEMA''s site login directory lists 30 California colleges, Rio Hondo the nearest; Cerritos is not one. Each college''s CATEMA site is a sign-in (2026-10-05, run 37247286802).'),
         jsonb_build_object('host', 'www.boarddocs.com', 'access', 'refused', 'platform', 'outside', 'note', 'BoardDocs, where Cerritos''s board publishes agendas (/ca/cerritos/Board.nsf). robots.txt disallows readers, so no read loads it (2026-10-05, run 37247716971). Web search places the CCAP agreement with Downey Unified there.'),
         jsonb_build_object('host', 'cerritos.dualenroll.com', 'access', 'refused', 'platform', 'outside', 'note', 'DualEnroll (CourseMaven), the CCAP enrollment platform the CCAP page names: a sign-in page only, and the reader never signs in (2026-10-05, run 37248015019).')))
    || jsonb_build_object('steps', (p->'steps') || jsonb_build_array(
         jsonb_build_object('run', '37247286802', 'date', '2026-10-05', 'plan', 'kb/college_reads/cerritos_ironworker_ladder_read7.json', 'loads', 8, 'reached', 5, 'found', 'The How To Receive Articulation Credit page names no list. cerritos.ctecourseconnect.com has no DNS record and no archive capture. Cerritos is not among CATEMA''s 30 California sites. The 2016 capture of showagreements.php lists agreements by career path through a GET form.'),
         jsonb_build_object('run', '37247716971', 'date', '2026-10-05', 'plan', 'kb/college_reads/cerritos_ironworker_ladder_read8.json', 'loads', 5, 'reached', 3, 'found', 'The CCAP page, opened: ABC, Bellflower, Downey (Downey, Warren, Columbus) and Norwalk-La Mirada high schools are CCAP partners; students enroll through cerritos.dualenroll.com. BoardDocs bars readers in robots.txt. The archive''s index holds one full list, careerpathid=0 (2016-03-14).'),
         jsonb_build_object('run', '37248015019', 'date', '2026-10-05', 'plan', 'kb/college_reads/cerritos_ironworker_ladder_read9.json', 'loads', 3, 'reached', 3, 'found', 'The 2016 full list loads (419,364 characters); its excerpts show Cerritos agreements with Downey, Warren, Artesia and John Muir high schools and four ROPs. DualEnroll is a sign-in page.'),
         jsonb_build_object('run', '37248993313', 'date', '2026-10-05', 'plan', 'kb/college_reads/cerritos_ironworker_ladder_read10.json', 'loads', 1, 'reached', 1, 'found', 'Every row naming Cerritos (rows step): 57 agreements with 27 schools and ROPs, none for welding, none with Columbus High. Kept dated in kb/program_requirements_pilot/cerritos_hs_agreements_2016.json.'),
         jsonb_build_object('run', '37249565514', 'date', '2026-10-05', 'plan', 'kb/college_reads/cerritos_ironworker_ladder_read11.json', 'loads', 2, 'reached', 1, 'found', '/epp/Articulation_List.htm answers 404. Downey High''s 2023 post: the welding pathway will be equivalent to WELD 100, articulation wording.'),
         jsonb_build_object('run', '37250119275', 'date', '2026-10-05', 'plan', 'kb/college_reads/cerritos_ironworker_ladder_read12.json', 'loads', 2, 'reached', 2, 'found', 'Columbus High''s CTE Welding page: Welding and Materials Joining I and its Capstone, OSHA 10 and OSHA 30 certifications, Cerritos named as partner college, and no route stated. Downey High''s Dual Enrollment page: dual enrollment may reach Columbus students.')))
    || jsonb_build_object('answers', (
         select jsonb_agg(case when a->>'question' = 'The high school articulation list.'
           then a || jsonb_build_object('status', 'partly answered', 'answer', 'The route: Credit by Exam for an articulated course (a B or better; the Cerritos application; the petition filed with EPP within two years; up to 30 units; residency waived), or a CCAP course. The last public list is Statewide Career Pathways'' of 2016-03-14: 57 agreements with 27 schools and ROPs, none for welding (kb/program_requirements_pilot/cerritos_hs_agreements_2016.json). No public source holds today''s list: CTE Course Connect does not resolve, BoardDocs bars readers, DualEnroll is a sign-in. Columbus High is a CCAP partner; its welding pathway (Welding and Materials Joining I and Capstone, OSHA 10 and OSHA 30) names Cerritos as partner; Downey''s 2023 post calls it equivalent to WELD 100, and Downey teachers teach it, so articulation by Credit by Exam is likely and unconfirmed.')
           else a end)
         from jsonb_array_elements(p->'answers') a))
    || jsonb_build_object('open', (
         select jsonb_agg(case when o->>'question' like 'Cerritos''s list of articulated high school courses%'
           then o || jsonb_build_object('next', 'Public routes exhausted (reads 1-12). Ask Sam (decision sheet) whether to send the held request to Educational Partnerships & Programs, naming Columbus High''s Welding and Materials Joining I and Capstone and the 2016 list.')
           else o end)
         from jsonb_array_elements(p->'open') o))
    || jsonb_build_object('nuances', (p->'nuances') || jsonb_build_array(
         'Cerritos''s public agreement search has moved twice and is gone each time: Statewide Career Pathways (domain for sale), then hsarticulation.cerritos.edu and cerritos.ctecourseconnect.com (no DNS). Web search still returns all three.',
         'Columbus High''s welding pathway awards OSHA 10 General Industry and OSHA 30 Construction certifications; IWAP 41.09 in the Ironworker A.S. is OSHA 30/Extension Review.'))
    || jsonb_build_object('workarounds', (
         select jsonb_agg(case when w->>'for' = 'The articulation list at Statewide Career Pathways'
           then w || jsonb_build_object('tried', (w->>'tried') || '; the Internet Archive''s 2016 full list (reads 9-10); CATEMA; CTE Course Connect; the CCAP page; BoardDocs; DualEnroll; Downey Unified''s and Columbus High''s pages (reads 7-12)', 'result', 'the 2016 list recovered; no public source for today''s list')
           else w end)
         from jsonb_array_elements(p->'workarounds') w)
       || jsonb_build_array(
         jsonb_build_object('for', 'A list closed in an accordion (the CCAP page)', 'tried', 'The reader''s expand step (read 8)', 'result', 'worked'),
         jsonb_build_object('for', 'A 419,364-character list in one table', 'tried', 'The reader''s rows step (read 10)', 'result', 'worked')))
    as p
  from cur)
select public.program_source_procedure_set('Cerritos College', (select p from v4), 'college-page-read S331', 'dcf96a508207ee55e604437d9ef71802') as result;
