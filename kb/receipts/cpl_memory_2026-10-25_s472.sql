-- S472 SkyBrodiaea, 2026-10-25 ~08:35Z. Rule 8 ingest through execute_sql: INSERT-only, one new slug, author SkyBrodiaea-S472,
-- proposed, logged. Rollback: supersede by slug under actor 'SkyBrodiaea-S472-rollback'.
insert into public.cpl_memory (slug, kind, org, title, summary, plain, tags, affects, source, related, author, event_date, status)
values ('memo-noncredit-section-2026-10-25', 'milestone', 'cpl', 'The funding memo prints the noncredit outcomes under Scenario 4 (S472)',
'S472: under ncLane outcomes every funding document prints Noncredit Outcomes after the credit priorities: passage memo_noncredit, each outcome from ncOutcomes with its share, the reported figure; outcome strategies join Recommended Strategies. Origination unchanged. Guard tests/cpl_funding_memo_nc_outcomes.test.js.',
'The funding memo now tells a college what its noncredit share asks of it.',
array['funding','implementation-funding','noncredit','scenario-4','memo']::text[], array['cpl_funding.js']::text[], 'S472 build, PR #2439',
array['nc-builder-counts-emitted-2026-10-25','sam-sheet-113-rulings-2026-10-22']::text[], 'SkyBrodiaea-S472', '2026-10-25', 'proposed')
on conflict (slug) do nothing;
insert into public.cpl_memory_log (memory_id, actor, action, note, after)
select id, 'SkyBrodiaea-S472', 'create', 'S472 (2026-10-25)', to_jsonb(m) from public.cpl_memory m
where m.slug = 'memo-noncredit-section-2026-10-25'
  and not exists (select 1 from public.cpl_memory_log l where l.memory_id = m.id and l.action = 'create');
