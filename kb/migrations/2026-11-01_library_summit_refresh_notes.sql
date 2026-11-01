-- The side session beside S539, 2026-11-01: two Library refresh notes past their occasion.
-- Both notes were reminders the filing session wrote (library-filer@bot, 2026-10-05 and 10-06; cpl_library_history),
-- tied to the Noncredit Summit week. The summit met on October 8 (CPLBrain
-- 04-projects/cpl-initiative/20261005_Noncredit_Summit_Film_2.md), two days after the Oct. 6 the slides' note keys
-- on, and the film's v2 cuts were made October 6 (S339). Left in place, each reads as an open Revise request
-- (scheduled_sessions step 6: "a note left by the older box, with no regen, is still a request"), and handoffs 533
-- to 539 each read them and left them. Guarded on the exact before-values, so a note anyone changed since stays.
-- ROLLBACK: kb/migrations/2026-11-01_library_summit_refresh_notes_rollback.sql (the before-values, verbatim).
update public.cpl_library
set refresh_note = null, updated_by = 'library-s539side@bot'
where slug = 'noncredit-summit-in-motion' and retired_at is null and regen is null
  and refresh_note = 'students served and the funding figures, the week of the summit, then re-render both cuts';
update public.cpl_library
set refresh_note = null, updated_by = 'library-s539side@bot'
where slug = 'noncredit-summit-cpl-slides' and retired_at is null and regen is null
  and refresh_note = 'students served from live_metrics.json, and the funding figures if the config md5 is no longer 764fd264, if the summit is more than a week after Oct. 6';
select slug, refresh_note, regen, updated_by from public.cpl_library
where slug in ('noncredit-summit-in-motion', 'noncredit-summit-cpl-slides') order by slug;
