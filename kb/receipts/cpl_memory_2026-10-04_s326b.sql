-- S326 (SkyAddendum) checkpoint, 2026-10-04: three more rows (author 'SkyAddendum-s326'). Idempotent.
-- Rollback: supersede the rows by slug.
insert into public.cpl_memory (slug, title, kind, summary, detail, plain, tags, affects, source, author, event_date, status, verified_by, verified_at)
values
('program-requirement-records-live-2026-10-04', 'Checked program records sit where Sierra reads them; she names required courses and the printed total for them', 'milestone',
 'program_requirement_records holds the 20 pilot records, all checked (scorer passed and Sam''s reading ok, or fix carried out by rerun 37195340082); anon reads checked rows only. cpl-chat renders a checked program as CATALOG REQUIREMENTS (PR #1851); every other program keeps "lists". Live for Sierra only after #1851 merges and cpl-chat deploys.',
 'Loader kb/_program_requirements_load.py (--check). Loaded in four migrations; md5 of record::text, checks::text and the columns matched the repo files on all 20 rows, computed locally with jsonb key order (length, then bytes). The table stores {program, blocks}; the extraction notes stay in the repo. Privilege close: kb/receipts/program_requirement_records_close_2026-10-04_s326.sql (open-asks sheet 31).',
 'Sierra can now say which courses a checked program requires.', array['program-requirements','sierra']::text[], array['chatbox/supabase_program_requirement_records.sql','kb/_program_requirements_load.py']::text[],
 'S326 migrations program_requirement_records_2026_10_04 and _load_..._part_1-4; PR #1851', 'SkyAddendum-s326', '2026-10-04', 'proposed', null, null),
('smoke-negative-moves-when-its-program-gains-data-2026-10-04', 'A smoke negative tied to one program goes stale when that program gains data', 'pitfall',
 'Smoke 7l asserted "never adds up the units" on Mt. SAC''s LVN-to-RN degree, which became a checked record in S326, where Sierra may give the printed total. The negative moved to 7q on El Camino''s Welding, a college with no record, and 7l now expects the 2026-2027 catalog. Put a negative on a subject the change cannot reach.',
 'chatbox/smoke_test.sh modes 7l and 7q; tests/sierra_program_courses.test.js block 9 pins 7l''s question.',
 'A test that checks for something absent breaks when the data fills in.', array['sierra','smoke','methodology']::text[], array['chatbox/smoke_test.sh']::text[],
 'PR #1851', 'SkyAddendum-s326', '2026-10-04', 'proposed', null, null),
('santa-monica-program-maps-open-2026-10-04', 'Santa Monica''s program maps page answers; filed as an open sequence source', 'fact',
 'The registry-aware probe (run 37209313523) found Santa Monica''s Program Maps page answering after a morning timeout; filed as sequence_access open (receipt ..._2026-10-04b_s326.sql). Registry now: 18 refused, 5 not read, 2 open (Irvine Valley, Santa Monica). The probe''s changed() now flags an unreached page that loads as well as a refused host that opens.',
 'kb/_program_sequence_ppm.py changed(); tests/program_requirements_pilot_test.py pins both directions.',
 'Two colleges publish program maps the reader can open.', array['program-requirements','sequence','registry']::text[], array['kb/_program_sequence_ppm.py']::text[],
 'probe run 37209313523; migration program_source_registry_sequence_access_2026_10_04_santa_monica', 'SkyAddendum-s326', '2026-10-04', 'proposed', null, null)
on conflict (slug) do nothing;
