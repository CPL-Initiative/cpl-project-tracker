-- Rollback of 2026-11-09_map_reviewers_rccd.sql. None of the three addresses was on the list before
-- (read 2026-11-09 ~17:50Z: Janelle absent; Natalie and Chelsea at vendor.rccd.edu only).
delete from public.allowed_reviewers ar
using public.team_members tm
where tm.org = 'MAP' and tm.name = 'Janelle Brekke' and lower(ar.email) = lower(tm.email);
delete from public.allowed_reviewers ar
using public.team_members tm
where tm.org = 'MAP' and tm.name in ('Natalie Powell', 'Chelsea Marada')
  and lower(tm.email) like '%@vendor.rccd.edu'
  and lower(ar.email) = split_part(lower(tm.email), '@', 1) || '@rccd.edu';
