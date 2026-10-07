-- S342 (2026-10-07) cpl_memory writes, INSERT-only under author 's342-2026-10-07', each logged in cpl_memory_log.
-- Rollback: set status = 'superseded' on the rows below by slug (the S342 log rows name each one).
--   created  noce-google-it-support-pre-apprenticeship-2026-10-07   (fact, proposed)
--   created  sierra-alias-substring-and-initialism-2026-10-07       (pitfall; verified: #1897 merged, smoke 37674213394 green)
--   created  sam-roep-progress-view-2026-10-07                      (decision, verified by Sam)
--   created  display-8292780f6cd5-live-delta-2026-10-07             (milestone, proposed)
-- The rows' text is in the table; this receipt names them so the cohort can be found and reversed.
select slug, kind, status, verified_by from public.cpl_memory where author = 's342-2026-10-07' order by created_at;
