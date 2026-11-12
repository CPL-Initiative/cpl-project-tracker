-- S638 ASE plans: run FRESH, read-only, before the dry run of each plan (CLAUDE.md Rule 10a).
-- Plans: kb/cer_decisions_out/2026-11-11 (phase 1), -2 (phase 2), -3 (phase 3, after cred-rename-apply).

-- 1. Every row the plans replace or retire, with its per-row stamp. Paste each retire's reviewed_at into its plan
--    (the plans carry kb/credential_review_overlay.json's per-title stamp). Expect slee@cccco.edu on all.
select course_id, field, value, reviewer_email, reviewed_at
from kb_curation
where course_id in (
  '_CREDENTIAL_REVIEW::Automotive Braking Systems',
  '_CREDENTIAL_REVIEW::Heating and Air Conditioning',
  '_CREDENTIAL_REVIEW::Automotive Air Conditioner',
  '_CREDENTIAL_REVIEW::Advanced Electrical and Electronic Systems',
  '_CREDENTIAL_REVIEW::Engine Performance 1 (ASE A8 Engine Performance)',
  '_CREDENTIAL_REVIEW::Engine Performance 2 (ASE A8 Engine Performance)',
  '_CREDENTIAL_REVIEW::Automotive Electrical/Electronics 1 (ASE A6 Electrical/Electronic Systems)',
  '_CREDENTIAL_REVIEW::Automotive Electrical/Electronics 2 (ASE A6 Electrical/Electronic Systems)')
order by course_id, field;

-- 2. The local-title rows (whitespace twins included: MAP spells some with a leading or trailing space).
select course_id, field, value, reviewer_email, reviewed_at
from kb_curation
where course_id like '\_UNCLASSIFIED::%' escape '\'
  and btrim(substr(course_id, 16)) in (
    'Automotive Service Excellence MIL3 - Drive Train', 'Automotive Service Excellence MIL4 - Chassis',
    'Automotive Service Excellence MIL6 - Electrical/Electronic Systems',
    'Automotive Service Excellence MIL7 - Heating, Ventilation & Air Conditioning',
    'IC-Automotive Brake Systems', 'IC-Engine Performance I', 'Auto 617 Completion',
    'IC- Automotive Electrical/Electronics I', 'IC-Automotive Electrical/Electronics II', 'IC- Engine Performance II',
    'Brakes', 'Basic Automotive Air Conditioning Systems', 'Engine Performance',
    'Engine Performance I AUTO 018 Cx', 'Engine Performance II AUTO 029 Cx')
order by course_id, field;
-- Expect: each MIL key, IC-Automotive Brake Systems, IC-Engine Performance I and the three b2 keys hold
-- unified_title_assignment by slee@cccco.edu naming the title the plan replaces; IC-Automotive Brake Systems also
-- unified_title_supersedes 'Automotive Brake Systems' and issuing_agency_assignment 'California Community Colleges';
-- IC-Engine Performance I 'Engine Performance I'; the b2 keys their own supersedes. Auto 617 Completion and the five
-- credit-by-exam keys hold NO row (machine drafts). Any other row: hold that plan and report it.

-- 3. Any other ASE MIL exhibit, live (the committed reference shows only MAPICI-ASEM1..4 at Golden West).
select course_id, field, value, reviewer_email, reviewed_at from kb_curation
where course_id ilike '%MIL_ %' or course_id ilike '%ASE MIL%' or value ilike '%MIL_ -%';

-- 4. Rule 10a cross-check: a pending merge confirm that targets a source title the plans empty.
select course_id, field, value, reviewer_email, reviewed_at from kb_curation
where field = 'unified_title_merge_confirm'
  and value in ('Automotive Braking Systems', 'Heating and Air Conditioning', 'Automotive Air Conditioner',
                'Advanced Electrical and Electronic Systems', 'Engine Performance 1 (ASE A8 Engine Performance)',
                'Engine Performance 2 (ASE A8 Engine Performance)',
                'Automotive Electrical/Electronics 1 (ASE A6 Electrical/Electronic Systems)',
                'Automotive Electrical/Electronics 2 (ASE A6 Electrical/Electronic Systems)');

-- 5. Anything this cohort already wrote (should be empty).
select course_id, field, value, reviewed_at from kb_curation where reviewer_email = 'cer-s638@bot';
