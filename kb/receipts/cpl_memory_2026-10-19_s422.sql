-- S422 SkyWillow, 2026-10-19 ~08:50Z. Rule 8 ingest through execute_sql: INSERT-only, new slugs dated today,
-- author SkyWillowS422 (proposed). Rollback: supersede by slug under actor 'SkyWillow-s422-rollback'.
insert into public.cpl_memory (slug, kind, org, title, summary, detail, plain, tags, affects, source, related, author, event_date, status)
values
('scorer-pass-shape-is-a-flag-not-a-status-2026-10-19', 'pitfall', 'cpl',
 'A new pass shape in the program scorer is equal plus a flag, never a new status string',
 'program_record_machine_pass (SQL), the tab, CPL Pathways and the display build accept only arithmetic status equal or unstated, so S422''s new passes are flags beside equal: minimum (total_units_minimum) and total_only. A new reconcile field must also leave program_record_carry_basis, or a person''s confirm will not survive a reread.',
 'Delta''s live rows went from 154 to 195 of 202 passing (#2250). The carry basis change was applied through supabase-migrate.yml (run 39216602991) after checking md5(prosrc) of the live functions against the file. tests/program_requirements_college_test.py fails when a reconcile field is missing from the basis.',
 'When the checker learns a new way a program record can be right, it marks it with a note rather than a new result name, because several pages and a database check only know the two existing names.',
 array['program-requirements','harvest','scorer'], array['kb/_program_requirements_score.py','chatbox/supabase_program_requirement_records_college_reread.sql','kb/program_requirements_reconcile.json'],
 'S422 SkyWillow, #2250', array['record-shape-5-degree-total-2026-10-14','jev-cause-reliable-owner-a-hint-2026-10-19'],
 'SkyWillowS422', '2026-10-19', 'proposed'),
('reread-posts-newest-run-only-2026-10-19', 'pitfall', 'cpl',
 'Two reconcile runs in a row leave two run stamps, and step=reread posts only the newest',
 'Each reconcile stamps the records it changes with its run; after Delta''s second reconcile, the reread posted its 7 and left the first run''s 195. reread --extracted-run (the force input on a reread dispatch) posts a named run (39223682919: 195 replaced, 0 held).',
 'Better: put every scorer change on the branch before the first reconcile; a reconcile checks out its dispatch commit, so cancel and redispatch while its capture is young. Delta''s reconcile captures take about 25 minutes. The function''s guards (unchecked, unread by a person, from an earlier run) decide each posted row either way.',
 'If the harvest checker is rerun twice before posting, the posting step has to be told which run to post, or the first run''s fixes stay off the live table.',
 array['program-requirements','harvest','reread'], array['kb/_program_requirements_college.py','.github/workflows/program-requirements-college.yml'],
 'S422 SkyWillow, #2250; kb/receipts/program_requirement_records_college_reread_san_joaquin_delta_39223682919.json', array['reread-path-live-2026-10-14'],
 'SkyWillowS422', '2026-10-19', 'proposed'),
('taft-two-local-ge-patterns-2026-10-19', 'fact', 'cpl',
 'Taft''s catalog prints two local GE patterns: 27 units, and 18 for its CTE degrees',
 'Its GE philosophy page states a 27-unit local pattern; its Other Associate Degrees page says the CTE degrees (Energy Technology and Occupational Safety and Health among them) "follow the local general education pattern of only 18 units". No page words the 60 as a minimum, so no reconcile step was built; records 16725 and 36928 stay failing (#2249).',
 'Page reads 39215793482, 39216772779, 39217374801 (kb/college_reads/taft_local_ge_units.json). With 18 the sums are 36 and 53 against 60; only Title 5''s floor and electives the pages never name would pass them, which is also what a dropped block looks like (Fable''s advice, S422).',
 'Taft''s catalog gives two different general education totals for its local degrees, so the harvest leaves those two programs marked as not adding up and the difference is one for the college to settle.',
 array['program-requirements','harvest','taft'], array['kb/jev_harvest_verdicts/taft.json','kb/college_reads/taft_local_ge_units.json'],
 'S422 SkyWillow, #2249', array['taft-cal-getc-statewide-34-2026-10-18'],
 'SkyWillowS422', '2026-10-19', 'proposed')
on conflict (slug) do nothing;
insert into public.cpl_memory_log (memory_id, actor, action, note, after)
select id, 'SkyWillowS422', 'create', 'checkpoint auto-write (S422, 2026-10-19)', to_jsonb(m)
from public.cpl_memory m where m.slug in ('scorer-pass-shape-is-a-flag-not-a-status-2026-10-19','reread-posts-newest-run-only-2026-10-19','taft-two-local-ge-patterns-2026-10-19');
