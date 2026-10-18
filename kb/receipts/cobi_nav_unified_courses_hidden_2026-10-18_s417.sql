-- S417 SkyManzanita, 2026-10-18 20:46Z. The COBI side menu: SkyView alone carries the Common Course
-- Reference. Sam, 20:40Z: "the CCR should be the same as SkyView now, right?"; 20:46Z: "SkyView alone, since
-- CCR is included as part of it." The cobi_nav row for the list tab (`unified-courses`, label "Common Course
-- Reference (CCR)", parent reference, sort_order 4, orgs {cpl,ci}, audience everyone, hidden false, updated_by
-- slee@cccco.edu 2026-09-17T13:43:51Z) is set hidden; the `skyview` launcher row stays. The tab and its list
-- view stay reachable by deep link (#unified-courses, #unified-courses/list), and the Admin tab can show the
-- entry again. Through supabase-migrate.yml because execute_sql holds an UPDATE for a confirmation.
-- Idempotent. Rollback: update public.cobi_nav set hidden = false, updated_by = 'slee@cccco.edu',
-- updated_at = '2026-09-17T13:43:51.358+00' where kind = 'tab' and key = 'unified-courses';
update public.cobi_nav
set hidden = true,
    updated_by = 'commons-s417@bot',
    updated_at = now()
where kind = 'tab'
  and key = 'unified-courses'
  and hidden = false;
