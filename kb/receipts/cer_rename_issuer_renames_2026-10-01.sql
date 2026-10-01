-- CER: two credentials the issuers renamed (S311, 2026-10-01)
--
-- RULING. Sam, open-asks sheet 11 card 8 (2026-09-30, 22:48Z): "Rename with
-- aliases" for three credentials the industry-credential watch found renamed.
-- Built here for two of the three. The aliases are the raw titles: the CER's
-- search matches every raw variant (credential_reference.js, the search
-- filter), and each credential's raws still carry the old name, so a search
-- for "CyberOps" or "SysOps" finds the renamed record.
--
-- VERIFIED 2026-10-01 against the issuers' announcements (the issuers' own
-- pages are blocked by this environment's network policy; read through search):
--   Cisco: CyberOps Associate became Cisco Certified Cybersecurity Associate on
--     2026-01-21 and CCNA Cybersecurity on 2026-02-03; active holders were
--     migrated automatically; exam 200-201 CBROPS unchanged.
--   AWS: SysOps Administrator - Associate was renamed CloudOps Engineer -
--     Associate effective 2025-09-30 (exam SOA-C02 to SOA-C03).
--
-- HELD, NOT WRITTEN (open-asks cards):
--   Microsoft: Microsoft kept the certification's name (Microsoft Certified:
--     Azure AI Fundamentals); only its exam moved from AI-900 to AI-901, and
--     "taking AI-901 will not change the name of your existing credential".
--     Card 8's premise (AI-900 is AI-901) holds for the exam, not the credential.
--   AWS's second record, "AWS Certified SysOps Administrator" (one raw title),
--     cannot take the same new name without a MERGE, and a merge is a curator's
--     confirm, never inferred (kb/_cred_rename_dryrun.py, PR-5b/2).
--
-- FRESH READ at write time (Rule 10 a): no kb_curation row on any of the four
-- old keys or the two new ones; no pending unified_title_merge_confirm names
-- either new title; neither new title is a key in kb/credentials.json.
--
-- THE WRITE. INSERT-only under the cohort reviewer cer-rename-s311@bot; the
-- primary key is (course_id, field), so a re-run adds nothing.

insert into public.kb_curation (course_id, field, value, reviewer_email, reviewed_at) values
  ('_CREDENTIAL_REVIEW::Cisco Certified CyberOps Associate', 'unified_title_override',
   'CCNA Cybersecurity', 'cer-rename-s311@bot', now()),
  ('_CREDENTIAL_REVIEW::AWS Certified SysOps Administrator — Associate', 'unified_title_override',
   'AWS Certified CloudOps Engineer — Associate', 'cer-rename-s311@bot', now())
on conflict (course_id, field) do nothing;

-- THEN: the daily cron's dry-run (or a manual one) lists both as clean renames
-- (V1-V3); dispatch cred-rename-apply.yml to re-key the KB files.
--
-- ROLLBACK before the apply: delete from public.kb_curation where reviewer_email = 'cer-rename-s311@bot';
-- ROLLBACK after the apply: the frozen kb/cred_rename_out/<date>/alias_map.json
--   carries the round trip (kb/_cred_rename_apply.py, Rollback).
