-- NOT RUN. Written by an S645 worker for the S645 conductor (SkyFinch), 2026-11-13. The conductor runs it through
-- the Supabase connector, then replaces this line with "APPLIED <timestamp> by <who>" and pastes the read-back.
--
-- Receipt: program_source_registry, Glendale Community College, from its 2025-2026 PDF to its 2026-2027 Coursedog
-- catalog, and a procedure record that names the new host.
--
-- Why: Sam's ruling, relayed by COBIx on issue #3111 (comment 6842097699; COBIx chat 6:33 PM PT 2026-11-12;
-- cpl_memory sam-glendale-unpark-2026-11-12): "Glendale: unpark. Read its 2026-27 Coursedog catalog at
-- https://catalog.glendale.edu/. The program index and graduation requirements are JS shells, so it needs a rendered
-- read, not static HTML (see scout-2026-11-12). Update the registry, which still names the 2025-26 PDF."
-- COBIx's scout (kb/harvest_scouting/scout-2026-11-12.json, branch claude/harvest-pdf-control-number-s644, checked
-- 2026-11-13T01:26:36Z): catalog.glendale.edu answers 200, robots allows the reader, no challenge, slowest load 2.71 s;
-- it is the Standard 2026-2027 Catalog on Coursedog. The 2025-2026 PDF still answers 200; the college site says the
-- 2026-27 PDF is coming soon.
-- The S407 row (kb/receipts/program_source_registry_glendale_lasc_catalogs_2026-10-17_s407.sql) said: "Read again
-- when the 2026-2027 online catalog posts." It has posted.
--
-- The reader: kb/_program_requirements_college.py reads a Coursedog row (catalog_platform 'coursedog') from its site
-- in a headless browser (prefer_site, cd_list, cd_pages), as Merced (catalog.mccd.edu) and Hartnell read. A PDF
-- catalog step in the procedure record is set aside unless a run asks route=pdf, so part 2 keeps (or adds) the
-- 2025-2026 PDF as that step: route=pdf can still read the old file for a comparison.
--
-- ── PART 0. BEFORE (run first; paste the result here) ─────────────────────────────────────────────────────────────
select college, catalog_url, catalog_year, catalog_platform, catalog_format, best_method, access_status,
       corrected_by, corrected_at, correction_note,
       coalesce(md5(procedure::text), 'none') as procedure_md5,
       procedure->>'v' as procedure_v, procedure->'catalog' as procedure_catalog,
       jsonb_array_length(coalesce(procedure->'hosts', '[]'::jsonb)) as procedure_hosts
from public.program_source_registry where college = 'Glendale Community College';
-- Expected (registry_read.json and the scout): catalog_url
-- https://www.glendale.edu/academics/catalogs/_documents/2025-2026-gcc-catalog.pdf, catalog_year 2025-2026,
-- catalog_platform pdf, catalog_format single_pdf, best_method pdf_extraction, corrected_by the S407 note.
-- If any of the first three differs, stop: the guard below then matches no row, and someone else has moved it.
-- BEFORE (pasted by the conductor): <none yet>
--
-- ── PART 1. THE REGISTRY ROW (a person's correction; the history trigger files the prior row) ──────────────────────
update public.program_source_registry r set
  catalog_url      = 'https://catalog.glendale.edu/',
  catalog_year     = '2026-2027',
  catalog_platform = 'coursedog',
  catalog_format   = 'html_per_program',
  best_method      = 'platform_reader',
  corrected_by     = 'Sam (relayed by COBIx on #3111, comment 6842097699, 2026-11-12; sam-glendale-unpark-2026-11-12), applied by the S645 conductor',
  corrected_at     = now(),
  correction_note  = 'Glendale''s 2026-2027 catalog posted on Coursedog at catalog.glendale.edu (COBIx scout 2026-11-13T01:26:36Z: 200, robots allows, no challenge). Its program index and graduation requirements are JavaScript apps, read rendered by the Coursedog site reader. The 2025-2026 PDF stays the procedure record''s catalog step for a route=pdf comparison.'
where r.college = 'Glendale Community College'
  and r.catalog_url = 'https://www.glendale.edu/academics/catalogs/_documents/2025-2026-gcc-catalog.pdf'
  and r.catalog_year = '2025-2026'
  and r.catalog_platform = 'pdf';
-- Expect UPDATE 1. UPDATE 0 means the row moved since the BEFORE read: stop and re-read.
--
-- ── PART 2. THE PROCEDURE RECORD (the table's one write path, guarded on the md5 from PART 0) ──────────────────────
-- Replace PROCEDURE_MD5_FROM_PART_0 with PART 0's procedure_md5 (the word 'none' when the row holds no record).
-- Left as it stands, the function refuses the write ("the record changed since it was read"), so nothing changes.
-- It adds one host and one step, and a catalog step naming the 2025-2026 PDF only where the record names none.
select public.program_source_procedure_set(p.college,
  coalesce(p.procedure, '{"v": 0, "hosts": []}'::jsonb)
    || case when coalesce(p.procedure, '{}'::jsonb) ? 'catalog' then '{}'::jsonb
            else jsonb_build_object('catalog', jsonb_build_object(
              'why', 'The 2025-2026 catalog, kept for a route=pdf comparison after the college moved to its 2026-2027 Coursedog catalog (S645).',
              'start', 'https://www.glendale.edu/academics/catalogs/index.html',
              'file', 'https://www.glendale.edu/academics/catalogs/_documents/2025-2026-gcc-catalog.pdf',
              'format', 'pdf',
              'catalog_year', '2025-2026')) end
    || jsonb_build_object(
         'v', coalesce((p.procedure->>'v')::int, 0) + 1,
         'hosts', coalesce(p.procedure->'hosts', '[]'::jsonb) || jsonb_build_array(
           jsonb_build_object('host', 'catalog.glendale.edu', 'access', 'open', 'platform', 'coursedog',
             'note', 'The college''s Standard 2026-2027 Catalog on Coursedog. /programs and /admissions-academics/graduation-requirements are JavaScript apps, so a static fetch prints no course lists or GE units; the site reader renders them (COBIx scout, 2026-11-13).')),
         'steps', coalesce(p.procedure->'steps', '[]'::jsonb) || jsonb_build_array(
           jsonb_build_object('run', 'scout-2026-11-12', 'date', '2026-11-13', 'plan', 'COBIx''s source scout of the gap census''s colleges',
             'found', 'catalog.glendale.edu is the 2026-2027 catalog on Coursedog, open to the reader; the 2025-2026 PDF still answers 200; glendale.elumenapp.com opens on a sign-in.'))),
  'S645 conductor: Glendale to its 2026-2027 Coursedog catalog (Sam, relayed by COBIx on #3111, 2026-11-12)',
  'PROCEDURE_MD5_FROM_PART_0')
from public.program_source_registry p
where p.college = 'Glendale Community College';
-- The function returns {was_md5, md5, v}. Paste it here: <none yet>
--
-- ── READ-BACK ──────────────────────────────────────────────────────────────────────────────────────────────────────
select college, catalog_url, catalog_year, catalog_platform, catalog_format, best_method, corrected_by is not null as corrected,
       procedure->>'v' as procedure_v, procedure->'catalog'->>'file' as pdf_step,
       (select count(*) from jsonb_array_elements(procedure->'hosts') h where h->>'host' = 'catalog.glendale.edu') as new_host
from public.program_source_registry where college = 'Glendale Community College';
--
-- ── ROLLBACK ───────────────────────────────────────────────────────────────────────────────────────────────────────
-- Part 1: the history trigger filed the prior row under this write's corrected_by. Restore its catalog fields and
-- its S407 correction from that row:
-- update public.program_source_registry r set
--   catalog_url = h.old_row->>'catalog_url', catalog_year = h.old_row->>'catalog_year',
--   catalog_platform = h.old_row->>'catalog_platform', catalog_format = h.old_row->>'catalog_format',
--   best_method = h.old_row->>'best_method', corrected_by = h.old_row->>'corrected_by',
--   corrected_at = (h.old_row->>'corrected_at')::timestamptz, correction_note = h.old_row->>'correction_note'
-- from (select old_row from public.program_source_registry_history
--       where college = 'Glendale Community College' and op = 'UPDATE'
--         and changed_by like 'Sam (relayed by COBIx on #3111, comment 6842097699%'
--       order by changed_at desc limit 1) h
-- where r.college = 'Glendale Community College' and r.catalog_url = 'https://catalog.glendale.edu/';
-- Part 2: the same function, with the record PART 0 read (the history table also keeps it) and the md5 PART 2 returned:
-- select public.program_source_procedure_set('Glendale Community College', '<PART 0 procedure>'::jsonb,
--   'rollback of the S645 Glendale procedure change', '<md5 PART 2 returned>');
-- Where PART 0 found no record ('none'), the function cannot set one back to null: set procedure, procedure_by and
-- procedure_at to null with a direct UPDATE as the service role, guarded on that md5.
