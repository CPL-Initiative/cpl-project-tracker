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
