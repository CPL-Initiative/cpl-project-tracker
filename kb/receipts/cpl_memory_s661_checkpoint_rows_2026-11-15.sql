-- S661 SkyKnot, Rule 9 checkpoint: three cpl_memory rows and eight cpl_memory_log create rows.
-- RUN ~22:55Z by the conductor through the Supabase MCP; rows already live. This file is the receipt, not a script to rerun.
-- Verified with Sam (in session 2026-11-15): d-eta-widgets-placement-sam-s661, d-college-collections-plan-sam-s661.
-- Proposed (the session's finding): q-exhibit-universe-grows-with-stamps-s661 (the exhibit universe, the length of
--   kb/unified_titles.json, grows by exactly the day's new stamps, so exhibit remaining never falls; PR #3375).
-- cpl_memory_log: one 'create' row (actor SkyKnot) for each of the run's eight rows:
--   d-eta-clock-reads-files-s661, d-eta-chips-as-words-s661, d-eta-date-controls-are-chips-sam-s661,
--   d-curation-eta-net-pace-s661, d-framed-cobi-same-origin-only-s661, d-eta-widgets-placement-sam-s661,
--   d-college-collections-plan-sam-s661, q-exhibit-universe-grows-with-stamps-s661.
-- Earlier S661 receipts: cpl_memory_s661_rows_2026-11-15.sql, cpl_memory_s661_chips_2026-11-15.sql (main),
--   cpl_memory_s661_eta_rows_2026-11-15.sql (landed with PR #3375, f44a0fcd).
-- VERIFY:
select slug, kind, status from cpl_memory
where slug in ('d-eta-widgets-placement-sam-s661','d-college-collections-plan-sam-s661','q-exhibit-universe-grows-with-stamps-s661');
-- ROLLBACK (this checkpoint's three rows and their log rows only; the other decision rows roll back by their own receipts):
-- delete from cpl_memory_log where memory_id in (select id from cpl_memory where slug in ('d-eta-widgets-placement-sam-s661','d-college-collections-plan-sam-s661','q-exhibit-universe-grows-with-stamps-s661'));
-- delete from cpl_memory where slug in ('d-eta-widgets-placement-sam-s661','d-college-collections-plan-sam-s661','q-exhibit-universe-grows-with-stamps-s661');
