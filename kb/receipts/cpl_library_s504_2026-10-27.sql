-- S504 SkyMulberry, 2026-10-27: the Library's funding-film record follows the films the public funding page carries
-- (one guarded UPDATE, read live at ~23:30Z). Since 2026-10-05 it named Scenario 1's narrated Draft 4 and a Scenario 2
-- music cut v7 that is no longer in the repo; funding-model/index.html now plays Scenario 2 v12 (the recorded piano,
-- Sheet 137 card 1) and links Sierra's narrated Draft 5. Scenario 1's two approved cuts stay listed for the record.
-- BEFORE (updated_at 2026-10-05 22:02:22.047858+00, updated_by null):
--   version '4 cuts'; summary 'Scenarios 1 and 2, each as a music cut and a narrated cut'; extent '1:41 to 3:08';
--   url/file_name .../main/prototype/funding_video/20260926_CPL_Funding_in_Motion_Narrated_Draft_4.mp4;
--   ruling 'Sam approved the narrated Scenario 1, draft 4 (open asks sheet 4, card 4, 29 September 2026). He cleared the
--   figures for his sunshine walk-through with colleges (25 September 2026).'; versions as in ROLLBACK below.
-- ROLLBACK:
--   update public.cpl_library set version = '4 cuts',
--     summary = 'Scenarios 1 and 2, each as a music cut and a narrated cut', extent = '1:41 to 3:08',
--     url = 'https://github.com/CPL-Initiative/cpl-project-tracker/blob/main/prototype/funding_video/20260926_CPL_Funding_in_Motion_Narrated_Draft_4.mp4',
--     file_name = '20260926_CPL_Funding_in_Motion_Narrated_Draft_4.mp4',
--     ruling = 'Sam approved the narrated Scenario 1, draft 4 (open asks sheet 4, card 4, 29 September 2026). He cleared the figures for his sunshine walk-through with colleges (25 September 2026).',
--     versions = '[{"url": "https://github.com/CPL-Initiative/cpl-project-tracker/blob/main/prototype/funding_video/20260926_CPL_Funding_in_Motion_Narrated_Draft_4.mp4", "date": "2026-09-26", "size": "3:08 · 15.9 MB", "label": "Scenario 1, narrated draft 4", "status": "Approved"}, {"url": "https://github.com/CPL-Initiative/cpl-project-tracker/blob/main/prototype/funding_video/20260926_CPL_Funding_in_Motion_v4.mp4", "date": "2026-09-26", "size": "1:41 · 10.6 MB", "label": "Scenario 1, music cut v4", "status": "Played by the funding explainer"}, {"url": "https://github.com/CPL-Initiative/cpl-project-tracker/blob/main/prototype/funding_video/20260926_CPL_Funding_in_Motion_Scenario_2_v7.mp4", "date": "2026-09-26", "size": "1:41 · 10.6 MB", "label": "Scenario 2, music cut v7", "status": "Played by the explainer''s Scenario 2 view"}, {"url": "https://github.com/CPL-Initiative/cpl-project-tracker/blob/main/prototype/funding_video/20260930_CPL_Funding_in_Motion_Scenario_2_Narrated_Draft_3.mp4", "date": "2026-09-30", "size": "2:38 · 14.1 MB", "label": "Scenario 2, narrated draft 3", "status": "Linked from the explainer''s Scenario 2 view"}]'::jsonb,
--     updated_by = null
--   where slug = 'cpl-funding-in-motion';
update public.cpl_library
set version = 'Scenario 2 v12',
    summary = 'The published scenario as a music cut with the recorded piano (v12) and Sierra''s narrated cut (Draft 5); Scenario 1''s approved cuts kept for the record',
    extent = '1:41 and 2:52',
    url = 'https://github.com/CPL-Initiative/cpl-project-tracker/blob/f513f97c/prototype/funding_video/20260926_CPL_Funding_in_Motion_Scenario_2_v12.mp4',
    file_name = '20260926_CPL_Funding_in_Motion_Scenario_2_v12.mp4',
    ruling = 'Sam approved the narrated Scenario 1, draft 4 (open asks sheet 4, card 4, 29 September 2026). He cleared the figures for his sunshine walk-through with colleges (25 September 2026). He approved the recorded piano under Scenario 2 (open asks sheet 137, card 1, 27 October 2026).',
    versions = '[{"url": "https://github.com/CPL-Initiative/cpl-project-tracker/blob/f513f97c/prototype/funding_video/20260926_CPL_Funding_in_Motion_Scenario_2_v12.mp4", "date": "2026-10-27", "size": "1:41 · 10.1 MB", "label": "Scenario 2, music cut v12 (recorded piano)", "status": "Played by the public funding page"}, {"url": "https://github.com/CPL-Initiative/cpl-project-tracker/blob/f513f97c/prototype/funding_video/20260930_CPL_Funding_in_Motion_Scenario_2_Narrated_Draft_5.mp4", "date": "2026-10-27", "size": "2:52 · 14.4 MB", "label": "Scenario 2, narrated draft 5 (Sierra)", "status": "Linked from the public funding page"}, {"url": "https://github.com/CPL-Initiative/cpl-project-tracker/blob/f513f97c/prototype/funding_video/20260926_CPL_Funding_in_Motion_Narrated_Draft_4.mp4", "date": "2026-09-26", "size": "3:08 · 15.1 MB", "label": "Scenario 1, narrated draft 4", "status": "Approved"}, {"url": "https://github.com/CPL-Initiative/cpl-project-tracker/blob/f513f97c/prototype/funding_video/20260926_CPL_Funding_in_Motion_v4.mp4", "date": "2026-09-26", "size": "1:41 · 10.1 MB", "label": "Scenario 1, music cut v4", "status": "Played by the funding explainer"}]'::jsonb,
    updated_by = 'library-s504@bot'
where slug = 'cpl-funding-in-motion' and version = '4 cuts'
  and updated_at = '2026-10-05 22:02:22.047858+00';
select slug || ' ' || version as record, file_name, jsonb_array_length(versions) as cuts from public.cpl_library
where slug = 'cpl-funding-in-motion';
