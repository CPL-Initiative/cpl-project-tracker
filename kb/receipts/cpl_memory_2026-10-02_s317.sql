-- S317 (SkyCompass), 2026-10-02: Rule 8 ingest - two new rows, two summary/plain updates, all logged.
-- New (author 'SkyCompass-s317', status 'proposed'):
--   custom-report-load-reads-back-after-5xx-2026-10-02 (milestone, #1824). Inserted at 15:19Z without
--     `plain` (a first attempt broke the 400-char summary check); its 'create' log row is LATE, written at
--     the checkpoint by the guarded insert below, and `plain` was added by a logged UPDATE.
--   rebuild-table-grants-intact-2026-10-02 (fact, live measurement).
-- Updated: sam-no-price-on-funding-surfaces-2026-10-02 - the summary's description of the rendered text now
--   names Sam's own term, the FTES reimbursement rate (sam-ftes-reimbursement-rate-term-2026-10-02). His quote
--   is unchanged; this was S316's queued to-do, whose three UPDATE attempts had timed out.
-- Note: both UPDATEs ran at once through execute_sql in S317, so the S316 stall
--   (mcp-update-cpl-memory-stalls-2026-10-02) is intermittent. The repo guard refuses a statement containing
--   the word replace, the string function included; write the new text as a literal.
-- Rollback: supersede the two rows by author 'SkyCompass-s317' under actor 'SkyCompass-s317-rollback'; restore
--   the updated summary from the 'update' log row's `before` (cpl_memory_log, actor 'SkyCompass-s317').

-- 1. The fact row and both create logs (the milestone row was already in; its log is late).
insert into public.cpl_memory (slug, title, kind, summary, detail, plain, tags, affects, source, author, event_date, status)
values ('rebuild-table-grants-intact-2026-10-02',
 'Rebuild grants hold after promotion',
 'fact',
 'S317, 2026-10-02: after the 2026-10-01 19:00Z promotion, map_college_goal2, map_college_credit_summary, map_cleanup_worklist, map_transcribed_gap and map_cx_exhibit_guidance each grant SELECT to anon, authenticated and service_role, and each live rebuild_* body carries its own grant. The 2026-10-30 default-grant change cannot strip them.',
 'Measured with has_table_privilege per role and pg_get_functiondef(rebuild_<table>) ~* ''grant\s+select''. Closes the implementation-funding lane''s grants re-check and the map-custom-reports NEXT item 0. Grants applied live 2026-09-23 (receipt kb/receipts/supabase_rebuild_grants_2026-09-23.sql).',
 'Five summary tables are thrown away and rebuilt every night. Supabase will stop handing out read access to new tables on 30 October, which would have left the dashboards unable to read them. Each nightly rebuild now grants that access itself, and a check after last night''s rebuild found all five readable.',
 array['map-custom-reports','supabase','grants'],
 array['kb/supabase_map_college_goal2.sql','kb/supabase_map_promote_custom_reports.sql'],
 'S317 live measurement', 'SkyCompass-s317', '2026-10-02', 'proposed')
on conflict do nothing;
insert into public.cpl_memory_log (memory_id, actor, action, note, after)
select m.id, 'SkyCompass-s317', 'create', 'checkpoint auto-write', to_jsonb(m)
from public.cpl_memory m
where m.slug in ('custom-report-load-reads-back-after-5xx-2026-10-02','rebuild-table-grants-intact-2026-10-02')
  and not exists (select 1 from public.cpl_memory_log l where l.memory_id = m.id and l.action = 'create');

-- 2. `plain` on the milestone row (guarded on plain is null), logged with before/after.
--    Text: "The nightly load of MAP student and credit data stopped twice in September over a server error that
--    hid what had actually happened. ... It now checks what arrived before it tries again, never sends the same
--    rows twice, and looks at its own log before it reports the outcome."

-- 3. The no-price row's summary (guarded on the old phrase), logged with before/after.

-- Verified at 15:4xZ: cpl_memory_log holds create x2 and update x2 under actor 'SkyCompass-s317'.
