-- S354 SkyFurrow, 2026-10-09: the Cerritos load (PR #1941). Session findings, status proposed.
-- INSERT-only; rollback: supersede each row by slug (author s354-2026-10-09).
insert into public.cpl_memory (slug, title, kind, summary, detail, plain, tags, affects, source, author, event_date, status)
values
('roep-cerritos-loaded-unchecked-2026-10-09',
 'Cerritos is loaded: 270 program records unchecked beside the four checked pilot rows',
 'milestone',
 'Load run 37970640026 posted the 274 filed records through program_requirement_records_college_load(): 270 inserted unchecked, the four checked pilot rows kept. Live: 274 Cerritos rows, 4 checked, 234 of the 270 pass the three machine checks. The receipt (kb/receipts/, run 37970640026) names every inserted key and the rollback.',
 'The read cost $16.64 across runs 37961137169 and 37966828676 (the re-run extracted 18 programs whose page changed, $0.84). 274 of 288 programs read; 9 lost a sibling''s page under assign() and read none, among them the two Welding A.A. degrees whose catalog addresses name A.S.; 5 found no page. The 36 failing records: 23 arithmetic unequal, 9 incomplete, 4 coverage. Sam reads a sample on the Records view next.',
 'Every Cerritos program the harvest could read is now in the Records view for review; none is public until a person confirms it.',
 array['program-requirements-harvest','phase-2','cerritos','records'], array['program_requirement_records','kb/program_requirements_college/cerritos/','chatbox/supabase_program_requirement_records_college_load.sql'],
 'S354, load run 37970640026 and a live count', 's354-2026-10-09', '2026-10-09', 'proposed'),
('roep-college-workflow-reads-only-on-a-marker-2026-10-09',
 'The college workflow reads a catalog only when a push says [read] or [extract], and loads only on [load]',
 'decision',
 'program-requirements-college.yml ran its capture on every push touching the script: about 360 page loads of a college catalog over 29 minutes. S354 gated the read job on a message starting [read] or [extract] (or a dispatch) and added a load job on [load] or a dispatch with step=load; tests/program_requirements_college_test.py pins both gates.',
 'The test also pins that the service key reaches only the extract and load steps. A bot''s push (the filing and receipt commits) triggers no CI and no rerun, so the branch needs a session push to get test on its head.',
 'Editing the harvest script no longer re-reads a college''s catalog by accident.',
 array['program-requirements-harvest','phase-2','workflow'], array['.github/workflows/program-requirements-college.yml'],
 'S354, PR #1941', 's354-2026-10-09', '2026-10-09', 'proposed')
on conflict (slug) do nothing;

-- Added at the checkpoint (live, same session): sam-records-find-a-record-2026-10-09 and
-- sam-answer-calls-on-the-card-2026-10-09 (verified, Sam's words), activities-ui-pass-2026-10-09 (proposed).
