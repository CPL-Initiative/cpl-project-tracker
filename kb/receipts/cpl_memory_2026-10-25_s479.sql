-- S479 SkyMilkmaids (opened by hand by Sam), 2026-10-25 ~17:50Z. Rule 8 ingest: INSERT-only for one new slug, author
-- SkyMilkmaids-S479, logged. Rollback: supersede the slug under actor 'SkyMilkmaids-S479-rollback'.
-- STATUS: APPLIED 2026-10-25 ~17:52Z through the MCP (read back: 1 row, 1 log row). A first try failed the 400-character
-- summary check and wrote nothing.

insert into public.cpl_memory (slug, kind, org, title, summary, plain, tags, affects, source, related, author, event_date, status)
values
('procedure-coordinator-guide-audit-from-drive-2026-10-25', 'procedure', 'cpl',
 'The CPL Coordinator Guide audit reads the guide from the Drive; its first report is in the vault (S479)',
 'Sheet 121 card 2 closed. The guide''s .docx files sit in the Drive folder "CPL Coordinator Getting Started Guides"; CPLBrain coordinator-guide/audit_workflow.js reads them by Drive id (args.scratch), so no upload. S479 run: 132 unique findings, 10 of 14 checked conflicts stood. Report 20261025_Coordinator_Guide_Audit.md: rebuild the Phase 2 workflow first.',
 'The Coordinator Guide audit ran from the copies on the Drive. Its report says to rebuild the guide''s student workflow first.',
 array['coordinator-guide','library','title-5','ess-25-82','sheet-121','procedure']::text[],
 array['CPLBrain/04-projects/cpl-initiative/coordinator-guide/audit_workflow.js']::text[],
 'S479 Workflow run wf_6ed1674c-7a1; samueltlee/CPLBrain#479',
 array[]::text[], 'SkyMilkmaids-S479', '2026-10-25', 'proposed')
on conflict (slug) do nothing;

insert into public.cpl_memory_log (memory_id, actor, action, note, after)
select m.id, 'SkyMilkmaids-S479', 'create', 'S479 (2026-10-25)', to_jsonb(m) from public.cpl_memory m
where m.slug = 'procedure-coordinator-guide-audit-from-drive-2026-10-25'
  and not exists (select 1 from public.cpl_memory_log l where l.memory_id = m.id and l.action = 'create');
