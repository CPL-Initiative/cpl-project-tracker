-- kb_curation: a reviewer_label beside reviewer_email (S614, Sam 2026-11-09: "go ahead and close the email exposure").
-- Part 1 of 2, additive. Read live 2026-11-09 ~03:40Z: the read policy kb_curation_read is PUBLIC with qual true, and
-- anon holds table-level SELECT, so the published anon key reads every row's reviewer_email and validated_by
-- (38,106 rows: 33,643 by @bot cohorts, 41 distinct people). The label keeps a procedure's cohort id (…@bot, not a
-- person) and reads "a reviewer" for a person, so the tabs that tell a person's save from a procedure's
-- (canonical_subj4.js isCohort) keep working for a signed-out reader once part 2 takes the emails away from anon.
-- Applied through the Supabase MCP (Rule 10c). Rollback: 2026-11-09_kb_curation_reviewer_label_rollback.sql
alter table public.kb_curation add column if not exists reviewer_label text
  generated always as (case when reviewer_email is null then null
                            when reviewer_email ~ '@bot$' then reviewer_email
                            else 'a reviewer' end) stored;
grant select (reviewer_label) on public.kb_curation to anon, authenticated;

-- Read back (expect a reviewer / the cohort ids):
--   select reviewer_label, count(*) from public.kb_curation group by 1 order by 2 desc limit 5;
