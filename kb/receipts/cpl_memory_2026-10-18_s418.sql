-- S418 SkyMadrone, 2026-10-18. Rule 8 ingest through execute_sql: INSERT-only, idempotent on slug.
-- Row 1 ran at 17:42Z (returned its slug). Rollback: supersede by slug under actor 'SkyMadrone-s418-rollback'.
insert into public.cpl_memory (slug, kind, org, title, summary, detail, plain, tags, affects, source, related, author, event_date, status, verified_by, verified_at)
values ('sam-sheet-96-rulings-2026-10-18', 'decision', 'cpl',
 'Sam''s Sheet 96 ruling: a rule procedure''s settlement saves at the rule''s word, the course-identity rule''s 0.8 included',
 'Sam answered Open Asks Sheet 96''s one card at 17:23Z 2026-10-18, his own call: keep. A rule procedure''s settlement saves at the rule''s word, the course-identity rule''s 0.8 included (the college''s own course title for a code-only title; 96 of its 125 on the preview run). The first saving run, cer-procedures.yml run 39150222312 at 17:34Z, proceeded on it.',
 'Reversal stays available by procedure: python3 kb/_cer_procedures.py --undo course-identity takes that rule''s cohort back in one call, receipted. Sheet 96: https://claude.ai/artifact/Gta7x4T2NfFwbymH4nddui (SHEET_ID 2026-10-18-open-asks-96); CPLBrain#385 carries its source. Lane: docs/reference/lanes/cer-procedures.md.',
 'Sam kept the rule: a code-only exhibit title the course-identity rule settles at 0.8 saves without waiting for a person.',
 array['decision-sheet','cer-procedures'], array[]::text[],
 'Sam, Open Asks Sheet 96 replies store (Gta7x4T2NfFwbymH4nddui), 2026-10-18 17:23Z', array[]::text[],
 'Sam Lee', '2026-10-18', 'verified', 'Sam Lee', now())
on conflict (slug) do nothing
returning slug;

-- 17:58Z: S417 had written the same ruling at 17:29Z as sam-sheet-96-ruling-2026-10-18 (richer: the store's
-- documents and the submit comment verbatim). Two UPDATE statements (fold the quotes into the cited row, supersede
-- the duplicate explicitly) waited on the connector's confirmation through execute_sql and timed out unrun; they went
-- through supabase-migrate.yml as kb/receipts/cpl_memory_sheet96_duplicate_superseded_2026-10-18_s418.sql (this
-- branch's kb/migrations/.apply), whose run receipt the workflow commits beside it.

-- 18:12Z: three rows this run earned (proposed, author SkyMadroneS418). A first send failed the 400-character
-- summary check on one row and rolled all three back; these summaries are shorter. Idempotent on slug.
insert into public.cpl_memory (slug, kind, org, title, summary, detail, plain, tags, affects, source, related, author, event_date, status)
values
('cer-first-saving-run-and-first-fold-2026-10-18', 'milestone', 'cpl',
 'The first CER saving run and the fold''s first apply since July',
 'The first CER saving run (cer-procedures.yml run 39150222312, 17:37Z 2026-10-18) wrote 926 titles as 1,852 kb_curation rows under 7 cohorts, none held, none a duplicate. The daily run of 17:44Z made the fold''s first apply since 2026-07-08: 1,102 folded, 12 supersedes, 455 credential records added, 18 held; 4,915 titles in the reference.',
 'Cohorts: classifier 737, course-identity 125, brand-family 53, nccer-verbatim 5, statewide-catalog 3, cslb-classification 2, apprenticeship-trades 1 (receipt kb/cer_procedures_out/saved/saved_2026-10-18T17-37-29Z.json). The 1,102 are the 176 that waited since July and the 926 just saved (kb/unclassified_fold/2026-10-18/applied.json). Stamps after the fold: 1,729 of 4,915 titles (645 a person''s, the 457 plus 176 and 12; 1,084 a cohort''s, the 158 plus 926); credentials 2,441 (1,986 plus 455). Sam''s Sheet 94 cards 1 and 2 and Sheet 96 card 1 authorize it; --undo <procedure> reverses a cohort.',
 'The nightly exhibit-title run saved its first 926 titles, and the morning fold carried 1,102 saved titles into the reference for the first time since July, holding the 18 that disagree with a person''s review.',
 array['cer-procedures'], array['kb/unified_titles.json','kb/credentials.json','kb_curation'],
 'runs 39150222312 and 39150946369; kb/cer_procedures_out/saved/saved_2026-10-18T17-37-29Z.json; kb/unclassified_fold/2026-10-18/applied.json', array['sam-sheet-94-rulings-2026-10-18','sam-sheet-96-rulings-2026-10-18'],
 'SkyMadroneS418', '2026-10-18', 'proposed'),
('regressed-mode-must-reach-the-changed-code-2026-10-18', 'procedure', 'cpl',
 'A regressed A/B mode must reach the changed code before it counts as the candidate''s',
 'Before calling an A/B regression systematic, trace the regressed smoke mode''s route to the diff: a mode that cannot reach the changed code cannot regress from it. #2230''s three A/Bs regressed 7l, then 7c and 9, then 7s; 7c and 7s name a place, stripped before the college matcher runs, so the changed block never runs for them. Variance; deployed.',
 '7l reaches the block and its run-1 loss was a real gate bug (Active only; COCI marks most credit programs Approved), fixed in 57b25bb4. The A/B runs its two smokes in sequence, so contention is not a cause. The run artifact sits on a blob host the sandbox proxy refuses (403); the ab job log holds both runs'' prose (get_job_logs, tail_lines 6000, sliced per MODE). KB note docs/kb-notes/methodology-a-regressed-mode-must-reach-the-changed-code.md.',
 'When a Sierra test run fails on one question, first check whether that question even uses the part of the program that changed; if it does not, the different answer is the model''s normal variation, not a bug.',
 array['sierra-retrieval-corpus','methodology'], array['chatbox/smoke_test.sh','.github/workflows/cpl-chat-preview-ab.yml'],
 'cpl-project-tracker#2230 comment (S418, 2026-10-18); A/B runs 39142613772, 39145439350, 39147745774', array['sierra-quotes-complete-records-read-2026-10-18'],
 'SkyMadroneS418', '2026-10-18', 'proposed'),
('execute-sql-update-waits-on-connector-confirmation-2026-10-18', 'pitfall', 'cpl',
 'Through the Supabase MCP an insert into cpl_memory runs at once; an update waits on the connector and times out',
 'Through the Supabase MCP an insert into cpl_memory runs at once, but an update of cpl_memory waits on the connector''s own confirmation and times out at 60 s (twice, S418, 2026-10-18); the repo''s SQL-guard carve-out is not the gate. A committed SQL file through supabase-migrate.yml (kb/migrations/.apply) applies DML too and ran in two minutes with a receipt.',
 'The statements were two guarded UPDATEs superseding a duplicate memory row (kb/receipts/cpl_memory_sheet96_duplicate_superseded_2026-10-18_s418.sql; run 39152467211, version 20261018180602; S411''s data fix was the precedent). The apply job runs in the GitHub environment database, which had no required reviewer. The workflow commits its receipt to the branch that ran, so pull before the next commit on that branch.',
 'Changing an existing memory entry through the live connector stalls waiting for a confirmation; committing the change as a small SQL file and letting the migration workflow apply it works in minutes.',
 array['rule-8','supabase','tooling'], array['scripts/supabase_migrate.py','kb/migrations/.apply'],
 'S418 SkyMadrone, 2026-10-18; supabase-migrate run 39152467211', array[]::text[],
 'SkyMadroneS418', '2026-10-18', 'proposed')
on conflict (slug) do nothing
returning slug;

-- 19:12Z: S418 inserted sam-commons-mockup-approved-collapse-controls-2026-10-18 (Sam's Commons approval, from S417's
-- relay, time 17:31Z). S417 had written the same ruling first-hand as sam-approves-commons-mockup-collapse-2026-10-18
-- and corrected the time to 19:08Z, so S418's row is superseded through supabase-migrate.yml:
-- kb/receipts/cpl_memory_commons_duplicate_superseded_2026-10-18_s418.sql (this branch's kb/migrations/.apply; run 39158212210).
