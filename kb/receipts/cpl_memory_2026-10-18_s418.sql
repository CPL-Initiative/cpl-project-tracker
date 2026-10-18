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
-- documents and the submit comment verbatim). The cited row keeps those quotes; the earlier duplicate is
-- superseded explicitly (same source, same fact). Rollback: set its status back to 'verified' and clear superseded_by.
update public.cpl_memory
set detail = detail || ' Store detail (S417 read, 17:29Z): doc 1 {by: sam, item: 1, v: keep, note: empty, fu: false, t: 2026-10-18T17:23:15.026Z}; doc done {ruled: 1, items: 1, through: 1, sent: true}; submit comment (thread 8fb38942-84ed-4d13-a17d-cd2a587b71aa): "Decisions done on 2026-10-18-open-asks-96 - 1 of 1 items your own call. 1 keep - reviewed through 1 (the whole sheet)." Verifies S416''s proposed row rule-settlement-saves-at-the-rules-word-2026-10-18 (marked verified 17:23Z).',
    tags = array['decision-sheet','decision-sheets','cer-procedures','rule-10'],
    updated_at = now()
where slug = 'sam-sheet-96-rulings-2026-10-18'
returning slug;

update public.cpl_memory
set status = 'superseded',
    superseded_by = 'sam-sheet-96-rulings-2026-10-18',
    detail = detail || ' Superseded by S418 (17:58Z): the same ruling was written twice, by S417 at 17:29Z and by S418 at 17:43Z before S417''s row was seen; sam-sheet-96-rulings-2026-10-18 keeps this row''s store quotes and is the row the CER lane, the vault and cpl-project-tracker#2235 cite. Same source, same fact, nothing lost.',
    updated_at = now()
where slug = 'sam-sheet-96-ruling-2026-10-18'
returning slug;
