-- S494 (SkyWhortleberry), 2026-10-27: Rule 8 ingest at the checkpoint. INSERT-only under author/actor
-- memory-s494-checkpoint-2026-10-27. ROLLBACK: delete from public.cpl_memory_log where actor = 'memory-s494-checkpoint-2026-10-27';
--   delete from public.cpl_memory where author = 'memory-s494-checkpoint-2026-10-27';
-- Checked first against S493's two failures: related is coalesced to '{}' and every summary is <= 400.
insert into public.cpl_memory (slug, kind, title, summary, detail, plain, tags, status, source, verified_by, verified_at, event_date, author, related)
select x.slug, x.kind, x.title, x.summary, x.detail, x.plain, x.tags, x.status, x.source, x.verified_by,
       case when x.verified_by is null then null else now() end, '2026-10-27'::date, 'memory-s494-checkpoint-2026-10-27', coalesce(x.related, '{}'::text[])
from jsonb_to_recordset($json$[
 {
  "slug": "sierra-map-links-live-2026-10-27",
  "kind": "fact",
  "title": "Sierra gives one MAP link per building college beside each credential a named college could adopt",
  "summary": "Since cpl-chat deploy run 40434182175 (01:44Z 2026-10-27, #2491), a question naming a college reads kb/reference/map_cpl_opportunities_verified.json (raw main, kept an hour) and lists, under each could-adopt or ready-to-adopt credential, up to six building colleges with MAP's page searched for the exhibit. Same IDs as map_links.js for all 2,620 titles; smoke mode 17 passed twice.",
  "tags": [
   "sierra-retrieval-corpus",
   "my-college-action-page",
   "map-link",
   "could-adopt"
  ],
  "source": "cpl-project-tracker#2491; smoke run 40434487810 (both attempts)",
  "detail": null,
  "plain": null,
  "status": "proposed",
  "verified_by": null,
  "related": null
 },
 {
  "slug": "cobi-side-menu-is-navigation-2026-10-27",
  "kind": "fact",
  "title": "COBI's side menu is a labelled nav with aria-current, not a tablist",
  "summary": "axe-core 4.10.2 flagged aria-required-children (critical) on every COBI route: the menu said role=tablist while holding group heads, section links and launchers, and 39 panes named themselves as tabpanels. #2494 made it navigation: no tab roles, aria-current=page on the open button (tabs.js). tests/cobi_nav_semantics.test.js fails a new tab copied with role=tab.",
  "tags": [
   "cobi-dark-mode",
   "accessibility",
   "a11y",
   "nav"
  ],
  "source": "cpl-project-tracker#2494",
  "detail": null,
  "plain": null,
  "status": "proposed",
  "verified_by": null,
  "related": null
 },
 {
  "slug": "pitfall-axe-after-focus-loop-obscured-2026-10-27",
  "kind": "pitfall",
  "title": "axe run after the a11y runner's focus-ring loop reads targets under sticky headers as obscured",
  "summary": "The focus loop focuses every control, which scrolls tables inside their own scrollers; a sticky header left over a row made axe flag the SD Cont. Ed caret (80x27) as an undersized target. scripts/a11y.js runs axe before the loop, as the page settles (#2492); both funding-model targets then pass.",
  "tags": [
   "accessibility",
   "a11y",
   "axe"
  ],
  "source": "cpl-project-tracker#2492",
  "detail": null,
  "plain": null,
  "status": "proposed",
  "verified_by": null,
  "related": null
 },
 {
  "slug": "pitfall-lifted-span-in-cpl-chat-2026-10-27",
  "kind": "pitfall",
  "title": "Tests lift long spans of cpl-chat index.ts as plain JS; a Deno read or object type inside one breaks them",
  "summary": "tests/sierra_credit_disposition and sierra_credit_sources lift index.ts from a CreditStatus comment to the proximity band and evaluate it. A new fetcher there (Deno.env.get, a { at: number } type) failed both with SyntaxError. Keep network fetchers beside fetchStatewideCatalog, outside every lifted span; pure helpers may sit inside with stripTypes-safe types.",
  "tags": [
   "sierra-retrieval-corpus",
   "testing"
  ],
  "source": "cpl-project-tracker#2491 (local run before push)",
  "detail": null,
  "plain": null,
  "status": "proposed",
  "verified_by": null,
  "related": null
 },
 {
  "slug": "risk-smoke-7x-and-9-load-flakes-2026-10-27",
  "kind": "risk",
  "title": "Production smoke modes 7x and 9 each failed once after the MAP-link deploy, neither reachable by it",
  "summary": "Post-deploy smoke run 40434487810: attempt 1 failed only 7x (the ELL IET answer named 1 grantee, needs 2); attempt 2 failed only mode 9 (Search failed, a route-time-limit timeout in the vector search, before the new code runs). 7x names no college, so it never reads the MAP index. library_lessons records 7x failing under overlapping suites.",
  "tags": [
   "sierra-retrieval-corpus",
   "smoke",
   "flake"
  ],
  "source": "cpl-chat-smoke run 40434487810 attempts 1 and 2",
  "detail": null,
  "plain": null,
  "status": "proposed",
  "verified_by": null,
  "related": null
 }
]$json$::jsonb)
  as x(slug text, kind text, title text, summary text, detail text, plain text, tags text[], status text,
       source text, verified_by text, related text[])
on conflict (slug) do nothing;
insert into public.cpl_memory_log (memory_id, actor, action, note, after)
select m.id, 'memory-s494-checkpoint-2026-10-27', 'create', 'S494: ' || m.slug, to_jsonb(m)
from public.cpl_memory m
where m.author = 'memory-s494-checkpoint-2026-10-27'
  and not exists (select 1 from public.cpl_memory_log g where g.memory_id = m.id and g.actor = 'memory-s494-checkpoint-2026-10-27');
select slug, status from public.cpl_memory where author = 'memory-s494-checkpoint-2026-10-27';
