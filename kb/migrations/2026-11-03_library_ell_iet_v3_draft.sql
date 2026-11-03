-- S557, 2026-11-03: Sam's Revise request on ELL IET CPL Starting Points (2026-11-02 21:20Z, regen.publish = show).
-- Version 3's draft is published at its own link; the public copy stays until someone presses Replace the public copy
-- (scheduled_sessions step 6). Guarded on the request's exact requested_at, so a newer request stays untouched.
-- ROLLBACK: kb/migrations/2026-11-03_library_ell_iet_v3_draft_rollback.sql (the before-values, verbatim).
update public.cpl_library
set regen = regen || jsonb_build_object('ready_at', '2026-11-03T07:05:00Z',
                                        'draft_url', 'https://claude.ai/artifact/5JMF3L4sEFZHrAPZrHSmH3'),
    versions = versions || jsonb_build_array(jsonb_build_object(
      'url', 'https://claude.ai/artifact/5JMF3L4sEFZHrAPZrHSmH3', 'date', '2026-11-03', 'label', 'Version 3',
      'status', 'Draft: Get Focused, Stay Focused removed (IRC); the December 9 agenda; answers on the course-to-course path and what grantees can do after the grant; Request Adopt on 25 example rows; programs each example course is required in, from the program requirements harvest (20 rows). Remediated: Request Adopt links raised to 24px targets; npm run a11y passes light and dark.')),
    updated_by = 'library-s557@bot'
where slug = 'ell-iet-cpl-starting-points' and retired_at is null
  and regen->>'requested_at' = '2026-11-02T21:20:29.029Z' and regen->>'ready_at' is null;
select slug, regen, jsonb_array_length(versions) n_versions, updated_by from public.cpl_library where slug = 'ell-iet-cpl-starting-points';
