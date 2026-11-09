-- kb_curation: the anon key stops reading reviewer_email and validated_by (S614, Sam 2026-11-09: "go ahead and close
-- the email exposure"). Part 2 of 2. Apply only after the readers that select reviewer_label are live on Pages:
-- a PostgREST select naming a column anon may not read fails the whole query.
-- Kept: authenticated keeps table-level SELECT (a signed-in reviewer still sees who saved); postgres and
-- service_role are untouched, so every kb/*.py sync and apply (service key) is unaffected. RLS is unchanged.
-- anon's column SELECT is every column but the two emails. Applied through the Supabase MCP (Rule 10c).
-- Rollback: 2026-11-09_kb_curation_hide_reviewer_email_rollback.sql
revoke select on public.kb_curation from anon;
grant select (course_id, field, value, reviewed_at, validated_at, reviewer_label) on public.kb_curation to anon;

-- Read back (expect false, false, true):
--   select has_column_privilege('anon','public.kb_curation','reviewer_email','select'),
--          has_column_privilege('anon','public.kb_curation','validated_by','select'),
--          has_column_privilege('anon','public.kb_curation','value','select');
