-- S473 SkyClarkia, 2026-10-25 ~10:00Z. Rule 8 ingest through execute_sql: INSERT-only, one new slug, author SkyClarkia-S473,
-- proposed, logged. Rollback: supersede by slug under actor 'SkyClarkia-S473-rollback'.
insert into public.cpl_memory (slug, kind, org, title, summary, plain, tags, affects, source, related, author, event_date, status)
values ('nc-channel3-crosswalk-proposed-2026-10-25', 'decision', 'cpl', 'NC-1 channel 3 counts only confirmed crosswalk rows; 13 proposed wait on Sheet 127 (S473)',
'S473: funding/nc_credential_crosswalk.json pairs an exhibit with CDCP courses naming its credential. The builder counts a row only when status=confirmed and a course title_norm is still CDCP. 13 rows proposed (Cabrillo 3, LATTC 9, Saddleback 1); confirming moves LATTC 0 to 9 of 4, so it holds for Sam (Open Asks Sheet 127).',
'Channel 3 is built and off until Sam confirms the pairs.',
array['funding','implementation-funding','noncredit','scenario-4','nc-1']::text[], array['funding/_build_funding_performance.py','funding/nc_credential_crosswalk.json']::text[], 'S473 build',
array['nc-builder-counts-emitted-2026-10-25','sam-sheet-113-rulings-2026-10-22']::text[], 'SkyClarkia-S473', '2026-10-25', 'proposed')
on conflict (slug) do nothing;
insert into public.cpl_memory_log (memory_id, actor, action, note, after)
select id, 'SkyClarkia-S473', 'create', 'S473 (2026-10-25)', to_jsonb(m) from public.cpl_memory m
where m.slug = 'nc-channel3-crosswalk-proposed-2026-10-25'
  and not exists (select 1 from public.cpl_memory_log l where l.memory_id = m.id and l.action = 'create');
