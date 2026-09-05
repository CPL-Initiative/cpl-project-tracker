---
name: consult-doctrine
description: Check what this repo has already decided before stating a measurement, a count, a percentage, or a finding drawn from its data — and before re-keying, dropping, merging or bulk-writing anything id-keyed. Use when about to report how many/how much/what share of, call rows stale or dead or missing, compare a stored set against a live one, act on a number a handoff or lane file supplies, or conclude that a file needs regenerating. Also use before writing code that touches kb/ artifacts, Supabase tables, or the daily dashboard pipeline. Triggers on "how many", "% dead", "stale", "ghost keys", "re-key", "alias map", "drop", "worklist", "measured", "compared against the live set".
---

# Consult the doctrine before you conclude

This repo's expensive mistakes are not bugs. They are **readings** — a number
measured against the wrong set, a file believed stale that is rebuilt nightly, a
whole identity system condemned by a liveness test that could never contain it.
No line of code was wrong in any of those. They shipped as findings, into
handoffs, and the next session inherited them as fact.

`kb/doctrine.py` exists because recall does not scale past a few dozen notes
(299 KB notes, 238 of them indexed to the exact files they govern). This skill
exists because the tool still had to be **remembered**, and that is the step
that keeps failing.

## Do this first

```bash
python3 kb/doctrine.py --read      # what have I OPENED? what governs it?
python3 kb/doctrine.py --changed   # what am I about to WRITE? what governs it?
```

`--read` is the one for analysis: it takes the files this session has actually
opened, from the live transcript, so it fires *before* there is a diff. Read the
titles — in this corpus a note's title **is** the rule, so a twenty-note answer
is twenty rules, not a reading list. Open only the ones that bear on the claim
you are about to make.

Then, for anything id-keyed:

```bash
python3 kb/doctrine.py --topic <alias|rekey|caps|liveness|privacy>
```

## Before you state a number, answer these

1. **What set did I compare against, and can it contain what I am counting?**
   A display payload is not a catalog. `unified_courses_data.js` declares
   `count_total: 76,008` and ships `count_inbrowser: 16,480` — measuring against
   it made live ids read as dead and over-reported by about fourfold. An M-ID
   catalog cannot contain a C-ID identity, so testing C-IDs against it condemns
   every one of them by construction.
2. **Is this file stored, or rebuilt?** Check the writer column in
   [`docs/reference/dependency_map.md`](../../../docs/reference/dependency_map.md).
   A file `daily-dashboard.yml` regenerates cannot be stale, and "fixing" it in
   place is overwritten by morning.
3. **Which id era are its keys in?** Resolve through
   [`kb/alias_chain.py`](../../../kb/alias_chain.py) — never a hand-rolled walk.
   ⭐ **The tell is the DIRECTION the number moves:** resolving an old-era key
   *heals* it (dead falls), resolving a current-era key *moves* it onto a live
   but unrelated row (dead rises). If your dead count goes UP when you resolve,
   the keys were already current and you are one `--apply` from a double-applied
   permutation.
4. **Whose number is this?** A figure inherited from a handoff or a lane file is
   a claim, not a measurement. Reproduce it before you build on it — and if you
   correct it, say what the old one was measured against.

## Before a drop, a merge, or a bulk write

- Nothing is dropped silently. Write the removed set to a worklist beside the
  receipt, with enough per row to act on (Sam's ruling 5, 2026-09-05). It is what
  turns "175 dead" into "172 of these are C-IDs and should never have been here."
- Gates that check the *post-state* is consistent do not check the *plan* was
  sane. Both are needed.
- Rule 10 governs any shared-table write: fresh live read at write time, an
  INSERT-only cohort or a receipt that captures before-values, and a rollback
  that works from the receipt alone.

## When it is worth skipping

Reading one known file to answer one factual question. If you are about to state
a number, a share, or a claim about what the data shows, it is not worth
skipping.
