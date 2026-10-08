-- S347 SkyTrellis, 2026-10-08: Palo Verde College's program map is read, the last of the 32 published map sources
-- (handoff 347 priority 3, Sam's "Palo Verde, the last of the 32 maps").
-- guides.paloverde.edu, the one lead S345 found, no longer resolves (read 1, run 37810862182; WebFetch and the
-- sandbox again 2026-10-08). A web search restricted to libguides.com found the same guide, "PVC Pirates Pathways -
-- LibGuides at Palo Verde College", at the college's LibGuides address. The host had refused nothing; its custom name
-- lapsed. College page read run 37835928900 (plan kb/college_reads/pvc_program_maps_read2.json, the census's reader
-- and user agent) loaded three pages, each 200: the guide's home lists its tabs (twelve ADTs; Automotive Technology,
-- Building Construction Technology, Computer Information Systems and Welding Technology under Professional
-- Vocational Technologies), and the CIS A.S. and Building Construction Technology A.S. pages each print a two-year
-- map, Semester 1 to Semester 4. Each page reads "Last Updated: Oct 25, 2023".
-- Under Sam's sheet 50 card 5 a published map counts as settled when read: 32 of 32.
--
-- Statement 1, the registry's map columns (the census never writes them), guarded on the row as read just before:
-- sequence_access 'not_read' and no sequence_host. Statement 2, the procedure record v2 through
-- program_source_procedure_set, guarded on v1's md5 (941b08688bc6c8abcffccba8e5825d85, read 2026-10-08 ~19:55Z).
-- Applied: statement 2 through execute_sql 2026-10-08 ~20:10Z, was_md5 941b0868 matched, new md5 3879b5d0f4e2c27cae98779ee65b56bf.
-- Statement 1: the repo's Supabase guard refuses UPDATE through execute_sql, and apply_migration timed out four times
--   (60 s each, 20:0x-20:2xZ) with nothing written (read back each time; no lock on the table or schema_migrations).
--   Handed to Sam to paste in the SQL editor, as S345 handed the cpl_library update (lesson 8).
-- Rollback (Rule 10 a2): statement 1, set sequence_host = null, sequence_access = 'not_read', sequence_note = the
--   prior note (below), sequence_checked_run = 'college-page-read run 37810862182'; statement 2, restore the prior
--   row the history trigger files under this procedure_by (old_row->'procedure', procedure_by, procedure_at).
-- Prior sequence_note: No program map found yet. The census's sequence address is a '#' link on the homepage, and a
--   web search (2026-10-08) found one lead, the college's Guided Pathways guide at guides.paloverde.edu, whose name did
--   not resolve for the reader on 2026-10-08.

update public.program_source_registry set
  sequence_host        = 'paloverde.libguides.com',
  sequence_access      = 'open',
  sequence_note        = 'The college''s Guided Pathways guide, PVC Pirates Pathways, prints a two-year semester map for some programs on its LibGuides site (paloverde.libguides.com/pathways). Its custom name, guides.paloverde.edu, no longer resolves; a search restricted to libguides.com found the guide at this address (2026-10-08). The Computer Information Systems A.S. and Building Construction Technology A.S. pages each print four semesters (college page read run 37835928900). The guide was last updated Oct 25, 2023, before the 2025-26 catalog the census reads, so a map is checked against the catalog''s requirements before it places a course.',
  sequence_checked_run = 'college-page-read run 37835928900'
where college = 'Palo Verde College'
  and sequence_access = 'not_read' and sequence_host is null
returning college, sequence_host, sequence_access, sequence_checked_run;

select public.program_source_procedure_set(r.college, r.procedure || jsonb_build_object(
  'v', (r.procedure->>'v')::int + 1,
  'hosts', coalesce(r.procedure->'hosts', '[]'::jsonb) || $a$[{"host": "paloverde.libguides.com", "access": "open", "platform": "outside", "note": "The college's LibGuides site, where its Guided Pathways guide lives (/pathways, \"PVC Pirates Pathways\"). guides.paloverde.edu was the guide's custom name and no longer resolves; a web search restricted to libguides.com found it here (2026-10-08). Each program tab is a page (c.php?g=1137535&p=<page>); the vocational pages print a two-year map as a table, Semester 1 to Semester 4. All three loads answered 200 (run 37835928900)."}]$a$::jsonb,
  'steps', coalesce(r.procedure->'steps', '[]'::jsonb) || $a$[{"run": "37835928900", "date": "2026-10-08", "plan": "kb/college_reads/pvc_program_maps_read2.json", "found": "The guide's home lists twelve ADT tabs and four vocational programs (Automotive Technology p=8300771, Building Construction Technology p=8300772, Computer Information Systems p=8300773, Welding Technology p=8300774). The CIS A.S. and Building Construction Technology A.S. pages each print four semesters of courses and units; the BCT map marks the embedded certificate's required (*) and elective (**) courses. Each page gives Oct 25, 2023 as its last change.", "loads": 3, "reached": 3}]$a$::jsonb,
  'workarounds', coalesce(r.procedure->'workarounds', '[]'::jsonb) || $a$[{"for": "The term-by-term map", "tried": "One web search restricted to paloverde.edu (S346, 2026-10-08)", "result": "No map on the college's own domain: curriculum guides, program reviews, and catalogs from 2010-11 and 2023-25."}, {"for": "The term-by-term map", "tried": "Web searches restricted to paloverde.edu, then libguides.com (S347, 2026-10-08)", "result": "The first indexes the guide's pages under the lapsed name guides.paloverde.edu, including the CIS A.S. \"2-year printable pathway\"; the second finds the guide at paloverde.libguides.com/pathways, read in run 37835928900."}]$a$::jsonb,
  'answers', coalesce(r.procedure->'answers', '[]'::jsonb) || $a$[{"question": "Whether the college publishes a term-by-term map", "answer": "Yes, for some programs: its Guided Pathways guide on LibGuides (paloverde.libguides.com/pathways) prints a two-year semester map on the vocational program pages read so far (CIS A.S., Building Construction Technology A.S.; run 37835928900).", "status": "answered"}]$a$::jsonb,
  'nuances', coalesce(r.procedure->'nuances', '[]'::jsonb) || $a$["The guide's pages give Oct 25, 2023 as their last change, before the 2025-26 catalog; check each map's courses against the catalog's requirements before it places a course (the CIS map names ENG 100 or ENG 101 and MAT 095).", "A search restricted to paloverde.edu also lists catalog.paloverde.edu (an Acalog catalog, content.php?catoid=1&navoid=47, Programs) where the registry names pvc.elumenapp.com 2025-2026."]$a$::jsonb,
  'open', $o$[{"question": "Which programs the guide maps", "next": "Read the Automotive Technology (p=8300771) and Welding Technology (p=8300774) pages and the twelve ADT tabs for a semester layout, then compare each map with the catalog's requirements."}, {"question": "Which catalog is current", "next": "Read catalog.paloverde.edu (Acalog) beside pvc.elumenapp.com and tell the census which one names the current year."}]$o$::jsonb),
  'S347 SkyTrellis, 2026-10-08 (handoff 347 priority 3: Palo Verde, the last unsettled map; college page read run 37835928900)',
  '941b08688bc6c8abcffccba8e5825d85') as result
  from public.program_source_registry r where r.college = 'Palo Verde College';

-- Read back: published maps settled.
select count(*) filter (where sequence_access = 'open'
         or (sequence_access in ('refused', 'unreached') and jsonb_array_length(coalesce(procedure->'workarounds', '[]')) > 0)) settled,
       count(*) published
  from public.program_source_registry
 where sequence_source in ('ppm', 'program_map_page') or sequence_host is not null;
