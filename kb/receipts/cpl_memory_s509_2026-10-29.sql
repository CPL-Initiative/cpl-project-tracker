-- S509 (SkyElderberry, Sam's session), 2026-10-29: Sam's screenshot alt-text ruling, the Library's Version 20 build, one pitfall.
-- APPLIED 2026-10-29 through the Supabase MCP (cpl_memory_s509_2026_10_29); read back 3 rows, 3 log rows.
-- INSERT-only under author/actor memory-s509-2026-10-29. ROLLBACK:
--   delete from public.cpl_memory_log where actor = 'memory-s509-2026-10-29';
--   delete from public.cpl_memory where author = 'memory-s509-2026-10-29';
insert into public.cpl_memory (slug, kind, title, summary, detail, plain, tags, status, source, verified_by, verified_at, event_date, author, related)
select x.slug, x.kind, x.title, x.summary, x.detail, x.plain, x.tags, x.status, x.source, x.verified_by,
       case when x.verified_by is null then null else now() end, x.event_date::date, 'memory-s509-2026-10-29', coalesce(x.related, '{}'::text[])
from jsonb_to_recordset($json$[
 {
  "slug": "sam-library-screenshots-alt-text-by-claude-2026-10-29",
  "kind": "decision",
  "title": "Sam: the Library's remediation reads screenshots and drafts alt text",
  "summary": "Sam in session, 2026-10-29, on the remediation report: \"We do a lot of MAP screenshots and hoping you can decipher them and at least take a shot at alt text\" (he corrected \"decider\" to \"decipher\"). Built S509: Draft from the picture sends that one picture to Claude through the alt-text-draft Edge Function; charts draft from their own numbers in the browser.",
  "detail": "Asked whether a picture may leave the browser (a new data flow, a production deploy and a per-picture model cost), Sam answered with the ask above. S509 built a per-picture button and Draft every picture; the picture goes, shrunk to 1568 pixels, to alt-text-draft (v1, verify_jwt off, team phrase or reviewer checked inside, reads no table, writes nothing), which asks claude-sonnet-5 for one to three sentences naming the screen and its point and never copying a person's name, email or ID. The draft is marked as Claude's and read before it is kept. cpl-project-tracker#2541; docs/reference/model_spend.md lists the caller.",
  "tags": [
   "library",
   "remediation",
   "accessibility",
   "model-spend"
  ],
  "status": "verified",
  "source": "S509 session, 2026-10-29; cpl-project-tracker#2541",
  "verified_by": "Sam",
  "event_date": "2026-10-29",
  "plain": null,
  "related": null
 },
 {
  "slug": "library-version-20-built-2026-10-29",
  "kind": "milestone",
  "title": "The Library built to mockup Version 20: one card per project, one panel, remediation in the browser",
  "summary": "S509, 2026-10-29: cpl_library.project and one card per project (#2538, 13 projects of 2 by receipt); the one Create or Remediate a Document panel in place of Make a visual, Start a piece and Add to the Library (#2540, routing proceeded on S509's reading of Version 20); remediation of a .pptx or .docx in the browser over a vendored jszip.min.js (#2541).",
  "detail": null,
  "tags": [
   "library",
   "remediation",
   "accessibility"
  ],
  "status": "proposed",
  "source": "cpl-project-tracker#2538, #2540, #2541",
  "verified_by": null,
  "event_date": "2026-10-29",
  "plain": null,
  "related": null
 },
 {
  "slug": "pitfall-remediation-test-on-real-team-files-2026-10-29",
  "kind": "pitfall",
  "title": "Try a remediation change on real team decks before shipping it",
  "summary": "Run on four team files from CPLBrain/04-projects, the first remediation build missed generator stock titles, joined a title's lines across a:br, flooded the report with per-slide items for a deck without placeholders, and marked a chart reused on two of three slides as a logo. Fixtures written by hand passed all of it.",
  "detail": null,
  "tags": [
   "library",
   "remediation",
   "testing"
  ],
  "status": "proposed",
  "source": "docs/library_lessons.md, S509 section",
  "verified_by": null,
  "event_date": "2026-10-29",
  "plain": null,
  "related": null
 }
]$json$::jsonb) as x(slug text, kind text, title text, summary text, detail text, plain text, tags text[], status text, source text, verified_by text, event_date text, related text[])
on conflict (slug) do nothing;
insert into public.cpl_memory_log (memory_id, actor, action, note, after)
select m.id, 'memory-s509-2026-10-29', 'create', 'S509: ' || m.slug, to_jsonb(m)
from public.cpl_memory m
where m.author = 'memory-s509-2026-10-29'
  and not exists (select 1 from public.cpl_memory_log g where g.memory_id = m.id and g.actor = 'memory-s509-2026-10-29');
select slug, status from public.cpl_memory where author = 'memory-s509-2026-10-29';
