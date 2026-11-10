-- S633 SkySilverDollar checkpoint: three cpl_memory rows (proposed) and their log entries.
-- Written 2026-11-10 ~18:21Z through execute_sql; verify returned creates = 1 for each slug. The summaries as
-- sent were shortened to fit cpl_memory_summary_check (400 chars); the moved words are in detail. Rollback:
-- delete from cpl_memory where author = 'SkySilverDollarS633' (log rows cascade or delete by memory_id).
insert into public.cpl_memory (kind, slug, title, summary, detail, plain, tags, source, status, verified_by, verified_at, event_date, author, confidence) values
('pitfall','p-moving-lane-text-can-close-a-card','Moving a lane paragraph can close a decision-sheet card by accident',
 'A decision-sheet card stays open only while its premise check (p_*_open in CPLBrain/decision-sheets/_build_open_asks_decision_sheet.py) finds its text in the lane. S630 moved Alameda''s paragraph to the lessons and kept the NEEDS SAM marker but not the six record ids the check also reads, so the builder refused Sheet 179 as if Sam had ruled on Sheet 178 card 2.',
 'Fixed in cpl-project-tracker#3074 by naming the ids in the lane again. When compacting a lane, keep everything the card''s premise check reads beside its marker.',
 'When a session tidies a status file, it can delete the words that keep one of Sam''s open questions open, and the question then looks answered when it is not.',
 array['decision-sheets','program-requirements-harvest','docs'],'cpl-project-tracker#3074; CPLBrain#754','proposed',null,null,'2026-11-10','SkySilverDollarS633','high'),
('decision','d-exhibit-reanalysis-jev-ungated','The exhibit re-analysis asks Jev two questions with no gate',
 'kb/_exhibit_reanalysis_jev.py (#3076) asks only step 9''s questions (one credential under two names, for the checks'' shared_mid_same_issuer pairs; an issuer that is a training site) on typesafe-smoke.yml. Step 9 had named the 0.85 gate; kb/_jev_adjudicate.py holds that a gate belongs to the reference it was measured on (only the CCRR), so the exhibits run as a calibration sitting and nothing reads as suggested.',
 'Each answer carries Jev''s probability for Sam''s word; his verdicts would earn the exhibits a gate. Writes nothing, commits nothing; artifact jev-exhibit-reanalysis. Guard tests/exhibit_reanalysis_jev_test.py.',
 'An AI helper now checks Sam''s exhibit changes for two kinds of mistake, and it reports how sure it is rather than deciding anything.',
 array['cer-procedures','jev','exhibits'],'cpl-project-tracker#3076; docs/exhibit_canonicalization_lessons.md S633','proposed',null,null,'2026-11-10','SkySilverDollarS633','high'),
('pitfall','p-runner-push-starts-no-ci','A PR whose last push came from a workflow shows no check runs',
 'A runner''s commit (the workflow token) starts no workflow, so #3056 sat with zero check runs after the display job committed its applied record. A session push (a merge of main) starts test; then mark the PR ready and merge on it.',
 'Seen 2026-11-10 on claude/catalog-laspositas-s630. The same holds for every harvest branch a job commits back to.',
 'A pull request can look like it has no tests at all when only an automated job touched it last; a person''s push wakes the tests up.',
 array['branch-policy','ci','program-requirements-harvest'],'cpl-project-tracker#3056','proposed',null,null,'2026-11-10','SkySilverDollarS633','medium')
on conflict (slug) do nothing;
insert into public.cpl_memory_log (memory_id, actor, action, note, after)
select id, 'SkySilverDollarS633', 'create', 'checkpoint auto-write', to_jsonb(m)
from public.cpl_memory m where m.slug in ('p-moving-lane-text-can-close-a-card','d-exhibit-reanalysis-jev-ungated','p-runner-push-starts-no-ci')
  and not exists (select 1 from public.cpl_memory_log l where l.memory_id = m.id and l.action = 'create');
select m.slug, count(l.id) filter (where l.action='create') as creates
from public.cpl_memory m left join public.cpl_memory_log l on l.memory_id = m.id
where m.author = 'SkySilverDollarS633' group by m.slug order by m.slug;
