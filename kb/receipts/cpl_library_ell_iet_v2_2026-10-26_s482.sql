-- S482 (SkyShootingStar), 2026-10-26. Sam's Changes to make on the ELL IET record (his edit, 01:29Z): "Add a short
-- table to each grantee card that gives specific examples of potential articulations that could be made between the
-- training (course or certificate) and specific college courses in the region of the grantee." Then, mid-run
-- (~02:00Z): "Those cards that repeatedly say 'nothing nearby' sound pretty negative and discouraging. Perhaps
-- reframe it to focus on what is possible rather than what's not already there. That's what folks are interested in."
-- (1) Version 2, a private Claude page (https://claude.ai/artifact/Skw4HTtnQUPkQBUYYGFwtw), joins the record's
--     versions as a draft for Sam's review. Version 1 stays Current and stays the public copy
--     (library/ell-iet-cpl-starting-points/): the public copy changes only on his word, so url, version and the
--     listing are untouched. The box empties, as the Changes to make procedure says; rebuild_from names the v2 brief.
-- (2) Rule 8 ingest: Sam's asks of this session, verbatim.
-- Rule 10: one guarded UPDATE from the before-values read live at ~02:05Z 2026-10-26:
--   updated_by Sam, updated_at 2026-10-26 01:29:21.558089+00, versions [Version 1 only], refresh_note (his request,
--   above), rebuild_from (below, in the rollback).
-- rows_updated = 0 means someone edited the row since: re-read and retry.
-- ROLLBACK (cpl_library_history_trg files the prior row either way):
--   update public.cpl_library set
--     refresh_note = 'Add a short table to each grantee card that gives specific examples of potential articulations that could be made between the training (course or certificate) and specific college courses in the region of the grantee.',
--     versions = '[{"url":"https://claude.ai/artifact/WnEFhH4yuoSdx6mCnoqRpe","date":"2026-10-23","label":"Version 1","status":"Current"}]'::jsonb,
--     rebuild_from = 'CPLBrain/04-projects/cpl-initiative/ell-iet/make_brief.py, then CPLBrain/04-projects/cpl-initiative/agency-visual/build.py on briefs/20261023_ELL_IET_CPL_Starting_Points.json; the public page: python3 scripts/library_page.py ell-iet-cpl-starting-points <the built HTML> (cpl-project-tracker)',
--     updated_by = 'Sam'
--   where slug = 'ell-iet-cpl-starting-points';
--   delete the memory log rows (actor library-s482-2026-10-26), then the memory row by slug.
-- A good result is one row with two versions and an empty refresh_note.
update public.cpl_library l
set versions = '[{"url":"https://claude.ai/artifact/WnEFhH4yuoSdx6mCnoqRpe","date":"2026-10-23","label":"Version 1","status":"Current"},{"url":"https://claude.ai/artifact/Skw4HTtnQUPkQBUYYGFwtw","date":"2026-10-26","label":"Version 2","status":"Draft for review"}]'::jsonb,
    refresh_note = null,
    rebuild_from = 'CPLBrain/04-projects/cpl-initiative/ell-iet/make_brief.py --tracker <cpl-project-tracker>, then CPLBrain/04-projects/cpl-initiative/agency-visual/build.py briefs/20261023_ELL_IET_CPL_Starting_Points_2.json -o 20261023_ELL_IET_CPL_Starting_Points_2.html (Version 2; Version 1''s brief and page sit beside it); the public page: python3 scripts/library_page.py ell-iet-cpl-starting-points <the built HTML> (cpl-project-tracker)',
    updated_by = 'library-s482@bot'
where l.slug = 'ell-iet-cpl-starting-points'
  and l.updated_at = '2026-10-26 01:29:21.558089+00'
  and l.updated_by = 'Sam'
returning l.slug, l.refresh_note, jsonb_array_length(l.versions) as versions;

insert into public.cpl_memory (slug, kind, title, summary, detail, plain, tags, status, source, verified_by, verified_at, event_date, author, related)
select x.slug, x.kind, x.title, x.summary, x.detail, x.plain, x.tags, x.status, x.source, x.verified_by,
       case when x.verified_by is null then null else now() end, '2026-10-26'::date, 'library-s482-2026-10-26', x.related
from jsonb_to_recordset($json$[
 {"slug":"sam-s482-frame-what-is-possible-2026-10-26","kind":"decision",
  "title":"Sam: frame a field-facing visual around what is possible, never what is missing",
  "summary":"Sam, 2026-10-26 ~02:00Z (S482), on the ELL IET cards: lines that repeatedly say \"nothing nearby\" read as negative and discouraging; reframe to what is possible, \"That's what folks are interested in.\" Same run: the Noncredit Summit film's greeting ends on a period so the voice comes in softer, and its funding line says \"for two noncredit outcomes\" (his word, for \"restricted to\").",
  "detail":"Verbatim: \"Those cards that repeatedly say 'nothing nearby' sound pretty negative and discouraging. Perhaps reframe it to focus on what is possible rather than what's not already there. That's what folks are interested in.\" Of the summit film: \"For the video script, take off the exclamation mark on the first line as well--so the voice comes in a bit softer on the intro.\" Then: \"2nd voice render sounds good to me. Change the word 'restricted' to 'for'\" and \"'restricted to' to 'for'\". Applied in ELL IET Version 2 (https://claude.ai/artifact/Skw4HTtnQUPkQBUYYGFwtw): Ready for a first articulation at …; A precedent to adopt: … already award credit for it; Open for the first exhibit in MAP, built with the nearest college; the bands Ready to build, A precedent to adopt, Job-related English: a course-to-course match. Pairs with his 2026-09-16 rule to state things positively.",
  "plain":"Sam wants pages for the field to lead with what a college or partner can do next, not with what is absent.",
  "tags":["library","house-voice","ell-iet","noncredit-summit-film"],"status":"verified",
  "source":"Sam in chat, S482, 2026-10-26","verified_by":"Sam",
  "related":["library-changes-to-make-built-2026-10-25"]}
]$json$::jsonb)
  as x(slug text, kind text, title text, summary text, detail text, plain text, tags text[], status text,
       source text, verified_by text, related text[])
on conflict (slug) do nothing;

-- Log, as its own statement (a CTE log insert sees nothing; playbook step 6).
insert into public.cpl_memory_log (memory_id, actor, action, note, after)
select m.id, 'library-s482-2026-10-26', 'create', 'S482: Sam''s framing rule and the summit film''s words', to_jsonb(m)
from public.cpl_memory m
where m.slug = 'sam-s482-frame-what-is-possible-2026-10-26'
  and not exists (select 1 from public.cpl_memory_log g where g.memory_id = m.id and g.actor = 'library-s482-2026-10-26');
