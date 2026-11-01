-- Rollback of 2026-11-01_college_contacts_harvest.sql (Rule 10 a2): the function, then the table.
-- Each load's rows are also named in its receipt (kb/receipts/college_contacts_harvest_<run>.json).
drop function if exists public.college_contacts_harvest_apply(jsonb);
drop table if exists public.college_contacts_harvest;
