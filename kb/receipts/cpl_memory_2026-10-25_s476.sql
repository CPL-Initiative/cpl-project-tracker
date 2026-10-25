-- S476 SkyFiddleneck, 2026-10-25 ~12:30Z. Rule 8 ingest through execute_sql: INSERT-only, one new slug, author SkyFiddleneck-S476,
-- proposed, logged. Rollback: supersede by slug under actor 'SkyFiddleneck-S476-rollback'.
insert into public.cpl_memory (slug, kind, org, title, summary, plain, tags, affects, source, related, author, event_date, status)
values ('pitfall-postgrest-8s-ignores-function-timeout-2026-10-25', 'pitfall', 'cpl', 'A PostgREST RPC is cancelled at the authenticator''s 8 s; a function-level statement_timeout does not lift it (S476)',
'cpl_funding_nc_counts() returned HTTP 500 in the 2026-10-25 11:40Z daily run: "canceling statement due to statement timeout". The authenticator''s 8 s applies; the function''s own 60 s does not extend a running statement. Warm 1.1 s, cold 6.1 s. The builder retries a 5xx (#2443).',
'A slow RPC called through the REST API stops at 8 seconds no matter what the function says; retry cold calls or make the SQL faster.',
array['supabase','postgrest','timeout','funding','noncredit','pitfall']::text[], array['funding/_build_funding_performance.py','kb/supabase_cpl_funding_nc_counts.sql']::text[], 'cpl-project-tracker#2443; Supabase postgres_logs 2026-10-25T11:40:38Z',
array['nc-builder-counts-emitted-2026-10-25']::text[], 'SkyFiddleneck-S476', '2026-10-25', 'proposed')
on conflict (slug) do nothing;
insert into public.cpl_memory_log (memory_id, actor, action, note, after)
select id, 'SkyFiddleneck-S476', 'create', 'S476 (2026-10-25)', to_jsonb(m) from public.cpl_memory m
where m.slug = 'pitfall-postgrest-8s-ignores-function-timeout-2026-10-25'
  and not exists (select 1 from public.cpl_memory_log l where l.memory_id = m.id and l.action = 'create');
