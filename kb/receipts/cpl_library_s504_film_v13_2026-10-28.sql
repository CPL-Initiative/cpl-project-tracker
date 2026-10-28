-- S504 SkyMulberry, 2026-10-28: the funding film's Library record follows #2525: the music cut v13 (the Veteran
-- Star) and Sierra's narrated Draft 7 in Sam's own script, both carried by the public funding page. One guarded
-- UPDATE from the state S504 set at 23:28Z 2026-10-27 (receipt cpl_library_s504_2026-10-27.sql); links pin to
-- #2525's head commit 57246801c, which the pull ref keeps after the squash.
-- ROLLBACK (the before-values, verbatim from cpl_library_s504_2026-10-27.sql):
--   update public.cpl_library
--   set version = 'Scenario 2 v12',
--       summary = 'The published scenario as a music cut with the recorded piano (v12) and Sierra''s narrated cut (Draft 5); Scenario 1''s approved cuts kept for the record',
--       extent = '1:41 and 2:52',
--       url = 'https://github.com/CPL-Initiative/cpl-project-tracker/blob/f513f97c/prototype/funding_video/20260926_CPL_Funding_in_Motion_Scenario_2_v12.mp4',
--       file_name = '20260926_CPL_Funding_in_Motion_Scenario_2_v12.mp4',
--       ruling = 'Sam approved the narrated Scenario 1, draft 4 (open asks sheet 4, card 4, 29 September 2026). He cleared the figures for his sunshine walk-through with colleges (25 September 2026). He approved the recorded piano under Scenario 2 (open asks sheet 137, card 1, 27 October 2026).',
--       versions = '[{"url": "https://github.com/CPL-Initiative/cpl-project-tracker/blob/f513f97c/prototype/funding_video/20260926_CPL_Funding_in_Motion_Scenario_2_v12.mp4", "date": "2026-10-27", "size": "1:41 · 10.1 MB", "label": "Scenario 2, music cut v12 (recorded piano)", "status": "Played by the public funding page"}, {"url": "https://github.com/CPL-Initiative/cpl-project-tracker/blob/f513f97c/prototype/funding_video/20260930_CPL_Funding_in_Motion_Scenario_2_Narrated_Draft_5.mp4", "date": "2026-10-27", "size": "2:52 · 14.4 MB", "label": "Scenario 2, narrated draft 5 (Sierra)", "status": "Linked from the public funding page"}, {"url": "https://github.com/CPL-Initiative/cpl-project-tracker/blob/f513f97c/prototype/funding_video/20260926_CPL_Funding_in_Motion_Narrated_Draft_4.mp4", "date": "2026-09-26", "size": "3:08 · 15.1 MB", "label": "Scenario 1, narrated draft 4", "status": "Approved"}, {"url": "https://github.com/CPL-Initiative/cpl-project-tracker/blob/f513f97c/prototype/funding_video/20260926_CPL_Funding_in_Motion_v4.mp4", "date": "2026-09-26", "size": "1:41 · 10.1 MB", "label": "Scenario 1, music cut v4", "status": "Played by the funding explainer"}]'::jsonb,
--       updated_by = 'library-s504@bot'
--   where slug = 'cpl-funding-in-motion' and version = 'Scenario 2 v13 and narrated Draft 7';
update public.cpl_library
set version = 'Scenario 2 v13 and narrated Draft 7',
    summary = 'The published scenario as a music cut with the recorded piano and the Veteran Star (v13) and Sierra''s narrated cut in Sam''s own script (Draft 7); Scenario 1''s approved cuts kept for the record',
    extent = '1:41 and 2:44',
    url = 'https://github.com/CPL-Initiative/cpl-project-tracker/blob/57246801c/prototype/funding_video/20260926_CPL_Funding_in_Motion_Scenario_2_v13.mp4',
    file_name = '20260926_CPL_Funding_in_Motion_Scenario_2_v13.mp4',
    ruling = 'Sam approved the narrated Scenario 1, draft 4 (open asks sheet 4, card 4, 29 September 2026). He cleared the figures for his sunshine walk-through with colleges (25 September 2026). He approved the recorded piano under Scenario 2 (open asks sheet 137, card 1, 27 October 2026), and the narrated cut in his own script: "Excellent video!" (28 October 2026).',
    versions = '[{"url": "https://github.com/CPL-Initiative/cpl-project-tracker/blob/57246801c/prototype/funding_video/20260926_CPL_Funding_in_Motion_Scenario_2_v13.mp4", "date": "2026-10-28", "size": "1:41 · 10.3 MB", "label": "Scenario 2, music cut v13 (recorded piano, Veteran Star)", "status": "Played by the public funding page"}, {"url": "https://github.com/CPL-Initiative/cpl-project-tracker/blob/57246801c/prototype/funding_video/20260930_CPL_Funding_in_Motion_Scenario_2_Narrated_Draft_7.mp4", "date": "2026-10-28", "size": "2:44 · 15.1 MB", "label": "Scenario 2, narrated draft 7 (Sierra, Sam''s script)", "status": "Linked from the public funding page"}, {"url": "https://github.com/CPL-Initiative/cpl-project-tracker/blob/f513f97c/prototype/funding_video/20260926_CPL_Funding_in_Motion_Narrated_Draft_4.mp4", "date": "2026-09-26", "size": "3:08 · 15.1 MB", "label": "Scenario 1, narrated draft 4", "status": "Approved"}, {"url": "https://github.com/CPL-Initiative/cpl-project-tracker/blob/f513f97c/prototype/funding_video/20260926_CPL_Funding_in_Motion_v4.mp4", "date": "2026-09-26", "size": "1:41 · 10.1 MB", "label": "Scenario 1, music cut v4", "status": "Played by the funding explainer"}]'::jsonb,
    updated_by = 'library-s504@bot'
where slug = 'cpl-funding-in-motion' and version = 'Scenario 2 v12' and updated_by = 'library-s504@bot';
select slug || ' ' || version as record, file_name, jsonb_array_length(versions) as cuts from public.cpl_library
where slug = 'cpl-funding-in-motion';
