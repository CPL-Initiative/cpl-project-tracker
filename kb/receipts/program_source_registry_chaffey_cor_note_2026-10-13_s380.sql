-- S380 (SkyAlder), 2026-10-13: Chaffey College's course outline note, after a look for its course learning outcomes.
--
-- STATUS: NOT APPLIED. apply_migration timed out at ~12:06Z (its ninth timeout since 23:19Z on 2026-10-12) with
-- nothing landing; the note goes to Sam as a paste on the Open Asks sheet.
--
-- Why: Sam, Open Asks Sheet 70 card 2 (2026-10-12 20:41Z), "Record and move on", note "And look for other
-- repositories for the outcomes data and record the link and data in prog reqs". Census run 5 (38305389870) read
-- one Chaffey outline (reportId 225) and found no outcomes heading. S376 found Chaffey's outcomes site placing
-- course outcomes on section syllabi. S380 measured the rest:
--   * Chaffey's outcomes FAQ (https://www.chaffey.edu/outcomes/faq.php) says current course learning outcomes are
--     kept in META CurriQunet, and appear on each course's syllabus.
--   * Discovery run 38392162605: the curriQunet dashboard links two public reports per course, Course Outline
--     (225) and Course Outline - PDF (1225); there is no All Fields report (SDCCD's printed its SLOs, S376).
--   * College page read 38394075773: the PDF report for ACCTG 1A (CourseId 2368) prints Course Objectives and
--     no learning outcomes, as 225 does.
-- So no public source prints Chaffey's course outcomes: cor_slo_source_url stays null and the note says where
-- they are kept. The weekly census never writes the cor_* columns.
--
-- BEFORE (read 2026-10-13 ~12:05Z through execute_sql):
--   cor_system curriqunet | cor_url https://chaffey.curriqunet.com/ | cor_access public
--   | cor_proof_url https://chaffey.curriqunet.com/DynamicReports/AllFieldsReportByEntity/1?entityType=Course&reportId=225
--   | cor_prints_slos false | cor_slo_source_url null
--   | cor_note 'CurriQunet opens course outlines to the public; the outline read prints no student learning outcomes heading.'
--   | cor_checked_run 'course-outline-census run 38305389870' | corrected_by null
--
-- Rollback: program_source_registry_history holds the prior row; or set cor_note and cor_checked_run back to the
-- BEFORE values above.

update public.program_source_registry set
  cor_note        = 'CurriQunet opens two course outline reports to the public, Course Outline (reportId 225) and Course Outline - PDF (1225); both print Course Objectives and no learning outcomes. Chaffey''s outcomes FAQ (https://www.chaffey.edu/outcomes/faq.php) says current course learning outcomes are kept in META CurriQunet, outside these reports, and printed on each course''s syllabus. No public list of course learning outcomes found (S380).',
  cor_checked_run = 'course-outline-index run 38392162605; college-page-read run 38394075773'
where college = 'Chaffey College'
  and cor_checked_run = 'course-outline-census run 38305389870'
  and cor_slo_source_url is null;

-- Read back: one row, the new note.
select college, cor_prints_slos, cor_slo_source_url, cor_checked_run, left(cor_note, 80) as cor_note
from public.program_source_registry where college = 'Chaffey College';
