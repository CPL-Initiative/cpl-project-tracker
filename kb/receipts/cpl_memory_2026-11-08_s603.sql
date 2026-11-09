-- S603 SkyMaffei checkpoint: three cpl_memory rows, STAGED and NOT YET WRITTEN. The execute_sql approval prompt
-- timed out at 2026-11-08 ~01:58Z. Run as one call (three statements); the verify must show creates = 1 for each.
insert into public.cpl_memory (kind, slug, title, summary, detail, plain, tags, source, status, verified_by, verified_at, event_date, author, confidence) values
('decision','d-nc-cip-category-table','A confirmed noncredit CIP category is saved in a gated table',
 'Sam (Open Asks Sheet 169 card 2, 2026-11-07 20:57Z: "table"): a confirmed noncredit CIP category persists in public.nc_cip_category_decisions, one row per program, with who and when from the reviewer sign-in; not localStorage. Governance DR-33; migration committed and held until the picker (phase 3) is its first writer.',
 'Writers are a reviewer sign-in only; team phrase reads; no anon read; no DELETE; history trigger. A rule never writes a row (#1192 guard). Design: docs/noncredit_cip_category_scope.md section 8; PR #2908.',
 'When someone confirms which noncredit category a program belongs to, the choice is saved with the name of the person who confirmed it and the time, so it can be checked and undone later.',
 array['noncredit-cip-categories','governance','supabase'],'Open Asks Sheet 169 card 2; cpl-project-tracker#2908','verified','Sam',now(),'2026-11-07','SkyMaffeiS603','high'),
('decision','d-security-step3-applied','Security step 3 applied: a TMC draft can be changed only from the browser that saved it',
 'Sam (Open Asks Sheet 169 card 1, 2026-11-07 20:57Z: "apply"). supabase-migrate run 42413667979 applied the tmc_submissions owner token; #2901 merged in the same window. Read back: update and insert need owner_token = tmc_request_token(); anon cannot select owner_token; truncate revoked; 0 rows.',
 'Open: one real save and resume in a browser. contact_name and contact_email on tmc_submissions remain anon-readable (item 8, TMC half), with step 5.',
 'A TMC Builder draft can now be edited only from the browser that first saved it.',
 array['org-phrase-scope-auth','security','tmc-builder'],'Open Asks Sheet 169 card 1; cpl-project-tracker#2901','verified','Sam',now(),'2026-11-07','SkyMaffeiS603','high'),
('pitfall','p-runner-receipt-head-no-ci','A runner receipt commit at a PR head starts no CI',
 'supabase-migrate.yml (and the other runners) commit their receipt with the workflow token; a push made with that token starts no workflow, so js-tests never ran on #2901 head 6ea75ede. Push the PR''s own next change (a lane update) to start test; never an empty commit.',
 'Measured S603 2026-11-07. Same for course-outcomes and other runners that commit back to the branch.',
 'After an automated job adds a commit to a pull request, the tests do not run on it by themselves; the next human or session change starts them.',
 array['ci','branch-policy','supabase-migrate'],'docs/auth_and_repo_posture_lessons.md (S603 section)','proposed',null,null,'2026-11-07','SkyMaffeiS603','high')
on conflict do nothing;
insert into public.cpl_memory_log (memory_id, actor, action, note, after)
select id, 'SkyMaffeiS603', 'create', 'checkpoint auto-write (late: staged S603)', to_jsonb(m)
from public.cpl_memory m where m.slug in ('d-nc-cip-category-table','d-security-step3-applied','p-runner-receipt-head-no-ci')
  and not exists (select 1 from public.cpl_memory_log l where l.memory_id = m.id and l.action = 'create');
select m.slug, count(l.id) filter (where l.action='create') as creates
from public.cpl_memory m left join public.cpl_memory_log l on l.memory_id = m.id
where m.author = 'SkyMaffeiS603' group by m.slug order by m.slug;
