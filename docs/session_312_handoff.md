---
title: Session 312 handoff — Sierra names the place in full; the roster resolves; the model sweep and the CER renames wait on Sam
date: 2026-10-01
session: 311 (SkyQuill)
tags: [handoff, sierra, implementation-funding, college-district-identity, partner-crosswalks, decision-sheet]
status: current
---

# You are Session 312

Your moniker is **SkyLantern**. S311 ran one full checkpoint (this file); every Rule 9 artifact is current
except the Pipeline tab (the pipeline did not move) and `README.md` / `kb/README.md` (no surface or
generator changed).

## First, in this order

1. **Sierra, #1804 (a sub-region counts its own campuses).** If it is not merged, merge it on a green
   `test`. Then dispatch `cpl-chat-deploy.yml` (`confirm: DEPLOY`, ref `main`); `list_edge_functions` must
   show the version one past 75, ACTIVE, `verify_jwt: false`. Then dispatch **one** `cpl-chat-smoke.yml`,
   and only after the push-triggered smoke on `main` has finished: two runs at once time out
   `program_typical_courses` and fail 7c (`cpl_memory` `overlapping-smokes-time-out-rpc-2026-10-01`). Read
   7c, 7s and 7p. #1804 also carries the smoke fix for 7s: two correct articulation-precedent sentences in
   the noun form ("None of the three San Gabriel Valley colleges above have an existing CPL articulation
   …") tripped the absence check once the place was spelled out; the helper now sets that form aside, and
   `tests/sierra_smoke_absence_claims.test.js` holds the recorded sentences (18/18).
2. **Read both sheets' `replies` (and the sweep's `edits`) before anything else Sam-facing.**
   - Sheet 13, [CyhTj4tH2sSMjKtgaW6o69](https://claude.ai/artifact/CyhTj4tH2sSMjKtgaW6o69): five cards (the
     CCSF check, carried; run the two CER renames; the Microsoft title; folding AWS's second record; a
     pointer to the sweep sheet).
   - The "model" sweep, [T2MTd4n2cP2LXZXRXvbBQ6](https://claude.ai/artifact/T2MTd4n2cP2LXZXRXvbBQ6): 27
     cards, each arriving set to its proposal (the high-water rule applies). Port what he rules: rendered
     text only, in `funding-model/index.html` and `cpl_funding.js`; cards 23-24 are his to type on the tab.
     ⚠️ Grep `tests/` for a fragment of every sentence you retire before pushing (six tests pinned S310's
     words). `funding_model_page.test.js` scans the explainer's prose. The harness is in
     `prototype/mockup_harness/` (README, "The model sweep").
3. **The CER renames.** Check `kb_curation` for rows by `cer-rename-s311@bot`. If Sam ran receipt #1803,
   the daily dry-run (`kb/cred_rename_dryrun/report.md`) lists two clean renames; dispatch
   `cred-rename-apply.yml`. The repo's Supabase guard denies a session's `kb_curation` insert, so never
   route around it. Microsoft and AWS's second record follow sheet 13.
4. Then handoff 310's queue: the Monday watch run's PR after 2026-10-05 (routine
   `trig_019tTcardPfntFz6ctWU9Jg1`); sheet 11's issuer-skill verification goes through Governance and the
   privacy ADRs before any table (Rule 10 a3); card 11's and card 7's texts are still Sam's to type.

## What shipped

- **#1800 (merged, deployed as cpl-chat v75):** Sierra names the visitor's place in full the first time and
  never shortens it to an abbreviation the visitor did not write. Smoke 7s had failed on "7 miles from the SGV".
- **#1801:** the "model" sweep mockup, round 1 (the capture harness found 412 hits, 40 distinct sentences,
  over config md5 `0f3c6c8e…`), with the copy of record `docs/visuals/2026-10-01-model-sweep.html`.
- **#1802 + migration `map_colleges_funding_roster_variants`:** LA Swest, Mt San Antonio and MiraCosta are
  `map_colleges` variants; the funding roster resolves 115 of 115, so those colleges' staff see their
  reported expenditures on My College.
- **#1803:** the CER rename receipt (Cisco, AWS), held for Sam to run.
- **#1804 (open at this checkpoint):** `inAskedPlace()` in `cpl-chat/index.ts`, guard block 10 in
  `tests/sierra_place_anchor.test.js` (the unfixed code fails four of seven).
- **S310's memory receipt:** the eight SkyTandem-s310 rows are logged (`creates = 1`). The one step left
  is an `UPDATE` (promoting `do-this-next-implementation-step-never-rendered-2026-10-01` to verified);
  `execute_sql` statements carrying an `UPDATE` wait out the tool's 60 s limit, while `apply_migration`
  runs one at once.

## Sam's rulings this run

None new. Sam has not written since the greeting; every ask is on sheet 13 or the sweep sheet.

## Patterns that worked

- **Render the surface, then inventory it.** The sweep's capture lists every visible "model" in text,
  `title`, `aria-label`, `alt` and `placeholder` from the product's own code; the source read adds the
  lines only other states show, and `publicMode()` separates them from curator text.
- **Re-check a card's premise before writing.** Card 8 said "AI-900 is AI-901"; Microsoft renamed only
  the exam. A rename names the credential a person holds or the test that earns it; ask which.
- **Read a failing smoke's sentence, not just its assert.** The full place name exposed a miscount the
  abbreviation had hidden.

## Safety patterns

- ⚠️ **One smoke at a time** (above), and note which function version each mode ran against when a deploy
  lands mid-run.
- ⚠️ **Exact joins that decide disclosure take variants; fold only joins that label or rank**
  (`docs/college_identity_lessons.md`, S311).
- ⚠️ **Budgets at the edge:** `CLAUDE.md` 59,975 / 60,000 B; lanes `implementation-funding` 19,929,
  `partner-crosswalks` 19,703, `sierra-retrieval-corpus` 19,912 of 20,000; `docs/cpl_funding_lessons.md`
  118,362 / 120,000 (compact into the archive before its next section).
- ⚠️ `git push --force-with-lease` refuses on a stale tracking ref after a squash-merge deleted the branch:
  `git update-ref -d refs/remotes/origin/<branch>`, then a plain push.
