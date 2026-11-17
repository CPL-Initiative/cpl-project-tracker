-- cpl_memory rows for SkyPipit (S676), the CPL Queue routine's 13:12Z and 14:12Z firings, 2026-11-17. Applied by
-- supabase-migrate.yml (kb/migrations/.apply), never Execute SQL. INSERT ... ON CONFLICT (slug) DO NOTHING. Session decisions land proposed.
-- ROLLBACK: kb/migrations/2026-11-17_s676_cpl_memory_rows_rollback.sql
insert into public.cpl_memory (slug,kind,title,summary,tags,status,source,verified_by,verified_at,author,event_date) values
('d-slice-b-six-no-live-holder-rows-s676','decision','Slice B: six yield colleges filed, and none of their dropped records held a live row','S676: Cabrillo, College of San Mateo, Crafton Hills, Feather River, Gavilan and Lemoore were read again under the #3408 page yield, reread (45 rows replaced) and loaded (4 inserted), merged with one display build 71b67268c567 (#3456). Passing +22 for $6.85. The 14 records the reads dropped had all failed on main and were never loaded; a live read at 14:2xZ found none of them in program_requirement_records, so no guarded delete was needed. Chaffey remains.',array['program-requirements','harvest','slice-b'],'proposed','S676 SkyPipit, #3456; receipts kb/receipts/program_requirement_records_college_*_4410*.json',null,null,'SkyPipit (S676)','2026-11-17'),
('p-wave-branch-for-shared-builds-s676','pitfall','Several college reads share the Commons and display files: build once on a wave branch','S676: each read files under its own college folder, so per-college read branches merge cleanly, but kb/status/commons_data*.json and cpl_pathways_roep_data.js are shared and conflict across separate PRs. Merge the read branches onto one wave branch, then build the Commons data and the display once.',array['program-requirements','harvest','procedure'],'proposed','S676 SkyPipit, #3456',null,null,'SkyPipit (S676)','2026-11-17')
on conflict (slug) do nothing;

insert into public.cpl_memory_log (memory_id, actor, action, note, after)
select id, 'SkyPipit (S676)', 'create', 'S676 (2026-11-17)', to_jsonb(m)
from public.cpl_memory m where m.slug in ('d-slice-b-six-no-live-holder-rows-s676','p-wave-branch-for-shared-builds-s676')
  and not exists (select 1 from public.cpl_memory_log l where l.memory_id = m.id and l.action = 'create');
