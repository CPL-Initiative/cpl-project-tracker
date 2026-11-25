-- Rollback for 2026-11-25_adult_ed_cpl_starting_points_public_summary.sql: back to NULL, if no one edited it since.
update public.cpl_library set public_summary = null
 where slug = 'adult-ed-cpl-starting-points' and public_summary = 'Adult schools, regional occupational programs and county offices of education train toward many credentials that California community colleges already award credit for. This page shows, by credential and region, where an adult learner can bring a certification or license for college credit now, which colleges could adopt that credit through MAP, and which credentials no college credits yet.'
   and updated_by = 'library-adulted-2026-11-25@bot';
