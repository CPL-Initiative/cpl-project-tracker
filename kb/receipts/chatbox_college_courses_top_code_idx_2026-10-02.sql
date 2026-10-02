-- Receipt: migration chatbox_college_courses_top_code_idx, applied 2026-10-02 ~05:01Z by S315
-- (SkyLedger) through the Supabase MCP apply_migration. No data changed.
--
-- Why: cpl_memory sierra-catalog-reads-timeout-under-load-2026-10-02 (7c's program_typical_courses
-- lost the 8 s limit under concurrent load) and the S315 handoff's carryover ("measure first").
--
-- Before (explain (analyze, buffers, timing off), quiet database, one active backend):
--   select ... from chatbox_college_courses where top_code = any('{1230.30,1230.20}')
--     Seq Scan, rows 723, removed 140,973, shared hit 4,215, 3,384.8 ms then 1,946.1 ms
--   select * from program_typical_courses('{1230.30,1230.20}', 2, 12)
--     21 rows, shared hit 4,228, 1,521.2 ms
--   comparison: count(*) where college = 'Pasadena City College' (college btree, 1,964 rows) 28.2 ms
--
-- Applied:
create index if not exists chatbox_college_courses_top_code_idx
  on public.chatbox_college_courses using btree (top_code);
analyze public.chatbox_college_courses;
--
-- After: program_typical_courses('{1230.30,1230.20}', 2, 12)
--   Bitmap Index Scan on chatbox_college_courses_top_code_idx, 419 buffers, 21 rows, 15.5 ms
--   index size 1,008 kB
--
-- Write path: kb/_sync_college_courses.py upserts 500-row batches (on_conflict
-- college,subject,course_number,course_title); kb/_course_title_cleanup_apply.py PATCHes titles.
-- Neither is a whole-table statement, so the btree adds per-batch maintenance only.
--
-- Rollback:
--   drop index if exists public.chatbox_college_courses_top_code_idx;
