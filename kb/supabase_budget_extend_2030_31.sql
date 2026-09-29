-- ============================================================================
-- Budget ledger — extend ongoing operations through 2030-31 + archive the $5M
-- Session: 2026-08-05 (budget reconciliation against the revised Sep-2026 BOG
-- amendment).  Applied via the Supabase MCP to project hvuwhnbuahrtptokpqfh
-- ("Work Plan").  Committed here as the receipt.
--
-- WHY
--   Sam's revised budget stops at 2028-29 (the amendment's 2.5-yr Board window),
--   but the $7M ongoing operations continue. He asked COBI to carry the ongoing
--   through 2030-31 (committed), and to move the pre-amendment $5M 2025-26
--   ongoing to history (out of the forward view — "all previous funds are
--   expended, this is what we're accountable for moving forward").
--
--   Net: ongoing 3 yrs ($21M) -> 5 yrs ($35M, +$14M). One-time pots ($15M/$35M)
--   do NOT extend. The two new year columns are also where project funding may
--   later be shifted without changing any project total.
--
-- GUARDS
--   Every UPDATE is pinned to the row's expected current shape (id + section +
--   current total), so a concurrent curator edit makes the write a no-op rather
--   than a clobber (Rule 9 — Sam's rows win). None of these rows carries a
--   model_field, so the funding model (one_time_2026_27 / remaining_2025_26 /
--   scaling_projects_tech) is untouched.
--
-- Idempotent: the column add is IF NOT EXISTS; re-running the UPDATEs is safe
-- (they re-assert the same values; guarded on the pre-change total, so a second
-- run after success matches 0 rows, which is fine).
-- ============================================================================

-- 1. new committed year column -----------------------------------------------
alter table public.budget_funding
  add column if not exists yr_2030_31 numeric;

-- 2. archive the pre-amendment $5M 2025-26 ongoing (-> history) ---------------
update public.budget_funding
   set archived = true, updated_at = now()
 where id = 3
   and section = 'source_ongoing'
   and total = 5000000
   and archived = false;

-- 3. extend the $7M ongoing SOURCE through 2030-31 (committed) ----------------
update public.budget_funding
   set yr_2029_30 = 7000000,
       yr_2030_31 = 7000000,
       total = 35000000,
       window_label = '$7,000,000 × 5 yrs · committed through 2030-31',
       updated_at = now()
 where id = 5
   and section = 'source_ongoing'
   and total = 21000000;

-- 4. extend the $7M ongoing USE (RCCD operations) through 2030-31 -------------
update public.budget_funding
   set yr_2029_30 = 7000000,
       yr_2030_31 = 7000000,
       total = 35000000,
       updated_at = now()
 where id = 14
   and section = 'use_ongoing'
   and total = 21000000;
