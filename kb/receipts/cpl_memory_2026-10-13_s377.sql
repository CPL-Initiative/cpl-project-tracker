-- S377 SkySequoia, 2026-10-13. Rule 8 ingest through execute_sql: INSERT-only, idempotent on slug,
-- each row logged to cpl_memory_log (actor SkySequoiaS377).
-- Rollback: delete from public.cpl_memory where author = 'SkySequoiaS377';
insert into public.cpl_memory (slug, kind, org, title, summary, detail, plain, tags, source, related, status, author)
select x.slug, x.kind, 'cpl', x.title, x.summary, x.detail, x.plain, x.tags, x.source, coalesce(x.related, '{}'::text[]), x.status, 'SkySequoiaS377'
from jsonb_to_recordset($json$[
 {"slug": "activity-summaries-refresh-shipped-2026-10-13", "kind": "milestone", "title": "Refresh summaries live on the Activities tab", "summary": "activity_summaries.js (#2059, run 583): each Activities-tab header says how current its summary is; a signed-in reviewer's Refresh summaries drafts each Activity from its sub-activities through the report proxy and posts one only on its own Post (item_updates activity:N, provenance in raw). The header's Update link is retired.", "detail": "Inputs per sub-activity (home field, tabled out): three newest updates, else latest_update; status, percent, 2025-26 goal and current. raw: drafter, approver, model, edited flag, original draft, source ids. Sam's ruling: summaries are drafts he approves before they post (sam-annual-goals-rulings-2026-10-12). Team phrase neither drafts nor posts (reviewer magic-link only). A failed draft leaves the field open to write by hand. DR-20 names the writer. tests/activity_summaries.test.js (38); checked in Chromium at 1280 and 390. No summary posted with it as of 02:40Z.", "plain": "The Activities page now shows, under each of the four Activities, when its summary was last updated and how much has happened since. A signed-in reviewer can have Claude draft fresh summaries from the sub-activity updates, edit them, and post each one only by choosing to.", "tags": ["workplan", "annual-goals", "activities", "item-updates", "milestone"], "source": "S377 SkySequoia; cpl-project-tracker#2059; docs/workplan_annual_goals_lessons.md", "related": ["sam-annual-goals-rulings-2026-10-12"], "status": "proposed"},
 {"slug": "apply-migration-down-read-schema-migrations-2026-10-13", "kind": "procedure", "title": "Read schema_migrations before retrying apply_migration", "summary": "After an apply_migration timeout, read: did the object land (to_regclass, pg_proc), does anything hold a lock (pg_stat_activity), and the newest supabase_migrations.schema_migrations row. Nothing landed, no lock, no migration since a known success: the tool is down. Stop retrying; hand the committed file to Sam as a paste.", "detail": "2026-10-12/13: twelve timeouts across S374, S375, S377 on the 9 KB Move SQL, including a lone create table; the last row was add_projects_count_note at 23:19Z, after an 18,000-character migration at 21:51Z, so size was not the cause. KB note: docs/kb-notes/playbook-when-apply-migration-times-out-read-the-migrations-table.md.", "plain": "When the database tool stops answering, one quick look at its own history shows whether it has worked for anyone lately. If it has not, trying again wastes time; the change goes to Sam to paste.", "tags": ["supabase", "mcp", "migration", "procedure"], "source": "S377 SkySequoia tool results; KB note playbook-when-apply-migration-times-out-read-the-migrations-table", "related": ["apply-migration-timeouts-2026-10-13", "apply-migration-timeouts-2026-10-12"], "status": "proposed"},
 {"slug": "source-test-indexof-checks-only-first-match-2026-10-13", "kind": "pitfall", "title": "A source-text check reads only the first match", "summary": "A test pinning a code shape with indexOf checks only the first occurrence. A later change that adds a second instance above it (the Move dialog's Cancel-then-Move in workplan_goals.js) fails the test without naming the new code. Check every occurrence, in order.", "detail": "Shard 3 of #2056 failed on workplan_goals_editor_first_light (d). Fixed in 656e14f: Move leads, and the check walks every Submit/Cancel pair.", "plain": "An automatic check that looks for one pattern in the code only looked at the first place it appeared. A new dialog added earlier in the file broke it, and the failure message pointed at the old dialog instead of the new one.", "tags": ["testing", "pitfall", "workplan", "annual-goals"], "source": "S377 SkySequoia; cpl-project-tracker#2056 commit 656e14f", "status": "proposed"}
]$json$::jsonb)
  as x(slug text, kind text, title text, summary text, detail text, plain text, tags text[], source text, related text[], status text)
on conflict (slug) do nothing;
insert into public.cpl_memory_log (memory_id, actor, action, note, after)
select m.id, 'SkySequoiaS377', 'create', 'checkpoint auto-write', to_jsonb(m) from public.cpl_memory m
where m.author = 'SkySequoiaS377' and not exists (select 1 from public.cpl_memory_log l where l.memory_id = m.id and l.actor = 'SkySequoiaS377');
select m.slug, m.kind, m.status, (select count(*) from public.cpl_memory_log l where l.memory_id = m.id) as logs
from public.cpl_memory m where m.author = 'SkySequoiaS377' order by m.created_at;

-- Added ~03:53Z: Sam ran Sheet 72 cards 2 and 3; read back, verified (he ran them; the session read them back).
-- Supersedes S375's workplan-move-function-built-not-applied-2026-10-13 (a session row, now false). Logged: create + supersede.
-- Rollback: update public.cpl_memory set status = 'proposed', superseded_by = null
--             where slug = 'workplan-move-function-built-not-applied-2026-10-13';
--           delete from public.cpl_memory where slug = 'sheet-72-pastes-applied-2026-10-13';
with ins as (
  insert into public.cpl_memory (slug, kind, org, title, summary, detail, plain, tags, source, related, status, author, verified_by, verified_at, event_date)
  values ('sheet-72-pastes-applied-2026-10-13', 'milestone', 'cpl', 'Sam pasted Sheet 72 cards 2 and 3: 3.9 added, 1.1.2 is 4.2.1, Move function live',
   'Sam ran Open Asks Sheet 72 cards 2 and 3 in the SQL editor (~03:50Z 2026-10-13). Read back 03:51Z: 3.9 added (Goal 0/2/4/4/4, Stretch 0/4/8/8/8, Activity 3 home); 1.1.2 is 4.2.1 (Activity 4 home, Activity 1 kept, RACI and update moved, no table holds 1.1.2); workplan_move_sub_activity live, anon false, authenticated true.',
   'workplan_id_moves exists with RLS on. Card 1 (course_outcomes, the program requirements queue) not run. The Move control PR #2056 merges on test after this; apply_migration itself was still down (nothing newer than 23:19Z 2026-10-12 in schema_migrations before Sam''s paste).',
   'Sam ran the two database changes himself. The Futuro Behavioral Healthcare project is now 3.9, the AI apprenticeship tools project now sits under the Apprenticeship Sprint as 4.2.1, and the Move button''s database routine is switched on for signed-in reviewers.',
   array['workplan','annual-goals','move','sam-action','milestone'],
   'Sam in S377 chat ("Ran both 72 cards"), read back by S377 SkySequoia; receipts kb/receipts/workplan_2026-10-12_s372_add_3_9_move_1_1_2.sql and kb/supabase_workplan_move.sql',
   array['sam-sheet-72-rulings-2026-10-13','workplan-move-function-built-not-applied-2026-10-13','sam-annual-goals-rulings-2026-10-12'],
   'verified', 'SkySequoiaS377', 'Sam Lee', now(), '2026-10-13')
  on conflict (slug) do nothing
  returning id
), sup as (
  update public.cpl_memory set status = 'superseded', superseded_by = (select id from ins), updated_at = now()
   where slug = 'workplan-move-function-built-not-applied-2026-10-13' and status <> 'superseded' and exists (select 1 from ins)
  returning id
)
insert into public.cpl_memory_log (memory_id, actor, action, note, after)
select id, 'SkySequoiaS377', 'create', 'Sam''s Sheet 72 pastes read back', null::jsonb from ins
union all
select id, 'SkySequoiaS377', 'supersede', 'superseded by sheet-72-pastes-applied-2026-10-13 (the Move function is live)', null::jsonb from sup
returning memory_id, action;

-- Added ~04:25Z: the charts pitfall (dashboard run 585). Logged once.
-- Rollback: delete from public.cpl_memory where slug = 'workplan-charts-name-match-reads-sort-order-2026-10-13';
-- (inserted with the same column list as above: kind pitfall, status proposed, author SkySequoiaS377,
--  related sheet-72-pastes-applied-2026-10-13, source "S377 SkySequoia; dashboard run 38344616539; cpl-project-tracker#2063")
