-- Rollback for 2026-11-14_s652_honors_two_row_delete.sql: puts back exactly the two rows it deleted, reviewer and reviewed_at
-- unchanged. The receipt of the forward run (kb/receipts/migration_s652_honors_two_row_delete_<run>.json, `response`) holds each row
-- whole as read; if it shows a column this list does not name (reviewer_label is generated, never inserted), add it
-- before running this. A slot taken again since, by a person or a procedure, is skipped: their row wins.
insert into public.kb_curation (course_id, field, value, reviewer_email, reviewed_at, validated_at, validated_by)
values ('HUMA M10ME', 'merge_into', 'HUMA M1110', 'automerge-v1@bot', '2026-06-12T22:47:01.69179+00:00', NULL, NULL),
       ('LIBR M10CJ', 'merge_into', 'LIBR M1040', 'automerge-v1@bot', '2026-06-12T22:47:01.69179+00:00', NULL, NULL)
on conflict (course_id, field) do nothing
returning course_id, field, value, reviewer_email, reviewed_at;
-- Read back: expect two rows, each merge_into its base, automerge-v1@bot.
--   select course_id, field, value, reviewer_email, reviewed_at from public.kb_curation where course_id in ('HUMA M10ME', 'LIBR M10CJ') and field = 'merge_into';
