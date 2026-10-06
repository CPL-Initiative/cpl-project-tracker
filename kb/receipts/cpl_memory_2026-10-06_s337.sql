-- S337 SkyCompass (scheduled), 2026-10-06: what this run measured.
-- Session-sourced, so status proposed. INSERT-only; rollback: supersede each row by slug.
insert into public.cpl_memory (slug, title, kind, summary, detail, plain, tags, affects, source, author, event_date, status, verified_by, verified_at)
values
('ivc-art-10265-record-and-ccn-gap-2026-10-06',
 'Irvine Valley Art A.A. 10265 has a harvest record; its catalog prints ARTH 25/26 where the state file lists ARTH C1100/C1200',
 'fact',
 'Capture 37487454632 (curriQunet export, 21 of 23 codes) and extraction 37488863819 PASS at 27 units, equal, $0.07. The first record beyond Sam''s checked 20, filed unchecked. The 2026-27 catalog still prints ARTH 25 and 26; the Program Course File lists the common-numbered ARTH C1100 and C1200.',
 'Second capture list: kb/program_requirements_maps_sample.json, --sample maps (a push reads only it). The guard''s verdict checks now cover Sam''s 20 alone. The ARTH difference is a catalog-and-state-file gap for the college, never a misread.',
 'Irvine Valley''s Art degree now has a catalog record, and its catalog still uses two old art history course numbers.',
 array['program-requirements-harvest','irvine-valley','common-course-numbering'], array['kb/program_requirements_pilot/records/ivc_10265.json','kb/program_requirements_maps_sample.json'],
 'PR #1886', 's337-2026-10-06', '2026-10-06', 'proposed', null, null),
('smc-catalog-never-links-barbering-2026-10-06',
 'Santa Monica''s online catalog links no page for its Barbering A.S.; link-following has nothing left to follow there',
 'pitfall',
 'Capture run 37488858548 followed Academic and Career Paths to SMC Degrees and Certificates and printed every link naming the program on any host (title_links): none on five catalog pages. The next try is a Santa Monica procedure record naming its full-catalog PDF.',
 'The term map for 43767 lives on www.smc.edu/academics/classes/program.php?id=219 (sequence record smc_43767.json); the catalog rule does not sit beside it.',
 'Santa Monica''s catalog website never links its Barbering degree, so the reader must use the full catalog PDF.',
 array['program-requirements-harvest','santa-monica','capture'], array['kb/_program_requirements_pilot.py'],
 'capture run 37488858548', 's337-2026-10-06', '2026-10-06', 'proposed', null, null)
on conflict (slug) do nothing;

insert into public.cpl_memory_log (memory_id, actor, action, note, after)
select m.id, 's337-2026-10-06', 'create', 'S337 checkpoint, 2026-10-06', to_jsonb(m)
from public.cpl_memory m where m.author = 's337-2026-10-06'
  and not exists (select 1 from public.cpl_memory_log l where l.memory_id = m.id and l.action = 'create');
