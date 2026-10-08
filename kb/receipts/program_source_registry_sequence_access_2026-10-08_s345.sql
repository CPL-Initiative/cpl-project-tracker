-- S345 (SkyLantern), 2026-10-08: the program map columns for fourteen colleges, from four college page reads.
-- Same columns, trigger and policy as kb/receipts/program_source_registry_sequence_access_2026-10-04_s326.sql
-- (Sam, open-asks sheet 29 card 3: a refusal goes on the college's record; the reader looks for workarounds
-- and never retries a refusal another way). The census never writes these four columns.
--
-- Runs: 37799874023 (S344, West Los Angeles's mapper), 37810652946 (Bakersfield, Los Angeles Harbor, Merced),
-- 37810862182 (Mt. San Antonio's Guided Pathways, the four Los Rios colleges, Palo Verde), 37811253611 (Los
-- Angeles Mission's and Los Angeles Valley's mappers).
--
-- Each row is guarded on the access it held when read just before, so a row someone changed since is left alone.
-- Applied 2026-10-08 17:00:03Z as migration program_source_registry_sequence_access_2026_10_08_s345 (first try); read back:
-- 12 rows, 6 refused, 4 unreached, 1 open, 1 not_read.
-- Rollback (Rule 10 a2): each prior row sits in program_source_registry_history under changed_by = the new
-- sequence_checked_run; restore its four sequence columns from old_row.

with policy as (select
  ' The reader keeps its name and never retries a refusal another way. It looks for the sequence on the college''s own pages and in its catalog (Sam, open-asks sheet 29 card 3, 2026-10-04).'::text as tail),
v(college, host, access, run, was, lead) as (values
  ('Bakersfield College', 'programmap.bakersfieldcollege.edu', 'refused', '37810652946', 'not_read',
   'programmap.bakersfieldcollege.edu answered 403 Forbidden to the CPL Initiative''s reader on 2026-10-08 (one load), as every Program Mapper host read so far has: the refusal is the mapper service''s. The college''s own Program Pathways Mapper page answers and says each program shows a semester-by-semester path.'),
  ('Los Angeles Harbor College', 'la-harbor.programmapper.com', 'refused', '37810652946', 'not_read',
   'la-harbor.programmapper.com answered 403 Forbidden to the CPL Initiative''s reader on 2026-10-08 (one load), as every Program Mapper host read so far has: the refusal is the mapper service''s. The college''s own Program Mapper page answers and says each program shows a term-by-term sample map; its Program Mapper Programs page lists none.'),
  ('Merced College', 'merced.programmapper.com', 'refused', '37810652946', 'not_read',
   'merced.programmapper.com answered 403 Forbidden to the CPL Initiative''s reader on 2026-10-08 (one load), as every Program Mapper host read so far has: the refusal is the mapper service''s. The college''s own Program Pathways Mapper page answers and says each pathway''s maps show a semester-by-semester path.'),
  ('Los Angeles Mission College', 'la-mission.programmapper.ws', 'refused', '37811253611', null,
   'la-mission.programmapper.ws answered 403 Forbidden to the CPL Initiative''s reader on 2026-10-08 (one load), as every Program Mapper host read so far has: the refusal is the mapper service''s. The college''s own Program Mapper page (www.lamc.edu/academics/pathways/program-mapper) answers and links it.'),
  ('Los Angeles Valley College', 'programmap.lavc.edu', 'refused', '37811253611', null,
   'programmap.lavc.edu answered 403 Forbidden to the CPL Initiative''s reader on 2026-10-08 (one load), as every Program Mapper host read so far has: the refusal is the mapper service''s. The college''s own Program Pathways Mapper page answers and says the mapper gives a semester-by-semester guide for each degree and certificate.'),
  ('West Los Angeles College', 'programmap.wlac.edu', 'refused', '37799874023', 'not_read',
   'programmap.wlac.edu answered 403 Forbidden to the CPL Initiative''s reader on 2026-10-08 (one load, S344), as every Program Mapper host read so far has: the refusal is the mapper service''s. The college''s own Program Mapper page says each degree shows a planned sequence of required and elective classes.'),
  ('Mt. San Antonio College', 'www.mtsac.edu', 'open', '37810862182', null,
   'The college publishes a suggested term-by-term sequence for each program on its own Guided Pathways pages (www.mtsac.edu/guided-pathways/, 455 programs), each keyed by the local program code the catalog prints in the program''s title. The list and five program pages answered on 2026-10-08. The census does not score these pages, so its sequence source reads none found.'),
  ('American River College', 'arc.losrios.edu', 'unreached', '37810862182', null,
   'The other Los Rios colleges publish program maps as PDFs on mapmaker.losrios.edu, and a web search (2026-10-08) finds Program Roadmaps listed on the college''s Academics page. That page answered the reader 404 Not Found on 2026-10-08, as the college''s homepage does. The reader does not work around it.'),
  ('Cosumnes River College', 'crc.losrios.edu', 'unreached', '37810862182', null,
   'A web search (2026-10-08) finds the college''s program maps page (crc.losrios.edu/student-resources/counseling/program-maps), with maps as PDFs on mapmaker.losrios.edu. The page answered the reader 404 Not Found on 2026-10-08, as the college''s homepage does. The reader does not work around it.'),
  ('Folsom Lake College', 'flc.losrios.edu', 'unreached', '37810862182', null,
   'A web search (2026-10-08) finds the college''s program maps page (flc.losrios.edu/academics/programs-and-majors/program-maps), with maps as PDFs on mapmaker.losrios.edu. The page answered the reader 404 Not Found on 2026-10-08, as the college''s homepage does. The reader does not work around it.'),
  ('Sacramento City College', 'scc.losrios.edu', 'unreached', '37810862182', null,
   'A web search (2026-10-08) finds the college''s program maps page (scc.losrios.edu/student-resources/counseling-and-transfer/program-maps), with maps as PDFs on mapmaker.losrios.edu. The page answered the reader 404 Not Found on 2026-10-08, as the college''s homepage does. The reader does not work around it.'),
  ('Palo Verde College', null, 'not_read', '37810862182', 'not_read',
   'No program map found yet. The census''s sequence address is a ''#'' link on the homepage, and a web search (2026-10-08) found one lead, the college''s Guided Pathways guide at guides.paloverde.edu, whose name did not resolve for the reader on 2026-10-08.')
)
update public.program_source_registry as r set
  sequence_host        = v.host,
  sequence_access      = v.access,
  sequence_note        = v.lead || case when v.access in ('refused', 'unreached') then p.tail else '' end,
  sequence_checked_run = 'college-page-read run ' || v.run
from v, policy p
where r.college = v.college
  and r.sequence_access is not distinct from v.was;

-- Read back: 12 rows carry this receipt's runs; 6 refused, 4 unreached, 1 open, 1 not_read.
select sequence_access, count(*) from public.program_source_registry
where sequence_checked_run in ('college-page-read run 37799874023', 'college-page-read run 37810652946',
                               'college-page-read run 37810862182', 'college-page-read run 37811253611')
group by 1 order by 1;
