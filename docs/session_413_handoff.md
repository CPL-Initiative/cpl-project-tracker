---
title: "Session 413 handoff: the CER procedures run is live; the classifier's first pass; Crafton Hills loaded"
date: 2026-10-18
session: 412 (SkyJoshua)
tags: [handoff, cer, cer-procedures, classifier, exhibit-canonicalization, program-requirements, smartcatalog]
status: current
---

# You are Session 413

Your moniker is **SkyPinyon**. Session 412 (**SkyJoshua**, `session_018MEQ3ipjdqWUJ6AbCQpc4e`, from 03:28Z on
2026-10-18) checkpointed at about 105,000 tokens of runway. If the routine started you, follow
`docs/reference/scheduled_sessions.md` first.

## Sam's words this run

None new: Sam started the session with the handoff line and did not write again. Rulings in force: Sam's ask of
~02:55Z (vault braindump `braindump-2026-10-18-0300-cer-procedures-automate-curation`): *"I want to be able to add
more procedures to have you classify and complete common exhibit titles and elements as we go."* No approval per
item (2026-10-17); extraction with no card up to $40 a college (2026-10-14).

## What shipped (S412)

- **#2217 the CER procedures run.** `kb/cer_procedures.json` (7 rule procedures, 5 guidance, each with who, when
  and their words); `kb/_cer_procedures.py` (rules, a quality gate, then the classifier); Edge Function
  **`cer-classify`** (deployed v1; reads and writes nothing; service key only; `claude-opus-5-5`, 15 titles a
  call); `cer-procedures.yml` (nightly 07:47 UTC, `classify` input). It writes `kb/unclassified_preseed.json`
  (the tab's pre-fills), `kb/cer_classified.json` and `kb/cer_procedures_out/latest.json`. **Nothing saves.**
  Also: Rule 8's memory read orders by `coalesce(event_date, created_at::date)` (186 undated rows had been
  invisible) and the playbook's insert writes `event_date`.
- **First pass** (run 39097682221): 75 calls, all answered, **$8.30**; 1,116 of 1,322 waiting titles pre-filled,
  428 held. Sample: sure band right, middle plausible, low band mostly code-only titles. Lane:
  `docs/reference/lanes/cer-procedures.md`; lessons `docs/exhibit_canonicalization_lessons.md` S412 (its May-June
  sections moved to `_archive.md`).
- **#2218 the Procedures lane** in the CER tab (Needs you, then each procedure with its words and tally).
- **Harvest:** `182e810e207d` applied (15,651 written); **Crafton Hills loaded** (64 records, 40 passing the
  machine checks, $4.68; 112 colleges now hold records, 15,715 rows).
- Five `cpl_memory` rows (`author = 'SkyJoshuaS412'`).

## In flight at sign-off (check each first)

1. **#2219** (open): answers matched on a spacing-free title (105 dropped by a non-breaking space) and the
   college's own course title as a hint for code-only titles (94). Merge on a green `test`, then dispatch
   `cer-procedures.yml` on `main` with `classify=200` (about $1.50); read the report.
2. **Taft's capture-only read** (run 39097700126, `extract=0`): read its found count, then extraction, load, and
   one display build for the wave (Crafton plus Taft). Crafton's 13 not found: their near misses first.

## Priority after that

1. **Read Sheet 93's `replies`** (https://claude.ai/artifact/MZXYEqiNitiWGiTakDHUwW, current; store empty at
   05:30Z). Card 1 the fold applies clean assignments (a test that a conflict holds only itself); card 2 a sure
   result saves under its procedure (a bot cohort and a receipt, `cer-decision-apply.yml`'s shape); card 3 retire
   the Initiated sign-off and the Curate panel.
2. **The CER UI pass** on `cobi:credential-reference`: Needs you and Reference as the tab's views (the Procedures
   lane exists), per the mock-up https://claude.ai/artifact/Gu6HTwqSwMYLSy4C4xRag3.
3. **Merced:** a Coursedog walk (program search, 191 programs, then each program's Requisites tab).
4. **Cañada's 11** (capture-only read first).

## Patterns that worked

- **Measure a lane on today's queue before refreshing it.** The July lanes staged 642 of 1,498 and read badly;
  a 30-row sample caught it before anything reached the tab.
- **A one-call smoke test before a paid pass** (`classify=15`, $0.45) checked the function, the cache and the
  answers.
- **Sample answers by confidence band**, not at random overall: the low band showed the code-only gap.

## Lessons to honor

- **A newer pending run in a concurrency group cancels the older pending one.** On `main`, queue the next
  harvest run only after the pending one has started.
- **A model echoes a key with its spacing normalized.** Match on a normalized form; key by the value asked.
- `pkill -f "<pattern>"` matches the shell running it when the pattern is in the command line.

## Not refreshed this checkpoint

- The Pipeline tab: its phases did not move. `kb/README.md`, `README.md`: nothing they cover changed.
- **The UI pass ledger:** skipped for runway; `cobi:credential-reference` stays due. No KB note crossed the bar.
- The open-asks sheet: Sheet 93 is unchanged and current, so no rebuild.

## Subscriptions and check-ins

#2219 is watched; S412 releases it at sign-off. No check-in is pending.
