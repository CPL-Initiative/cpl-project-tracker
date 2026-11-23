-- cpl_memory rows, third set, for SkyTystie (S705): Sam's Exhibits Review asks of 2026-11-22 (five verified, his words
-- verbatim, verified_by Sam) and one fact (proposed). Applied with execute_sql at about 16:05Z; the full insert text is
-- the session's, the rows are these slugs. ROLLBACK: the _rollback file beside it.
select slug, status from public.cpl_memory where slug in ('r-exhibits-review-nav-undo-apart-sam-2026-11-22','r-exhibits-review-say-what-change-saves-sam-2026-11-22','r-exhibits-review-session-changes-list-sam-2026-11-22','r-exhibits-review-edit-sites-in-place-sam-2026-11-22','r-exhibits-look-in-another-subject-sam-2026-11-22','f-exhibits-source-id-did-nothing-s705','r-exhibits-card-shows-articulated-course-cr-sam-2026-11-22','r-noncredit-four-mq-codes-sam-2026-11-22','r-map-team-worklist-for-no-cr-exhibits-sam-2026-11-22') order by slug;
-- Also superseded: d-noncredit-four-categories-no-code-s701 (rollback: set it back to proposed).
