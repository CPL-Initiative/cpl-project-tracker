-- S344 SkyWaypoint (scheduled run), 2026-10-08. Rule 8 ingest at checkpoint: the five pilot procedures (milestone) and
-- apply_migration's timeouts on the sheet 49 library update (pitfall). INSERT-only, idempotent on slug.
-- Rollback: delete the log rows (actor s344-skywaypoint), then the rows by slug.
insert into public.cpl_memory (slug, kind, title, summary, detail, plain, tags, status, source, verified_by, verified_at, event_date, author, related)
select x.slug, x.kind, x.title, x.summary, x.detail, x.plain, x.tags, x.status, x.source, x.verified_by,
       null, '2026-10-08'::date, 's344-skywaypoint', x.related
from jsonb_to_recordset($json$[
 {"slug":"pilot-procedures-written-2026-10-08","kind":"milestone",
  "title":"Every pilot college has a reading procedure (7 of 118)",
  "summary":"S344 wrote v1 procedure records for Irvine Valley, San Diego Miramar, Mt. San Antonio, Riverside City and West Los Angeles (2026-10-08 15:13Z), joining Cerritos and Santa Monica: 7 of 118 colleges. Each holds only what the pilot's reads settled and names no catalog step, so capture is unchanged.",
  "detail":"Written through program_source_procedure_set, guarded on none; receipt kb/receipts/program_source_procedure_pilot5_2026-10-08_s344.sql (md5s and rollback). Sources: lessons S323-S342, kb/program_requirements_pilot/sources and records, registry_read.json. Map reads followed (run 37799874023): programmap.wlac.edu answers 403 like every mapper host (West LA v2, 09ff5b42); Riverside City's SEE PROGRAM MAPS leads to rcc.edu/programs/index.html; Mt. San Antonio's schedule page says the catalog shows the suggested order of classes, and the LVN-to-RN page prints none.",
  "plain":"Each of the seven colleges the harvest has read now has a written record of how to read its catalog: where the requirements are printed, which pages refuse the reader, and what is still open.",
  "tags":["program-requirements-harvest","roep","procedures"],"status":"proposed",
  "source":"S344 SkyWaypoint, PR #1906","verified_by":null,
  "related":["progress-view-built-2026-10-07"]},
 {"slug":"apply-migration-timeout-cpl-library-2026-10-08","kind":"pitfall",
  "title":"apply_migration timed out three times on the sheet 49 library update",
  "summary":"The guarded cpl_library update that makes Open Asks Sheet 49 the series' current version timed out in apply_migration three times on 2026-10-08 (twice in the library side session, once in S344) and wrote nothing; no lock was waiting. execute_sql refuses an update (the repo's Supabase guard). Sam can run kb/receipts/cpl_library_open_asks_sheet49_2026-10-08.sql in the SQL editor.",
  "detail":"S344 read the row fresh (version 48, url FWGJ2uNEGB1RrhMPrFsaCJ, 21 versions), ran the receipt's statement in apply_migration (60 s timeout), and read back version 48. pg_stat_activity showed one short PostgREST call and no waiting lock. The same session's execute_sql calls to program_source_procedure_set (a security-definer function) returned at once, so the timeout belongs to apply_migration's path rather than the database.",
  "plain":"One small database update for the team's library listing keeps timing out through the tool sessions use, so Sam may need to run it by hand.",
  "tags":["library","supabase","mcp","open-asks"],"status":"proposed",
  "source":"S344 SkyWaypoint tool results, 2026-10-08; handoff 344 (library side session)","verified_by":null,
  "related":[]}
]$json$::jsonb)
  as x(slug text, kind text, title text, summary text, detail text, plain text, tags text[], status text,
       source text, verified_by text, related text[])
on conflict (slug) do nothing;

insert into public.cpl_memory_log (memory_id, actor, action, note, after)
select m.id, 's344-skywaypoint', 'create', 'S344 checkpoint ingest', to_jsonb(m)
from public.cpl_memory m
where m.author = 's344-skywaypoint'
  and not exists (select 1 from public.cpl_memory_log l where l.memory_id = m.id and l.action = 'create');
