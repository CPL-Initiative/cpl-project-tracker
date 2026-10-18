-- S419 SkyCottonwood, 2026-10-18 ~20:05Z. Rule 8 ingest through execute_sql: INSERT-only, idempotent on slug,
-- author SkyCottonwoodS419, status proposed. Rollback: supersede by slug under actor 'SkyCottonwood-s419-rollback'.
-- Summaries shortened under the 400-character check after a first send failed it (20:05Z); the rows below are as sent at 20:08Z.
-- Sam's ruling of 19:08Z is S417's row sam-approves-commons-mockup-collapse-2026-10-18 (verified); no second row.
insert into public.cpl_memory (slug, kind, org, title, summary, detail, plain, tags, affects, source, related, author, event_date, status)
values
('commons-step-1-shared-progress-module-2026-10-18', 'milestone', 'cpl',
 'The Commons'' step 1: the Progress view is drawn by one shared module',
 'cpl-project-tracker#2237 (merged 19:28Z 2026-10-18): commons_progress.js draws the Program Requirements tab''s Progress view; the tab keeps its definitions and live reads and lends section(), goControl() and call-card helpers. Nothing changed on screen: 417 checks pass with the module loaded first, 30 new guard the module. Status file: kb/status/program-requirements.json.',
 'A host passes h.classes and the module substitutes them into its CSS, one style per host set; a spec with no whole measure draws no band; a stub keeps the tab alive if the module''s lazy load fails (CPL_TABS.loadScript calls back on error). scripts/queue_status.py --project names another project''s status file; checkpoint step 12 names the new path; a dependency-map seed records the read the module makes for the host. Next: step 2, each reference''s Progress view (Exhibit first), then step 3, the Commons tab from the approved mock-up (version 4, #2239). Lessons docs/commons_lessons.md; KB note docs/kb-notes/methodology-a-shared-view-borrows-the-host-s-primitives.md.',
 'The progress dashboard the Program Requirements tab shows is now built by one shared piece of code, so the other common references (exhibits, courses, credit recommendations, subjects) can each get the same dashboard next, and all of them will stay alike as one changes.',
 array['commons','program-requirements'], array['commons_progress.js','program_requirements.js','kb/status/program-requirements.json'],
 'cpl-project-tracker#2237 (S419 SkyCottonwood, 2026-10-18)', array['sam-sheet-95-rulings-2026-10-18','sam-approves-commons-mockup-collapse-2026-10-18'],
 'SkyCottonwoodS419', '2026-10-18', 'proposed'),
('canada-pdf-heading-shapes-2026-10-18', 'pitfall', 'cpl',
 'Cañada''s catalog heads a section with the award''s letters, wraps long titles, and opens a list on the next page',
 'Eleven of Cañada''s 73 extractions placed no listed course: the PDF picker handed the model a sibling''s section. The catalog heads sections "AS  Business Assistant" then "CA  Business Assistant", wraps "CA  Human Relations in the" / "Workplace", and opens a list on the page after "AS-T  Mathematics 2.0". Fixed in #2241; the capture-only run moved 26 pages, 8 of the 11 onto their own headings.',
 'Shapes from pages 147-156, 183, 188, 215, 229 (page reads 39159401511, 39159883287); the legend on p147 names the letters (AS, AS-T, CA, CS). Still out: Political Science A.A.-T (its own page names 4 of 9 listed codes; the description pages win), and three one-course COCI lists the printed section never names (Business Administration A.S. CIS 118, Theater Arts A.A. DRAM 300.1, Technical (Apparel Industry Orientation) FASH 195): COCI comparison findings. Capture-only run 39160718966 on claude/stoic-cray-l8kmja; the extraction of the 26 (about $2) is the next dispatch. Lessons S419 in docs/program_requirements_harvest_lessons.md.',
 'Cañada''s catalog labels each program with two letters for the award (AS for the degree, CA for the certificate) and prints the certificate a few pages after the degree with the same courses; the reader did not know the letters, so it read the degree''s page for the certificate and found nothing to place. It now reads the letters, a title that wraps onto a second line, and a program whose course list starts on the page after its heading.',
 array['program-requirements','harvest','pdf-reader'], array['kb/_program_requirements_college.py','kb/program_requirements_college/ca_ada'],
 'cpl-project-tracker#2241 (S419); runs 39159401511, 39159883287, 39160718966', array['canada-hand-filed-2026-10-18'],
 'SkyCottonwoodS419', '2026-10-18', 'proposed'),
('verify-a-picker-change-on-the-printed-pages-2026-10-18', 'procedure', 'cpl',
 'Verify a reader change on the catalog''s printed pages before any dispatch',
 'Before changing the harvest''s page picker, print the catalog''s pages from the runner (a kb/college_reads/ plan; college-page-read.yml) and run the picker over them before and after, per program with its COCI list. Then a capture-only run (extract=0) confirms the picks on the whole PDF and names in would_extract the programs whose page moved, before a model call is spent.',
 'S419: two reads of Cañada''s copy (the first printed two pages because the patterns allowed one space after the award''s letters and pypdf leaves two; match with \\s+), the picker simulated over eleven printed pages (four certificates moved to their own headings), the tests written from the catalog''s text verbatim, then run 39160718966 moving 26 pages. Reading the records'' score first matters as much: the lane had called the eleven unfound for two sessions; summary.json said extracted, failed.coverage 11.',
 'When the program-reading code misreads a college catalog, first have the runner print the catalog pages involved, then test the fix against those exact pages locally, then run the free page-finding pass on the whole catalog; only after that spend model calls on extraction.',
 array['program-requirements','harvest','methodology'], array['kb/_program_requirements_college.py','.github/workflows/college-page-read.yml'],
 'S419 SkyCottonwood, 2026-10-18; docs/program_requirements_harvest_lessons.md S419', array['canada-pdf-heading-shapes-2026-10-18'],
 'SkyCottonwoodS419', '2026-10-18', 'proposed')
on conflict (slug) do nothing
returning slug;

insert into public.cpl_memory_log (memory_id, actor, action, note, after)
select id, 'SkyCottonwoodS419', 'create', 'checkpoint auto-write (S419, 2026-10-18)', to_jsonb(m)
from public.cpl_memory m where m.slug in ('commons-step-1-shared-progress-module-2026-10-18','canada-pdf-heading-shapes-2026-10-18','verify-a-picker-change-on-the-printed-pages-2026-10-18')
  and m.author = 'SkyCottonwoodS419';
