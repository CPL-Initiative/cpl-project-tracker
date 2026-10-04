-- S326 (SkyAddendum), 2026-10-04 ~17:40Z: Rule 8 ingest - three new rows, all logged.
-- New (author 'SkyAddendum-s326'): Sam's direction for the ROEP dataset and CPL Pathways (decision,
-- verified: his words); a pathway map names the course a college recommends inside a choice (fact,
-- verified: his words). No row names a word the Supabase connector holds, so this ran through execute_sql.
-- Rollback: supersede the two rows by slug under actor 'SkyAddendum-s326-rollback'.

insert into public.cpl_memory (slug, title, kind, summary, detail, plain, tags, affects, source, author, event_date, status, verified_by, verified_at)
values
('sam-roep-procedures-not-curation-2026-10-04',
 'Sam: the harvest tab runs the reading, CPL Pathways shows the ROEP record, and a misread changes the college''s procedure',
 'decision',
 'Sam, 2026-10-04 ~17:20Z: "we use the new tab based on mockup to manage the ongoing process to harvest program ROE and Pathway data and CPL Pathways to show it graphically to the colleges and public... My goal is to not need to curate or manually adjust and instead to adjust college-based procedures to arrive at accurate catalog ROEP dataset--the P is for the pathways data".',
 'He lifted accuracy as a gate for display: "Don''t worry about the uncertainty on accuracy at this point. Being able to see things graphically will help reveal gaps and misreads we need to find fixes for in our process." Sierra''s "required" stays on the checked gate (sheet 29 card 4). Mock-up https://claude.ai/artifact/8hkej9jHsmLRX6cZYxrXbM; two calls on open-asks sheet 32. Lane: docs/reference/lanes/program-requirements-harvest.md. Vault braindump 2026-10-04 17:20.',
 'Show every program''s catalog requirements and pathway as a picture, and fix mistakes by fixing how each college is read.',
 array['program-requirements','cpl-pathways','roep','governance'], array['docs/reference/lanes/program-requirements-harvest.md','cpl_pathways.js'],
 'Sam, S326 chat, 2026-10-04', 'SkyAddendum-s326', '2026-10-04', 'verified', 'Sam', now()),
('pathway-map-names-the-pick-inside-a-choice-2026-10-04',
 'A pathway map names the courses a college recommends inside a choice; the catalog keeps the rule',
 'fact',
 'Sam, 2026-10-04 ~17:35Z: the state''s Program Course File lists every course that could count (20-40 options for a GE area such as humanities, of which a student takes 2 for 6 units); the pathway map names the two the college recommends; the catalog harvest gives the authoritative rule ("choose 6 units from the following list").',
 'He named the risk: "edge case colleges where our agent has to dig and prod to get at the authoritative data." Every Program Pathways Mapper host the probe reached refused the reader (17 of 17, run 37198225537); Irvine Valley''s and Santa Monica''s own map pages answer. Next: read those two and measure how often a slot inside a choice names a specific course.',
 'A college''s program map shows which of many optional courses it recommends.',
 array['program-requirements','pathways','program-pathways-mapper','roep'], array['kb/_program_sequence_ppm.py'],
 'Sam, S326 chat, 2026-10-04', 'SkyAddendum-s326', '2026-10-04', 'verified', 'Sam', now())
on conflict do nothing;

insert into public.cpl_memory_log (memory_id, actor, action, note, after)
select m.id, 'SkyAddendum-s326', 'create', 'S326 ingest (ROEP direction)', to_jsonb(m)
from public.cpl_memory m
where m.author = 'SkyAddendum-s326'
  and not exists (select 1 from public.cpl_memory_log l where l.memory_id = m.id and l.action = 'create');

select m.slug, m.status, count(l.id) filter (where l.action = 'create') as creates
from public.cpl_memory m
left join public.cpl_memory_log l on l.memory_id = m.id
where m.slug in ('sam-roep-procedures-not-curation-2026-10-04', 'pathway-map-names-the-pick-inside-a-choice-2026-10-04')
group by m.slug, m.status order by m.slug;

-- 17:40Z, after sheet 32 was answered: one more row, logged the same way.
insert into public.cpl_memory (slug, title, kind, summary, detail, plain, tags, affects, source, author, event_date, status, verified_by, verified_at)
values
('sam-sheet32-rulings-cpl-in-three-kinds-2026-10-04',
 'Sam, sheet 32: a program shows the most CPL a learner could apply, with CPL in three kinds per course',
 'decision',
 'Sam, open-asks sheet 32 (2026-10-04 17:33Z, both his own calls, as proposed): a program on CPL Pathways shows "up to" (the CPL course taken in every choice) plus the recommended path''s figure where a map is read; catalog-and-state-file differences collect as drafts on the college''s harvest-tab row and My College to-dos, and the MAP team sends them.',
 'His note on card 1: "Also make sure we continue to include any CPL that the college might adopt for the courses on the pathway. And think about how we can include any certs we know of that haven''t yet been articulated in the system for consideration. This is the reason we''re adding all those potential certs to the CER and ECRA". So each course carries CPL in three kinds: articulated at this college; could adopt (the same course articulated at another college); for consideration (a CER or EACR cert whose credit recommendation points at the course, not yet articulated anywhere). Lane: program-requirements-harvest. Sheet: https://claude.ai/artifact/AUF7W1nEqZ1L4xKHVRpRXB.',
 'Each course shows the CPL it has, the CPL it could adopt from other colleges, and certifications worth considering.',
 array['program-requirements','cpl-pathways','roep','decision-sheet','cer'], array['docs/reference/lanes/program-requirements-harvest.md'],
 'Sam, open-asks sheet 32 replies, 2026-10-04', 'SkyAddendum-s326', '2026-10-04', 'verified', 'Sam', now())
on conflict do nothing;

insert into public.cpl_memory_log (memory_id, actor, action, note, after)
select m.id, 'SkyAddendum-s326', 'create', 'S326 ingest (sheet 32)', to_jsonb(m)
from public.cpl_memory m
where m.author = 'SkyAddendum-s326'
  and not exists (select 1 from public.cpl_memory_log l where l.memory_id = m.id and l.action = 'create');
