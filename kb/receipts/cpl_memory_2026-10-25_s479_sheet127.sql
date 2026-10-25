-- S479 SkyMilkmaids, 2026-10-25 ~21:55Z. Rule 8 ingest: INSERT-only for one new slug (Sam's ruling on Open Asks Sheet
-- 127), author SkyMilkmaids-S479, logged. Rollback: supersede the slug under actor 'SkyMilkmaids-S479-rollback'.
-- STATUS: APPLIED 2026-10-25 ~21:57Z through the MCP (read back: 1 row, 1 log row).

insert into public.cpl_memory (slug, kind, org, title, summary, plain, tags, affects, source, related, author, event_date, status, verified_by, verified_at)
values
('sam-sheet-127-twelve-2026-10-25', 'decision', 'cpl',
 'Sam confirmed twelve of the thirteen NC-1 credential pairs; ServSafe stays proposed (Sheet 127, twelve)',
 'Open Asks Sheet 127 card 1, 21:48Z 2026-10-25, Sam''s own call: twelve. The twelve rows of funding/nc_credential_crosswalk.json read confirmed (confirmed_by "Sam, Sheet 127, 2026-10-25") and count toward NC-1''s channel 3 while a course stays CDCP; ServSafe stays proposed (held_by). The card measured LA Trade-Tech 0 to 9 of 4, Saddleback 2 to 3 of 7, Cabrillo 34 to 37 of 9.',
 'Sam agreed that twelve credential-to-course pairs count toward the noncredit outcome. The ServSafe pair does not count yet.',
 array['implementation-funding','noncredit','nc-1','crosswalk','decision-sheet','sam']::text[],
 array['funding/nc_credential_crosswalk.json','docs/reference/lanes/implementation-funding.md']::text[],
 'Open Asks Sheet 127 replies/1 (v "twelve"), 2026-10-25T21:48:19Z',
 array[]::text[], 'SkyMilkmaids-S479', '2026-10-25', 'verified', 'Sam (his reply on Sheet 127)', now())
on conflict (slug) do nothing;

insert into public.cpl_memory_log (memory_id, actor, action, note, after)
select m.id, 'SkyMilkmaids-S479', 'create', 'S479 (2026-10-25)', to_jsonb(m) from public.cpl_memory m
where m.slug = 'sam-sheet-127-twelve-2026-10-25'
  and not exists (select 1 from public.cpl_memory_log l where l.memory_id = m.id and l.action = 'create');
