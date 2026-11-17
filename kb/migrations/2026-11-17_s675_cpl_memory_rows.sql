-- cpl_memory rows for SkyLinnet (S675), the CPL Queue routine, 2026-11-17. Applied by supabase-migrate.yml (kb/migrations/.apply),
-- never Execute SQL. INSERT ... ON CONFLICT (slug) DO NOTHING (a replay is harmless). Session decisions land proposed.
-- ROLLBACK: kb/migrations/2026-11-17_s675_cpl_memory_rows_rollback.sql
insert into public.cpl_memory (slug,kind,title,summary,tags,status,source,verified_by,verified_at,author,event_date) values
('d-rcc-social-justice-catalog-unequal-s675','decision','Riverside City Social Justice 41749 and 43896: the catalog does not add up','S675: a free page read (44081245766) shows Required Courses printing Units: 9.00 over rows worth 3 (41749: select one of ETS-1, SOC-10/10H, SOC-15, SOC-25) and 6 (43896: ETS-1 plus one of SOC-15, SOC-25, PHI-34). The readings are faithful; the fault is the catalog''s, as with Geology 38790. No reconcile step, no forced read; both stay as filed and failing. #3446.',array['program-requirements','harvest','rccd'],'proposed','S675 SkyLinnet, #3446; page read 44081245766',null,null,'SkyLinnet (S675)','2026-11-17'),
('d-butte-31950-keeps-its-reading-s675','decision','Butte Physics 31950 keeps its conditional 8 elective units','S675, COBIx on #3426: Physics 31950 reads the page''s 8 elective units (only necessary if the 60 units have not been completed) where Mathematics 31953 leaves the figure empty. Both pass, and both carry electives_fill_degree; aligning them needs a new clear step for no pass. Picked: leave both as filed.',array['program-requirements','harvest','butte'],'proposed','S675 SkyLinnet; records kb/program_requirements_college/butte/records/{31950,31953}.json',null,null,'SkyLinnet (S675)','2026-11-17')
on conflict (slug) do nothing;

insert into public.cpl_memory_log (memory_id, actor, action, note, after)
select id, 'SkyLinnet (S675)', 'create', 'S675 (2026-11-17)', to_jsonb(m)
from public.cpl_memory m where m.slug in ('d-rcc-social-justice-catalog-unequal-s675','d-butte-31950-keeps-its-reading-s675')
  and not exists (select 1 from public.cpl_memory_log l where l.memory_id = m.id and l.action = 'create');
