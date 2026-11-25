-- Stray-code re-mint (S733): delete the 27 bot-cohort kb_curation rows on the retired and aliased M-IDs.
-- Run after the PR merges, before the next cron's curation sync. Before-values (full row images):
-- kb_curation_delete.json; kb_curation_restore.sql re-inserts them. Raises, and deletes nothing, when
-- the count is not 27 (a person's row is never matched: the guard keeps bot cohorts only).
do $$
declare n int := 0;
begin
  delete from public.kb_curation k
  using (values
    ('ARTG M10AA', 'merge_into'),
    ('ARTG M10AB', 'merge_into'),
    ('ARTG M10AH', 'merge_into'),
    ('ARTG M10AL', 'merge_into'),
    ('ARTI M10AE', 'merge_into'),
    ('CTVR M10AE', 'merge_into'),
    ('DGME M1001', 'unified_title'),
    ('DGME M10AH', 'merge_into'),
    ('DGME M10AI', 'merge_into'),
    ('ESTI M1001', 'unified_title'),
    ('ESTI M10AE', 'merge_into'),
    ('ESTI M10AF', 'merge_into'),
    ('ESTI M10AH', 'merge_into'),
    ('FLTE M10AE', 'merge_into'),
    ('FTMA M10AO', 'merge_into'),
    ('FTVM M10AJ', 'merge_into'),
    ('FTVM M10AS', 'honors_of'),
    ('PHTO M10AB', 'merge_into'),
    ('PHTO M10AE', 'merge_into'),
    ('PHTO M10AK', 'merge_into'),
    ('PHTO M10AM', 'merge_into'),
    ('PHTO M10AQ', 'merge_into'),
    ('PHTO M10AT', 'merge_into'),
    ('SGNG M10AB', 'merge_into'),
    ('SGNG M10AD', 'merge_into'),
    ('SGNG M10AH', 'merge_into'),
    ('TAFI M10AI', 'merge_into')
  ) as d(course_id, field)
  where k.course_id = d.course_id and k.field = d.field
    and (k.reviewer_email is null or k.reviewer_email = '' or lower(k.reviewer_email) like '%@bot' or lower(k.reviewer_email) like '%.bot');
  get diagnostics n = row_count;
  if n <> 27 then raise exception 'stray-code re-mint: expected 27 rows, matched %', n; end if;
end $$;
