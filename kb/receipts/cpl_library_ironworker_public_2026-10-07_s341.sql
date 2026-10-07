-- S341 (SkyTerrace), 2026-10-07: Sam, open-asks sheet 48 card 1, "Keep it public" (14:52Z): the Library records
-- the Ironworker film's audience as Public; the page and film stay. Guarded on the before-value (seen_by null,
-- read 2026-10-07); the history trigger files the prior row. Rollback: set seen_by back to null for this slug.
insert into public.cpl_library (slug, title, kind, home, url)
select slug, title, kind, home, url from public.cpl_library where slug = 'ironworker-pathway-in-motion'
on conflict (slug) do update set seen_by = 'public', updated_by = 'library-s341@bot'
where public.cpl_library.seen_by is null;
