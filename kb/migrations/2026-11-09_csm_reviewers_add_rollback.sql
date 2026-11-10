-- Rollback of 2026-11-09_csm_reviewers_add.sql: removes the three CSMs from the reviewer list.
-- None of the three was on the list before (read 2026-11-09 ~14:45Z: list of 10, 0 of 3 present).
delete from public.allowed_reviewers ar
using public.team_members tm
where lower(ar.email) = lower(tm.email)
  and tm.org = 'MAP'
  and tm.name in ('Natalie Powell', 'Chelsea Marada', 'Ally Barker');
