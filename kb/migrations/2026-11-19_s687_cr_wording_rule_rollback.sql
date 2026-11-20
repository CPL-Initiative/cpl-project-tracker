-- Rollback of kb/migrations/2026-11-19_s687_cr_wording_rule.sql (Sam's college wording rule, S687).
-- Removes only this cohort's rows; the 30 S280 rows and any curator's row stay.
delete from public.cr_reference_decisions where updated_by like 'cr-wording-s687@bot%';
delete from public.cpl_memory where slug='r-cr-college-wording-rule-yes-sam-2026-11-19' and author='SkyPipit (S687)';
