-- ROLLBACK of kb/migrations/2026-11-09_kb_curation_reviewer_label.sql (S614). Run part 2's rollback first if part 2
-- is applied, so anon reads reviewer_email again before any reader loses the label.
alter table public.kb_curation drop column if exists reviewer_label;
