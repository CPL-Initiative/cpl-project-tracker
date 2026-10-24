-- S467 SkyHollyleaf, 2026-10-24: Sam, Open Asks Sheet 124 card 2, "unlist" (16:20:30Z, his own call, no note).
-- "Turning IT and AI credentials into credit" comes off the public library until it has a public home: its link points
-- into the private vault repository, so a visitor who is not signed in to it gets GitHub's 404 page (anonymous read,
-- 2026-10-24 ~16:20Z). This does what cpl_library_set_public(slug, false) does (the Library tab's Remove): only
-- public_listed, listed_by and updated_by change; seen_by, the public summary and topics stay, so relisting is one switch.
-- Rule 10: one guarded UPDATE from the before-values read live at ~16:22Z 2026-10-24 (public_listed true, seen_by public,
-- listed_by Sam, listed_at and updated_at 2026-10-21 00:08:09.299992+00, updated_by Sam); rows_updated = 0 means someone
-- edited the row since: re-read and retry.
-- ROLLBACK: select set_config('cpl.library_public', 'on', true); update public.cpl_library set public_listed = true,
--   listed_by = 'Sam', updated_by = 'Sam' where slug = 'turning-it-and-ai-credentials-into-credit';
--   (cpl_library_history_trg files the prior row either way.)
-- A good result is one row: public_listed false, seen_by public.
select set_config('cpl.library_public', 'on', true);
update public.cpl_library l
set public_listed = false,
    listed_by = 'Sam, Open Asks Sheet 124 card 2 (S467 receipt)',
    updated_by = 'library-s467@bot'
where l.slug = 'turning-it-and-ai-credentials-into-credit'
  and l.retired_at is null
  and l.public_listed = true
  and l.updated_at = '2026-10-21 00:08:09.299992+00'
returning l.slug, l.public_listed, l.seen_by, l.listed_by;
