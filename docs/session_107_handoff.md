---
title: Session 107 handoff — after the SkySeal triage rules day (Session 106)
date: 2026-07-08
tags: [handoff, session-107, cer, issuer-lane, preseed, rule-5g, faa, multi-issuer]
related:
  - "[[CLAUDE]]"
  - "[[docs/exhibit_canonicalization_lessons]]"
  - "[[docs/session_106_handoff]]"
superseded: true
superseded_by: session_132_handoff.md
---

# You are Session 107

Session 106 (SkySeal) was a live-triage rules day: Sam worked the CER Triage
surface on the deployed page while the session mechanized every ruling within
the hour — **six merged PRs (#690–#695)**. Read in order: CLAUDE.md §11
(Session 106 block), `docs/exhibit_canonicalization_lessons.md` (2026-07-08
"continued 9" through the close-out),
`.claude/skills/exhibit-canonicalization/SKILL.md` (Rules 5f + 5g + the
authority sources), then this file.

## What shipped (Session 106 — SkySeal)

1. **Rule 5f** (#690): HS/ROP/adult-school Cx rows — school = issuer =
   trainer, title stripped; never overwrite a real issuer; EMT-405 unanimity
   guard. Lane UX: editable titles, raw-variant lines, college chips, Mode A3
   trainer promotion.
2. **Rule 5c mechanized** (#691, #692): staged titles by CCN > C-ID > local
   COCI course title; discipline-prefix strip; code-led AND discipline-NAME-led
   (CCSF) lookups, college-scoped.
3. **Apprenticeship lane** (#693): Norco/Santiago Canyon DIR-DAS sponsors
   (Southwest Carpenter JATC occId 82 · Riverside Area Electrical JAC occId
   490); region-prefill at 0.6; "IBEW" alone ≠ electrical. Sam's Tableau
   Completion Dashboard recorded (no CCC-affiliation field yet).
4. **Rule 5g** (#694): leading Beginning/Intermediate/Advanced → END of the
   title; "Intro" → "Introduction"; AP / Advanced EMT / ACLS exempt
   (`_LEVEL_KEEP`). 68 restyled. Same PR: the **save→re-edit dead-button
   fix** (re-arm on input + `data-busy`; KB note
   `methodology-rearm-disabled-save-on-edit.md`) and the **statewide-agency
   lane** (blank statewide issuer → AWS; the 5 welding rows; gate = presence
   in the statewide DATASET, any collab type — MAP types the FCAW row Local).
5. **FAA cert-family lane + multi-issuer** (#695): 22 aviation rows → FAA
   (Part-147 AMT + the Reedley FLGHT ladder; `drone pilot` never bare
   `drone`); the **＋ add issuing agency** affordance → new
   `issuing_agency_additional_override`, Mode A2 promotes BOTH issuer fields
   additively (Rule 4).

Plan state: **1,009 staged / 1,125 null-issuer queue** (cx 686 ·
course-as-exhibit 166 · local-trainer 72 · family 31 · cert-family 22 ·
course-title 20 · apprenticeship 6 · statewide-agency 5 · title-style 1) ·
284 titles · 152 residual. Verifier **50 checks**; lane test 46 assertions;
suite **142 files green**.

## Priority queue

1. **Sam works the lane** (he's "dinking around" now). After his pass + the
   daily fold, re-run `python3 kb/_preseed_null_issuers.py` — saved rows drop
   out. Watch for his rulings on: the IBEW Electrician re-point (Riverside
   JAC), the "American Welding Society" vs "(AWS)" spelling, the Modesto
   ENGL 102 re-title ("Introduction to Literature").
2. **Cred-Ref PR-5b rename re-key** — the recorded `unified_title_override`
   rows (Rule 5g just queued ~68 more) are its input; scope it when Sam's
   pass lands enough renames for one batch (re-mint playbook: alias map,
   dry-run first).
3. **Auditor re-run for college chips on classified rows**:
   `kb/_audit_exhibits.py` needs the PII-purged `CustomReport_latest.json`
   (not in the sandbox) — piggyback a runner job, commit
   `kb/exhibit_audit/latest.json`.
4. Carryover: ~146 DIR-pending apprenticeship residuals at other colleges
   (the Tableau dashboard lacks the CCC-affiliation join — Sam still hunting)
   · 3 CLEP "Complete both" spans · fire-family twins · 3 mojibake families ·
   MOC→COS bridge + 22 ambiguous COS matches · CCR Convergence voice pass
   (still the active CCR lane).

## Safety patterns to honor

- Staged pre-seeds are UI prefill ONLY (Rule 5e); the curator's click saves.
- Never overwrite a real issuer: resurface rows, Mode A2/A3 fill-or-append,
  the IBEW rows all guard it. The additional-issuer field APPENDS records.
- Rule 5g never touches official proper names (`_LEVEL_KEEP`) — extend the
  list rather than weakening the rule.
- The save→re-edit re-arm needs the `data-busy` in-flight guard — do not
  remove it (double-submit risk).
- Regenerate `kb/issuer_preseed.json` only AFTER the daily cron publishes a
  fresh bake (the plan reads `credential_reference_data.js`).
- `pip install openpyxl` in a fresh sandbox or the Rule-5c title count
  silently collapses ("titles staged: N" is the tell).
- Run `python3 kb/_verify_issuer_preseed.py` (50) + `npm test` after edits;
  `kb/_verify_preseed_rules.py` (100) still guards the unclassified plan.
- The harness overwrites `~/.claude/stop-hook-git-check.sh` with its default —
  after a squash-merge + branch reset, re-copy
  `scripts/stop-hook-git-check.sh` instead of amending GitHub's merge commit
  (Rule 5).

Session 106 claimed **SkySeal**. Moniker suggestion for you: **SkyKey** —
the session that turns the recorded renames into the PR-5b re-key — or claim
your own.
