-- S330 (SkyRoutine), 2026-10-04 ~23:20Z: Rule 8 ingest - three rows (author 'SkyRoutine-s330').
-- Facts from Cerritos reads 4 and 5 (#1859; college-page-read runs 37241442265, 37241996688) and one pitfall
-- of the reader's new form step. All proposed: session-measured, no human source.
-- Rollback: supersede each row by slug under actor 'SkyRoutine-s330-rollback'.

insert into public.cpl_memory (slug, title, kind, summary, detail, plain, tags, affects, source, author, event_date, status)
values
('statewide-career-pathways-gone-2026-10-04',
 'Statewide Career Pathways (statewidepathways.org) is gone: a domain for sale',
 'fact',
 'The ASCCC''s SB 70 school-to-college articulation database, where Cerritos''s Technology page says its high school agreements are public, redirected over https and http to a GoDaddy domain-for-sale page on 2026-10-04 (run 37241442265). Cerritos still drafts each agreement on the project''s template. Its own pages print no list, and hsarticulation.cerritos.edu has no DNS record.',
 'Cerritos''s route is confirmed from its 2026-27 catalog (Educational Partnerships and Programs) and its Petition for Credit by Examination for Articulated High School Course: credit for an articulated high school, ROP or adult school course comes by Credit by Exam (a B or better, the Cerritos application, the petition filed with EPP within two years, up to 30 units, residency waived); CCAP dual enrollment is the other route. Other colleges that name Statewide Career Pathways as their public list point at the same dead address. The procedure record marks the host gone, an access word kb/_college_page_read.py skips. Sheet 36 card 2 holds the drafted request to Cerritos for its list.',
 'The statewide website where colleges were supposed to publish their high school course agreements no longer exists, so those lists are not public anywhere.',
 array['program-requirements','cerritos','high-school-articulation','procedure-record','cpl-pathways'], array['docs/reference/lanes/program-requirements-harvest.md','cpl_pathways_data.js','kb/_college_page_read.py'],
 'college-page-read run 37241442265 (S330)', 'SkyRoutine-s330', '2026-10-04', 'proposed'),
('cerritos-schedule-ironworker-sections-2026-10-04',
 'Cerritos Schedule+: 22 IWAP courses run in Fall 2026; none of the 26 noncredit AED ironworker courses runs this year',
 'fact',
 'Schedule+ read 2026-10-04 (run 37241996688; Closed, Open and Wait List sections): Fall 2026 lists sections of 22 IWAP courses, IWAP 40.05 through 41.08, and of no AED 40.01-41.10 course, nor of the Pre-Apprenticeship certificate''s AED 36.02-36.04 and 80.01; AED 90.05 OSHA-10 runs both terms. Spring 2027 lists AED sections but no IWAP and no AED 40-41 section yet.',
 'All 26 AED 40.01-41.10 courses are in the 2026-27 catalog (read 3), so they exist on paper with no section this year. The Spring read cleared the Start Months boxes, which default to Fall''s. A tentative or cancelled section does not show under the default status boxes. Re-read Spring with read 5''s plan once its IWAP sections post.',
 'Cerritos is teaching 22 ironworker apprenticeship courses this fall, but the free noncredit versions of those courses are not being offered this year.',
 array['program-requirements','cerritos','cpl-pathways','noncredit','apprenticeship'], array['cpl_pathways_data.js','docs/reference/lanes/program-requirements-harvest.md'],
 'college-page-read run 37241996688 (S330)', 'SkyRoutine-s330', '2026-10-04', 'proposed'),
('form-without-submitter-matches-nothing-2026-10-04',
 'A form whose only buttons are named submits matches nothing without its submitter: print the buttons, then name one',
 'pitfall',
 'Read 4 submitted Cerritos''s Schedule+ form with no submitter (the plan''s button pattern, course|class|search|submit|go, matched none of ViewDepartments, ViewDepartments, ViewDivisions) and the CGI answered "No classes matched your criteria." Read 5 named ^ViewDepartments$ and got the term''s sections.',
 'kb/_college_page_read.py''s form step prints the fields sent, the button used and every button on the form, so one read shows what the next must name. Do not guess a submit button''s words: the first read of a form prints its buttons (forms: true), and the plan names one by its name. A local Chromium mock that had a Search Classes button passed the step, which is why the mock did not catch it.',
 'A web form can need a specific button pressed to work, and pressing none returns nothing; the reader now shows which buttons a form has.',
 array['college-page-read','pitfall','program-requirements','reader'], array['kb/_college_page_read.py','kb/college_reads/cerritos_ironworker_ladder_read5.json'],
 'college-page-read runs 37241442265 and 37241996688 (S330)', 'SkyRoutine-s330', '2026-10-04', 'proposed')
on conflict (slug) do nothing;

select slug, status from public.cpl_memory where author = 'SkyRoutine-s330' order by slug;
