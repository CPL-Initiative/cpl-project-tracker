---
title: Session 107 handoff — after Rule 5f + the issuer-lane title editing (Session 106)
date: 2026-07-08
tags: [handoff, session-107, cer, rule-5f, issuer-lane, preseed]
related:
  - "[[CLAUDE]]"
  - "[[docs/exhibit_canonicalization_lessons]]"
  - "[[docs/session_106_handoff]]"
---

# You are Session 107

Session 106 (SkySeal) turned Sam's four live asks into **Rule 5f** and made
the CER issuer lane a complete triage surface. Read in order: CLAUDE.md §11
(Session 106 block), `docs/exhibit_canonicalization_lessons.md` (2026-07-08
"continued 9"), `.claude/skills/exhibit-canonicalization/SKILL.md` (Rule 5f),
then this file.

## What shipped (Session 106 — SkySeal)

1. **Rule 5f** (SKILL.md, after 5e): HS / ROP / adult-school / noncredit
   exhibits earning credit via Cx or Portfolio — strip the school from the
   title (the course/pathway remains), the school becomes BOTH issuing and
   training agency (defaults the same). A real existing issuer (PLTW via an
   ROP) is never overwritten — the school stays trainer-only. Rule 5c's
   issuer-CCC line now yields to 5f when a school is identifiable. Multi-
   school identities (EMT-405) take NO default — the unanimity guard.
2. **Plan schema v2** in `kb/_preseed_null_issuers.py` /
   `kb/issuer_preseed.json`: entries may stage `title` + `trainer`;
   `issuer: null` = keep the current issuer; `resurface: true` = an
   issuer-carrying row surfaced for title/trainer cleanup. The local-hs ""
   lane is RETIRED. Run: **989 staged** (local-trainer 74 — 59
   school-as-issuer, 51 title strips, 3 resurface · cx 717 ·
   course-as-exhibit 167 · family 31 · residual 143). Verifier: 25 checks.
3. **Issuer lane upgrades** (credential_reference.js): editable unified-title
   input on every row (saves `unified_title_override` — display-only until
   PR-5b), raw college-entered title lines, originating-college chips
   (`kb/_audit_exhibits.py` now stamps `colleges` on CLASSIFIED cards too —
   populates at the next auditor run; articulation-college fallback
   meanwhile), the trainer ⇒ school chip, `laneJobsFor()` (one Save = up to
   3 overrides; staged trainer follows an issuer edit when staged the same),
   widened `issuerQueue()` with a convergence rule, jobs-aware bulk save.
4. **Mode A3** in `kb/_apply_credential_review.py`: `training_agency_override`
   promotes into credentials.json (fill-when-null, never overwrite) beside
   Mode A2's issuer promotion.
5. Suite **142 files green** (`tests/cer_issuer_lane.test.js` rewritten, 38
   assertions).

## Priority queue

1. **Sam works the lane** — the 74 ⚡ local-trainer rows first (school
   issuer+trainer+title in one Save), then the 717 cx→CCC bulk. After his
   pass + the daily fold, re-run `python3 kb/_preseed_null_issuers.py` — the
   plan converges (saved rows drop out).
2. **Auditor re-run needed for originating-college chips on classified
   rows**: `kb/_audit_exhibits.py` needs the PII-purged
   `CustomReport_latest.json` (not in the sandbox) — run it wherever the
   report is available (or piggyback the next runner job that fetches it),
   then commit `kb/exhibit_audit/latest.json`.
3. **Display-title duplicates are intended**: two schools' same course now
   read as one display title with different issuers, but they're still TWO
   KB keys. The durable merge is **Cred-Ref PR-5b** (real rename + alias map
   per the re-mint playbook) — the recorded `unified_title_override` rows
   are its input queue. Scope it when Sam's lane pass lands enough renames
   to make it worth one batch.
4. Carryover: apprenticeship issuer residual (143 — DIR DAS runner-as-proxy)
   · 3 CLEP "Complete both" spans · fire-family twins · 3 mojibake families
   · MOC→COS bridge + 22 ambiguous COS matches · CCR Convergence voice pass
   (still the active CCR lane).

## Safety patterns to honor

- Staged pre-seeds are UI prefill ONLY; the curator's click saves; live
  assignment > preseed. Bulk empty-issuer saves need staged "" intent.
- A resurface row's Save must NEVER write an issuer the curator didn't
  change (`laneJobsFor` guards it — keep the test).
- Rule 5f trainer defaults require raw-variant UNANIMITY about the school;
  partial extraction is not unanimity (the EMT-405 trap).
- `el()` builder: any NEW `data-*` attribute must be added to its fixed-name
  allowlist or it silently never renders.
- Run `python3 kb/_verify_issuer_preseed.py` (25) + `npm test` after edits;
  `kb/_verify_preseed_rules.py` (100) still guards the unclassified plan.
- Never regenerate `kb/issuer_preseed.json` from a stale bake — the plan
  reads `credential_reference_data.js`, so regenerate AFTER the daily cron
  publishes a fresh bake.

Session 106 claimed **SkySeal** (the handoff's suggestion — sealing the CER).
Moniker suggestion for you: **SkyKey** — the session that turns recorded
renames into the PR-5b re-key — or claim your own.
