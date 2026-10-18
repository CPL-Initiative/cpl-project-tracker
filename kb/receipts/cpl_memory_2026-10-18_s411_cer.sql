-- S411 SkySotol, 2026-10-18 (checkpoint). Rule 8 ingest through execute_sql: INSERT-only, idempotent on slug.
-- Three CER rows, written with the same column list as cpl_memory_2026-10-18_s411.sql:
--   sam-cer-procedures-automate-curation-2026-10-18 (decision, verified: Sam's words in chat, 2026-10-18 ~02:55Z)
--   cer-fold-all-or-nothing-stuck-since-2026-07-08   (pitfall, proposed)
--   open-asks-sheet-93-2026-10-18                    (question, proposed)
-- Rollback (both S411 receipts): delete from public.cpl_memory where author = 'SkySotolS411';
select slug, kind, status from public.cpl_memory where author = 'SkySotolS411' order by slug;
