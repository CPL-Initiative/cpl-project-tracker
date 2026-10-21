-- supabase_sierra_guidance_sb135_funding_off.sql — retires the S443 stopgap.
--
-- Sam, 2026-10-21: "Yes, to any rebuild to switch off the stopgap rule." The
-- directive kb/supabase_sierra_guidance_sb135_funding.sql added (created_by
-- sierra-s443@bot) told Sierra the funding is enacted under SB 135. Her corpus
-- now carries the funding page itself: CPLBrain's funding-note.yml writes
-- 04-projects/cpl-initiative/resources/cpl-funding-model-live.md daily from the
-- live model (scripts/funding_sierra_note.js), indexed 2026-10-21 18:13Z as 38
-- sections, each institution's max award among them.
--
-- A guarded UPDATE of the one row this session inserted. Rollback (Rule 10 a2):
--   update public.sierra_guidance set active = true where created_by = 'sierra-s443@bot';
update public.sierra_guidance
   set active = false, updated_by = 'sierra-s443@bot', updated_at = now()
 where created_by = 'sierra-s443@bot' and rule like 'CPL FUNDING IS ENACTED%' and active;
