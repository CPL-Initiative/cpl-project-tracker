-- Library side session (beside the numbered queue), 2026-10-06: what this run measured and built.
-- Session-sourced, so status proposed. INSERT-only; rollback: supersede each row by slug.
insert into public.cpl_memory (slug, title, kind, summary, detail, plain, tags, affects, source, author, event_date, status, verified_by, verified_at)
values
('drive-file-scope-cannot-write-into-cpllibrary-2026-10-06',
 'Google''s drive.file scope cannot write into CPLLibrary, so the filer signs in with the full Drive scope',
 'fact',
 'Checked 2026-10-06 for Sam''s call 7: an app holding drive.file may create files only in folders it created ("User cannot add children" otherwise). Sam made CPLLibrary by hand, so scripts/library_file.py asks for the full https://www.googleapis.com/auth/drive scope and fences itself to CPLLibrary and its Drafts folder.',
 'The app must be Published, not Testing: in Testing Google ends the refresh token after 7 days. CPLLibrary is owned by camapinitiative@gmail.com (a personal account, so the consent screen is External and shows the unverified-app warning). Setup and failure modes: docs/reference/library_filer.md.',
 'The filer needs permission to the whole Drive, because the narrow permission only reaches folders the filer made itself.',
 array['library','drive','filer','oauth'], array['scripts/library_file.py','docs/reference/library_filer.md'],
 'claudeissues.com #77073 (the Drive connector hit the same wall); docs/reference/library_filer.md', 'library-s2-2026-10-06', '2026-10-06', 'proposed', null, null),
('library-filer-receipt-applied-as-named-migration-2026-10-06',
 'A filer receipt goes in through apply_migration under the name the filer prints; execute_sql refuses the write',
 'procedure',
 'Measured 2026-10-06: the Supabase guard denies an UPDATE of cpl_library through execute_sql, even inside begin ... rollback. A receipted data write goes in as a named migration (as cpl_library_seed_2026_10_05 did), so scripts/library_file.py prints cpl_library_file_<date>_<slug>_<file> and the session applies its receipt under that name.',
 'Each receipt is guarded on the Drive file id. Rehearsed on a copy of the live rows in local Postgres 16: the six PR 2 files (four --move to CPLLibrary, two Summit cuts to Drafts), a v2 and a Requested record''s first draft each gave UPDATE 1, then UPDATE 0 on a second apply; the history trigger filed each prior row.',
 'After the filer uploads a file, the session records it in the Library by applying the receipt the filer wrote.',
 array['library','filer','supabase','receipts'], array['scripts/library_file.py','scripts/supabase_sql_guard.py','kb/receipts/library_filed/'],
 'session measurement 2026-10-06', 'library-s2-2026-10-06', '2026-10-06', 'proposed', null, null),
('library-start-a-piece-built-2026-10-06',
 'Start a piece is live: a brief saves a Requested record, and In development tracks it until approval',
 'milestone',
 'PR #1883, as Sam approved mockup version 2: the brief saves a Requested record (brief jsonb, migration cpl_library_start_a_piece). A Requested record, or a briefed one at Draft, shows under In development and never counts as Not filed; approval moves it to the register. Copy the brief carries the filer command for that record.',
 'Sam''s routine reads Requested records as queue items: docs/reference/scheduled_sessions.md, At the start, step 6. Verified in Chromium at 1280 and 390 px, light and dark; lowest text contrast 5.72:1.',
 'Anyone on the team can now ask for a deck, spreadsheet, film or document from the Library tab, and follow it from request to presented.',
 array['library','cobi','start-a-piece'], array['library.js','kb/supabase_cpl_library.sql','docs/reference/scheduled_sessions.md'],
 'PR #1883', 'library-s2-2026-10-06', '2026-10-06', 'proposed', null, null),
('open-asks-builder-moved-to-vault-2026-10-06',
 'The open-asks sheets, their builder, its guard and decision_sheets.md now live in CPLBrain/decision-sheets/',
 'milestone',
 'Sam''s call 9, carried out 2026-10-06 (CPLBrain#255, tracker #1885): the 47 sheets left the public tracker. The builder reads lanes, premises and kb/_decision_sheet_replies.py from the tracker clone beside the vault ($CPL_TRACKER_ROOT, else ../cpl-project-tracker); rebuilt there, sheet 44 was byte-identical.',
 'The coverage check now runs in scripts/check_generated.sh (it finds ../CPLBrain, ../COG-second-brain or $CPL_VAULT_ROOT, and fails when no vault is attached) and in the vault''s own CI (.github/workflows/decision-sheets.yml). The tracker''s public CI cannot read the vault, so it no longer runs it. The vault chatbox indexer skips decision-sheets/.',
 'The decision sheets that collect Sam''s open questions are now kept in the private vault instead of the public repo.',
 array['decision-sheets','vault','library','public-repo'], array['CPLBrain/decision-sheets/','scripts/check_generated.sh','.github/workflows/js-tests.yml'],
 'samueltlee/CPLBrain#255; CPL-Initiative/cpl-project-tracker#1885', 'library-s2-2026-10-06', '2026-10-06', 'proposed', null, null),
('environment-secrets-reach-only-new-sessions-2026-10-06',
 'A secret Sam adds to the environment reaches only sessions started after it, and a session may not start one itself',
 'pitfall',
 'The environment documentation says a new session picks up an added variable, and no session starts another (scheduled_sessions). So the filer''s end-to-end test and the six uploads wait for the next session Sam opens after saving the three Google secrets.',
 'Plan the hand-off: finish everything that does not need the secret, and write the exact commands for the next session (docs/reference/lanes/library.md, Next).',
 'A new password-like setting only works in the next chat Sam opens, so the work that needs it moves there.',
 array['environment','secrets','sessions','library'], array['docs/reference/lanes/library.md'],
 'session measurement 2026-10-06', 'library-s2-2026-10-06', '2026-10-06', 'proposed', null, null),
('needs-sam-marker-matches-plain-prose-2026-10-06',
 'The open-asks guard counts any "needs Sam" in a lane file as a marker, prose included',
 'pitfall',
 'Measured 2026-10-06: the open-asks builder matches NEEDS SAM case-insensitively, so "It needs Sam''s one-time Google sign-in" in the library lane made the coverage check refuse to build. Write the marker only where an ask goes on the sheet; reword plain prose ("waits on Sam").',
 'The regex lives in CPLBrain/decision-sheets/_build_open_asks_decision_sheet.py (NEEDS = re.compile(r''NEEDS SAM'', re.I)).',
 'Writing the words "needs Sam" in a lane file is read as an open question for Sam.',
 array['decision-sheets','lanes','guard'], array['CPLBrain/decision-sheets/_build_open_asks_decision_sheet.py','docs/reference/lanes/'],
 'session measurement 2026-10-06', 'library-s2-2026-10-06', '2026-10-06', 'proposed', null, null)
on conflict (slug) do nothing;

insert into public.cpl_memory_log (memory_id, actor, action, note, after)
select m.id, 'library-s2-2026-10-06', 'create', 'library side session, 2026-10-06', to_jsonb(m)
from public.cpl_memory m where m.author = 'library-s2-2026-10-06'
  and not exists (select 1 from public.cpl_memory_log l where l.memory_id = m.id and l.action = 'create');
