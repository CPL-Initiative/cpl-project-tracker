---
title: Session 108 handoff — after SkyKey turned the rename key (Session 107)
date: 2026-07-08
tags: [handoff, session-108, cer, rename-apply, merge-confirm, preseed]
related:
  - "[[CLAUDE]]"
  - "[[docs/exhibit_canonicalization_lessons]]"
  - "[[docs/session_107_handoff]]"
superseded: true
superseded_by: session_132_handoff.md
---

# You are Session 108

Session 107 (SkyKey) turned the recorded renames into the live PR-5b re-key —
the first production credential-rename apply — shipped the deferred PR-5b/2
confirm-merge lane the same day a curator finally hit the collision case, and
landed Sam's four evening triage asks within the hour, all while he kept
saving live. Read in order: CLAUDE.md §11 (Session 107 block),
`docs/exhibit_canonicalization_lessons.md` (2026-07-08 "continued 12" + its
addendum), `docs/kb-notes/methodology-confirmed-merge-via-decision-row.md`,
then this.

## What shipped (Session 107 — SkyKey, 6 merged PRs #697–#702)

1. **The fold** — Sam's 137 Session-106-day saves banked via a dispatched
   daily run (Modes A2/A3 promoted; `CalCERTS, Inc.` + 3 HS issuers entered
   the vocabulary through the ＋ additional-issuer affordance).
2. **#697** — queued rename collisions no longer block the clean set; Range
   pagination on the Supabase-apply pre-fetch (the Session-105 lesson).
3. **PR-5b/1 run #1** — 49 renames APPLIED: credentials/unified_titles/
   articulations re-keyed, V1–V4 green, Supabase migration 106 ops / 0 fail.
   Receipts: `kb/cred_rename_out/2026-07-08/`.
4. **#698 (PR-5b/2)** — the confirm-merge lane: Save-time collision detect +
   confirm dialog → `unified_title_merge_confirm` row; pending-merges strip
   for already-saved collisions; dry-run `merges` section (stale-confirm +
   chain-hazard guards); apply FOLD with issuer+trainer dedupe, count gate,
   target-drift abort. `tests/cer_merge_confirm.test.js` (17).
5. **Sam's evening asks** — #699 unlimited ＋ agencies (" | "-joined single
   override row; Mode A2 splits + promotes each); #702 the `hs-generic`
   ("Local High School") + `ase-align` lanes (12 ASE rows whose Saves flow
   through the confirm-merge — the intended fold) + fresh-bake preseed regen;
   #701 the 🔎 who-issues-this search + ✨ AI issuer suggestion (report
   proxy; click-to-fill chip, never auto-saved).
6. **#700** — the daily-run push-race fix (`git checkout -- .` before the
   retry rebase; the 20:23 run died on unstaged regen when #698 merged
   mid-run).

## Priority queue

1. **Sam's 6 pending merges** — the "Merge confirmations (6)" strip in the
   CER triage worklist (5 AoJ convergences + "American Politics" ⇒ "American
   Government and Politics"). After he ✓-confirms (any subset), dispatch
   `cred-rename-apply.yml` — it re-syncs, re-dry-runs, and folds with
   receipts. Watch `records_moved`/`records_deduped`. The 12 ASE prefills
   will ADD to this queue as he saves them — same flow.
2. **Spelling alignment calls (Sam):** ASE — his message said "Automotive
   Services Excellence"; the lane stages the 55-record house canonical
   "National Institute for Automotive Service Excellence (ASE)". AWS — house
   "(AWS)" ×13 vs his 1 bare save. OSHA — house "U.S. …" ×9 vs his 2 saves
   without it. Whichever way he rules, small re-saves or a tiny re-key batch.
3. **The lane continues** — after his next pass + daily fold, re-run
   `python3 kb/_preseed_null_issuers.py` (`pip install openpyxl` FIRST) +
   `kb/_verify_issuer_preseed.py` (56 checks).
4. Carryover: IBEW Electrician re-point to Riverside JAC (6 rows, generic
   IBEW issuer, still his call) · DIR-pending apprenticeship residuals (no
   CCC-affiliation source yet) · 3 CLEP "Complete both" spans · fire-family
   twins · 3 mojibake families · MOC→COS bridge + 22 ambiguous COS matches ·
   5 early Norco saves keeping a leading "Advanced" (restylable batch) ·
   auditor re-run for college chips (needs the runner's PII-purged
   CustomReport) · CCR Convergence voice pass (still the active CCR lane).

## Safety patterns to honor

- **Merges are NEVER inferred.** The confirm row must name the exact current
  target; a re-title makes it stale and the dry-run re-queues it. Don't
  "helpfully" seed confirms — the click is Sam's.
- Merges are not swap-reversible (fold + dedupe): rollback = git history +
  the frozen receipt. Renames stay swap-reversible.
- The apply workflow re-runs its own dry-run and refuses on gate failure —
  trust it; never hand-edit alias maps.
- Staged pre-seeds remain UI-prefill-only (Rule 5e); never overwrite a real
  issuer (Modes A2/A3 fill-or-append). The ✨ suggestion is a
  recommendation chip — it fills an input, never saves.
- The additional-agencies value is " | "-delimited in ONE kb_curation row —
  split it wherever you consume it (Mode A2 shows how).
- Regenerate `kb/issuer_preseed.json` only off a fresh post-fold bake.
- Run the 56-check verifier + `npm test` (145 files) after edits;
  `kb/_verify_preseed_rules.py` (100) still guards the unclassified plan.
- Poll CI via the MCP github tools, never curl (sandbox egress).
- **`git reset --hard` eats uncommitted riding edits** — SkyKey lost (and
  redid) four checkpoint docs that way. Stash first, always.

Session 107 claimed **SkyKey** (the handoff's suggestion — it fit: the key
turned). Moniker suggestion for you: **SkyFold** — the session that lands
Sam's confirmed merges — or claim your own.
