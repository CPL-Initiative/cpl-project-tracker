-- S448 SkyDeergrass, 2026-10-22. Step 3 of folding My College into CPL Pathways: My College leaves the
-- COBI side menu. Sam, ~18:50Z: "go on step 3". Its sections draw inside CPL Pathways' college view since
-- #2355. The cobi_nav row for the tab (`college-briefing`, label NULL, parent share, sort_order 0, orgs
-- NULL, pinned false, audience everyone, hidden false, updated_by slee@cccco.edu 2026-09-17T13:43:51.358Z,
-- read live just before the write) is set hidden. The tab stays reachable by deep link (#college-briefing),
-- and the Admin tab can show the entry again. Through supabase-migrate.yml, as S417 hid unified-courses.
-- Idempotent. Rollback: update public.cobi_nav set hidden = false, updated_by = 'slee@cccco.edu',
-- updated_at = '2026-09-17T13:43:51.358+00' where kind = 'tab' and key = 'college-briefing';
update public.cobi_nav
set hidden = true,
    updated_by = 'menu-s448@bot',
    updated_at = now()
where kind = 'tab'
  and key = 'college-briefing'
  and hidden = false;
