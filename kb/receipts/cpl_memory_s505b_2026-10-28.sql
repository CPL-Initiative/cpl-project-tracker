-- S505 (SkyBoysenberry, Sam's session), 2026-10-28: Sam's three rulings (MAP links, Request Adopt, the sweep) and three harvest/session learnings.
-- INSERT-only under author/actor memory-s505b-2026-10-28 (distinct from the queue routine's memory-s505-2026-10-28). ROLLBACK:
--   delete from public.cpl_memory_log where actor = 'memory-s505b-2026-10-28';
--   delete from public.cpl_memory where author = 'memory-s505b-2026-10-28';
insert into public.cpl_memory (slug, kind, title, summary, detail, plain, tags, status, source, verified_by, verified_at, event_date, author, related)
select x.slug, x.kind, x.title, x.summary, x.detail, x.plain, x.tags, x.status, x.source, x.verified_by,
       case when x.verified_by is null then null else now() end, x.event_date::date, 'memory-s505b-2026-10-28', coalesce(x.related, '{}'::text[])
from jsonb_to_recordset($json$[
 {
  "slug": "sam-map-links-open-non-military-card-2026-10-28",
  "kind": "decision",
  "title": "MAP links open the exhibit's own Non-Military card (View=Non-Military)",
  "summary": "Sam, 2026-10-28: \"We want the user to land on the non-military card that matches the MAP ID--the card is easier for the user to read than the first place we've been landing them.\" Pedro's routing (View=Military or Non-Military) is live on production MAP; every COBI and Sierra MAP link adds &View=Non-Military (#2530, Sierra deployed run 40733151892).",
  "detail": "Without View the CPL Opportunities page opens on Course Credit. Verified in a browser on six ID families (CPLICI, MAPSAS, MAPCXS, MAPPRA, MAPCBEN, MAPCXH). Every linked ID comes from MAP's collaborative-exhibits list, so all are non-military. Malone's sample links named the QA host; production carries the routing too.",
  "tags": [
   "eacr",
   "map-links"
  ],
  "status": "verified",
  "source": "Sam in session S505, 2026-10-28; cpl-project-tracker#2530",
  "verified_by": "Sam Lee",
  "event_date": "2026-10-28",
  "plain": null,
  "related": null
 },
 {
  "slug": "sam-request-adopt-label-2026-10-28",
  "kind": "decision",
  "title": "The adopt link reads Request Adopt",
  "summary": "Sam, 2026-10-28: \"Let's change the Could Adopt label to 'Request Adopt'.\" Applied to the link and button text (CPL Opportunity visual, its Excel workbook's link column and help row, the Library card). Could Adopt stays where it names a section or the Yes/No column; MAP chips show the building college (#2530).",
  "detail": null,
  "tags": [
   "eacr",
   "map-links"
  ],
  "status": "verified",
  "source": "Sam in session S505, 2026-10-28; cpl-project-tracker#2530",
  "verified_by": "Sam Lee",
  "event_date": "2026-10-28",
  "plain": null,
  "related": null
 },
 {
  "slug": "sam-sweep-public-views-for-map-link-2026-10-28",
  "kind": "wishlist",
  "title": "Sweep the public views that suggest an adoption and add the MAP link where feasible",
  "summary": "Sam, 2026-10-28: \"Later, will want to do a sweep of public views that don't have the link to see where it's feasible to add. Thinking of the statewide exhibits on the CPL Fact Sheet for example.\" Queued as the EACR lane's NEXT.",
  "detail": null,
  "tags": [
   "eacr",
   "map-links"
  ],
  "status": "verified",
  "source": "Sam in session S505, 2026-10-28",
  "verified_by": "Sam Lee",
  "event_date": "2026-10-28",
  "plain": null,
  "related": null
 },
 {
  "slug": "harvest-edge-boot-error-leaves-record-empty-2026-10-28",
  "kind": "pitfall",
  "title": "The extraction Edge Function's BOOT_ERROR (HTTP 503) is transient and files an empty record",
  "summary": "Glendale S505: 3 of 27 extractions failed with BOOT_ERROR on run 40704760867, 2 again on a forced retry, none on the third. The record files with error set and no score. Check every record's error after an extraction and force the empty ones before any reread.",
  "detail": null,
  "tags": [
   "program-requirements",
   "harvest"
  ],
  "status": "proposed",
  "source": "cpl-project-tracker#2529; docs/program_requirements_harvest_lessons.md S505",
  "verified_by": null,
  "event_date": "2026-10-28",
  "plain": null,
  "related": null
 },
 {
  "slug": "harvest-capture-reads-aliased-prefix-2026-10-28",
  "kind": "fact",
  "title": "The harvest capture looks for a listed course under a college's aliased prefix",
  "summary": "with_renumbers now sets printed from prefix_aliases too (4a925a33): Glendale's program pages print TART 101 where the state's file lists THTR 101, and without it the capture picked the THTR course descriptions for three Theatre records. A prefix that only begins with an alias's (ARTH under ART) is never rewritten.",
  "detail": "Also S505: the outcome scorer's no-space reading joins line-end hyphens and fires on letter-spaced lines and spaced semicolons (Glendale outcome failures 54 to 0). A reread posts the newest run only; earlier runs on the branch need force=<run>.",
  "tags": [
   "program-requirements",
   "harvest"
  ],
  "status": "proposed",
  "source": "cpl-project-tracker#2529",
  "verified_by": null,
  "event_date": "2026-10-28",
  "plain": null,
  "related": null
 },
 {
  "slug": "routine-and-session-share-a-session-number-2026-10-28",
  "kind": "pitfall",
  "title": "A live session and the CPL queue routine both claimed S505 / SkyBoysenberry",
  "summary": "Sam's S505 session started 03:18Z on handoff 505; the queue routine fired 13:12Z, read the same handoff, claimed the same number and moniker and wrote handoff 506. No file collided, but two S505s now exist in commits and receipts. A session that runs past the routine's next firing should expect it and checkpoint to the next free handoff number (S505's became 507).",
  "detail": null,
  "tags": [
   "scheduled-sessions"
  ],
  "status": "proposed",
  "source": "docs/session_506_handoff.md; docs/session_507_handoff.md",
  "verified_by": null,
  "event_date": "2026-10-28",
  "plain": null,
  "related": null
 }
]$json$::jsonb) as x(slug text, kind text, title text, summary text, detail text, plain text, tags text[], status text, source text, verified_by text, event_date text, related text[])
on conflict (slug) do nothing;
insert into public.cpl_memory_log (memory_id, actor, action, note, after)
select m.id, 'memory-s505b-2026-10-28', 'create', 'S505: ' || m.slug, to_jsonb(m)
from public.cpl_memory m
where m.author = 'memory-s505b-2026-10-28'
  and not exists (select 1 from public.cpl_memory_log g where g.memory_id = m.id and g.actor = 'memory-s505b-2026-10-28');
select slug, status from public.cpl_memory where author = 'memory-s505b-2026-10-28';
