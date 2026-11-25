-- 2026-11-25, Sam in session: "can you have library auto add a summary I can edit so if I forget and click publish,
-- we'll still have a summary?" He pressed Publish to Public Library on the Adult Education CPL Starting Points card
-- before its check passed; that form has no summary field, so public_summary stayed NULL, and the check run lists a
-- passing piece only when it holds one. This fills it with an editable draft (he can change it on the card); the form
-- itself gets the prefilled field in #3865. Guarded on public_summary still NULL. Before-value: NULL.
-- ROLLBACK: kb/migrations/2026-11-25_adult_ed_cpl_starting_points_public_summary_rollback.sql
update public.cpl_library
   set public_summary = 'Adult schools, regional occupational programs and county offices of education train toward many credentials that California community colleges already award credit for. This page shows, by credential and region, where an adult learner can bring a certification or license for college credit now, which colleges could adopt that credit through MAP, and which credentials no college credits yet.',
       updated_by = 'library-adulted-2026-11-25@bot'
 where slug = 'adult-ed-cpl-starting-points' and public_summary is null;

select slug, char_length(public_summary) as summary_chars, publish_target, public_listed, url
  from public.cpl_library where slug = 'adult-ed-cpl-starting-points';
