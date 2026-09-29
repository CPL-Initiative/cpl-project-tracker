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
- **The unit-range display audit** (read-only, data of 2026-09-28) is below. The rule, Sam's of
  2026-09-27: a merge or mint that joins differing units shows the range it joins.

## The unit-range audit (S301): eight surfaces fall short

| Surface | Where | What it prints for a merge whose members differ | Fix |
|---|---|---|---|
| Unified Courses table and detail | `excel_to_dashboard.py` L9042-9079 bake | The M-ID bake reads `kb/coci_minted_memberships.json` only, which lacks merged-in singletons: 2,358 merge targets print "—" (1,874) or one figure (484); 578 print too narrow a range (AGAS M1001 "—"; ENGL M1107 "3") | Bake from `_row_ents(r)`, as the C-ID/CCN branch already does (L9084-9101) |
| Unified Courses .xlsx | `excel_to_dashboard.py` `xrow` L9900 | `typical_units` (WELD M1109: 2) | Write the baked range |
| SkyView label, tooltip, card, outline | `kb/_build_ccr_universe.py` `point_of` L532; `ccr_universe.js` | One `u`: 8,065 of 16,478 identities differ; 4,937 print one figure, 3,128 "units not given" | Emit low and high in `point_of`; render "0–5u" (check the label at phone width) |
| Common CR Reference | `cr_reference.js` `rowHtml` L505 | The canonical wording's own figure plus "units vary" (113 groups) | Store the group's low and high; "Engine Performance (2–5 units)" |
| EACR | `statewide_interactive.js` `typicalAward` L1820 | One line per unit value for one recommendation (109 credentials) | Group by title: "Introduction to Statistics (3–5 units)" |
| Common Exhibit Reference | `credential_reference.js` L3401 | The modal wording (31 credentials: ASE A1 "3 hours in Engine Repair", awarded at 3 and 4) | Group by topic and print the range |
| Dashboard card, Articulations by Unified Course | `excel_to_dashboard.py` L6352 | The modal wording (114 identities) | Same grouping |
| Public Fact Sheet + Sierra statewide lines | `fact-sheet/_build_statewide_recs.py` `build` L71 | The first figure seen (9 recommendations: EMT "6 units", awarded at 6 and 7) | Keep every value; print low–high. **One fix corrects both, and they reach the most readers** |

Also Sierra's `local_set` (edge function L163) lists one recommendation once per unit value for 51
credentials. Complying: `map_export.js` (min and max units). The Unified Courses Units tooltip
(L4529) still calls a spread over 2 "likely an over-merge", which contradicts the rule. **Order:**
the Fact Sheet builder first (reach), then the Unified Courses bake (volume, and SkyView reads a
correct range only after it). The Fact Sheet is public wording: its display change is Sam's to
see before it ships.

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
