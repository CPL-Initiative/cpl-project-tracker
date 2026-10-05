-- S330 (SkyRoutine), 2026-10-05 ~00:20Z: Sam's sheet 36 answers, the write function, and his CATEMA lead (verified: his words).
-- Rollback: supersede each row by slug under actor 'SkyRoutine-s330-rollback'.
insert into public.cpl_memory (slug, title, kind, summary, detail, plain, tags, affects, source, author, event_date, status, verified_by, verified_at)
values
('sam-sheet36-other-routes-and-write-function-2026-10-04',
 'Sam: find Cerritos''s high school list another way; go on the procedure record write function',
 'decision',
 'Sam, 2026-10-04 23:51Z, sheet 36 card 2: "lets work together to see if we ca find these another way and close the gap" (the request to Cerritos stays held). ~00:00Z: "go ahead on writing the function"; "we can revise governance if needed". program_source_procedure_set() now writes a procedure record from a session with a SELECT.',
 'Card 1: "pasted", "it gave the correct read back" (v2 at 23:49Z). His Supabase connector tools are all Always allow (he checked), so a bare UPDATE''s 60-second hold sits with Supabase''s server. The function refuses an empty author, a malformed record, a missing college and a stale md5; service_role only; its first write was Cerritos''s v3. Receipt kb/receipts/program_source_procedure_set_2026-10-04_s330.sql.',
 'Sam asked us to keep looking for Cerritos''s high school course list ourselves before asking the college, and approved a safe way for sessions to save each college''s reading notes without him pasting them.',
 array['program-requirements','procedure-record','cerritos','decision-sheet','supabase'], array['docs/reference/lanes/program-requirements-harvest.md','kb/supabase_program_source_registry.sql'],
 'Sam in session S330 and on open-asks sheet 36, 2026-10-04', 'SkyRoutine-s330', '2026-10-04', 'verified', 'Sam', now()),
('sam-catema-articulation-lead-2026-10-05',
 'Sam: CATEMA is where colleges have documented their articulated CTE high school courses for years',
 'opportunity',
 'Sam, 2026-10-05 ~00:15Z: "there''s a system called catema that the college''s have been using for years to document their cte articulated hs courses in case we can scrub some data from there". The first route for Cerritos''s high school articulation list (read 7), before the archived Statewide Career Pathways database.',
 'Read it from a runner under the census rules: robots.txt first, public pages only, never behind a login; record the host and what it yields on the college''s procedure record. If CATEMA publishes regional articulation lookups, the same read may serve every college the harvest widens to.',
 'Sam pointed us to the system colleges use to record which high school career courses earn college credit, which may hold the list Cerritos does not publish.',
 array['program-requirements','high-school-articulation','catema','cerritos','cpl-pathways'], array['docs/reference/lanes/program-requirements-harvest.md','docs/session_331_handoff.md'],
 'Sam in session S330, 2026-10-05 ~00:15Z', 'SkyRoutine-s330', '2026-10-05', 'verified', 'Sam', now())
on conflict (slug) do nothing;
insert into public.cpl_memory_log (memory_id, actor, action, note, after)
select id, 'SkyRoutine-s330', 'create', 'S330 Sam decisions', to_jsonb(m)
from public.cpl_memory m where m.author = 'SkyRoutine-s330'
 and not exists (select 1 from public.cpl_memory_log l where l.memory_id = m.id and l.action = 'create');
select m.slug, m.status, (select count(*) from public.cpl_memory_log l where l.memory_id=m.id and l.action='create') creates
from public.cpl_memory m where m.author = 'SkyRoutine-s330' order by m.slug;
