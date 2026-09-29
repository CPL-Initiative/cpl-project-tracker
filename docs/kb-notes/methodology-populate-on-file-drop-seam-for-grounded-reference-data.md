---
title: Populate-on-file-drop seam for grounded reference data
created: 2026-07-29
updated: 2026-07-29
tags: [methodology, grounding, reference-data, cip, data-sourcing]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[cip_crosswalk_lessons]]"
  - "[[methodology-top-is-a-last-in-line-signal]]"
  - "[[CLAUDE]]"
artifacts:
  - kb/_build_cip_crosswalk.py
  - cip_crosswalk.js
---

# Populate-on-file-drop seam for grounded reference data

## The situation

A grounded tool (one whose brand is "no hallucination — only authoritative values")
needs a piece of external **reference data** it doesn't yet have — e.g. the NCES
4-digit CIP **series** titles, which the CCCCO workbook is exported without. You go
to source it and every reachable path is disqualified:

- the **authoritative** host is egress-blocked (policy 403, non-retryable);
- the only public **mirrors** are the **wrong edition** (CIP-2010 not -2020) and/or
  **lossy** (codes stored as numbers → `01.10` and `01.1000` collide);
- a **WebFetch/summarizer** would return the strings **paraphrased** by a model — a
  fidelity risk that violates grounding for reference strings;
- no package registry has it.

The tempting-but-wrong move is to ship *something* — recall the values from training,
or accept the stale/lossy/paraphrased set — so the deliverable isn't empty.

## The rule

**Do not fabricate grounded reference data to avoid an empty deliverable.** Build the
**seam** instead, and report the blocker with the exact file to supply:

1. **Builder** reads the authoritative file *if present* in a known location
   (`kb/reference/<canonical-name>.{json,csv,xlsx}`), validates/filters it against data
   you already trust (here: keep only 4-digit prefixes that occur among the built
   6-digit codes; strip trailing periods), and emits the map **only when non-empty** —
   so a no-source rebuild is **byte-identical** (verify with `git diff`).
2. **Consumer** shows the authoritative value when the map has it, else falls back to
   the prior grounded display (here: `"51.38 · N codes"`). It **never** invents a value.
3. **Report** the blocker and name the *exact* file + how to get it ("drop the NCES
   all-levels CIP-2020 export into `kb/reference/`, re-run the builder"). This mirrors
   how other authoritative inputs are sourced from the owner (the CO), not from the sandbox.

The feature then lights up the moment the real file lands — one drop, no code change —
and until then it degrades to honest prior behavior instead of a wrong answer.

## Why it's the right trade

An inert-but-correct seam beats a populated-but-wrong feature every time in a grounded
tool: a single paraphrased or stale federal title in a CO-facing surface costs more
trust than a dropdown that simply shows the code for now. "Ship the wiring, name the
file, refuse the fabrication" keeps momentum *and* the grounding contract.

## Instance

`kb/_build_cip_crosswalk.py` `load_sub4()` → `sub4` (emitted only when sourced) →
`cip_crosswalk.js` `fillCip4()` shows the 4-digit series title when present. Shipped
inert in PR #926 (2026-07-29); full story in `docs/cip_crosswalk_lessons.md`.
