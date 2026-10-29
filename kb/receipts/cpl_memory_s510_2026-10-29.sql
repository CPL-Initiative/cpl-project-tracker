-- S510 (SkyWineberry, the CPL Queue routine), 2026-10-29: one pitfall from the Library's contrast check.
-- APPLIED 2026-10-29 through the Supabase MCP; read back 1 row, 1 log row.
-- INSERT-only under author/actor memory-s510-2026-10-29. ROLLBACK:
--   delete from public.cpl_memory_log where actor = 'memory-s510-2026-10-29';
--   delete from public.cpl_memory where author = 'memory-s510-2026-10-29';
insert into public.cpl_memory (slug, kind, title, summary, detail, plain, tags, status, source, verified_by, verified_at, event_date, author, related)
select x.slug, x.kind, x.title, x.summary, x.detail, x.plain, x.tags, x.status, x.source, x.verified_by,
       case when x.verified_by is null then null else now() end, x.event_date::date, 'memory-s510-2026-10-29', coalesce(x.related, '{}'::text[])
from jsonb_to_recordset($json$[
 {
  "slug": "pitfall-deck-contrast-against-what-words-sit-on-2026-10-29",
  "kind": "pitfall",
  "title": "A deck's contrast is measured against the shape the words sit on, never the slide's background alone",
  "summary": "Measured against each slide's background alone, S510's first contrast check reported 72 failures on five team decks, mostly white on white: our decks lay text boxes over filled shapes. Reading the topmost shape beneath the text, layout shapes included, left 6, each confirmed on a render.",
  "detail": "library_remediate.js (contrastPptx, groundOf). Confirm every remaining finding on a render: soffice --headless --convert-to pdf, then pdftoppm. Text over a picture, chart, table, gradient or pattern is named for a person, never measured. cpl-project-tracker#2543; docs/library_lessons.md, S510.",
  "tags": ["library", "remediation", "accessibility", "contrast"],
  "status": "proposed",
  "source": "S510, cpl-project-tracker#2543",
  "verified_by": null,
  "event_date": "2026-10-29",
  "plain": null,
  "related": ["pitfall-remediation-test-on-real-team-files-2026-10-29"]
 }
]$json$::jsonb) as x(slug text, kind text, title text, summary text, detail text, plain text, tags text[], status text, source text, verified_by text, event_date text, related text[])
on conflict (slug) do nothing;
insert into public.cpl_memory_log (memory_id, actor, action, note, after)
select m.id, 'memory-s510-2026-10-29', 'create', 'S510: ' || m.slug, to_jsonb(m)
from public.cpl_memory m
where m.author = 'memory-s510-2026-10-29'
  and not exists (select 1 from public.cpl_memory_log g where g.memory_id = m.id and g.actor = 'memory-s510-2026-10-29');
select slug, status from public.cpl_memory where author = 'memory-s510-2026-10-29';
