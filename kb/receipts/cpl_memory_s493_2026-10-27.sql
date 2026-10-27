-- S493 (SkyThimbleberry), 2026-10-27: Rule 8 ingest at the checkpoint. INSERT-only under author/actor
-- memory-s493-checkpoint-2026-10-27. ROLLBACK: delete from public.cpl_memory_log where actor = 'memory-s493-checkpoint-2026-10-27';
--   delete from public.cpl_memory where author = 'memory-s493-checkpoint-2026-10-27';
-- S494: the first apply (run 40426660389) failed on related not-null (null into a column defaulting {}); coalesced here, re-applied as _r2; the second (run 40429270445) on summary <= 400 (one row at 438), shortened, re-applied as _r3.
insert into public.cpl_memory (slug, kind, title, summary, detail, plain, tags, status, source, verified_by, verified_at, event_date, author, related)
select x.slug, x.kind, x.title, x.summary, x.detail, x.plain, x.tags, x.status, x.source, x.verified_by,
       case when x.verified_by is null then null else now() end, '2026-10-27'::date, 'memory-s493-checkpoint-2026-10-27', coalesce(x.related, '{}'::text[])
from jsonb_to_recordset($json$[
 {
  "slug": "sam-sheet-134-rulings-2026-10-27",
  "kind": "decision",
  "title": "Sam's Sheet 134 rulings: the Could Adopt chip names MAP's builder; build the MAP link on CPL Pathways, My College and CER, Sierra next",
  "summary": "Sam, Open Asks Sheet 134, 00:09Z 2026-10-27, both his own call, no notes: card 1 builder (each chip names the college MAP records as the exhibit's owner, not the articulating colleges MAP's table lists); card 2 build (one title index links CPL Pathways, My College and CER, tracker #2488; Sierra in a second pull request; counts stay unlinked).",
  "detail": null, "plain": null,
  "tags": ["my-college-action-page", "map-link", "could-adopt", "decision-sheets"],
  "status": "verified", "source": "Open Asks Sheet 134 replies store (https://claude.ai/artifact/9GPuiZ5F4dvjCrinyJFr5q)",
  "verified_by": "Sam (sheet reply)", "related": null
 },
 {
  "slug": "map-exhibit-owner-not-articulator-2026-10-26",
  "kind": "fact",
  "title": "MAP records one owner per exhibit; its CPL Opportunities table lists the articulating colleges, and joined IDs are often one builder's versions",
  "summary": "MAP's collaborative-exhibits API names each exhibit's owner: MAPICI-DREB1-1-001 was built by Saddleback, while the CPL Opportunities table lists Chabot, Fullerton and West LA, which articulated it. In 44 of 73 multi-ID Could Adopt rows one college built two or more joined IDs; in a sample of 40 joined IDs the table opens on another college for 9. All 6,418 statewide_data.js exhibit IDs are listed.",
  "detail": null, "plain": null,
  "tags": ["my-college-action-page", "map-link", "eacr"],
  "status": "proposed", "source": "cpl-project-tracker#2485; kb/reference/map_cpl_opportunities_verified.json",
  "verified_by": null, "related": null
 },
 {
  "slug": "pitfall-hidden-span-widens-scrolling-table-2026-10-26",
  "kind": "pitfall",
  "title": "A visually hidden span with no positioned ancestor widens the page from inside a scrolling table",
  "summary": "EACR's table scrolled the page sideways by 666px at 390px after the MAP chips landed: each chip's screen-reader span was position:absolute with no positioned ancestor, so it anchored to the page from inside the table's own scroller. position:relative on the chip fixed it (#2485); map_links.js carries the same rule.",
  "detail": null, "plain": null,
  "tags": ["accessibility", "a11y", "css", "eacr"],
  "status": "proposed", "source": "cpl-project-tracker#2485 (npm run a11y exhibit-adoption-table, main passed, branch failed)",
  "verified_by": null, "related": null
 },
 {
  "slug": "funding-step2-auto-column-squeeze-2026-10-26",
  "kind": "pitfall",
  "title": "The public funding page's Step 2 was squeezed to 21px: an auto grid column grew to Step 1's description",
  "summary": "Sam's screenshot, 2026-10-26: with My Institution chosen, the Step 1 box (grid auto minmax(0,1fr)) let Step 1's full description (#2478) take the row; Step 2 got 21px, its list 28px, and the page scrolled sideways at 1280, 1024 and 900px. Fixed in #2487 with minmax(0,3fr) minmax(min(100%,22rem),2fr). S492's pre-Summit sweep left out funding-model-mycpl, the one target that opens My Institution.",
  "detail": null, "plain": null,
  "tags": ["implementation-funding", "accessibility", "cpl-summit"],
  "status": "proposed", "source": "cpl-project-tracker#2487",
  "verified_by": null, "related": null
 }
]$json$::jsonb)
  as x(slug text, kind text, title text, summary text, detail text, plain text, tags text[], status text,
       source text, verified_by text, related text[])
on conflict (slug) do nothing;
insert into public.cpl_memory_log (memory_id, actor, action, note, after)
select m.id, 'memory-s493-checkpoint-2026-10-27', 'create', 'S493: ' || m.slug, to_jsonb(m)
from public.cpl_memory m
where m.author = 'memory-s493-checkpoint-2026-10-27'
  and not exists (select 1 from public.cpl_memory_log g where g.memory_id = m.id and g.actor = 'memory-s493-checkpoint-2026-10-27');
-- The Library's series record moves to Open Asks Sheet 134 (one guarded UPDATE, read live at 00:31Z 2026-10-27).
-- BEFORE: url https://claude.ai/artifact/Vzy2jpwwBJsJoZ2Y3fv199, version '133', updated_at 2026-10-26 21:33:32.27152+00.
-- ROLLBACK: update public.cpl_library set url = 'https://claude.ai/artifact/Vzy2jpwwBJsJoZ2Y3fv199', version = '133'
--   where slug = 'open-asks-sheets';
update public.cpl_library
set url = 'https://claude.ai/artifact/9GPuiZ5F4dvjCrinyJFr5q', version = '134'
where slug = 'open-asks-sheets' and version = '133' and url = 'https://claude.ai/artifact/Vzy2jpwwBJsJoZ2Y3fv199';
select slug, status from public.cpl_memory where author = 'memory-s493-checkpoint-2026-10-27'
union all select slug || ' v' || version, url from public.cpl_library where slug = 'open-asks-sheets';
