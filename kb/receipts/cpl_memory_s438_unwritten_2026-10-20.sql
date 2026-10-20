-- S438 SkySumac, 2026-10-20: three cpl_memory rows, UNWRITTEN. Three execute_sql attempts (15:36Z, 15:38Z,
-- 16:44Z) timed out at 60s before reaching the database (no active query in pg_stat_activity; reads worked).
-- The next session runs this as written, through the Supabase MCP, in ONE execute_sql call, then deletes
-- the "UNWRITTEN" note from handoff 439. Idempotent: on conflict do nothing, and the log insert is guarded.
insert into public.cpl_memory (slug, kind, org, title, summary, detail, plain, tags, source, related, status, author, event_date)
select x.slug, x.kind, 'cpl', x.title, x.summary, x.detail, x.plain, x.tags, x.source, '{}'::text[], x.status, 'SkySumacS438', x.event_date
from jsonb_to_recordset($json$[
 {"slug":"sam-grok-api-billing-district-card-2026-10-20","kind":"fact","title":"Grok reader waits on billing",
  "summary":"Sam, 2026-10-20 ~16:30Z (S438): \"I guess I'll have another delay on the Grok key since we have to pay for that separately from the grok account--need to get the account moved to the RCCD District credit card which will take some time.\" The Grok subscription covers the chat app; the xAI API key is billed separately. The second reader stays parked until then.",
  "detail":"Once the key exists: Sam sets XAI_API_KEY and XAI_MODEL as Edge Function secrets on the Work Plan project; a session deploys program-requirements-extract (live is Supabase version 10 of 2026-10-15, before the provider switch of #2246) and dispatches second-reader.yml with college=Cañada College, then Taft and San Joaquin Delta.",
  "plain":"We built a way for a second AI (Grok) to double-check the program records the first reading got wrong, but it needs a paid developer key, and the district has to put that account on its credit card first.",
  "tags":["program-requirements-harvest","second-reader","grok","xai","blocked","s438"],"source":"Sam, in chat, Session 438, 2026-10-20 ~16:30Z","status":"verified","event_date":"2026-10-20"},
 {"slug":"sam-annual-goals-no-total-fold-gray-2026-10-20","kind":"decision","title":"Annual Goals: no Total, folded",
  "summary":"Sam, 2026-10-20 (S438): drop the Annual Goals Total column (most goals are cumulative, so the sum mis-states the 2030 target); center the numbers; auto-collapse everything under each sub-activity's title so its three rows stand at single height; delete the blue outline on editable cells (\"the thin blue outlines look like someone didn't finish the formatting\"); add links to the Activity cards. Built in #2291, live after dashboard run 619.",
  "detail":"The editor still sends the ladder's sum to workplan_goals.total; only the display dropped it. Links: #activities-projects/card-<id> and #activities-projects/activity-<N>, landed by card_actions.js clear of the sticky actions bar.",
  "plain":"On the Annual Goals page, adding up five years of running totals made 25 features look like 78, so the Total column is gone, and each goal now shows as three short rows with its notes tucked behind a Details link.",
  "tags":["workplan-goals","annual-goals","ui","ruling","s438"],"source":"Sam, in chat, Session 438, 2026-10-20 ~14:40-15:05Z; cpl-project-tracker#2291","status":"verified","event_date":"2026-10-20"},
 {"slug":"context-meter-denominator-stale-2026-10-20","kind":"pitfall","title":"Context meter divides by 786k",
  "summary":"S438, 2026-10-20: kb/_context_budget.py reported 512,952 of 786,077 while the app's Context panel showed 542.4k of a 1M window with 420k until auto-compact. The meter's denominator is stale, so its Rule 9a warnings fire early; the panel is the authority until the meter reads the window from the session.",
  "detail":"Sam found the panel in the session sidebar (Context, with Messages, Memory files, MCP tools and the autocompact buffer broken out).",
  "plain":"The repo's own gauge of how full a session's memory is assumes a smaller limit than the app now has, so it warns too early.",
  "tags":["context-pressure","rule-9a","pitfall","s438"],"source":"Session 438, the meter beside Sam's screenshot of the Context panel, 2026-10-20 ~16:40Z","status":"proposed","event_date":"2026-10-20"}
]$json$::jsonb) as x(slug text, kind text, title text, summary text, detail text, plain text, tags text[], source text, status text, event_date date)
on conflict (slug) do nothing;
insert into public.cpl_memory_log (memory_id, actor, action, note, after)
select id, 'SkySumacS438', 'create', 'S438 checkpoint write (run from the receipt)', to_jsonb(m)
from public.cpl_memory m where m.slug in ('sam-grok-api-billing-district-card-2026-10-20','sam-annual-goals-no-total-fold-gray-2026-10-20','context-meter-denominator-stale-2026-10-20')
and not exists (select 1 from public.cpl_memory_log l where l.memory_id = m.id and l.action = 'create');
select m.slug, m.status, (select count(*) from public.cpl_memory_log l where l.memory_id = m.id and l.action='create') as creates
from public.cpl_memory m where m.slug in ('sam-grok-api-billing-district-card-2026-10-20','sam-annual-goals-no-total-fold-gray-2026-10-20','context-meter-denominator-stale-2026-10-20');
