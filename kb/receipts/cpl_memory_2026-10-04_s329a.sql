-- S329 (SkyRunner), 2026-10-04 ~21:40Z: Rule 8 ingest - six rows.
-- New (author 'SkyRunner-s329'): Sam's scheduled-session terms and his "apply the procedure record"
-- (decisions, verified: his words); the job-log window and the in-session go (pitfalls, proposed); what
-- the Cerritos reads confirmed and the statement deploy (facts, proposed).
-- Rollback: supersede each row by slug under actor 'SkyRunner-s329-rollback'.

insert into public.cpl_memory (slug, title, kind, summary, detail, plain, tags, affects, source, author, event_date, status, verified_by, verified_at)
values
('sam-scheduled-sessions-terms-2026-10-04',
 'Sam: a routine starts sessions on a schedule; go with the recommendation more often, up to 6 sessions, Fable as advisor',
 'decision',
 'Sam, 2026-10-04 (S329): "be more aggressive and go with your recommendations more often--I''m guessing that about 80% of the time I go with your recommendation--and very rarely would your recommendations have led to a grave error. 2. Go for up to 6 sessions... 3. Decide on the fly the effort to set and feel free to add Fable as an advisor when needed."',
 'He asked whether an agent could start the next session from the handoff until he stops it or too many questions pile up. The permission check refused a session-started chain twice (Create Unsafe Agents), so Sam chose to create a routine himself: "I''ll make the routine--give me the exact steps and wording". The rules for the sessions it starts are docs/reference/scheduled_sessions.md: one session at a time, a pause line in the handoff, act on a clear and reversible recommendation and card it for review, the holds, a permission denial is a hold, effort and Fable.',
 'Sam lets scheduled sessions act on their own recommendations when a step can be undone, up to six sessions a day, and he starts them with a routine he set up himself.',
 array['scheduled-sessions','governance','decision-sheet','fable','autonomy'], array['docs/reference/scheduled_sessions.md','CLAUDE.md'],
 'Sam in session S329, 2026-10-04 ~21:05-21:20Z', 'SkyRunner-s329', '2026-10-04', 'verified', 'Sam', now()),
('sam-apply-procedure-record-2026-10-04',
 'Sam: apply the procedure record (Cerritos first)',
 'decision',
 'Sam, 2026-10-04 ~21:20Z: "apply the procedure record". Migration program_source_registry_procedure_2026_10_04 added procedure, procedure_by and procedure_at to program_source_registry (the history trigger names procedure_by). Cerritos''s row UPDATE timed out twice at the connector with nothing written; open-asks sheet 35 carries it to paste.',
 'The record (kb/receipts/program_source_registry_procedure_2026-10-04_s329.sql) holds six hosts, three reading steps, four answers, five nuances and three next steps from college-page-read runs 37232742985, 37233721702 and 37234256967; it names hosts and offices, never staff, since anon reads the registry. kb/_college_page_read.py loads it before each run and skips a host marked refused or unreached. Sheet: https://claude.ai/artifact/FVG2MYA9Xw5HqC8EkAftgq.',
 'Each college now has a place to keep the notes on how its website should be read; Cerritos''s first notes wait for Sam to paste them in.',
 array['program-requirements','procedure-record','cerritos','registry','decision-sheet'], array['docs/reference/lanes/program-requirements-harvest.md','kb/supabase_program_source_registry.sql'],
 'Sam in session S329, 2026-10-04', 'SkyRunner-s329', '2026-10-04', 'verified', 'Sam', now()),
('github-mcp-job-log-window-5000-lines-2026-10-04',
 'The GitHub MCP returns at most 5,000 lines of a job log',
 'pitfall',
 'get_job_logs returns the last 5,000 lines however large tail_lines is. Read 1 of the Cerritos page read printed 5,826 lines and lost its first two pages, the Field Ironwork page among them. A long result saves to disk; parse it with python. kb/_college_page_read.py now folds runs of short lines and reads a page''s main region, so a 15-page read fits in 1,752 lines.',
 'Measured S329 on run 37232742985 (original_length 5,826; the 6,000-line request returned 5,000). A college site wraps each page in a menu, a footer and a 240-language picker, each a run of short lines.',
 'When a job prints a long log, the tool that reads it back only sees the last part, so a long report has to be kept short to be read whole.',
 array['github-mcp','ci','logs','runner','program-requirements'], array['kb/_college_page_read.py'],
 'S329 college-page-read runs 37232742985 and 37233721702', 'SkyRunner-s329', '2026-10-04', 'proposed', null, null),
('auto-mode-needs-the-go-in-session-2026-10-04',
 'An authorization in a handoff or a sheet does not carry into the permission check',
 'pitfall',
 'S329: the auto-mode check held three actions whose authority sat in a handoff or a sheet: reading on after a deploy dispatched under the handoff''s standing A/B authorization (Production Deploy), a registry write sheet 34 approved (Modify Shared Resources), and a session-started relay Sam had said yes to in chat (Create Unsafe Agents). The first two cleared on Sam''s words in session.',
 'Do not route around a denial. Say what was asked and why, carry on with work that does not depend on it, and ask Sam for the go in his own words; a session-started chain does not clear, so Sam created the routine himself (docs/reference/scheduled_sessions.md). The connector also holds a bare UPDATE through apply_migration for a person (two 60 s timeouts, nothing written); the receipt goes on a sheet card to paste.',
 'The safety check only accepts approval Sam gives in the conversation itself, and it never lets a session start other sessions on its own.',
 array['permissions','auto-mode','governance','supabase','scheduled-sessions'], array['docs/reference/scheduled_sessions.md'],
 'S329 session, 2026-10-04', 'SkyRunner-s329', '2026-10-04', 'proposed', null, null),
('cerritos-ironworker-reads-confirmed-2026-10-04',
 'Cerritos Ironworker: what three runner reads confirmed',
 'fact',
 'Runner reads (S329): classroom hours 878 on the Reinforcing track and 898 on the Structural (2026-27 IWAP course descriptions); a four-year apprenticeship; the B.S. open to graduates from Spring 2027; its 2024 regional course list of 23 courses and 60 units with a GE-pattern admission rule; all 26 AED 40.01-41.10 courses in the catalog; WELD 60 renamed WELD 160.',
 'Sources: cerritos.edu Field_Ironwork.htm, the courseleaf catalog (program, IWAP, AED, WELD pages), regionalcte.org/browse/ZyxAg (recommended June 2024), the State of the College release (May 2026), Downey Unified''s June 2023 board presentation (Columbus High welding maps to WELD 60/160 and WELD 100). Still open: whether the approved B.S. keeps the list, AED sections this term (Schedule+ form), and how high school credit is granted (agreements through Statewide Career Pathways). hsarticulation.cerritos.edu has no DNS record.',
 'Reading Cerritos''s own pages settled most of the open lines on the ironworker pathway, including how many classroom hours the apprenticeship carries.',
 array['cerritos','ironworker','cpl-pathways','program-requirements','runner-read'], array['cpl_pathways_data.js','docs/reference/lanes/program-requirements-harvest.md'],
 'college-page-read runs 37232742985, 37233721702, 37234256967 (PR #1858)', 'SkyRunner-s329', '2026-10-04', 'proposed', null, null),
('sierra-statement-deployed-2026-10-04',
 'Sierra states who CPL serves in production (#1856, deployed 2026-10-04)',
 'fact',
 'A/B 37230411476: no regressions, preview all modes OK; production failed 7c in the same run with no change, so 7c''s earlier regression was flake. Deployed by run 37231799184 (20:21Z) and again by 37232150199 (20:27Z, same code, a second session racing); production smoke 37231826035 ALL MODES OK, 7u included.',
 'Two sessions worked the same handoff for about ten minutes; Sam closed one. One session at a time is now a rule for scheduled sessions.',
 'Sierra now names California''s 116 community colleges and Cal State LA when asked who the CPL Initiative serves.',
 array['sierra','deploy','statement','college-identity'], array['chatbox/supabase/functions/cpl-chat/index.ts'],
 'GitHub Actions runs 37230411476, 37231799184, 37232150199, 37231826035', 'SkyRunner-s329', '2026-10-04', 'proposed', null, null)
on conflict (slug) do nothing;

insert into public.cpl_memory_log (memory_id, actor, action, note, after)
select id, 'SkyRunner-s329', 'create', 'S329 checkpoint', to_jsonb(m)
from public.cpl_memory m where m.slug in ('sam-scheduled-sessions-terms-2026-10-04','sam-apply-procedure-record-2026-10-04','github-mcp-job-log-window-5000-lines-2026-10-04','auto-mode-needs-the-go-in-session-2026-10-04','cerritos-ironworker-reads-confirmed-2026-10-04','sierra-statement-deployed-2026-10-04')
 and not exists (select 1 from public.cpl_memory_log l where l.memory_id = m.id and l.action = 'create');

select m.slug, m.status, (select count(*) from public.cpl_memory_log l where l.memory_id=m.id and l.action='create') creates from public.cpl_memory m where m.slug in ('sam-scheduled-sessions-terms-2026-10-04','sam-apply-procedure-record-2026-10-04','github-mcp-job-log-window-5000-lines-2026-10-04','auto-mode-needs-the-go-in-session-2026-10-04','cerritos-ironworker-reads-confirmed-2026-10-04','sierra-statement-deployed-2026-10-04') order by m.slug;
