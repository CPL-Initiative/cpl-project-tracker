-- S420 SkyTanoak, 2026-10-19 ~03:25Z. Rule 8 ingest through execute_sql: INSERT-only, new slugs dated today,
-- author Sam Lee for his ruling (verified, verified_by Sam Lee) and SkyTanoakS420 for the two session rows (proposed).
-- Rollback: supersede by slug under actor 'SkyTanoak-s420-rollback'.
insert into public.cpl_memory (slug, kind, org, title, summary, detail, plain, tags, affects, source, related, author, event_date, status, verified_by, verified_at)
values
('sam-sheet-97-second-reader-grok-2026-10-19', 'decision', 'cpl',
 'Sam''s Sheet 97 ruling: build a second reader with xAI''s Grok over the harvest records that fail a machine check',
 'Sam, Open Asks Sheet 97 card 1, 03:11Z 2026-10-19, his own call: Build with Grok. A second model re-reads each harvest record that fails a machine check; the scorer scores both readings; agreement is evidence, disagreement a known issue carrying both. First tranche: the 93 failing records at Cañada, Taft and San Joaquin Delta. Waits on the XAI_API_KEY repo secret only Sam can create.',
 'His words of ~02:33Z: "perhaps begin using Grokbot if it could multiple and diversify our work"; the card read Grokbot as xAI''s Grok and said so, and he chose Build with Grok over a second Claude model. Public catalog text only (his 2026-10-04 ruling). The build: the extraction Edge Function takes a provider parameter so both readers share one prompt and record shape; kb/_second_reader.py runs the failing records through it on a runner; xai-smoke.yml verifies the key first.',
 'Sam approved adding a second AI model, Grok, to re-read the program requirement records that fail the automatic checks, so two independent readings can be compared; it starts once he adds the Grok key to the repository''s secrets.',
 array['decision-sheet','program-requirements','harvest','second-reader'], array['docs/reference/lanes/program-requirements-harvest.md','.github/workflows/xai-smoke.yml'],
 'Sam, Open Asks Sheet 97 replies store (1eWaN6UmVnKaJhGYTqQtfN), 2026-10-19 03:11Z', array['sam-trust-procedures-no-per-item-approval-2026-10-17','sam-extraction-standing-go-40-per-college-2026-10-14'],
 'Sam Lee', '2026-10-19', 'verified', 'Sam Lee', '2026-10-19T03:11:49Z'),
('jev-harvest-sitting-uncalibrated-2026-10-19', 'milestone', 'cpl',
 'Jev sits over the harvest''s failing records: a typed cause per record, uncalibrated until a person''s verdicts set a gate',
 'kb/_jev_harvest.py (typesafe-smoke.yml, input harvest=<college>): the runner captures the college, then one System One call per record failing a machine check asks Jev the cause (seven typed causes), who would fix it, and three page facts. No gate is measured for the harvest, so every row is uncalibrated and nothing is proposed; the first sittings are the calibration. Suggests, never edits.',
 'State: the record''s figures and blocks, the checks'' verdicts, the page text the reader handed the model cut to 6,000 characters (or a note that none is in hand). Owners: reader_procedure, extraction, scorer, college_catalog, state_list, none. Output kb/jev_out/harvest_<slug>.json, uploaded as the jev-harvest artifact. 18 stdlib checks in tests/jev_harvest_test.py, in the lints job.',
 'A fast judgment model now reads every failing program record at a college and names the likely cause and who should fix it, so a session starts from a ranked list instead of reading each page cold; its answers are advisory until checked against a person''s verdicts.',
 array['program-requirements','harvest','jev','typesafe'], array['kb/_jev_harvest.py','.github/workflows/typesafe-smoke.yml','tests/jev_harvest_test.py'],
 'S420 SkyTanoak, 2026-10-19; cpl-project-tracker#2245', array['jev-magic-half-one-module-for-every-reference','advice-where-a-system-one-model-fits-this-repo-2026-09-20'],
 'SkyTanoakS420', '2026-10-19', 'proposed', null, null),
('data-pr-needs-its-display-build-2026-10-19', 'pitfall', 'cpl',
 'A harvest data PR fails lints until the branch carries its display build',
 'The lints job''s ROEP display test reads the committed display receipt against the branch''s record folders: Cañada''s re-read (8 records new, 17 replaced) failed it on cpl-project-tracker#2244 (run 39191885428) until kb/_build_roep_display.py ran on the branch and its two outputs were committed (build 3aa52b4afcb6). One display build per wave, on the branch, before the merge.',
 'The runner''s read, reread and load steps commit records and receipts and no display build; the sweep''s wave branches carried one by hand. The step=display dispatch on main applies the build the page carries after the merge.',
 'When new program records are filed, the published page''s data must be rebuilt in the same branch, or the automated checks flag the mismatch.',
 array['program-requirements','harvest','ci'], array['kb/_build_roep_display.py','tests/roep_display_test.py'],
 'cpl-project-tracker#2244; runs 39191885428, 39192964955', array['canada-pdf-heading-shapes-2026-10-18'],
 'SkyTanoakS420', '2026-10-19', 'proposed', null, null);
insert into public.cpl_memory_log (memory_id, actor, action, note, after)
select id, 'SkyTanoakS420', 'create', 'checkpoint auto-write (S420, 2026-10-19)', to_jsonb(m)
from public.cpl_memory m where m.slug in ('sam-sheet-97-second-reader-grok-2026-10-19','jev-harvest-sitting-uncalibrated-2026-10-19','data-pr-needs-its-display-build-2026-10-19');
