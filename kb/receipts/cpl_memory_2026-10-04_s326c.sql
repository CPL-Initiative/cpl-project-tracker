-- S326 (SkyAddendum), 2026-10-04, after the checkpoint: Rule 8 ingest - five new rows, all logged.
-- New (author 'SkyAddendum-s326'): Sierra's catalog requirements live (milestone); sheet 31 pasted and
-- read back (milestone, verified: Sam's own read-back); a paste card carries its SQL (procedure);
-- Postgres 17's MAINTAIN in the default grants (pitfall); smoke 15d passing on a timeout (pitfall).
-- No row names a word the Supabase connector holds for confirmation, so this ran through execute_sql.
-- Rollback: supersede the five rows by author 'SkyAddendum-s326' under actor 'SkyAddendum-s326-rollback'.

insert into public.cpl_memory (slug, title, kind, summary, detail, plain, tags, affects, source, author, event_date, status, verified_by, verified_at)
values
('sierra-catalog-requirements-live-2026-10-04',
 'Sierra names a checked program''s catalog requirements in production (#1851, deployed 15:33Z)',
 'milestone',
 '#1851 (squash 4837edc) deployed by cpl-chat-deploy run 37213391271 at 15:33Z on 2026-10-04. Asked about Mt. SAC''s LVN to RN option, Sierra names the anatomy choice, joins alternatives with "or" and gives "Program total, as the catalog prints it: 49.5-52.5 units", citing the 2026-2027 catalog. A program with no checked record keeps a plain list and no total.',
 'Smoke on main: run 37213710695 failed once on 7c (the quick-list table landed at about character 1,741 of an 1,800 window; 7c names a county, so the changed code never runs) and passed on its one re-run, 88 asserts. 7l and 7q pass. A/B preview 37210570623 had no regressions.',
 'Sierra can now say which courses a pilot program requires and give the total its catalog prints.',
 array['sierra','program-requirements','deploy'], array['chatbox/supabase/functions/cpl-chat/index.ts','chatbox/smoke_test.sh'],
 'cpl-chat-deploy run 37213391271; smoke run 37213710695', 'SkyAddendum-s326', '2026-10-04', 'proposed', null, null),
('sheet-31-pasted-tables-closed-2026-10-04',
 'Sam pasted open-asks sheet 31: the held memory rows are written and both new tables are closed to public writes',
 'milestone',
 'Sam ran one combined paste in the SQL editor on 2026-10-04 (card marked pasted at 16:56Z): three memory rows from S320 and S321, and the privilege closes for program_source_addenda (with its history, sequences and two functions) and program_requirement_records. His read-back matched: ten memory rows logged once, public roles read only.',
 'Live read the same hour: anon and authenticated hold rm on both tables (select plus Postgres 17 maintain), nothing on the history table or sequences, and no execute on either function; service_role keeps its grants, so the census and the loader still write.',
 'The last steps that needed a person on the two new tables are done.',
 array['supabase','security','decision-sheet','program-requirements'], array['kb/receipts/program_source_addenda_close_2026-10-04_s326.sql','kb/receipts/program_requirement_records_close_2026-10-04_s326.sql'],
 'Sam''s read-back CSV, 2026-10-04; live acl read', 'SkyAddendum-s326', '2026-10-04', 'verified', 'Sam', now()),
('paste-card-carries-the-sql-2026-10-04',
 'A decision-sheet card that asks Sam to paste carries the SQL itself, cut to what is still missing',
 'procedure',
 'Sheet 31 named four file paths; Sam pasted a path into the SQL editor and got a syntax error (2026-10-04). Put the SQL on the card in a <pre> block, after a live read that cuts it to what is still missing (seven of ten memory rows were already written), ending in one read-back. The open-asks builder refuses a paste card with no <pre>.',
 'Guard: kb/_build_open_asks_decision_sheet.py (mutation-tested: a paste card without the block refuses to build). Rule text: docs/reference/decision_sheets.md, the standing open-asks sheet section.',
 'When Sam has to paste something, give him the exact text, never a file name.',
 array['decision-sheet','process','supabase'], array['kb/_build_open_asks_decision_sheet.py','docs/reference/decision_sheets.md'],
 'Sam, S326 chat, 2026-10-04', 'SkyAddendum-s326', '2026-10-04', 'verified', 'Sam', now()),
('pg17-maintain-rides-the-default-grants-2026-10-04',
 'Postgres 17''s MAINTAIN privilege comes with the default grants: anon holds it on 97 of 104 public tables',
 'pitfall',
 'Read live 2026-10-04 (server 17.6): after both closes, anon and authenticated still show rm on the new tables, m being MAINTAIN (vacuum, analyze, reindex, cluster, lock). 97 of 104 public tables carry it for anon, the registry included. PostgREST issues no maintenance commands, so the API cannot reach it.',
 'The house close names insert, update, the row-removal privilege, the table-emptying one, references and trigger; none of those is MAINTAIN, which arrived in Postgres 17. Name maintain in the next close''s list. Closing it on the 97 existing tables is a shared-table change and needs a reviewed plan.',
 'Every public table still lets the public key run housekeeping commands, which the website cannot send.',
 array['supabase','security','grants','rule-10'], array['docs/kb-notes/playbook-ship-a-table-before-its-privilege-close.md'],
 'S326 live acl read, 2026-10-04', 'SkyAddendum-s326', '2026-10-04', 'proposed', null, null),
('smoke-15d-timeout-passes-as-gated-2026-10-04',
 'Smoke 15d counts a statement timeout as proof a student table is gated',
 'pitfall',
 'Smoke run 37213710695 (2026-10-04): the anon reads of map_college_cr_unit and map_student_credit returned 57014 (statement timeout), and 15d counted each as "returned no rows (gated/sealed)". The gate does hold: RLS is on, each table has one SELECT policy (reviewer, or reviewer or team pass), so a completed anon read returns nothing.',
 'The timeout likely comes from the policy function evaluated per row. The check should treat an error as inconclusive and probe with a cheap read (limit 1, or a has_table_privilege plus policy read). Not fixed; recorded for the Sierra lane.',
 'One privacy check in the Sierra smoke test passes for the wrong reason; the tables are still protected.',
 array['sierra','smoke','privacy','rls'], array['chatbox/smoke_test.sh'],
 'Smoke run 37213710695 log; live policy read 2026-10-04', 'SkyAddendum-s326', '2026-10-04', 'proposed', null, null)
on conflict do nothing;

insert into public.cpl_memory_log (memory_id, actor, action, note, after)
select m.id, 'SkyAddendum-s326', 'create', 'S326 ingest (after the checkpoint)', to_jsonb(m)
from public.cpl_memory m
where m.author = 'SkyAddendum-s326'
  and not exists (select 1 from public.cpl_memory_log l where l.memory_id = m.id and l.action = 'create');

select m.slug, m.status, count(l.id) filter (where l.action = 'create') as creates
from public.cpl_memory m
left join public.cpl_memory_log l on l.memory_id = m.id
where m.author = 'SkyAddendum-s326' group by m.slug, m.status order by m.slug;
