-- 2026-11-09 (SkyCigar): add the three MAP CSMs to the reviewer list before the funding-confirmation session.
-- Sam's go (relayed by COBIx on cpl-project-tracker#2967, 2026-11-09 13:39Z) and confirmed by Sam in session.
-- is_allowed_reviewer() reads public.allowed_reviewers only; the CSMs' addresses live in Team RACI
-- (public.team_members), so this reads them from there by name and org. No address enters the repo.
-- Idempotent: an address already on the list is left alone. Rollback: 2026-11-09_csm_reviewers_add_rollback.sql.
insert into public.allowed_reviewers (email)
select lower(tm.email)
from public.team_members tm
where tm.org = 'MAP' and tm.active
  and tm.name in ('Natalie Powell', 'Chelsea Marada', 'Ally Barker')
  and tm.email like '%@%'
  and not exists (select 1 from public.allowed_reviewers ar where lower(ar.email) = lower(tm.email));
-- Read-back (expect 3):
-- select count(*) from public.allowed_reviewers ar join public.team_members tm on lower(ar.email) = lower(tm.email)
--  where tm.name in ('Natalie Powell','Chelsea Marada','Ally Barker');
-- Applied 2026-11-09 ~14:47Z through the Supabase MCP (apply_migration csm_reviewers_add). Read back: 3 of 3
-- matched; the list holds 13.
