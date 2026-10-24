-- S466 SkyYerbaSanta, 2026-10-24: Sam, Open Asks Sheet 123 card 1, "list" (13:17:15Z, his own call: "List it, and I contact
-- the projects myself"). ELL IET CPL Starting Points goes on the public library. This does what cpl_library_set_public()
-- does for a reviewer or the team phrase (Listing also sets Seen by to Public), under the same session flag its guard
-- trigger reads. The public summary is the record's summary, which the tab's List publicly dialog prefills; the topics
-- are the ones Sierra matches. APPLY ONLY AFTER SAM SETS THE PAGE'S claude.ai LINK PUBLIC (the dialog's required tick).
-- Rule 10: one guarded UPDATE from the before-values read live at 13:27Z 2026-10-24 (status draft, seen_by team,
-- public_listed false, public_summary empty, public_topics {}, updated_at 2026-10-23 23:09:25.848553+00);
-- rows_updated = 0 means someone edited the row since: re-read and retry.
-- ROLLBACK: select set_config('cpl.library_public', 'on', true); update public.cpl_library set public_listed = false,
--   seen_by = 'team', public_summary = null, public_topics = '{}', listed_at = null, listed_by = null
--   where slug = 'ell-iet-cpl-starting-points';
--   (cpl_library_history_trg files the prior row either way.)
-- A good result is one row: public_listed true, seen_by public.
select set_config('cpl.library_public', 'on', true);
update public.cpl_library l
set public_listed = true,
    seen_by = 'public',
    public_summary = coalesce(nullif(btrim(l.public_summary), ''), l.summary),
    public_topics = array['ELL IET', 'English language learners', 'integrated education and training', 'EDD', 'adult education'],
    listed_at = now(),
    listed_by = 'Sam, Open Asks Sheet 123 card 1 (S466 receipt)',
    updated_by = 'library-s466@bot'
where l.slug = 'ell-iet-cpl-starting-points'
  and l.retired_at is null
  and l.seen_by = 'team'
  and l.public_listed = false
  and l.updated_at = '2026-10-23 23:09:25.848553+00'
returning l.slug, l.public_listed, l.seen_by, l.status, l.listed_at;
