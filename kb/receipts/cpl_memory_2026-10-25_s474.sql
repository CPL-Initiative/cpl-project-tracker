-- S474 SkyMariposa, 2026-10-25 ~10:25Z. Rule 8 ingest through execute_sql: INSERT-only, one new slug, author SkyMariposa-S474,
-- proposed, logged. Rollback: supersede by slug under actor 'SkyMariposa-S474-rollback'.
insert into public.cpl_memory (slug, kind, org, title, summary, plain, tags, affects, source, related, author, event_date, status)
values ('archive-numbered-parts-keep-exemptions-2026-10-25', 'procedure', 'cpl', 'An oversized archive splits into numbered parts that keep the lint exemptions (S474)',
'S474: roadmap_archive.md (747 KB) keeps its newest rotations at both ends and moves the body verbatim to roadmap_archive_2.._6; cpl_funding_lessons_archive splits by date into parts 1-3, old part 2 now part 4. kb/_docs_audit.py is_archive matches _archive(_N)?.md, so a part keeps the house_voice and rule_citation_drift exemptions. oversized_doc 0.',
'Archives over 150 KB split into numbered parts; the lint treats every part as an archive.',
array['docs-lint','oversized-doc','archive']::text[], array['kb/_docs_audit.py','docs/roadmap_archive.md','docs/cpl_funding_lessons_archive.md']::text[], 'cpl-project-tracker#2441',
array[]::text[], 'SkyMariposa-S474', '2026-10-25', 'proposed')
on conflict (slug) do nothing;
insert into public.cpl_memory_log (memory_id, actor, action, note, after)
select id, 'SkyMariposa-S474', 'create', 'S474 (2026-10-25)', to_jsonb(m) from public.cpl_memory m
where m.slug = 'archive-numbered-parts-keep-exemptions-2026-10-25'
  and not exists (select 1 from public.cpl_memory_log l where l.memory_id = m.id and l.action = 'create');
