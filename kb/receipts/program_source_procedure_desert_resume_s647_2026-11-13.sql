-- Receipt: program_source_registry, College of the Desert, catalog.resume true (S647, SkyPipit, a worker's draft;
-- the conductor runs it through the Supabase connector and fills the md5 after).
-- Why: the catalog is one PDF of 21,123,131 bytes (2026-2027, 476 pages). The baseline read it once (run 43160342510,
-- 200 OK, 261 s); three captures did not: two ran past the 900 s limit (43162424214, 43173033722) and the third,
-- with 2,400 s allowed (receipt program_source_procedure_desert_timeout_s641_2026-11-12.sql), got
-- "APIRequestContext.get: read ETIMEDOUT" after 1,016 s (43212020852): the catalog page answered 200 and the file's
-- transfer stalled. By docs/reference/blocked_sources.md: the www. host serves the same path (200, COBIx's scout
-- scout-2026-11-12.json, 2026-11-13T01:26Z), the Wayback Machine holds no copy of the PDF (same scout), and the
-- college's CourseLeaf catalog (catalog.collegeofthedesert.edu, 2026-2027) answers in under a second. The key is read
-- only by the reader of claude/harvest-desert-blocked-source-s647 (P.read_pdf_ranged: 4 MB ranges, each failed range
-- asked for again, six times at most, inside the step's 2,400 s); main's reader ignores it.
--
-- READ FIRST (the current record and its md5; expect timeout_s 2400 and md5 bbf96cf25765ebfed75d8380f2f5cc3a):
-- select md5(procedure::text), procedure->'catalog' from program_source_registry
--  where college = 'College of the Desert';
--
-- THE WRITE (the table's one write path, guarded on the md5 read above):
select public.program_source_procedure_set(
  'College of the Desert',
  jsonb_set((select procedure from program_source_registry where college = 'College of the Desert'),
            '{catalog,resume}', 'true'),
  'S647 (SkyPipit): the 21 MB catalog PDF stalled part way (read ETIMEDOUT, run 43212020852); read it in ranges',
  'bbf96cf25765ebfed75d8380f2f5cc3a');
-- md5 before: bbf96cf25765ebfed75d8380f2f5cc3a (expected; replace if the read above differs). md5 after: ed460cd81c273329a671451beaebd371 (read by the conductor after the write, S647).
--
-- ROLLBACK (the same function; the registry's history table also keeps the version before):
-- select public.program_source_procedure_set(
--   'College of the Desert',
--   (select procedure #- '{catalog,resume}' from program_source_registry where college = 'College of the Desert'),
--   'rollback of the S647 resume key', 'ed460cd81c273329a671451beaebd371');
