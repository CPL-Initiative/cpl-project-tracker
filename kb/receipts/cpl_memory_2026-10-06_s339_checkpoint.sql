-- S339 SkyReel checkpoint, 2026-10-06: session findings, status proposed. INSERT-only; rollback: supersede by slug.
insert into public.cpl_memory (slug, title, kind, summary, detail, plain, tags, affects, source, author, event_date, status)
values
('harvest-procedure-catalog-step-2026-10-06',
 'A college''s procedure record can name its catalog''s start page and the link to follow; Santa Monica''s reads its Barbering A.S. from the full-catalog PDF',
 'procedure',
 'procedure.catalog = {start, follow, format, timeout_s}: the capture opens the start page, follows the link by its text and reads the PDF. Santa Monica''s record v1 (md5 060d7b66) sends it to catalog.smc.edu/current/catalog.pdf (472 pages, 14.5 MB); run 37545459181 reads Barbering A.S. 43767 on pages 121-122, 25 of 25 codes.',
 'A whole catalog needs the step''s 600 s wait (180 s timed out in run 37543985175); a HEAD logs its size first. A missing link reports the page''s links and falls back to the registry address. PR #1892; tests/program_requirements_pilot_test.py 259 checks.',
 'The harvest can now follow a college''s own instructions to find its catalog.',
 array['program-requirements-harvest','procedure','santa-monica'], array['kb/_program_requirements_pilot.py','program_source_registry'],
 'S339, PR #1892, runs 37543985175 and 37545459181', 's339-2026-10-06', '2026-10-06', 'proposed'),
('smc-barbering-catalog-gaps-2026-10-06',
 'Santa Monica''s 2026-27 catalog prints Salon Management as COSM 11C in its Barbering A.S. and omits COSM 95D',
 'fact',
 'Barbering A.S. 43767, catalog pages 121-122 (run 37545459181): Level 4 lists "COSM 11C, Salon Management (2)" (COSM 11C is Hair Coloring 1; Salon Management is COSM 64), and the Salon Experience list stops at COSM 95C where the Program Course File lists 95D.',
 'Both are drafts for the college once the record files (the harvest-tab Drafts for the college).',
 'Santa Monica''s catalog has two small errors in its Barbering degree listing.',
 array['program-requirements-harvest','santa-monica','college-gap'], array['kb/program_requirements_pilot/'],
 'S339, run 37545459181', 's339-2026-10-06', '2026-10-06', 'proposed'),
('summit-film-v2-shipped-2026-10-06',
 'The Noncredit Summit film v2: Sarah Explains narrates, unnamed; MP4s go to Drive, never the repo',
 'milestone',
 'PR #1891: music cut 1:41, narrated 3:32 (-17.1 LUFS); Sam''s greeting, $7 million ongoing, four grants with Calbright, 30,795, Nadia an industry certificate, brighter portraits. The pages drop the Download button; .gitignore keeps v2+ MP4s out; the page test asks git. Both cuts sent to Sam for Drafts.',
 'Vault note 20261005_Noncredit_Summit_Film_2.md (samueltlee/CPLBrain#262). His review is outstanding.',
 'The re-cut Summit film is done and with Sam.',
 array['noncredit-summit','film','library'], array['prototype/noncredit_video/'],
 'S339, PR #1891', 's339-2026-10-06', '2026-10-06', 'proposed'),
('library-filer-values-truncated-2026-10-06',
 'The Library filer''s saved Google values are cut short; each still passes its shape check',
 'pitfall',
 'S339: library_file.py --check answers invalid_client. The values measure 43 / 19 / 14 characters (real ones about 72 / 35 / 100+), yet each ends or starts as expected (.apps.googleusercontent.com, GOCSPX-, 1//). Measure length beside shape, print neither; Sam re-saves them.',
 'Supersedes nothing: library-filer-signin-set-2026-10-06 recorded the settings saved, which they were, at the wrong length.',
 'The filer still cannot sign in to Google Drive.',
 array['library','filer','oauth'], array['scripts/library_file.py'],
 'S339 measurement, 2026-10-06', 's339-2026-10-06', '2026-10-06', 'proposed')
on conflict (slug) do nothing;

insert into public.cpl_memory_log (memory_id, actor, action, note, after)
select m.id, 's339-2026-10-06', 'create', 'S339 checkpoint, 2026-10-06', to_jsonb(m)
from public.cpl_memory m where m.author = 's339-2026-10-06'
  and not exists (select 1 from public.cpl_memory_log l where l.memory_id = m.id and l.action = 'create');
