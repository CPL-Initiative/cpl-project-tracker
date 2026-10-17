-- S405 (SkyCholla), 2026-10-17: the Program Requirements tab's light index reads four small stored columns
-- in place of paths into display and the requirements_fp computed field.
--
-- Why: Sam, 2026-10-17, in chat: "Prog Req tab in COBI loads very slow--we need to find a way to optimize it
-- as we continue to grow it to the full CCC catalog." Measured the same morning on 11,969 records (87 colleges):
--   every index row read three paths out of display (39 MB of jsonb, 3.5 KB a row on average), so a full pass
--   cost 6.1 s; the signed-in index added requirements_fp, program_record_fp(record) over 13 MB, 10.4 s more.
--   The tab reads the index in Range pages, an OFFSET each, and an OFFSET evaluates every skipped row: the last
--   public page took 9.4 s against anon's 3 s statement_timeout. Without the display paths the same page took
--   23 ms. The cost grew with the square of the table, so the full CCC catalog would make it worse.
--
-- What it does: four STORED generated columns. Postgres computes each on insert and on any update of its source
-- column, so every writer (the college load and reread functions, the display apply, the verdict function, the
-- rescore and undo receipts) keeps them current without a change: each names its columns, and none writes these.
-- No trigger fires during the rewrite, so program_requirement_records_follow_verdict leaves checked alone.
-- The ALTER rewrites the table (80 MB) under an ACCESS EXCLUSIVE lock for about 20 s; reads wait for it.
--
-- Rollback: alter table public.program_requirement_records
--   drop column idx_fp, drop column idx_display_arithmetic, drop column idx_display_reviewer,
--   drop column idx_display_here;
-- and revert the program_requirements.js change that reads them (it reads them by name, so revert it first).

alter table public.program_requirement_records
  add column idx_fp text
    generated always as (public.program_record_fp(record)) stored,
  add column idx_display_arithmetic text
    generated always as (display -> 'checks' ->> 'arithmetic') stored,
  add column idx_display_reviewer text
    generated always as (display -> 'checks' ->> 'reviewer') stored,
  add column idx_display_here jsonb
    generated always as (display -> 'counts' -> 'here') stored;

comment on column public.program_requirement_records.idx_fp is
  'program_record_fp(record), stored for the Program Requirements tab''s signed-in index; equals requirements_fp(r).';
comment on column public.program_requirement_records.idx_display_arithmetic is
  'display->checks->>arithmetic, stored for the Program Requirements tab''s light index (S405).';
comment on column public.program_requirement_records.idx_display_reviewer is
  'display->checks->>reviewer, stored for the Program Requirements tab''s light index (S405).';
comment on column public.program_requirement_records.idx_display_here is
  'display->counts->here, stored for the Program Requirements tab''s light index (S405).';

-- Read back: every row's stored fingerprint equals the computed field the verdicts compare against.
select count(*) as n,
       count(*) filter (where idx_fp is distinct from public.program_record_fp(record)) as fp_mismatch,
       count(*) filter (where idx_display_arithmetic is distinct from display -> 'checks' ->> 'arithmetic') as dar_mismatch
from public.program_requirement_records;
