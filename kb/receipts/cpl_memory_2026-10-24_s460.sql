-- S460 SkyFremontia, 2026-10-24, the checkpoint: Rule 8 ingest of this run's durable learnings. INSERT-only,
-- idempotent on slug, author s460-skyfremontia. Rollback: delete the log rows (actor s460-skyfremontia), then the rows by slug.
-- APPLIED: through the Supabase MCP (execute_sql, INSERT-only passes the guard), 2026-10-24 ~02:22Z; the three rows read back as proposed.
insert into public.cpl_memory (slug, kind, title, summary, detail, plain, tags, status, source, verified_by, verified_at, event_date, author, related)
select x.slug, x.kind, x.title, x.summary, x.detail, x.plain, x.tags, x.status, x.source, x.verified_by, now(), '2026-10-24'::date, 's460-skyfremontia', x.related
from jsonb_to_recordset($json$[
 {"slug":"writer-module-built-2026-10-24","kind":"milestone",
  "title":"The one writer module (cpl_writer.js) holds the voice, the words, the audiences, the one model and the proxy call; comms.js, activity_summaries.js and report_generator.js are its first consumers (Sam's Sheet 118 ruling 5)",
  "summary":"Built by S460 on 2026-10-24 (cpl-project-tracker#2399, then #2401 and the report-generator port): the rules as named parts, eleven AUDIENCES and six REPORT_AUDIENCES, MODEL claude-opus-5-5 (an unversioned alias named nowhere else), system({ role, extra, omit }) and draft(prompt, opts) over the page's proxy URL. Each consumer keeps only what is its own and names no model.",
  "detail":"Static in both HTMLs before report_generator.js (Rule 4); in plain node it attaches to globalThis. tests/cpl_writer.test.js pins each rule once in the rulings' words, the one model, the audiences, system()'s order, draft()'s request and every rejection, and lists the consumers. Remaining ports, one PR each: college_report_generator.js, annual_report.js, raci.js, credential_reference.js, quickstart.js (docs/reference/lanes/communications.md Next).",
  "plain":"Every COBI surface that asks Claude to write now shares one set of writing rules and one model, kept in one file, instead of each carrying its own copy.",
  "tags":["communications","writer","house-voice","cobi"],"status":"proposed","source":"cpl-project-tracker#2399; docs/reference/lanes/communications.md; docs/communications_lessons.md","verified_by":null,
  "related":["sam-sheet-118-rulings-2026-10-23","cobi-writing-surfaces-twelve-with-their-own-rules-2026-10-23"]},
 {"slug":"shared-browser-module-attaches-to-window-or-globalthis-2026-10-24","kind":"procedure",
  "title":"A shared browser module the tests load two ways attaches to window or globalThis, and a consumer reads whichever exists",
  "summary":"The repo's tests require() a consumer in plain node for its pure helpers and inject it into jsdom for its UI. cpl_writer.js sets root.CPL_WRITER where root is window or globalThis; a consumer reads whichever exists. A jsdom test injects the shared module's source before the consumer's; a node test requires it first (S460).",
  "detail":"The first port of activity_summaries.js threw at require() because the module looked only at window. The fix is in the shared module's root and the consumer's lookup, not in the tests' order alone. A mock proxy answer carries type: 'text' on its blocks and a json rejection on a failing response, as the API and the writer's parser expect.",
  "plain":"A piece of shared code has to be findable both in a browser and in the test runner, or the tests that load a file directly break.",
  "tags":["testing","jsdom","writer","procedure"],"status":"proposed","source":"cpl-project-tracker#2401; docs/communications_lessons.md","verified_by":null,"related":["writer-module-built-2026-10-24"]},
 {"slug":"dependency-map-loses-an-edge-when-a-call-moves-into-a-shared-module-2026-10-24","kind":"pitfall",
  "title":"When a call moves into a shared module, the dependency map loses the caller's edge until a seed names it",
  "summary":"kb/_build_dependency_map.py attributes the drafting proxy host by the CPL_REPORT_PROXY_URL literal in each module; comms.js stopped naming it when its draft moved into cpl_writer.js, and the letters tab left the proxy's consumer list (S460). A SEEDS entry anchored on the consumer's W.draft( call restores the edge; each port adds one.",
  "detail":"The seeds carry a 'why' and go stale loudly (a missing anchor drops the edge with a warning). The same blindness S209 fixed for raci's helper and the college_briefing seed for's per-reader table choice: a literal scan cannot see a call made on a module's behalf.",
  "plain":"Our map of who uses what is read from the code; when a tab hands its request to shared code, the map needs a note saying so, or the tab looks like it stopped using the service.",
  "tags":["dependency-map","generated-files","pitfall"],"status":"proposed","source":"cpl-project-tracker#2399 kb/_build_dependency_map.py SEEDS; docs/communications_lessons.md","verified_by":null,"related":["writer-module-built-2026-10-24"]}
]$json$::jsonb) as x(slug text, kind text, title text, summary text, detail text, plain text, tags text[], status text, source text, verified_by text, related text[])
on conflict (slug) do nothing;

insert into public.cpl_memory_log (memory_id, actor, action, note, after)
select m.id, 's460-skyfremontia', 'create', 'S460 checkpoint ingest', to_jsonb(m)
from public.cpl_memory m where m.author = 's460-skyfremontia'
  and not exists (select 1 from public.cpl_memory_log l where l.memory_id = m.id and l.actor = 's460-skyfremontia');

select slug, status from public.cpl_memory where author = 's460-skyfremontia' order by slug;
