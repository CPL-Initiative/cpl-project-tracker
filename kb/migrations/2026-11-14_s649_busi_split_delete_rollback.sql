-- Rollback for 2026-11-14_s649_busi_split_delete.sql: puts back exactly the row it deleted, its reviewer and reviewed_at
-- unchanged. The receipt of the forward run (kb/receipts/migration_s649_busi_split_delete_<run>.json, `response`)
-- holds the whole row as read; if it shows a column this list does not name, add it before running this.
-- Skipped (nothing written) when the slot is taken again, by a person or a procedure: their row wins.
insert into public.kb_curation (course_id, field, value, reviewer_email, reviewed_at, validated_at, validated_by)
values ('BUSI M10XW', 'merge_into', 'BUSI M1228', 'automerge-titlelane-v1@bot',
        '2026-06-13T17:47:56.243497+00:00', NULL, NULL)
on conflict (course_id, field) do nothing
returning course_id, field, value, reviewer_email, reviewed_at;
-- Read back: expect one row, (BUSI M10XW, merge_into, BUSI M1228, automerge-titlelane-v1@bot).
--   select course_id, field, value, reviewer_email, reviewed_at from public.kb_curation where course_id = 'BUSI M10XW' and field = 'merge_into';
