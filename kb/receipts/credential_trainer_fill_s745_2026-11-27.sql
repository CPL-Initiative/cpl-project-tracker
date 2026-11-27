-- Credential trainer fill: the 16 Ironworker apprenticeship period credentials (S745, SkyTattler worker)
-- Written 2026-11-27T22:05Z (date -u). A PLAN, NOT APPLIED. The conductor reviews and runs it.
--
-- WHY. Sam, 2026-11-27, on learning that kb/credentials.json carries a training agency for 348 of 2,970
-- credentials: "yes, this is what we could want to show: Trained by Ironworker JATC". The 16 period credentials
-- "Ironworker Apprenticeship — Reinforcing, Period 1..8" and "— Structural, Period 1..8" carry the issuer but no
-- training agency, so a CPL Pathways card cannot say who trained them.
--
-- EVIDENCE.
--   1. The sibling credentials already carry exactly these values in kb/credentials.json: "Ironworker
--      Apprenticeship — Cranes", "— Detailing", "— General Rigging", "— Ironworker History", "— Lead Hazard",
--      "— Mixed Base", "— Post Tensioning 1", "— Post Tensioning 2", "— Reinforcing 2", "— Welding 1",
--      "— Welding 2": issuing_agency International Association of Bridge, Structural, Ornamental and Reinforcing
--      Iron Workers; training_agency Ironworker Joint Apprenticeship Training Committee.
--   2. The period credentials are MAP's MAPICA-RA4P*-1-001 ("Reinforcing Apprenticeship 416: Period 1..8") and
--      MAPICA-SA4P*-1-001 ("Structural Apprenticeship 433: Period 1..8") exhibits, Cerritos College's Ironworker
--      apprenticeship, articulated to its IWAP courses (cpl_memory f-cerritos-ironworkers-all-24-cpl-s744;
--      kb/reference/map_cpl_opportunities_verified.json; library/adopt/adopt_data.json).
--
-- WHAT IT WRITES. public.kb_curation, the Credential Reference namespace read by kb/_apply_credential_review.py:
--   course_id = '_CREDENTIAL_REVIEW::<unified_title>', field = 'training_agency_override' (in TRAINER_FIELDS),
--   value = 'Ironworker Joint Apprenticeship Training Committee', reviewer_email = 'credentials-s745@bot'.
-- The next sync folds it into kb/credentials.json through promote_trainers (fill when the first record's trainer
-- is empty, which it is for all 16) and into kb/credential_review_overlay.json.
--
-- WHAT IT LEAVES OUT, AND WHY. The issuer. Every one of the 16 keys already holds a person's
-- issuing_agency_override (map@rccd.edu, 2026-07-08T23:57Z) with exactly the issuer the siblings carry; it is
-- already in kb/credentials.json as each key's second record ("curator (CER issuing-agency override)"). A person's
-- save wins, and it already says what this plan would say, so no issuer row is written.
-- Any key the pre-check shows with a training_agency_override or training_sites_override row (a person's or any
-- other) is skipped by the NOT EXISTS guard below and by ON CONFLICT; report it rather than overwrite it.
--
-- ROLLBACK (insert-only cohort):
--   delete from public.kb_curation
--   where reviewer_email = 'credentials-s745@bot'
--     and field = 'training_agency_override'
--     and course_id like '_CREDENTIAL_REVIEW::Ironworker Apprenticeship — %, Period _';
-- then rerun kb/_apply_credential_review.py; promote_trainers never clears a fill, so also restore
-- kb/credentials.json's training_agency on these 16 first records with git revert of the sync commit.

-- PRE-CHECK (one JSON value). Expect issuer_rows = 16, all by map@rccd.edu with the IABSORIW issuer, and
-- trainer_rows = [] (no training_agency_override or training_sites_override row for any key).
select json_build_object(
  'issuer_rows', (select json_agg(json_build_object('k', course_id, 'by', reviewer_email, 'v', value) order by course_id)
                  from public.kb_curation
                  where field = 'issuing_agency_override'
                    and course_id like '_CREDENTIAL_REVIEW::Ironworker Apprenticeship — %, Period _'),
  'trainer_rows', (select coalesce(json_agg(json_build_object('k', course_id, 'f', field, 'by', reviewer_email, 'v', value)
                                            order by course_id), '[]'::json)
                   from public.kb_curation
                   where field in ('training_agency_override', 'training_sites_override')
                     and course_id like '_CREDENTIAL_REVIEW::Ironworker Apprenticeship — %, Period _'));

-- APPLY.
insert into public.kb_curation (course_id, field, value, reviewer_email, reviewed_at)
select v.course_id, 'training_agency_override', 'Ironworker Joint Apprenticeship Training Committee',
       'credentials-s745@bot', now()
from (values
  ('_CREDENTIAL_REVIEW::Ironworker Apprenticeship — Reinforcing, Period 1'),
  ('_CREDENTIAL_REVIEW::Ironworker Apprenticeship — Reinforcing, Period 2'),
  ('_CREDENTIAL_REVIEW::Ironworker Apprenticeship — Reinforcing, Period 3'),
  ('_CREDENTIAL_REVIEW::Ironworker Apprenticeship — Reinforcing, Period 4'),
  ('_CREDENTIAL_REVIEW::Ironworker Apprenticeship — Reinforcing, Period 5'),
  ('_CREDENTIAL_REVIEW::Ironworker Apprenticeship — Reinforcing, Period 6'),
  ('_CREDENTIAL_REVIEW::Ironworker Apprenticeship — Reinforcing, Period 7'),
  ('_CREDENTIAL_REVIEW::Ironworker Apprenticeship — Reinforcing, Period 8'),
  ('_CREDENTIAL_REVIEW::Ironworker Apprenticeship — Structural, Period 1'),
  ('_CREDENTIAL_REVIEW::Ironworker Apprenticeship — Structural, Period 2'),
  ('_CREDENTIAL_REVIEW::Ironworker Apprenticeship — Structural, Period 3'),
  ('_CREDENTIAL_REVIEW::Ironworker Apprenticeship — Structural, Period 4'),
  ('_CREDENTIAL_REVIEW::Ironworker Apprenticeship — Structural, Period 5'),
  ('_CREDENTIAL_REVIEW::Ironworker Apprenticeship — Structural, Period 6'),
  ('_CREDENTIAL_REVIEW::Ironworker Apprenticeship — Structural, Period 7'),
  ('_CREDENTIAL_REVIEW::Ironworker Apprenticeship — Structural, Period 8')) as v(course_id)
where not exists (
  select 1 from public.kb_curation k
  where k.course_id = v.course_id and k.field in ('training_agency_override', 'training_sites_override'))
on conflict (course_id, field) do nothing;

-- VERIFY (one JSON value). Expect n = 16, one value, one reviewer.
select json_build_object(
  'n', count(*), 'values', json_agg(distinct value), 'by', json_agg(distinct reviewer_email))
from public.kb_curation
where field = 'training_agency_override'
  and course_id like '_CREDENTIAL_REVIEW::Ironworker Apprenticeship — %, Period _';
