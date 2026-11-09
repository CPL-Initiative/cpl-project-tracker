-- ROLLBACK of kb/migrations/2026-11-09_kb_curation_hide_reviewer_email.sql (S614): restores anon's table-level
-- SELECT, read live 2026-11-09 before it.
revoke select (course_id, field, value, reviewed_at, validated_at, reviewer_label) on public.kb_curation from anon;
grant select on public.kb_curation to anon;
