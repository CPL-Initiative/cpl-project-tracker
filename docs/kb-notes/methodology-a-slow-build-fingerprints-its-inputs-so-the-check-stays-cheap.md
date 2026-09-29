---
title: A slow build fingerprints its inputs so the check stays cheap
created: 2026-09-07
updated: 2026-09-07
tags: [methodology, pipeline, ci, daily-dashboard, skyview, testing]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/reference/lanes/skyview-ccr-interface]]"
  - "[[docs/reference/pipeline_reference]]"
artifacts:
  - kb/_build_ccr_sky.py
  - prototype/ccr_sky.json
  - tests/ccr_sky_payload_test.py
---

# A slow build fingerprints its inputs so the check stays cheap

> **One-sentence summary** — a derived artifact that costs minutes to compute
> should carry a hash of exactly what it depends on, so the daily run rebuilds
> only when that hash changes and CI can prove the committed file is current
> without paying for the computation.

## Context

SkyView's sphere placement eases 159 discipline islands apart on a sphere and
sorts them by kind. The relaxation is about 90 seconds of pure Python. The
pattern this repo uses for a derived payload — rebuild every daily run, and a
CI test that fails when the committed file is not a fresh build — works when
the build is seconds (the CPL payload, ~5 s). Applied to a 90-second build it
would have put 90 seconds into every CI run and a needless daily diff into
`main`, or tempted a session to drop the check.

## The method

1. **Name the inputs.** The placement depends on the islands' geometry (name,
   center, radius, in order), the class each island is placed by, the scale and
   the algorithm's version — and on nothing else. The daily inputs that feed the
   class (TOP codes) are folded into the class before hashing, so the hash is of
   what the placement *uses*, not of every file it reads.
2. **Hash them into the payload** (`_inputs: sha256:…`). Bump the algorithm
   name in the hash when the arithmetic changes, so every committed file
   rebuilds exactly once.
3. **The builder rebuilds only on a changed hash** and otherwise leaves the file
   untouched — no timestamp churn, no daily commit of nothing.
4. **`--check` recomputes the hash and the payload's own invariants** (no island
   on the wrong side, no overlaps, every position in range) in half a second.
   That is what CI runs; the relaxation never runs in CI.
5. **Hold state that must not flap.** A threshold read from daily data can
   cross by a hair; the builder holds a discipline's side unless the reading
   crosses by a margin, and the held set is part of the payload so the check
   can verify it.

## What to watch

- The hash must include everything the output depends on, or a stale file
  passes as current. The test moves one island by one unit and flips one class
  and expects the hash to change.
- The computation must be deterministic for the hash to mean anything; the
  test runs the relaxation twice on a toy sky and compares.
- A copy of the algorithm elsewhere (a prototype's generator) breaks the
  promise silently; import it, and let a test fail on a second `def`.

## Related

- The CPL payload's pattern (`kb/_build_ccr_cpl.py`, Step 4d3) — right for a
  five-second build.
- The alias-chain lesson (Rule 7): a copied loop drifts under a comment
  promising lockstep.
