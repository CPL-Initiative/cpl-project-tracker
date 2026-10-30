-- S521 (SkyBearberry, Sam's session), 2026-10-30: Sam's Sheet 142 rulings and Quick Adopt ask, the program search finding, a CI pitfall.
-- INSERT-only under author/actor memory-s521-2026-10-30. ROLLBACK:
--   delete from public.cpl_memory_log where actor = 'memory-s521-2026-10-30';
--   delete from public.cpl_memory where author = 'memory-s521-2026-10-30';
insert into public.cpl_memory (slug, kind, title, summary, detail, plain, tags, status, source, verified_by, verified_at, event_date, author, related)
select x.slug, x.kind, x.title, x.summary, x.detail, x.plain, x.tags, x.status, x.source, x.verified_by,
       case when x.verified_by is null then null else now() end, x.event_date::date, 'memory-s521-2026-10-30', coalesce(x.related, '{}'::text[])
from jsonb_to_recordset($json$[
 {
  "slug": "sam-sheet-142-rulings-2026-10-30",
  "kind": "decision",
  "title": "Sam's Open Asks Sheet 142 rulings",
  "summary": "Sam completed Open Asks Sheet 142 at 00:21Z 2026-10-30, all three his own call: card 1 tonight (apply the program search's no-copy migration before the Summit), card 2 retry-report (deploy smoke: RPC checks retry once, answer checks warn, rule guards fail), card 3 later (an address without github.io). In session he said \"Push it\" (00:33Z) and \"Push the fix\" (00:59Z).",
  "tags": [
   "sierra",
   "decision-sheet",
   "smoke"
  ],
  "status": "verified",
  "source": "Open Asks Sheet 142 replies; Sam in session",
  "verified_by": "Sam",
  "event_date": "2026-10-30",
  "detail": null,
  "plain": null,
  "related": null
 },
 {
  "slug": "sam-quick-adopt-partly-adopted-2026-10-30",
  "kind": "opportunity",
  "title": "Quick Adopt links for courses not yet approved",
  "summary": "Sam, 00:57Z 2026-10-30, on Sierra's Bakersfield Firefighter 1 answer: \"Would have been perfect if it gave the request quick adopt links for courses not yet approved\". Sierra's Quick Adopt links render only for a credential the college has not adopted; a partly adopted credential's unapproved courses get none. NEXT in the Sierra lane.",
  "tags": [
   "sierra",
   "quick-adopt",
   "map-links"
  ],
  "status": "verified",
  "source": "Sam in session",
  "verified_by": "Sam",
  "event_date": "2026-10-30",
  "detail": null,
  "plain": null,
  "related": null
 },
 {
  "slug": "fact-search-college-programs-no-temp-2026-10-30",
  "kind": "fact",
  "title": "search_college_programs spilled to temp; fixed in two migrations",
  "summary": "S521: search_college_programs copied all 22,335 programs into a MATERIALIZED CTE and grouped DF by a tsquery (no hash opclass), so both spilled past work_mem 2 MB (79 MB temp a call; mean 2.0 s, max 7.8 s since 10-26). s521 and s521b read the table and group by ordinal: 149 ms warm (555), 733 ms on 30 terms (3,570), no temp; 13 key sequences equal.",
  "tags": [
   "sierra",
   "supabase",
   "performance"
  ],
  "status": "proposed",
  "source": "kb/receipts/search_college_programs_no_copy_2026-10-30_s521.sql; cpl-project-tracker#2570",
  "verified_by": null,
  "event_date": "2026-10-30",
  "detail": null,
  "plain": null,
  "related": null
 },
 {
  "slug": "pitfall-run-js-summary-lost-2026-10-30",
  "kind": "pitfall",
  "title": "tests/run.js loses its summary on a failing shard",
  "summary": "tests/run.js prints its summary with console.log to a pipe and then calls process.exit(1), which discards the buffer: a failing shard's log ends mid-stream with exit 1 and no failing file named (#2570, shard 3, twice on 2026-10-30). Fix: write the summary with fs.writeSync(1, ...). Not yet built.",
  "tags": [
   "ci",
   "tests"
  ],
  "status": "proposed",
  "source": "cpl-project-tracker#2570 comment",
  "verified_by": null,
  "event_date": "2026-10-30",
  "detail": null,
  "plain": null,
  "related": null
 }
]$json$::jsonb) as x(slug text, kind text, title text, summary text, detail text, plain text, tags text[], status text, source text, verified_by text, event_date text, related text[])
on conflict (slug) do nothing;
insert into public.cpl_memory_log (memory_id, actor, action, note, after)
select m.id, 'memory-s521-2026-10-30', 'create', 'S521: ' || m.slug, to_jsonb(m)
from public.cpl_memory m
where m.author = 'memory-s521-2026-10-30'
  and not exists (select 1 from public.cpl_memory_log g where g.memory_id = m.id and g.actor = 'memory-s521-2026-10-30');
select slug, status from public.cpl_memory where author = 'memory-s521-2026-10-30';
