-- S332 (SkyBridge), 2026-10-05: Sam's ruling that apply_migration joins the allow list. Written through
-- execute_sql under the guard's cpl_memory carve-out (no prompt). Rollback: supersede the row by slug
-- under actor 'SkyBridge-s332-rollback'.
insert into public.cpl_memory (slug, title, kind, summary, detail, plain, tags, affects, source, author, event_date, status)
values ('sam-apply-migration-allow-listed-2026-10-05',
 'Sam: apply_migration joins the allow list; the decision sheet and the receipt are the whole gate on a session''s database write',
 'decision',
 'Sam, 2026-10-05 (S332), after six prompts for one write he had approved on open-asks sheet 38: "Add apply migrations to allow list". The rule resolves every apply_migration call without a prompt or the auto-mode check, so a session writes only on his go (a sheet card or his word) with a committed receipt that rolls it back. Memory rows stay on execute_sql''s cpl_memory carve-out.',
 'scripts/install_prompt_guards.py carries the rule with his ruling beside it; tests/install_prompt_guards_test.py names it the one ruled exception. Installed in S332''s session root with --apply. A new session gets it once the environment''s setup script is edited at claude.ai/code and the snapshot rebuilds. Supersedes the "auto-mode check denies re-routing" half of supabase-writes-wait-on-sams-go-2026-10-05 for apply_migration.',
 'Database updates Sam has approved no longer ask him a second time; his approval on a decision sheet is the check.',
 array['supabase','rule-10','permissions','decision-sheet','process'], array['scripts/install_prompt_guards.py','tests/install_prompt_guards_test.py','docs/reference/approval_prompt_hooks.md'],
 'Sam, in session S332 (2026-10-05)', 'SkyBridge-s332', '2026-10-05', 'verified')
on conflict (slug) do nothing;
insert into public.cpl_memory_log (memory_id, actor, action, note, after)
select id, 'SkyBridge-s332', 'create', 'Sam''s ruling: apply_migration allow-listed', to_jsonb(m)
from public.cpl_memory m where m.slug = 'sam-apply-migration-allow-listed-2026-10-05'
 and not exists (select 1 from public.cpl_memory_log l where l.memory_id = m.id and l.action = 'create');
