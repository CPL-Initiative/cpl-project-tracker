-- S418 SkyMadrone, 2026-10-18 18:00Z. cpl_memory hygiene: Sam's Sheet 96 ruling was written twice, by S417
-- (sam-sheet-96-ruling-2026-10-18, 17:29Z, with the store's documents verbatim) and by S418
-- (sam-sheet-96-rulings-2026-10-18, 17:43Z, the row the CER lane, the vault and PR #2235 cite). The cited
-- row keeps the store quotes; the earlier duplicate is superseded explicitly (same source, same fact).
-- Through supabase-migrate.yml because execute_sql holds an UPDATE for a confirmation (timed out twice).
-- Idempotent: each statement guards on its own effect. Rollback: set the superseded row's status back to
-- 'verified' and its superseded_by to null; the appended detail is prose and may stay.
update public.cpl_memory
set detail = coalesce(detail, '') || ' Store detail (S417 read, 17:29Z): doc 1 {by: sam, item: 1, v: keep, note: empty, fu: false, t: 2026-10-18T17:23:15.026Z}; doc done {ruled: 1, items: 1, through: 1, sent: true}; submit comment (thread 8fb38942-84ed-4d13-a17d-cd2a587b71aa): "Decisions done on 2026-10-18-open-asks-96 - 1 of 1 items your own call. 1 keep - reviewed through 1 (the whole sheet)." Verifies S416''s proposed row rule-settlement-saves-at-the-rules-word-2026-10-18 (marked verified 17:23Z).',
    tags = array['decision-sheet','decision-sheets','cer-procedures','rule-10'],
    updated_at = now()
where slug = 'sam-sheet-96-rulings-2026-10-18'
  and coalesce(detail, '') not like '%Store detail (S417 read, 17:29Z)%';

update public.cpl_memory
set status = 'superseded',
    superseded_by = 'sam-sheet-96-rulings-2026-10-18',
    detail = coalesce(detail, '') || ' Superseded by S418 (2026-10-18): the same ruling was written twice, by S417 at 17:29Z and by S418 at 17:43Z before S417''s row was seen; sam-sheet-96-rulings-2026-10-18 keeps this row''s store quotes and is the row the CER lane, the vault and cpl-project-tracker#2235 cite. Same source, same fact, nothing lost.',
    updated_at = now()
where slug = 'sam-sheet-96-ruling-2026-10-18'
  and status <> 'superseded';
