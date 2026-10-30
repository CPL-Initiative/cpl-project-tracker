-- S522 (SkyCrowberry), 2026-10-30: the runner's lost summary fixed, the test race it then named, the bot receipt commit that starts no CI.
-- Three INSERT-only rows under author/actor memory-s522-2026-10-30, and one guarded UPDATE that supersedes the two
-- session-written run.js pitfall rows (both status 'proposed', superseded_by null, before this write) with the new fact row.
-- ROLLBACK:
--   update public.cpl_memory set status = 'proposed', superseded_by = null
--     where slug in ('pitfall-run-js-summary-lost-2026-10-30', 'pitfall-run-js-summary-lost-on-ci-shard-2026-10-25');
--   delete from public.cpl_memory_log where actor = 'memory-s522-2026-10-30';
--   delete from public.cpl_memory where author = 'memory-s522-2026-10-30';
insert into public.cpl_memory (slug, kind, title, summary, detail, plain, tags, status, source, verified_by, verified_at, event_date, author, related)
select x.slug, x.kind, x.title, x.summary, x.detail, x.plain, x.tags, x.status, x.source, x.verified_by,
       case when x.verified_by is null then null else now() end, x.event_date::date, 'memory-s522-2026-10-30', coalesce(x.related, '{}'::text[])
from jsonb_to_recordset($json$[
 {
  "slug": "fact-run-js-names-failing-shard-file-2026-10-30",
  "kind": "fact",
  "title": "tests/run.js keeps its summary on a failing shard",
  "summary": "Fixed in #2572 (S522): tests/run.js called process.exit(1) after writing megabytes to the CI pipe, which discarded the buffered tail and the summary, so a red shard named no file (#2446, #2570). It now sets process.exitCode and returns, so the log ends with the FAILED list. tests/runner_capture.test.js runs the real runner through a pipe (11 checks).",
  "tags": ["ci", "tests", "runner"],
  "status": "proposed",
  "source": "#2572; docs/test_suite_speed_lessons.md (S522)",
  "verified_by": null,
  "event_date": "2026-10-30",
  "detail": null,
  "plain": null,
  "related": ["pitfall-run-js-summary-lost-2026-10-30", "pitfall-run-js-summary-lost-on-ci-shard-2026-10-25"]
 },
 {
  "slug": "pitfall-test-wait-without-margin-2026-10-30",
  "kind": "pitfall",
  "title": "A test that waits a fixed count of ticks fails on a loaded shard",
  "summary": "library.test.js (19) waited exactly two settles for JSZip to read a dropped Word file, and locally the read lands after exactly two, so it failed on #2570's loaded shard 3. Wait on the condition, bounded. Prove it by delaying the async step (300 ms on JSZip.loadAsync); CPU spinners did not. A new test file reshuffles every shard, so such a check surfaces on an unrelated PR. Fixed in #2572.",
  "tags": ["ci", "tests", "flake"],
  "status": "proposed",
  "source": "#2572; docs/test_suite_speed_lessons.md (S522)",
  "verified_by": null,
  "event_date": "2026-10-30",
  "detail": null,
  "plain": null,
  "related": null
 },
 {
  "slug": "pitfall-migrate-receipt-commit-starts-no-ci-2026-10-30",
  "kind": "pitfall",
  "title": "The migrate runner's receipt commit starts no CI",
  "summary": "supabase-migrate.yml commits its receipt to the branch with the workflow token, and a push by that token starts no workflow, so the PR's newest head has no checks (#2570 after run 40990743558, S522). The next session push is what tests that head; carry a real change in it rather than an empty commit.",
  "tags": ["ci", "supabase", "migrate"],
  "status": "proposed",
  "source": "#2570, run 40990743558 (S522)",
  "verified_by": null,
  "event_date": "2026-10-30",
  "detail": null,
  "plain": null,
  "related": null
 }
]$json$::jsonb) as x(slug text, kind text, title text, summary text, detail text, plain text, tags text[], status text, source text, verified_by text, event_date text, related text[])
on conflict (slug) do nothing;
insert into public.cpl_memory_log (memory_id, actor, action, note, after)
select m.id, 'memory-s522-2026-10-30', 'create', 'S522: ' || m.slug, to_jsonb(m)
from public.cpl_memory m
where m.author = 'memory-s522-2026-10-30'
  and not exists (select 1 from public.cpl_memory_log g where g.memory_id = m.id and g.actor = 'memory-s522-2026-10-30');
-- Guarded supersede: only rows still 'proposed' with no successor, and never a human-verified row.
with fixed as (select slug from public.cpl_memory where slug = 'fact-run-js-names-failing-shard-file-2026-10-30'),
     old as (
       select m.* from public.cpl_memory m
       where m.slug in ('pitfall-run-js-summary-lost-2026-10-30', 'pitfall-run-js-summary-lost-on-ci-shard-2026-10-25')
         and m.status = 'proposed' and m.superseded_by is null and m.verified_by is null),
     upd as (
       update public.cpl_memory m set status = 'superseded', superseded_by = (select slug from fixed)
       from old where m.id = old.id and exists (select 1 from fixed)
       returning m.*, to_jsonb(old) as before_row)
insert into public.cpl_memory_log (memory_id, actor, action, note, before, after)
select u.id, 'memory-s522-2026-10-30', 'supersede', 'S522: fixed by #2572', u.before_row, to_jsonb(u) - 'before_row'
from upd u;
select slug, status from public.cpl_memory
where author = 'memory-s522-2026-10-30'
   or slug in ('pitfall-run-js-summary-lost-2026-10-30', 'pitfall-run-js-summary-lost-on-ci-shard-2026-10-25');
