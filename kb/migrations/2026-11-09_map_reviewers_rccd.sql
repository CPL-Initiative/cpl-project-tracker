-- 2026-11-09 (S621 SkyBlackEye): the MAP team, live on Sam's call ~17:30Z, were told to sign in as a reviewer.
-- COBIx on cpl-project-tracker#2967 (17:42Z), Sam's ask in session ("see cobix comments ... the reviewer list
-- changes needed"). Read live ~17:50Z: Janelle Brekke (MAP, team_members, rccd.edu, has an auth account) is not on
-- allowed_reviewers; Natalie Powell and Chelsea Marada are on it only at their vendor.rccd.edu address, and
-- is_allowed_reviewer() compares the exact address, so a magic link to rccd.edu does not match.
-- 1. Janelle Brekke, her address read from team_members.
-- 2. Natalie Powell and Chelsea Marada at rccd.edu too: the same local part as their vendor.rccd.edu row.
-- No address enters the repo. Idempotent. Rollback: 2026-11-09_map_reviewers_rccd_rollback.sql.
insert into public.allowed_reviewers (email)
select lower(tm.email)
from public.team_members tm
where tm.org = 'MAP' and tm.active and tm.name = 'Janelle Brekke' and tm.email like '%@%'
  and not exists (select 1 from public.allowed_reviewers ar where lower(ar.email) = lower(tm.email));

insert into public.allowed_reviewers (email)
select split_part(lower(tm.email), '@', 1) || '@rccd.edu'
from public.team_members tm
where tm.org = 'MAP' and tm.active and tm.name in ('Natalie Powell', 'Chelsea Marada')
  and lower(tm.email) like '%@vendor.rccd.edu'
  and not exists (select 1 from public.allowed_reviewers ar
                  where lower(ar.email) = split_part(lower(tm.email), '@', 1) || '@rccd.edu');
-- Read-back (expect Janelle 1; Natalie and Chelsea 2 each):
-- select tm.name, count(*) from public.team_members tm join public.allowed_reviewers ar
--   on split_part(lower(ar.email),'@',1) = split_part(lower(tm.email),'@',1)
--  where tm.name in ('Janelle Brekke','Natalie Powell','Chelsea Marada') group by 1;
-- Applied 2026-11-09 ~17:55Z through the Supabase MCP (apply_migration map_reviewers_rccd). Read back: Janelle Brekke
-- 1 (rccd.edu); Natalie Powell 2 and Chelsea Marada 2 (vendor.rccd.edu, rccd.edu); Ally Barker 1 (norcocollege.edu).
