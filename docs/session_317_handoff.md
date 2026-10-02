---
title: Session 317 handoff — sheet 19 executed (the CER fold and the summed target), and the FTES reimbursement rate
date: 2026-10-02
session: 316 (SkyTally)
tags: [handoff, implementation-funding, partner-crosswalks, funding-video, decision-sheet]
status: current
---

# You are Session 317

Your moniker is **SkyCompass**. S316 executed both cards of sheet 19 and took Sam's two vocabulary rulings. This is a
full checkpoint. The Pipeline tab, `README.md` and `kb/README.md` were not refreshed: neither the pipeline nor a
generator moved.

## First, in this order

1. **Nothing is waiting in a PR.** #1821 merged at 13:36Z. Confirm the Pages deploy carried it: the explainer's
   target line on `funding-model/` reads "Target: 4,366.7 CPL FTES statewide … at an FTES reimbursement rate of
   $2,824.82 …", and its video link names `_Scenario_2_v7.mp4`.
2. **Read Sam's opening note for direction.** The handoff queue is otherwise clear. The open asks are below; build a
   decision sheet for any that wait on him (`kb/_build_open_asks_decision_sheet.py`).
3. **ElevenLabs** still waits on Sam's rewritten Scenario 2 script (sheet 6 card 1). When it arrives, voice it
   (American English, female).

## What shipped

- **Sheet 19 card 1 ("write"):** `cer-decision-apply.yml` dry-ran (3 to write, 0 held) and wrote the three
  `kb_curation` rows at 12:36Z. `cred-rename-apply.yml` then folded *AWS Certified SysOps Administrator* into *AWS
  CloudOps Engineer - Associate* and renamed *Microsoft Certified: Azure AI Fundamentals (AI-900)* to *Microsoft
  Certified: Azure AI Fundamentals*. The workflow deleted the fulfilled rows. Receipts:
  `kb/cer_decisions_out/2026-10-02/`, `kb/cred_rename_out/2026-10-02/`.
- **Sheet 19 card 2 ("sum"), #1821.**
  - `sysTarget(p, slot)` in `cpl_funding.js`. The card, the Statewide CSV row, `_publicProgress()` (the explainer)
    and the film print the institutions' targets added up: 4,366.7 for Access and for Completion, against 4,467.6
    for the division. The seven institutions at the $400,000 maximum carry the 100.9 difference.
  - The explainer says why in one sentence.
  - The film is `_v7`: funding ÷ the FTES reimbursement rate − 100.9 = 4,366.7.
- **"FTES reimbursement rate", never price.** The film, the explainer and three tab strings say it. `cpl_funding_calm`
  bans price, priced and premium in the tab's rendered text; the explainer and film tests check the same.
- **KB note:** [`methodology-rebuild-a-jsonb-from-receipts-and-check-its-md5`](kb-notes/methodology-rebuild-a-jsonb-from-receipts-and-check-its-md5.md)
  plus `scripts/pg_jsonb_md5.py`. The live funding config is the `e21658f9` fixture plus plans `2026-10-02` and
  `2026-10-02-2`, hashing to live `764fd264`. Use it instead of transcribing MCP output.

## Sam's rulings this run

- Sheet 19 (11:52Z): card 1 **"write"**, card 2 **"sum"** (both executed). `cpl_memory` `sam-sheet19-rulings-2026-10-02`.
- In session: *"Stay away from commercial terms like 'price'"* and *"instead of price per FTES, it should be 'FTES
  reimbursement rate'"*. `cpl_memory` `sam-no-price-on-funding-surfaces-2026-10-02` (its summary still says "rate
  per CPL FTES"; an MCP UPDATE timed out three times) and `sam-ftes-reimbursement-rate-term-2026-10-02`.
- He approved reading the film source and the explainer after auto mode blocked them, and took the recommended
  script revisions.

## Open (none blocks a session)

- Scenario 2 narration script → ElevenLabs (Sam).
- Card 11's two measure texts and card 7's lines, still Sam's to type on the tab.
- Scenario 1's unpublished `v4` film still says "price per CPL FTES" on its slide (its page reads the new term).
  Re-render with `bash prototype/funding_video/render.sh` only if Sam asks.
- The tab's priority card prints "$2,824.82 per CPL FTES" without naming the rate. It is correct as written; offer
  the term there if Sam raises it.

## Carryover

- `kb/_docs_audit.py --apply` reads handoffs 314-316 as same-date siblings (all 2026-10-02). The highest number is
  authoritative.
- `cpl_funding.js` `DEFAULT_TIMING` still says "model" (inert; both scenarios carry saved text).

## Safety patterns

- ⚠️ **Read a workflow's dry-run before an apply, even when the workflow gates itself.** Auto mode flagged the
  `cred-rename-apply.yml` dispatch as a blind apply. Read `kb/cred_rename_dryrun/report.md` and the live override
  rows first, and say what will change.
- ⚠️ **A cpl_memory UPDATE through the MCP can stall on an approval prompt.** Insert a related row; never retry.
- ⚠️ **Screenshot a film slide before the full render.** Use `build.py <v> --render`, a Playwright seek and the
  render's fonts; a render takes 5-25 minutes. Killing `render.sh` leaves Chrome on port 9333; kill it.
- ⚠️ **A rendered-text scan drops `<script>` first.**
- ⚠️ **Prune a stale remote ref before `--force-with-lease`.** The feature branch auto-deletes on merge.
- ⚠️ Budgets: lanes `implementation-funding` 19,950, `partner-crosswalks` 19,990 of 20,000; `CLAUDE.md` at its
  limit. Delete before you add.
