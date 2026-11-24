-- S724 (SkySandpiper), 2026-11-24 20:59Z. Rule 10 receipt: one INSERT-only row, cohort commons-s724@bot.
-- Why: Sam ruled KINE M1267 "Adapted: Beginning Stretching and Stress Reduction" to PEDS (2026-11-24 19:33Z,
-- "course title uses the term 'Adapted'"). Cabrillo KIN 38A "Beginning Yoga and Stress Reduction" (0.5 u,
-- CCC000567717) is not adapted PE; it re-homes to KINE M1344 "Yoga, Beginning", whose members are Beginning
-- Yoga courses at 0.5-1.5 units. Fresh read before write: no merge_into or mid_member_confirm row on the key.
-- Applied:
insert into kb_curation (course_id, field, value, reviewer_email)
select 'CN:CCC000567717','merge_into','KINE M1344','commons-s724@bot'
where not exists (select 1 from kb_curation where course_id='CN:CCC000567717' and field in ('merge_into','mid_member_confirm'))
on conflict do nothing;
-- Returned: CN:CCC000567717 | merge_into | KINE M1344 | commons-s724@bot | 2026-11-24 20:59:14.607685+00
-- Rollback:
-- delete from kb_curation where reviewer_email='commons-s724@bot' and course_id='CN:CCC000567717' and field='merge_into';
