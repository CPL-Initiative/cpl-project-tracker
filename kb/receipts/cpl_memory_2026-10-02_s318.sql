-- S318 (SkyKeel), 2026-10-02: Rule 8 ingest - five new rows, all logged.
-- New (author 'SkyKeel-s318'): Sam's program-course ask (decision, verified: his words), the TOP-proxy
-- measurement (fact), the course list's Desert/Citrus misfiling (fact), the MCP destructive-confirm timeout
-- (pitfall), and the catalog loaders' open EXECUTE grant (risk).
-- Rollback: supersede the five rows by author 'SkyKeel-s318' under actor 'SkyKeel-s318-rollback'.

insert into public.cpl_memory (slug, title, kind, summary, detail, plain, tags, affects, source, author, event_date, status)
values
('sam-sierra-program-course-lists-2026-10-02',
 'Sam: Sierra should list the courses in a program at a given college',
 'decision',
 'Sam, 2026-10-02 (S318): "Can you work on giving Sierra good access to the MIS program and course dataset? I believe we have this huge set...advise. Goal is to be able to list the courses in particular programs at a given college." Built: coci_program_courses (#1826) and the college_program_courses route (#1828).',
 'The set is the CCCCO Data Mart Program Course File (kb/reference/coci_program_course_file.csv.gz, 401,163 rows, export 2026-07-16) beside the MIS Master Course File (cb_course_basic_fall2025.csv). Loaded: 313,710 rows, 20,451 of 22,335 catalog programs, 118 colleges. The source has no required/elective flag, so Sierra says a program lists a course, never that it requires it.',
 'Sam asked for Sierra to be able to name the courses in a particular program at a particular college. The state already publishes which courses belong to which program; this work loads that list where Sierra can read it.',
 array['sierra','program-course','coci','sierra-retrieval'],
 array['chatbox/build_program_courses.py','chatbox/supabase_college_program_courses.sql','chatbox/supabase/functions/cpl-chat/index.ts'],
 'Sam, S318 opening note, 2026-10-02', 'SkyKeel-s318', '2026-10-02', 'verified'),
('top-proxy-finds-a-third-of-program-courses-2026-10-02',
 'The TOP proxy finds a third of a program''s courses',
 'fact',
 'Against the CO Program Course File (2026-07-16), over 19,883 active programs, listing a program''s courses as every course at its college sharing its TOP code finds a median 33% of them (mean 41%), and a median 44% of what it returns is in the program. 2,707 programs: none found. Mt. San Antonio LVN-to-RN A.S.: 7 of 27.',
 'Recall restricted to member courses present in the MIS course file: median 45%. Only 236 programs match exactly; 12,739 miss half or more. The proxy misses the cross-subject courses a program lists (anatomy, physiology, microbiology, English, psychology for the Mt. SAC A.S.) and adds same-TOP courses it does not list. Sierra''s prospective-credit block (fetchProgramCourses) still uses this proxy.',
 'Guessing a program''s courses from its subject code gets about a third of them right. The real lists come from the state''s program file.',
 array['sierra','program-course','top-code','measurement'],
 array['chatbox/supabase/functions/cpl-chat/index.ts'],
 'S318 measurement, scratch script over the committed files', 'SkyKeel-s318', '2026-10-02', 'proposed'),
('course-list-misfiles-desert-under-citrus-2026-10-02',
 'The course list files some College of the Desert courses under Citrus College',
 'fact',
 'coci_course_list.xlsx files some College of the Desert courses under Citrus College (AUTO 10, CCC000631388; 110 control numbers appear under both). The MIS Master Course File puts them at Desert (931), the college whose program lists them. chatbox_college_courses inherits the misfiling; build_program_courses.py takes MIS as owner.',
 'Measured 2026-10-02: 77 program-course rows had the course list''s college overruled by MIS CB_COLLEGE_ID. The remaining sister-college rows are the Riverside district''s shared course records (Norco and Moreno Valley programs listing RCC courses), which are real.',
 'One state file lists some of College of the Desert''s courses under a different college. Another state file has them right, and the new course lists use that one.',
 array['coci','data-quality','program-course','sierra'],
 array['kb/reference/coci_course_list.xlsx','chatbox/build_program_courses.py'],
 'S318 measurement', 'SkyKeel-s318', '2026-10-02', 'proposed'),
('mcp-apply-migration-destructive-confirm-times-out-2026-10-02',
 'apply_migration times out on drop, revoke or delete',
 'pitfall',
 'S318: the Supabase MCP apply_migration timed out at 60 s, applying nothing, on every statement carrying drop, revoke or delete, including a delete inside a plpgsql body. Its destructive-statement confirm waits for a person. Create-only migrations applied at once. Read back after each timeout; hand the rest to Sam as a paste or an attended call.',
 'Four timeouts, each read back via pg_class, pg_proc and supabase_migrations.schema_migrations: nothing applied, nothing left running. The successful split: create table; create index plus create policy; add column; create or replace of a read-only sql function. Never reword a statement to dodge the confirm.',
 'The database tool asks a person before it removes anything. With no one watching, those changes wait for Sam.',
 array['supabase','mcp','migrations'],
 array['chatbox/supabase_program_courses.sql','chatbox/supabase_search_college_programs.sql'],
 'S318 observation', 'SkyKeel-s318', '2026-10-02', 'proposed'),
('catalog-loader-functions-open-to-authenticated-2026-10-02',
 'The three catalog loader functions are open to signed-in users',
 'risk',
 'Read live 2026-10-02: coci_programs_replace, coci_offerings_replace and college_geo_replace (SECURITY DEFINER, each deletes its whole table before inserting) grant EXECUTE to authenticated. Only the sync''s service key needs them. The revoke is written in chatbox/supabase_search_college_programs.sql, pending the destructive confirm (Sam).',
 'proacl {postgres=X, authenticated=X, service_role=X}: PUBLIC and anon already closed, authenticated not. Rule 10 b2. Paste-ready SQL handed to Sam as 20261002_S318_pending_migration.sql, with the programs loader carrying control_number.',
 'Any signed-in user could empty Sierra''s catalog tables through three functions meant only for the nightly loader. The fix is written and waits on Sam''s approval.',
 array['supabase','grants','security','sierra'],
 array['chatbox/supabase_search_college_programs.sql'],
 'S318 live read of pg_proc.proacl', 'SkyKeel-s318', '2026-10-02', 'proposed')
on conflict do nothing;

insert into public.cpl_memory_log (memory_id, actor, action, note, after)
select m.id, 'SkyKeel-s318', 'create', 'S318 ingest', to_jsonb(m)
from public.cpl_memory m
where m.author = 'SkyKeel-s318'
  and not exists (select 1 from public.cpl_memory_log l where l.memory_id = m.id and l.action = 'create');
