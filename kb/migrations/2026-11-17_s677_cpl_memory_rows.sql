-- cpl_memory rows for SkyTanager (S677), Sam's session, 2026-11-17. Applied by
-- supabase-migrate.yml (kb/migrations/.apply), never Execute SQL. INSERT ... ON CONFLICT (slug) DO NOTHING. Session decisions land proposed.
-- ROLLBACK: kb/migrations/2026-11-17_s677_cpl_memory_rows_rollback.sql
insert into public.cpl_memory (slug,kind,title,summary,tags,status,source,verified_by,verified_at,author,event_date) values
('d-chaffey-18435-not-found-no-live-row-s677','decision','Chaffey 18435 is not found in its fresh capture, so its suspect yield is gone and no row comes out','S677: Chaffey''s fresh capture (read 44090894573) files Physical Science 18435 under not_found; it had been read from the Cal-GETC page, so the S668 yield 18435 to 45032 no longer occurs (RESOLVED_BY_NOT_FOUND_S677 in the census test). A live read at about 20:55Z found no row for 18435 or 45032, so no guarded delete.',array['program-requirements','harvest','slice-b','chaffey'],'proposed','S677 SkyTanager, #3462; tests/harvest_ncl_lookup_census_test.py',null,null,'SkyTanager (S677)','2026-11-17'),
('f-skyline-self-test-miss-38299-pace-s677','fact','The lookup self-test''s one miss is Skyline 38299 PACE; the earlier 27 of 28 was never committed','S677: the self-test recall drop 27 to 26 of 28 is Skyline. Its one committed capture (d600083e) already reads 26 of 28, so the 27 cannot be rebuilt. From committed census inputs the one miss is 38299 Proficiency in American Culture and English (PACE), Certificate of Achievement, not matched against its own page. Recall stays above the floor.',array['program-requirements','harvest','self-test','skyline'],'proposed','S677 SkyTanager; kb/_harvest_ncl_lookup_census.py',null,null,'SkyTanager (S677)','2026-11-17')
on conflict (slug) do nothing;

insert into public.cpl_memory_log (memory_id, actor, action, note, after)
select id, 'SkyTanager (S677)', 'create', 'S677 (2026-11-17)', to_jsonb(m)
from public.cpl_memory m where m.slug in ('d-chaffey-18435-not-found-no-live-row-s677','f-skyline-self-test-miss-38299-pace-s677')
  and not exists (select 1 from public.cpl_memory_log l where l.memory_id = m.id and l.action = 'create');

select slug, kind, status, length(summary) as summary_len from public.cpl_memory
where slug in ('d-chaffey-18435-not-found-no-live-row-s677','f-skyline-self-test-miss-38299-pace-s677') order by slug;
