-- S662 SkyQuill, Rule 9 checkpoint: three cpl_memory pitfall rows and their cpl_memory_log create rows.
-- DRAFTED 2026-11-16 ~01:40Z by the checkpoint-docs worker; RUN by the conductor about 01:45Z, 2026-11-16, as one execute_sql
-- statement through the Supabase MCP, then notes the run time here. INSERT-only, status 'proposed'.
-- Earlier S662 receipts (RUN): cpl_memory_s662_exhibit_universe_2026-11-15.sql (PR #3378),
--   cpl_memory_s662_cost_feed_2026-11-16.sql (PR #3379).
-- ROLLBACK:
-- delete from public.cpl_memory_log where memory_id in (select id from public.cpl_memory where slug in ('p-handoff-built-file-never-committed-s662','p-check-generated-exit-code-again-s662','p-cpl-memory-kind-and-summary-cap-s662'));
-- delete from public.cpl_memory where slug in ('p-handoff-built-file-never-committed-s662','p-check-generated-exit-code-again-s662','p-cpl-memory-kind-and-summary-cap-s662');
insert into public.cpl_memory (slug,kind,title,summary,tags,status,source,author,event_date) values
('p-handoff-built-file-never-committed-s662','pitfall','A file rebuilt from every handoff is built at Pages deploy and never committed','kb/status/session_spend.json is rebuilt from every handoff''s Spend: line, so committing it makes parallel handoff PRs conflict (COBIx on #3379). The daily build may not read docs/ (tests/apply_concurrency_test.py, the not_inputs walk), so it cannot be built there either. pages.yml builds it at deploy and .gitignore keeps it out of git.',array['commons','eta-clock','model-spend','pages','generated-files'],'proposed','PR #3379 (67193ef5); COBIx''s review on #3379','SkyQuill (S662)',date '2026-11-16'),
('p-check-generated-exit-code-again-s662','pitfall','A commit landed on a failing check_generated.sh a second time, after S661''s lesson','S662 committed once while scripts/check_generated.sh failed (the dependency map was stale), one session after S661 wrote the same lesson. Run git add -A && bash scripts/check_generated.sh; echo $? and commit only on exit 0, rebuilding what it names. Never pipe it into tail before a commit: the pipe''s status is tail''s.',array['checkpoint','check-generated','ci','dependency-map'],'proposed','S662 session record; docs/commons_lessons.md S662 and S661 entries','SkyQuill (S662)',date '2026-11-16'),
('p-cpl-memory-kind-and-summary-cap-s662','pitfall','cpl_memory has no kind finding, and a summary is capped at 400 characters','A row drafted with kind finding fails the kind check: use fact. A summary over 400 characters fails the length check. Check each summary''s length with a script before running a receipt, and print the lengths rather than the rows.',array['cpl-memory','receipts','checkpoint'],'proposed','S662 receipts cpl_memory_s662_exhibit_universe_2026-11-15.sql and this one','SkyQuill (S662)',date '2026-11-16')
on conflict (slug) do nothing;
insert into public.cpl_memory_log (memory_id, actor, action, note, after)
select m.id, 'SkyQuill-S662', 'create', 'S662 (2026-11-16), Rule 9 checkpoint', to_jsonb(m)
from public.cpl_memory m
where m.slug in ('p-handoff-built-file-never-committed-s662','p-check-generated-exit-code-again-s662','p-cpl-memory-kind-and-summary-cap-s662')
  and not exists (select 1 from public.cpl_memory_log l where l.memory_id = m.id and l.action = 'create');
-- VERIFY:
select slug, kind, status, length(summary) as summary_len from public.cpl_memory
where slug in ('p-handoff-built-file-never-committed-s662','p-check-generated-exit-code-again-s662','p-cpl-memory-kind-and-summary-cap-s662')
order by slug;
