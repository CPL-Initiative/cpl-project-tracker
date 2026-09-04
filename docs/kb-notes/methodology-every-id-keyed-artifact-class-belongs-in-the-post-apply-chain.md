---
title: Every id-keyed artifact class belongs in the post-apply chain
created: 2026-09-04
updated: 2026-09-04
tags: [methodology, remint, rule-7, identity, kb, pitfall]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/coursecontrolnumber_remint]]"
  - "[[docs/kb-notes/methodology-alias-map-resolution-semantics]]"
  - "[[docs/kb-notes/methodology-land-a-re-mint-by-rehearsal-and-a-fresh-read]]"
artifacts:
  - kb/_rekey_crnc_mirrors.py
  - kb/_rekey_promotions.py
  - kb/_post_apply_chain.py
  - kb/crnc_rekey_out/2026-09-04/rekey_receipt.json
---

# Every id-keyed artifact class belongs in the post-apply chain

**The claim.** A re-mint is only landed when every file keyed by the ids it
moves has been re-keyed. The chain that runs after an apply is the list of
those files, and a file that is not on the list goes stale silently — not at
the apply, but at the first read that looks an id up and finds nothing.

## The instance

`kb/crnc_mirrors.json` classifies 2,836 identities whose members mix credit
and noncredit sections: `mirror` (a same-college pair, a Credit-by-Exam
pathway, so the auditor's band-purity signal is suppressed), `partial_mirror`,
`band_mix`. The dashboard generator reads it by identity id. It was generated
on 2026-07-12 and was never added to `kb/_post_apply_chain.py`. The 2026-09-03
authority recode and Z-band retirement moved 14,349 ids, 398 of them keys in
that file. From that moment the suppression stopped for those identities and
nothing said so: the lookup returned nothing and the page drew the default.

It surfaced a day later, and only because the next session scanned every file
in the repository for the 278 ids its own fold would move (a cheap regex over
`kb/**/*.json` and the SkyView payloads) before writing the apply. The scan is
the general instrument: **before an apply, list every file that names an old
id, and account for each one** — the apply moves it, the chain re-keys it, a
rebuild regenerates it, or a written reason says why it stays.

## Re-key or regenerate

A derived file that is purely a function of the catalog can be regenerated. A
file that carries curated work cannot: the crnc file folds in eleven
cross-college mirrors an agent re-adjudicated on 2026-07-12, and the detector
does not know them. So the fix is a **re-key through the alias chain** with the
same semantics as `kb/_rekey_promotions.py` — each map applied at most once,
in chronological order, no within-map iteration (the telescoping defect), an
era list on the doc naming the maps already folded in, a baseline flag for the
first run — and three gates: the count is conserved (two keys converging on
one id is an error, never a fold), every output key is live in the file's own
source of truth (memberships, here), and a second pass with no maps changes
nothing. Measured on 2026-09-04: 398 keys moved, one hop each, none
converging, none dead afterward; on a rehearsal copy with the next fold
pending, 427.

## What else the scan found

`kb/cid_articulation_joins.json` carries a `current_home` field with 1,068
recode-old ids — and nothing reads that field (the routing uses disposition,
control number and descriptor). Regenerating would re-derive the dispositions
from a raw course list that has moved since June, which changes routing: a
decision, not hygiene. And the articulation doc's `identities` map holds 1,605
keys that are not live (68% of its entries), pre-fold keys the S110 finding
already named; the catalog overrides its metadata on overlap, so it is inert
for display, but a chain-aware re-key of that map is the next cleanup of this
kind.

## Where it lives

`kb/_rekey_crnc_mirrors.py` (step `crnc-mirrors` of `kb/_post_apply_chain.py`),
`tests/rekey_crnc_mirrors_test.py`, the receipt under `kb/crnc_rekey_out/`, the
artifact-class list in `docs/coursecontrolnumber_remint.md`, and
`docs/ccr_atlas_lessons.md` §2026-09-04 for the story.
