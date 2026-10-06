---
title: A verdict that reports an action is checked in the store before the next step
created: 2026-10-02
updated: 2026-10-02
tags: [methodology, decision-sheet, governance, supabase, curation]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/partner_crosswalk_lessons]]"
  - "[[docs/kb-notes/playbook-decision-sheet-replies]]"
artifacts:
  - credential_reference.js
  - CPLBrain/decision-sheets/_build_open_asks_decision_sheet.py
  - CPLBrain/decision-sheets/decision_sheets.md
---

# A verdict that reports an action is checked in the store before the next step

> **One-sentence summary** — When a curator's reply says they did something ("Done") on a surface the session can observe, read the store for the write and the API log for the attempt before acting on it; the log separates "tried and failed" from "never opened", and each calls for a different next ask.

## Context

A decision card sometimes asks the curator to act on a page rather than to choose: type a title in the Credential Reference (CER), press Confirm merge. The reply chip for that card reads "Done". On 2026-10-02 two such cards in a row (sheet 16 at 00:36Z, sheet 17 at 04:18Z) came back Done, and neither left a row in `kb_curation`. Story: `docs/partner_crosswalk_lessons.md` (S314, S315).

## The claim

### A "Done" is the curator's report, and the store is the record

The reply store holds what the curator said. The table holds what happened. Read the table before running the next step (here, `cred-rename-apply.yml`, which fresh-syncs from `kb_curation` and would have applied nothing).

### The API log says which failure it was

A surface that reads its data on load leaves a trace each time it opens. The CER reads `course_id=like._CREDENTIAL_REVIEW::%` on every load, so the Supabase edge log answers the question the table cannot:

- **Reads with failed or missing writes** (a POST refused, an OPTIONS with no POST after it): the curator tried, and the page failed them. Fix the page or the card's steps.
- **No read at all** after the last known visit: the page was not opened. Repeating the steps will not help.

On 2026-10-02 the log showed the second: no CER overlay read between the 22:46Z rename run and the next morning. Sheet 16's card had named a button the CER draws only after a title is typed (a wrong card); sheet 17 corrected the steps, and the entry still did not happen.

### After a second miss, change the mechanism

The substance was already ruled (sheet 14). What kept failing was the entry, so the third ask offers a session path: write the rows through a reviewed workflow under a bot cohort, with a receipt and a Governance mapping, or type them. Asking a third time for the same typing would ask the curator to supply the one thing two rounds showed was not happening.

## How we got here

S314 found sheet 16's Done had no write and traced it to the card. S315 found sheet 17's Done had no write, queried the edge log by path and method across the night, and found no CER load at all. Sheet 19 card 1 carries the changed ask.

## When this applies (and when it doesn't)

It applies to any card whose verdict reports an action on a surface with a store the session can read. It does not apply to a choice ("Keep", "Apply them"): those are rulings, and the session acts on them. A verdict can also be ahead of the store by minutes (Sam may answer the sheet first and type second), so read the store again before concluding.

## See also

- `[[docs/kb-notes/playbook-decision-sheet-replies]]` — how replies are stored and read
- `CPLBrain/decision-sheets/decision_sheets.md` — the high-water rule and the store
