---
title: Session 301 handoff — Jev's next steps on one sheet, fresh scans, SkyView on a phone
date: 2026-09-29
session: 301 (SkyShuttle)
tags: [handoff, jev, common-cr-reference, decision-sheet, skyview, implementation-funding, funding-video]
status: current
---

# You are Session 302

Your moniker is **SkyWeft**. SkyShuttle (S301) took the queue from
[`session_301_handoff.md`](session_301_handoff.md).

## First thing: Sam's answers on the twelve-card sheet

The standing sheet is [9Wikhf54XyJgWXDEw5AK7G](https://claude.ai/artifact/9Wikhf54XyJgWXDEw5AK7G)
(`SHEET_ID` `2026-09-29-open-asks-2`, twelve cards). Read its `replies` and `replies/done` and its
comment threads before anything else, and apply the high-water rule (`decision_sheets`).
- **Cards 1–7** are S300's seven, unchanged. Sam pressed Complete on that sheet
  ([QiaDezD2AN6XDzctUCSCfw](https://claude.ai/artifact/QiaDezD2AN6XDzctUCSCfw)) with no card
  touched, so none is reviewed; its thread points to the new sheet, and **a reply there still
  counts** for the seven. Cards 1–2 are also cards 3–4 of `74AfMNmXPQYP5X7XKpjHfH`: the later
  answer stands. Card 7 is a guarded UPDATE with a receipt of the before-values (Rule 10 a2).
- **Cards 8–11** answer his Jev ask of 2026-09-28 (a next step per reference). The detail is in
  the [`common-cr-reference`](reference/lanes/common-cr-reference.md) lane's NEEDS SAM section;
  every count comes from `python3 kb/_jev_next_steps.py`.
- **Card 12:** Sierra Training's Try it in buttons ([`sierra-retrieval-corpus`](reference/lanes/sierra-retrieval-corpus.md)).

Carry out each verdict with its lane marker in the same PR. Cards 4–6 and 8–12 rest on measured
premises, so the builder refuses to build once their work lands: remove each card then.

## What shipped (S301)

- **#1735:** fresh CER and CSR scans (`kb/trail_crew_out/2026-09-29/`, `kb/csr_out/2026-09-29/`)
  and two CSR rules that reported settled work: CS9 compares the M-ID's prefix, and CS2 honors a
  mutual `fan_in_with` (FTVE). CSR 185 → 63 findings, 136 → 15 for Jev.
- **#1736:** the funding brief says minimum conditions (NEXT ⓪d), and the public download's
  percentage divides the coarse figure (⓪f).
- **#1737:** the twelve-card sheet, `kb/_jev_next_steps.py` and its receipt, the lane markers.
- **#1738:** SkyView on a phone opens at the desktop's scale, 65° across at 390px, and draws
  every island name whole. Merge it on a green `test` if S301 did not (check its state first).

## In flight when S301 closed

- **The narrated video's cue pass** was delegated to a subagent in a scratchpad worktree
  (branch `claude/funding-video-cues`). If S301 pushed it, review the diff and the render
  (`20260926_CPL_Funding_in_Motion_Narrated_Draft_2.mp4`), then bring the draft to Sam; it stays
  unlinked from the explainer. If the branch is not on the remote, the work was lost with the
  container: redo it from the To-Do `s295-fable-cue-narrated-draft` (word timings from
  `narration_s1.mp3` through faster-whisper `small`; huggingface.co is reachable).
- **The unit-range display audit** ran read-only; if its table is not in the lane
  [`mid_lifecycle`](reference/mid_lifecycle.md) or this file, re-run it.

## Then: the queue

The Jev steps Sam rules on · the ETHS answer (card 3) · ESL monthly after 2026-10-28 ·
governance for the write surfaces (the `cpl_occupation_match` queue, the cross-list curator
surface, and now a CER decisions store) · the funding lane's NEXT ③ cleanup.

## Waiting on Sam

The twelve cards. GR rows #2, #10 and #16. The SQL To-Do's other half: did he change the Supabase
setting for the whole organization or only his account. (Three timed reads in S301, a new
session, returned 1.5–1.9 s after the stamp, so none waited on him.)

## Read in order

1. This file. 2. [`common_cr_reference_lessons`](common_cr_reference_lessons.md), the S301
section. 3. [`decision_sheets`](reference/decision_sheets.md), the high-water rule.

## Patterns that worked

- **Re-run a stale scanner, then classify what surprises you.** One `if` on the key shape
  explained 121 of 136 findings.
- **Measure through the page's own state on the served page** (`skyWindow`, `__ccrSkyAcross`).
- **Numbers on a sheet come from a script at build time**, and each premise has a both-ways
  fixture (`tests/open_asks_sheet_coverage_test.py`).
- **Delegate a long job to a worktree in the scratchpad**, outside the repo, so the in-repo
  lints never see a second copy.

## Safety patterns

- A canvas width read when a view resets is not the settled width; test the viewport.
- A queued-notification batch can cost 40K tokens of context; read the meter after one.
- `kb/docs_audit/` output changes on every lint run; restore it before committing a PR that
  does not own it.

## Carryover

Not refreshed: `kb/README.md` and `README.md` (no structure change), the Pipeline tab (the
pipeline did not move).
