-- cpl_memory row for SkyKinglet (S679), Sam's session, 2026-11-18: his slash-to-and ruling. Applied by
-- supabase-migrate.yml (kb/migrations/.apply), never Execute SQL. INSERT ... ON CONFLICT (slug) DO NOTHING.
-- ROLLBACK: kb/migrations/2026-11-18_s679_slash_to_and_cpl_memory_rows_rollback.sql
insert into public.cpl_memory (slug,kind,title,summary,tags,status,source,verified_by,verified_at,author,event_date) values
('sam-slash-joining-words-is-and-2026-11-18','decision','A slash joining words in a canonical credential title is written "and" (Sam, 2026-11-18)','Sam, in session S679, 2026-11-18: "I believe I replaced the / with and to avoid formatting issues and should be a general rule for other titles. UA Plumbers and Pipefitters". A slash joining words in a canonical title becomes "and"; a code slash and an official name''s slash stay (kb/slash_titles.py). The 80 renames ride rename plan slash-to-and-2026-11-18; 7 titles whose spaced slash stands between two whole names are held for a person, and Medical/Surgical keeps its slash as the nursing term (the S679 conductor on COBIx''s review of #3479).',array['cer-procedures','credential-naming','exhibits','sam'],'verified','Sam in session S679, 2026-11-18; the line between word, code and official-name slashes drawn by the S679 conductor for Sam to revise','Sam Lee',now(),'SkyKinglet (S679)',date '2026-11-18')
on conflict (slug) do nothing;

insert into public.cpl_memory_log (memory_id, actor, action, note, after)
select id, 'SkyKinglet (S679)', 'create', 'S679 (2026-11-18)', to_jsonb(m)
from public.cpl_memory m where m.slug in ('sam-slash-joining-words-is-and-2026-11-18')
  and not exists (select 1 from public.cpl_memory_log l where l.memory_id = m.id and l.action = 'create');

select slug, kind, status, length(summary) as summary_len from public.cpl_memory
where slug in ('sam-slash-joining-words-is-and-2026-11-18');
