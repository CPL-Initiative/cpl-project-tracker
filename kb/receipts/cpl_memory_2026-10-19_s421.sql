-- S421 SkyTupelo, 2026-10-19 ~06:45Z. Rule 8 ingest through execute_sql: INSERT-only, new slugs dated today,
-- author SkyTupeloS421 (proposed). Rollback: supersede by slug under actor 'SkyTupelo-s421-rollback'.
insert into public.cpl_memory (slug, kind, org, title, summary, detail, plain, tags, affects, source, related, author, event_date, status)
values
('jev-cause-reliable-owner-a-hint-2026-10-19', 'fact', 'cpl',
 'Jev''s harvest sitting: the cause is a reliable ranking, the owner a hint',
 'Three sittings (Cañada 22, Taft 24, San Joaquin Delta 49 rows; no errors; seconds each after the free capture) with a session''s verdicts beside every row in kb/jev_harvest_verdicts/. Where the record''s own notes settle it, Jev''s cause held on 16 of 16 at Cañada, 15 of 21 at Taft and 17 of 49 at Delta, where 29 of the 32 misses are one page shape (a floor total against a ranged sum). The owner leans wrong the same way everywhere: the scorer or the extraction for a figure a procedure step supplies, or a page the reader cut. No gate is set.',
 'A verdicts file beside the sitting turns it into a worklist: grouping rows by cause found one fix for five Cañada rows (Cal-GETC''s 34), one for two Taft rows (the local GE pattern) and one scorer rule for 29 Delta rows (read the program total as a floor, as degree_total_minimum reads the degree total). The record''s notes quote the page, so a session settles most rows without it.',
 'Jev''s guesses about why a program record fails are usually right about the cause and often wrong about who should fix it; a person''s verdicts beside each guess are what turn a sitting into a work list.',
 array['jev','program-requirements','harvest','calibration'], array['kb/_jev_harvest.py','kb/jev_harvest_verdicts/'],
 'S421 SkyTupelo, runs 39197675380, 39204968617, 39206690775; kb/jev_harvest_verdicts/*.json', array['jev-harvest-sitting-uncalibrated-2026-10-19'],
 'SkyTupeloS421', '2026-10-19', 'proposed'),
('transfer-only-reconcile-step-awards-transfer-2026-10-19', 'pitfall', 'cpl',
 'A reconcile step for a figure only transfer degrees carry must say awards: transfer',
 'Cañada''s Cal-GETC step (set ge_units 34 on the line "Completion of Cal-GETC (California General Education Transfer Curriculum)", cited from the catalog''s own GE page) read every associate degree on its first run (39200870107) and filled six local A.A./A.S. records whose captured page spans the sibling transfer section; Earth Science A.S. 30427 then failed at 64 past 60. awards_match gained a transfer kind (#2247); tests/program_requirements_reconcile_test.py pins it. The reread dispatched on the wrong fills posted before its cancel landed; the six rows were restored from the receipt''s before-images through supabase-migrate.yml (run 39202436931), verified live.',
 'The rollback followed data_write_rollback: a fresh live read (all six exactly as the write left them), the receipt''s own SQL cut to the six, the migrate workflow because the Supabase guard holds an UPDATE from execute_sql, a rollback receipt beside the original. Dispatch a reread only after the filed records are what they should be.',
 'A catalog rule that applies only to transfer degrees has to be marked that way in the procedure, because a local degree''s captured page can include the neighboring transfer degree''s text.',
 array['program-requirements','harvest','reconcile','rollback'], array['kb/program_requirements_reconcile.json','kb/_program_requirements_reconcile.py','docs/reference/data_write_rollback.md'],
 'S421 SkyTupelo, #2247; kb/receipts/program_requirement_records_rollback_ca_ada_six_local_2026-10-19_s421.json', array['reread-path-live-2026-10-14','sam-trust-procedures-no-per-item-approval-2026-10-17'],
 'SkyTupeloS421', '2026-10-19', 'proposed'),
('second-reader-built-waits-on-function-secrets-2026-10-19', 'milestone', 'cpl',
 'The second reader is built; it waits on two Edge Function secrets and a deploy',
 'program-requirements-extract version 11 takes provider (anthropic or xai; the same system prompt, user message and record schema; the model from XAI_MODEL or the body, never guessed; the key scrubbed from errors). kb/_second_reader.py reads a college''s failing records from the page the first reading came from, scores the second reading with the one scorer and compares on requirements_md5 (agree, second_passes, both_fail_same_checks, disagree); second-reader.yml runs it and uploads the comparison; nothing is written (#2246). The key is an Edge Function secret per Sam''s call 6 on sheet 23; the repo secret xai-smoke.yml reads only proves the key and was unset at 04:05Z on 2026-10-19.',
 'Sam''s steps: XAI_API_KEY and XAI_MODEL on the function (Supabase project hvuwhnbuahrtptokpqfh), then cpl-chat-deploy.yml with function program-requirements-extract. Then second-reader.yml with college=Cañada College.',
 'The second AI reader Sam approved is built and tested; it runs once he adds the Grok key and model name to the extraction function''s secrets and the function is redeployed.',
 array['second-reader','program-requirements','harvest','edge-function'], array['chatbox/supabase/functions/program-requirements-extract/index.ts','kb/_second_reader.py','.github/workflows/second-reader.yml'],
 'S421 SkyTupelo, #2246', array['sam-sheet-97-second-reader-grok-2026-10-19'],
 'SkyTupeloS421', '2026-10-19', 'proposed')
on conflict (slug) do nothing;
insert into public.cpl_memory_log (memory_id, actor, action, note, after)
select id, 'SkyTupeloS421', 'create', 'checkpoint auto-write (S421, 2026-10-19)', to_jsonb(m)
from public.cpl_memory m where m.slug in ('jev-cause-reliable-owner-a-hint-2026-10-19','transfer-only-reconcile-step-awards-transfer-2026-10-19','second-reader-built-waits-on-function-secrets-2026-10-19');
