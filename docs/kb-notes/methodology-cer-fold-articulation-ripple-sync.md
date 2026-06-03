---
title: Resolving the V4 articulation-ripple gate when folding a CER unclassified title
created: 2026-06-03
updated: 2026-06-03
tags: [methodology, cer, unclassified-triage, articulation, credential-identity, kb]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[exhibit_canonicalization_lessons]]"
artifacts:
  - kb/_fold_unclassified.py
  - kb/unclassified_assignments.json
  - kb/coci_articulations.json
  - kb/unified_titles.json
  - kb/credentials.json
---

# Resolving the V4 articulation-ripple gate when folding a CER unclassified title

> **One-sentence summary** — When `_fold_unclassified.py`'s V4 gate rejects a fold because the
> target credential disagrees with what `coci_articulations.json` already inlines, there are
> exactly three correct fixes, and the *reason* the ripple fires tells you which one.

## Context

The CER unclassified-triage loop assigns a `unified_title` to each raw MAP exhibit title that has
no credential identity, then `kb/_fold_unclassified.py` folds confirmed assignments into
`kb/unified_titles.json` (+ `credentials.json`). Its **V4 gate** blocks any fold that would make
the exhibit's `unified_title` disagree with the value the articulation layer
(`kb/coci_articulations.json`) already inlines for that exhibit's rows — a guard against silently
splitting a credential's earned articulations away from it. V4 firing is **information, not an
error**: it means the target you chose and the articulation layer's existing label differ, and you
must reconcile them before folding.

## The claim

Pick the resolution by **diagnosing why** the article rows disagree. Scan
`coci_articulations.json` for the raw first (`exhibit_title == raw`) and read the rows'
`unified_title`:

1. **Clean fold (no ripple).** The article rows already resolve to the *exact* target spelling →
   just fold. (Many "duplicate raw spelling → existing credential" folds land here.)

2. **Adopt-the-article-spelling.** Two **valid** spellings of the **same** credential exist (a KB
   duplicate — e.g. `History of Architecture I` vs `1`, `ASE A4 — Suspension & Steering` vs
   `…and Steering`). Your matcher picked spelling A; the articulation inlines spelling B.
   **Re-assign the raw to spelling B** → 0 ripple. Both are valid credentials; the duplicate is a
   separate cleanup. **Do NOT** overwrite the article rows.

3. **Re-point-the-article-rows.** You are deliberately minting a **DISTINCT** credential (the raw
   is genuinely its own thing, not the existing target). The exhibit's articulations should move
   **with** it: edit the article rows' `unified_title` (and issuer if changing) to the new title,
   THEN fold → 0 ripple. Carry the issuer onto the new credential via the overlay entry's
   `issuing_agency` field so the fold creates the credential record correctly.

**Rule of thumb:** a V4 ripple usually means "two valid spellings," not "wrong target" — default to
aligning with the articulation layer (strategy 1/2). Only re-point the article rows (strategy 3)
when the product decision is that the credential is genuinely distinct.

## How we got here

Session 30–31 cleared the CER `unclassified_in_map` backlog 194 → 5. Strategy 2 surfaced in Session
30 batch 2 (3 punctuation-variant duplicate credentials caught by V4). Strategy 3 was exercised in
Session 31 PR #282: Sam kept `Firefighter 1A Certification` distinct from `Firefighter 1`, so all
**13** of its article rows were re-pointed `Firefighter 1` → `Firefighter 1A` (format-preserved
13/13 diff, issuer California State Fire Training (SFT) carried via the overlay) before folding — the
fold then added the new `Firefighter 1A` credential with 0 ripple. PR #280 was strategy-2 (4 raws),
and the POST/AUTO A1 calls in #282 were strategy-1 clean folds.

## When this applies / when it doesn't

- **Applies:** any `_fold_unclassified.py` fold (or any future fold that touches a title the
  articulation layer references) whose dry-run reports `articulation ripples > 0` or a V4 fail.
- **Doesn't apply:** raws with no articulation rows at all (no ripple possible — fold freely), and
  the long-tail raws that need a brand-new credential minted from scratch (that's the
  `exhibit-canonicalization` skill's per-item judgment, not a fold).

## Gotcha — the daily cron is a mid-flight merge hazard for the overlay

`kb/unclassified_assignments.json` is rewritten by the daily cron's Supabase sync. If the cron lands
between your Supabase insert and your PR merge, the PR goes `dirty` on the overlay. Resolve: rebase
onto main, take **main's** cron-synced overlay (`git checkout --ours` during rebase — authoritative
Supabase state), re-add only the entries inserted **after** the cron ran, `--continue`,
`--force-with-lease`. The fold's deliverable files (`unified_titles.json` / `credentials.json` /
`coci_articulations.json` / `exhibit_audit/latest.json`) don't conflict — the cron doesn't touch them.
