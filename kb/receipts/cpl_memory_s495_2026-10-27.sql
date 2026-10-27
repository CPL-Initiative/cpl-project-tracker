-- S495 (SkySalmonberry), 2026-10-27: Rule 8 ingest at the checkpoint. INSERT-only under author/actor
-- memory-s495-checkpoint-2026-10-27. ROLLBACK: delete from public.cpl_memory_log where actor = 'memory-s495-checkpoint-2026-10-27';
--   delete from public.cpl_memory where author = 'memory-s495-checkpoint-2026-10-27';
-- related is coalesced to '{}' and every summary is <= 400 (S493's two failures).
insert into public.cpl_memory (slug, kind, title, summary, detail, plain, tags, status, source, verified_by, verified_at, event_date, author, related)
select x.slug, x.kind, x.title, x.summary, x.detail, x.plain, x.tags, x.status, x.source, x.verified_by,
       case when x.verified_by is null then null else now() end, '2026-10-27'::date, 'memory-s495-checkpoint-2026-10-27', coalesce(x.related, '{}'::text[])
from jsonb_to_recordset($json$[
 {
  "slug": "narrated-cut-scene8-reread-sheet135-2026-10-27",
  "kind": "fact",
  "title": "Sierra's narrated funding cut: scene 8 re-read, n2 on the v11 picture, scenes 5 to 7 on Sheet 135",
  "summary": "Scene 8 was re-read in Sierra's voice (ElevenLabs ReTJQSHbCXUjxzzfhCOu): December 31 and the Noncredit CPL Lead. n2 now plays the published v11 picture (LIVE['n2'], #2499, held). Scenes 5 to 7 still speak October figures (4,367 vs 3,598.2 FTES; 34.5 vs 31.3); Open Asks Sheet 135 card 1 asks Sam whether to re-read them before the render and the funding-page link.",
  "tags": [
   "implementation-funding",
   "funding-video",
   "narration",
   "accessibility"
  ],
  "source": "cpl-project-tracker#2499; Open Asks Sheet 135 https://claude.ai/artifact/PS3D3v2RTC8kb65mRWV5PD",
  "status": "proposed",
  "detail": null,
  "plain": null,
  "verified_by": null,
  "related": null
 },
 {
  "slug": "a11y-seed-waiting-on-data-reads-as-load-2026-10-27",
  "kind": "pitfall",
  "title": "An a11y seed that waits on a data-dependent control times out and reads as load",
  "summary": "CER Procedures' two a11y targets timed out alone as well as under the sweep: the seed waited for See what it did, which renders only where the last nightly CER run settled something, and the 2026-10-26 run settled none of 13. Re-run a timed-out target alone before calling it load; seed on structure every run paints. Fixed in #2501.",
  "tags": [
   "accessibility",
   "a11y-runner",
   "cer-procedures"
  ],
  "source": "cpl-project-tracker#2501",
  "status": "proposed",
  "detail": null,
  "plain": null,
  "verified_by": null,
  "related": null
 },
 {
  "slug": "axe-internal-tabs-worked-2026-10-27",
  "kind": "milestone",
  "title": "axe findings on COBI's internal tabs worked; one left for after the Summit",
  "summary": "S494's axe list is worked: select-name (#2498), TMC rows, Activities and Memory contrast, EACR and Program Requirements targets (#2500), CER Procedures' seed (#2501). Each target failed on main and passes after. Left: the funding section summary holding a control (curator views), after 10-30. The ten public Summit targets pass with axe on main 82ea5ce5.",
  "tags": [
   "accessibility",
   "cobi-dark-mode",
   "implementation-funding"
  ],
  "source": "cpl-project-tracker#2498 #2500 #2501",
  "status": "proposed",
  "detail": null,
  "plain": null,
  "verified_by": null,
  "related": null
 },
 {
  "slug": "hartnell-calgetc-pool-areas-step-2026-10-27",
  "kind": "fact",
  "title": "Hartnell CalGETC 45096: pool_areas pools each Cal-GETC area's sub-areas under its printed total",
  "summary": "The tab prints one total per area (6 over 3A and 3B; 7 over 5A, 5B, 5C; page read 40375734212) where the record keeps figureless sub-area blocks, so it read 30-44.5 against 34. pool_areas (branch claude/hartnell-calgetc-area-totals) merges them, sub-areas kept as floors, a twice-listed course once: 34 of 34 in test. Next: the reconcile run's capture, then reread.",
  "tags": [
   "program-requirements-harvest",
   "hartnell",
   "reconcile"
  ],
  "source": "branch claude/hartnell-calgetc-area-totals 3b22fa05",
  "status": "proposed",
  "detail": null,
  "plain": null,
  "verified_by": null,
  "related": null
 }
]$json$::jsonb)
  as x(slug text, kind text, title text, summary text, detail text, plain text, tags text[], status text,
       source text, verified_by text, related text[])
on conflict (slug) do nothing;
insert into public.cpl_memory_log (memory_id, actor, action, note, after)
select m.id, 'memory-s495-checkpoint-2026-10-27', 'create', 'S495: ' || m.slug, to_jsonb(m)
from public.cpl_memory m
where m.author = 'memory-s495-checkpoint-2026-10-27'
  and not exists (select 1 from public.cpl_memory_log g where g.memory_id = m.id and g.actor = 'memory-s495-checkpoint-2026-10-27');
select slug, status from public.cpl_memory where author = 'memory-s495-checkpoint-2026-10-27';
