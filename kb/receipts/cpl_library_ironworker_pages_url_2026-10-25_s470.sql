-- S470 SkyBlueCurls, 2026-10-25: the last public Library piece that opened off cpl-initiative.github.io. Sam's pick of
-- ~02:00Z, "GitHub Pages now" (cpl_memory sam-public-pieces-on-github-pages-2026-10-25), puts every public piece at a
-- cpl-initiative.github.io address. The film is already on Pages beside its source (prototype/ironworker_video/), so
-- the record's url moves from the github.com file page to the Pages address of the same file. Sam's two edits of this
-- record (2026-10-20 22:21Z and 2026-10-21 00:06Z, cpl_library_history) listed it publicly; the github.com url came
-- from the seed (library-seed-skyshelf@bot, 2026-10-05), so no value he chose changes. versions keeps the github.com
-- link (team view only; cpl_library_public() returns url, never versions).
-- Pages answered 206 video/mp4 for the new url at ~04:35Z 2026-10-25.
-- Rule 10: one guarded UPDATE from the before-values read live at ~04:35Z 2026-10-25:
--   ironworker-pathway-in-motion  url https://github.com/CPL-Initiative/cpl-project-tracker/blob/main/prototype/ironworker_video/20261004_Ironworker_Pathway_in_Motion_v1.mp4,
--     updated_by Sam, updated_at 2026-10-21 00:06:46.250231+00
-- rows_updated = 0 means someone edited the row since: re-read and retry.
-- ROLLBACK (cpl_library_history_trg files the prior row either way):
--   update public.cpl_library set url = 'https://github.com/CPL-Initiative/cpl-project-tracker/blob/main/prototype/ironworker_video/20261004_Ironworker_Pathway_in_Motion_v1.mp4',
--     updated_by = 'Sam' where slug = 'ironworker-pathway-in-motion';
-- A good result is one row, its url at https://cpl-initiative.github.io/cpl-project-tracker/prototype/ironworker_video/20261004_Ironworker_Pathway_in_Motion_v1.mp4.
update public.cpl_library l
set url = 'https://cpl-initiative.github.io/cpl-project-tracker/prototype/ironworker_video/20261004_Ironworker_Pathway_in_Motion_v1.mp4',
    updated_by = 'library-pages-s470@bot'
where l.slug = 'ironworker-pathway-in-motion'
  and l.url = 'https://github.com/CPL-Initiative/cpl-project-tracker/blob/main/prototype/ironworker_video/20261004_Ironworker_Pathway_in_Motion_v1.mp4'
  and l.updated_at = '2026-10-21 00:06:46.250231+00'
returning l.slug, l.url, l.public_listed;
