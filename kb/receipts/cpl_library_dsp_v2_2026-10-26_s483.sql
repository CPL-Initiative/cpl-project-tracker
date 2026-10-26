-- S483 (SkyCoyoteMint), 2026-10-26. Sam, S482 (cpl_memory sam-s482-film-asks-2026-10-26): redo the DSP visual the
-- same way as the ELL one. Version 2 moves DSP Credit Starting Points onto the agency template: a brief written by
-- CPLBrain/04-projects/cpl-initiative/dsp-training/make_brief.py and painted by ../agency-visual/build.py, each card
-- ending in example articulations (Training · College · Course · Basis), every line leading with what a college could
-- start (sam-s482-frame-what-is-possible-2026-10-26).
-- (1) Version 2, a private Claude page (https://claude.ai/artifact/K2h4XZQ9oRb2AXbPSJYbPa), joins the record's
--     versions as a draft for Sam's review. Version 1 stays Current and stays the public copy
--     (library/dsp-credit-starting-points/): the public copy changes only on his word, so url, version and the
--     listing are untouched. rebuild_from names the v2 brief and builder.
-- (2) Rule 8 ingest: what was built.
-- Rule 10: one guarded UPDATE from the before-values read live at ~03:16Z 2026-10-26:
--   updated_by library-pages-s469@bot, updated_at 2026-10-25 03:10:14.94232+00, versions [Version 1 only],
--   refresh_note null, rebuild_from (below, in the rollback).
-- rows_updated = 0 means someone edited the row since: re-read and retry.
-- ROLLBACK (cpl_library_history_trg files the prior row either way):
--   update public.cpl_library set
--     versions = '[{"url":"https://claude.ai/artifact/P4R8jJ84xdnLGhdmDhQ3xE","date":"2026-10-20","label":"Version 1","status":"Current"}]'::jsonb,
--     rebuild_from = 'CPLBrain/04-projects/cpl-initiative/dsp-training/20261020_DSP_Credit_Starting_Points.html; the public page: python3 scripts/library_page.py dsp-credit-starting-points <that file> (cpl-project-tracker)',
--     updated_by = 'library-pages-s469@bot'
--   where slug = 'dsp-credit-starting-points';
--   delete the memory log rows (actor library-s483-2026-10-26), then the memory row by slug.
-- A good result is one row with two versions.
update public.cpl_library l
set versions = '[{"url":"https://claude.ai/artifact/P4R8jJ84xdnLGhdmDhQ3xE","date":"2026-10-20","label":"Version 1","status":"Current"},{"url":"https://claude.ai/artifact/K2h4XZQ9oRb2AXbPSJYbPa","date":"2026-10-26","label":"Version 2","status":"Draft for review"}]'::jsonb,
    rebuild_from = 'CPLBrain/04-projects/cpl-initiative/dsp-training/make_brief.py --tracker <cpl-project-tracker>, then CPLBrain/04-projects/cpl-initiative/agency-visual/build.py briefs/20261020_DSP_Credit_Starting_Points_2.json -o 20261020_DSP_Credit_Starting_Points_2.html (Version 2; Version 1 is the hand-built 20261020_DSP_Credit_Starting_Points.html beside it); the public page: python3 scripts/library_page.py dsp-credit-starting-points <the built HTML> (cpl-project-tracker)',
    updated_by = 'library-s483@bot'
where l.slug = 'dsp-credit-starting-points'
  and l.updated_at = '2026-10-25 03:10:14.94232+00'
  and l.updated_by = 'library-pages-s469@bot'
returning l.slug, jsonb_array_length(l.versions) as versions;

insert into public.cpl_memory (slug, kind, title, summary, detail, plain, tags, status, source, verified_by, verified_at, event_date, author, related)
select x.slug, x.kind, x.title, x.summary, x.detail, x.plain, x.tags, x.status, x.source, x.verified_by,
       case when x.verified_by is null then null else now() end, '2026-10-26'::date, 'library-s483-2026-10-26', x.related
from jsonb_to_recordset($json$[
 {"slug":"dsp-credit-starting-points-v2-built-2026-10-26","kind":"fact",
  "title":"DSP Credit Starting Points Version 2 is on the agency template, with example articulations on every card (draft for review)",
  "summary":"Built by S483 at Sam's S482 ask: dsp-training/make_brief.py writes the brief, agency-visual/build.py paints it (https://claude.ai/artifact/K2h4XZQ9oRb2AXbPSJYbPa). Five cards, each ending in up to six rows of Training · College · Course · Basis, every line opening on what a DSP could count toward. Version 1 stays the public copy until Sam says otherwise.",
  "detail":"MAP holds no DSPT exhibit (0 of 2,952 in statewide_data.js, read 2026-10-26), so every row's basis is a matching course, with the common course's reach named where the CCR places the course under one (PSYT P020A with 3 more colleges; SOCS M1041 Introduction to Disability Studies at 7; HLTH M1053 Medication Administration at 12). The training topics come from the tables of contents of DDS's DSPT Year 1 and Year 2 student resource guides, read through a web search (dds.ca.gov does not resolve from the session); the guides' text was not read. New from the COCI program inventory: Taft also runs a Direct Support Education certificate and A.S. The wider ring is counted: psychiatric technician programs at 10 colleges, behavior technician at 3 (noncredit), 114 caregiving, personal care and home health aide courses at 62 colleges.",
  "plain":"The DSP page now looks like the ELL page and shows faculty concrete course pairings to examine first.",
  "tags":["library","dsp","agency-visual"],"status":"proposed",
  "source":"S483 build, 2026-10-26","verified_by":null,
  "related":["sam-s482-film-asks-2026-10-26","sam-s482-frame-what-is-possible-2026-10-26","public-pieces-pages-copies-built-2026-10-25"]}
]$json$::jsonb)
  as x(slug text, kind text, title text, summary text, detail text, plain text, tags text[], status text,
       source text, verified_by text, related text[])
on conflict (slug) do nothing;

-- Log, as its own statement (a CTE log insert sees nothing; playbook step 6).
insert into public.cpl_memory_log (memory_id, actor, action, note, after)
select m.id, 'library-s483-2026-10-26', 'create', 'S483: DSP Credit Starting Points Version 2 built', to_jsonb(m)
from public.cpl_memory m
where m.slug = 'dsp-credit-starting-points-v2-built-2026-10-26'
  and not exists (select 1 from public.cpl_memory_log g where g.memory_id = m.id and g.actor = 'library-s483-2026-10-26');
