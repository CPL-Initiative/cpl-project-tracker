---
title: Session 334 handoff — the Ext & Review rename landed, the display follows it, OSHA has one name as issuer
date: 2026-10-05
session: 333 (SkyHarbor)
tags: [handoff, program-requirements-harvest, roep-display, cer, issuing-agency, decision-sheet]
status: current
---

# You are Session 334

Your moniker is **SkyAnchor**. SkyHarbor (S333, `session_0155WYXAKVQWdqKUfDojrrTx`) checkpointed on Rule 9's
commit count (7 since handoff 333), with about 290,000 tokens of runway left. If Sam's routine started you,
read [`docs/reference/scheduled_sessions.md`](reference/scheduled_sessions.md) first and follow it.

## First, in this order

1. **Merge the checkpoint PR** (`claude/s333-checkpoint`, the Rule 9 commit) on a green `test` if S333 did not.
2. **OSHA's one name held through a daily build** (confirmed by S333 after run 37341422154, 16:42Z): `kb/credentials.json` on `main` names OSHA one way, *U.S. Occupational Safety and Health Administration (OSHA)*, on all its OSHA entries; *OSHA 10-hour Construction Training Course* carries CTCNC as trainer; `credential_reference_data.js` holds no *U.S. Department of Labor*. If a later build shows a second issuer line, a source row was missed: search every `kb_curation` namespace the syncs read before writing.
3. **No decision sheet is open.** Sheet 39 (https://claude.ai/artifact/UcBESBRpoLZJKgZZG5NtXr) is answered
   and its thread resolved; no lane carries a NEEDS SAM. Build sheet 40 only when a lane gains one.

## Decisions Sam made this run

- **In chat, on OSHA 30 at Cerritos:** *"maybe your question about Osha 30 at Cerritos may have been whether to
  make them the issuing agency because they teach it as part of their course. If so, they would not be the
  issuing agency, osha would."* Sheet 38 card 2 had asked what IWAP 41.09 teaches (its CCR filing); that card
  stays *later*. The exhibit is credit by exam, so his July issuer for it (California Community Colleges)
  stands.
- **Sheet 39 (15:52Z, both his own call):** card 1 *go* on display build `799bfb9a7dbf`; card 2 *name*: OSHA
  takes one name as issuer across the CER, and CTCNC is the OSHA 10-hour Construction entry's trainer.
- Recorded in `cpl_memory` (verified): `sam-osha-issues-the-card-not-the-teaching-college-2026-10-05`,
  `sam-sheet39-rulings-2026-10-05`.

## What shipped

- **The *Ext & Review* rename ran on main** (`cer-decision-apply.yml` 15:10Z, `cred-rename-apply.yml` 15:18Z):
  *Ironworker Apprenticeship — OSHA 30/Extension Review*, Sam's issuer row re-keyed, the old title an alias,
  the three derived files rebuilt.
- **#1866:** display build `799bfb9a7dbf` (the label on IWAP 41.09), written as a two-path guarded update; all
  20 rows match `--verify-sql`. Receipt `..._2026-10-05_799bfb9a7dbf_delta.sql`.
- **#1868:** OSHA's one name. `kb/credentials.json` and `kb/unclassified_assignments.json` edited; five of Sam's
  `kb_curation` rows replaced through `kb/cer_decisions_out/2026-10-05-2` (16:28Z, read back). The applier
  gained the agency fields and a guarded `replaces` path (`tests/cer_decision_apply_test.py` 29/29). Sheet 39's
  cards retired.
- **#1865:** sheet 39, Sam's issuer rule in memory, the lane marker.
- **KB note:** `methodology-an-additive-sync-cannot-carry-a-correction`.

## Patterns that worked

- **Diff before you write.** A JSON diff of two receipts turned a 159 KB upsert into two guarded `jsonb_set`
  statements, and the full build's md5s proved them.
- **Read the merge rule before choosing the write.** The CER's issuer syncs only add; the card's override route
  would have listed two issuers. The correction went to Sam in the sheet's thread before any write.

## Safety patterns

- **Writes:** a sheet card or Sam's word, a committed receipt with before-values, then read back. A curator's
  row changes only by guarded `replaces`, and only where the plan names it.
- **Build verify queries from files.** A query retyped from a truncated listing gave four false *differs*.
- **`tests/run.js` ignores file arguments** and runs the whole suite (about an hour). Run one file with
  `node tests/<file>.test.js`. Never `pkill -f` a pattern your own shell's command line contains.
- **`apply_migration` still prompts.** `scripts/install_prompt_guards.py --apply` was denied by the auto-mode
  check as self-modification this run; the setup-script edit stays on Sam's To-Do list.
- The harvest lane is at 19,999 of 20,000 bytes and the partner-crosswalks lane at 19,990. Trim before adding.

## Next work

- IWAP 41.09's CCR filing waits on Sam (sheet 38 card 2, later).
- Re-read Cerritos Schedule+ for Spring 2027 IWAP and AED sections once they post.
- Record shape v3 (outcomes as printed); the program view's By requirement / By term layouts.
- The addenda reading agent after the 2026-10-11 census apply; widen the harvest past the pilot.
- Raise Miramar's AUTO 156G articulations (EMT, Driver Operator 1B) in the clean-up lane.
