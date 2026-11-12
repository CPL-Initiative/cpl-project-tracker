-- cpl_memory rows written by SkyKestrel (S642), 2026-11-12, each INSERT ... ON CONFLICT DO NOTHING, each returned its slug.
--   sam-classifier-suggests-title-in-use-2026-11-12   (Sam, in session, verbatim)
--   sam-cert-title-official-name-not-mid-2026-11-12   (Sam, in session, verbatim)
--   d-sierra-ghost-rows-deleted-s642                  (the delete carried out on Sheet 183 card 6)
-- ROLLBACK:
-- delete from cpl_memory where author = 'SkyKestrel (S642)' and slug in (
--   'sam-classifier-suggests-title-in-use-2026-11-12',
--   'sam-cert-title-official-name-not-mid-2026-11-12',
--   'd-sierra-ghost-rows-deleted-s642');
select slug from cpl_memory where author = 'SkyKestrel (S642)' order by created_at;
