-- Receipt: cpl_memory rows written by SkyBrant (S736, Sam's plain session of 2026-11-26T00:02Z to 2026-11-27T15:30Z),
-- through the Supabase MCP by the conductor before its checkpoint. This file records them; it writes nothing itself.
-- The rows went in as INSERT ... ON CONFLICT (slug) DO NOTHING (insert-only), each logged 'create' in cpl_memory_log.
-- The full text of each row (title, summary, tags, source, verified_by) lives in the live table; read it back with the
-- VERIFY query below rather than from this file.
--
-- Slugs written, by kind:
--   r-schedule-tool-first-for-subject-titles-sam-2026-11-26   decision (Sam's ruling, 2026-11-26: "search each college's
--       website for their schedule tool, which is almost always listed by subject and title"; "add these titles
--       instead of guessing")
--   d-lightning-round-not-a-subject-and-skip-s736             decision (the session's: Not a subject saves
--       {not_a_subject:true}; Skip sets a code aside for the visit; #3893)
--   f-cerro-coso-porterville-letter-glued-to-subject-s736     fact (COCI stores Cerro Coso's PHED C103 as PHEDC 103 for
--       some courses, Porterville's the same with P)
--   f-laccd-schedule-subject-lookup-s736                      fact (LACCD's PeopleSoft guest search: one select-subject
--       lookup per term, 216 subjects, term 2268; titled 171 of 212 untitled codes, #3894)
--   p-setinterval-keeps-jsdom-test-shard-alive-s736           pitfall (a setInterval left running hangs a jsdom CI shard)
--   f-library-check-runs-every-3h-s736                        fact (library-publish.yml runs on cron 41 */3 UTC)
--
-- ROLLBACK (insert-only, so a delete by slug undoes it):
--   delete from public.cpl_memory_log where memory_id in (select id from public.cpl_memory where slug in (
--     'r-schedule-tool-first-for-subject-titles-sam-2026-11-26','d-lightning-round-not-a-subject-and-skip-s736',
--     'f-cerro-coso-porterville-letter-glued-to-subject-s736','f-laccd-schedule-subject-lookup-s736',
--     'p-setinterval-keeps-jsdom-test-shard-alive-s736','f-library-check-runs-every-3h-s736'));
--   delete from public.cpl_memory where slug in (
--     'r-schedule-tool-first-for-subject-titles-sam-2026-11-26','d-lightning-round-not-a-subject-and-skip-s736',
--     'f-cerro-coso-porterville-letter-glued-to-subject-s736','f-laccd-schedule-subject-lookup-s736',
--     'p-setinterval-keeps-jsdom-test-shard-alive-s736','f-library-check-runs-every-3h-s736');
--
-- VERIFY (expects 6 rows, each summary at most 400 characters):
select slug, kind, status, verified_by, length(summary) as summary_chars
from public.cpl_memory
where slug in (
  'r-schedule-tool-first-for-subject-titles-sam-2026-11-26','d-lightning-round-not-a-subject-and-skip-s736',
  'f-cerro-coso-porterville-letter-glued-to-subject-s736','f-laccd-schedule-subject-lookup-s736',
  'p-setinterval-keeps-jsdom-test-shard-alive-s736','f-library-check-runs-every-3h-s736')
order by slug;
