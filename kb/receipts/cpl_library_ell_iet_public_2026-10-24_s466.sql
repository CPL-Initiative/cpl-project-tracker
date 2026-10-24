-- S466 SkyYerbaSanta, 2026-10-24: Sam, Open Asks Sheet 123 card 1, "list" (13:17:15Z, his own call: "List it, and I contact
-- the projects myself"). ELL IET CPL Starting Points goes on the public library. This does what cpl_library_set_public()
-- does for a reviewer or the team phrase (Listing also sets Seen by to Public), under the same session flag its guard
-- trigger reads; it keeps public_summary and public_topics as they stand (p_summary and p_topics null).
-- Rule 10: one guarded UPDATE, applying only from the before-values (read live before the apply; the S460 read of
-- 2026-10-24 ~01:40Z gave status draft, seen_by team, public_listed false); rows_updated = 0 means someone edited it since.
-- ROLLBACK: select set_config('cpl.library_public', 'on', true); update public.cpl_library set public_listed = false,
--   seen_by = 'team', listed_at = null, listed_by = null where slug = 'ell-iet-cpl-starting-points';
--   (cpl_library_history_trg files the prior row either way.)
-- A good result is one row: public_listed true, seen_by public.
select set_config('cpl.library_public', 'on', true);
update public.cpl_library l
set public_listed = true,
    seen_by = 'public',
    listed_at = now(),
    listed_by = 'Sam, Open Asks Sheet 123 card 1 (S466 receipt)',
    updated_by = 'library-s466@bot'
where l.slug = 'ell-iet-cpl-starting-points'
  and l.retired_at is null
  and l.seen_by = 'team'
  and l.public_listed = false
returning l.slug, l.public_listed, l.seen_by, l.status, l.listed_at;
