insert into cpl_memory (slug, kind, title, summary, tags, source, status, event_date, author, verified_by, verified_at) values
('sam-sheet-72-card-1-paste-2026-10-13','decision','Sam (Open Asks Sheet 72 card 1): he pastes the course_outcomes table himself',
 'Sam, Open Asks Sheet 72 card 1, chip "paste" at 2026-10-13T03:44:00Z (read from the sheet store by S376). to_regclass(public.course_outcomes) still null at 07:40Z; apply_migration timed out a seventh time (S376, 04:31Z) with nothing landing.',
 array['course-outcomes','program-requirements-harvest','decision-sheet'],'Open Asks Sheet 72 store, replies/1','verified','2026-10-13','SkyLindenS376','Sam (sheet chip)',now()),
('sdccd-all-fields-prints-slos-by-college-2026-10-13','fact','SDCCD prints SLOs per college in its All Fields report; its Course Outline Report prints objectives only',
 'S376 trials 38350133448 (report 493: STUDENT LEARNING OBJECTIVES only) and 38350787486 (report 4: Student Learning Outcomes, one Group Title per college). Index run 38350560193 reads All Fields: 1,641 of 1,660 courses. Slice 1: 411 read, 381 with outcomes, 1,433 SLOs.',
 array['course-outcomes','course-outlines','program-requirements-harvest','sdccd'],'cpl-project-tracker#2065, #2066','proposed','2026-10-13','SkyLindenS376',null,null),
('curriqunet-comparison-report-is-no-outline-2026-10-13','pitfall','A curriQunet Course Outline Comparison Report is titled for the outline and is not one',
 'S376 index run 38349485923 put SDCCD reportId 43 (Course Outline Comparison Report) ahead of the outline (493) on 1,978 revision rows; a comparison opens a dialog for a second proposal. The index now leaves out a MetaReport titled for a comparison and lists every report by title.',
 array['course-outlines','curriqunet','program-requirements-harvest'],'cpl-project-tracker#2065','proposed','2026-10-13','SkyLindenS376',null,null),
('trigger-file-gate-on-main-2026-10-13','pitfall','A merge of main carries trigger files; a later push re-runs their workflow',
 'S376: a display push on a branch that had merged main re-ran the SDCCD index (run 38356065581). The merge-commit check covers only a merge at the head. Census, index, outcomes read and load now gate on the trigger file differing from main (#2069, #2066).',
 array['ci','workflows','program-requirements-harvest','course-outcomes'],'cpl-project-tracker#2069, #2066','proposed','2026-10-13','SkyLindenS376',null,null),
('requirements-tab-rereads-loaded-2026-10-13','milestone','Re-reads under the Requirements-tab fix: Mesa 9, San Diego City 3, Miramar 10 loaded and displayed',
 'S376: Mesa 166 to 175 (#2064), San Diego City 164 to 167 (#2068), Miramar 110 to 120, all aviation (#2070). Build 98becf9fafc7 on all 2,203 rows, 31 checked. Miramar 39433 got a wrong page on the re-read; its good filed record was restored before the build.',
 array['program-requirements-harvest','san-diego-mesa','san-diego-city','san-diego-miramar'],'cpl-project-tracker#2064, #2068, #2070','proposed','2026-10-13','SkyLindenS376',null,null),
('chaffey-course-slos-on-syllabi-2026-10-13','fact','Chaffey publishes course outcomes on section syllabi, with no public course SLO list found',
 'S376 web search: Chaffey outcomes site says course learning outcomes are on syllabi; program outcomes are in the catalog and CurriQunet. Its outlines print no SLO heading (census run 5). Candidate cor_slo_source_url note.',
 array['course-outcomes','course-outlines','program-requirements-harvest','chaffey'],'chaffey.edu/outcomes (learning-outcomes, faq)','proposed','2026-10-13','SkyLindenS376',null,null)
on conflict do nothing;
insert into cpl_memory_log (memory_id, actor, action, note)
select id, 'SkyLindenS376', 'create', 'S376 checkpoint' from cpl_memory
where slug in ('sam-sheet-72-card-1-paste-2026-10-13','sdccd-all-fields-prints-slos-by-college-2026-10-13','curriqunet-comparison-report-is-no-outline-2026-10-13','trigger-file-gate-on-main-2026-10-13','requirements-tab-rereads-loaded-2026-10-13','chaffey-course-slos-on-syllabi-2026-10-13')
  and author = 'SkyLindenS376';
